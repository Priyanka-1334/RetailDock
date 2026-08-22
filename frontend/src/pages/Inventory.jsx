import React, { useState, useEffect } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, AlertTriangle, PlusCircle, RefreshCw, History, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const Inventory = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'audit'
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [stockInModal, setStockInModal] = useState({ open: false, product: null, qty: '10', note: '' });
  const [adjustModal, setAdjustModal] = useState({ open: false, product: null, change: '0', reason: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, txRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/inventory/transactions')
      ]);
      setProducts(prodRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      addToast('Failed to load inventory details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/stock-in', {
        product_id: stockInModal.product.id,
        quantity: parseInt(stockInModal.qty),
        note: stockInModal.note || 'Restocked via Inventory Portal'
      });
      addToast(`Restocked ${stockInModal.qty} units for ${stockInModal.product.name}`, 'success');
      setStockInModal({ open: false, product: null, qty: '10', note: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Stock-in failed', 'error');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/adjust', {
        product_id: adjustModal.product.id,
        quantity_change: parseInt(adjustModal.change),
        reason: adjustModal.reason || 'Manual inventory audit adjustment'
      });
      addToast(`Adjusted stock by ${adjustModal.change} for ${adjustModal.product.name}`, 'info');
      setAdjustModal({ open: false, product: null, change: '0', reason: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Adjustment failed', 'error');
    }
  };

  const displayedProducts = filterLowStock ? products.filter((p) => p.is_low_stock) : products;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Boxes size={28} color="var(--accent-amber)" />
            <span>Inventory & Stock Audit</span>
          </h1>
          <p className="page-subtitle">Track stock movements, restock inventory, and audit transactions</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('stock')}
            className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Boxes size={16} />
            <span>Current Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <History size={16} />
            <span>Audit History Log</span>
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                />
                <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>Show Low-Stock Alerts Only ({products.filter(p => p.is_low_stock).length})</span>
              </label>
              <button onClick={fetchData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} />
                <span>Refresh Stock</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Stock Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Restock & Adjust</th>}
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{p.product_code}</div>
                    </td>
                    <td>{p.category?.name || 'Uncategorized'}</td>
                    <td style={{ fontSize: '1rem', fontWeight: 800 }}>{p.quantity} units</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.low_stock_threshold} units</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'badge-danger' : p.is_low_stock ? 'badge-warning' : 'badge-success'}`}>
                        {p.quantity === 0 ? 'OUT OF STOCK' : p.is_low_stock ? 'LOW STOCK' : 'HEALTHY'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setStockInModal({ open: true, product: p, qty: '10', note: '' })}
                          className="btn btn-emerald btn-sm"
                          style={{ marginRight: '0.5rem' }}
                        >
                          <PlusCircle size={14} />
                          <span>Stock In</span>
                        </button>
                        <button
                          onClick={() => setAdjustModal({ open: true, product: p, change: '0', reason: '' })}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Adjust</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Audit Log Tab */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Product</th>
                <th>Quantity Change</th>
                <th>Reference Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${tx.transaction_type === 'STOCK_IN' ? 'badge-success' : tx.transaction_type === 'SALE' ? 'badge-info' : 'badge-warning'}`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td>
                    <strong>{tx.product?.name || `Product #${tx.product_id}`}</strong>
                  </td>
                  <td style={{ fontWeight: 800, color: tx.quantity > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                  </td>
                  <td style={{ color: 'var(--text-subtle)' }}>{tx.reference_id || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock In Modal */}
      {stockInModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Restock Product Quantity</h2>
              <button onClick={() => setStockInModal({ open: false, product: null })} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStockIn}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Restocking inventory for: <strong>{stockInModal.product?.name}</strong> (Current: {stockInModal.product?.quantity} units)
              </p>

              <div className="form-group">
                <label className="form-label">Quantity to Add (+)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={stockInModal.qty}
                  onChange={(e) => setStockInModal({ ...stockInModal, qty: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock In Note / Purchase Order</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PO-8849 / Supplier Batch"
                  value={stockInModal.note}
                  onChange={(e) => setStockInModal({ ...stockInModal, note: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setStockInModal({ open: false, product: null })} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald">
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Adjust Inventory Stock Count</h2>
              <button onClick={() => setAdjustModal({ open: false, product: null })} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjust}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Product: <strong>{adjustModal.product?.name}</strong> (Current Stock: {adjustModal.product?.quantity})
              </p>

              <div className="form-group">
                <label className="form-label">Stock Quantity Adjustment (+/-)</label>
                <input
                  type="number"
                  className="form-input"
                  value={adjustModal.change}
                  onChange={(e) => setAdjustModal({ ...adjustModal, change: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Enter positive value to add or negative to deduct (e.g. -2 for damage)</span>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Audit Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Damaged stock / Inventory discrepancy audit"
                  value={adjustModal.reason}
                  onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setAdjustModal({ open: false, product: null })} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
