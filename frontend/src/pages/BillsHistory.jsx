import React, { useState, useEffect } from 'react';
import { Receipt, Search, Download, Eye, X, Calendar, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const BillsHistory = () => {
  const { addToast } = useToast();
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/bills', {
        params: search ? { search } : {}
      });
      setBills(response.data);
    } catch (err) {
      addToast('Failed to load bill history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search]);

  const handleDownloadInvoice = async (billId, billNum) => {
    try {
      const res = await api.get(`/api/bills/${billId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${billNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      addToast('Failed to download invoice PDF', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt size={28} color="var(--accent-purple)" />
            <span>Invoice & Billing History</span>
          </h1>
          <p className="page-subtitle">View past transactions, inspect bill items, and download PDF receipts</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ maxWidth: '400px' }} className="search-bar">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search invoice number (e.g. INV-2026...)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Payment Method</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No bills found.</td>
              </tr>
            ) : (
              bills.map((b) => (
                <tr key={b.id}>
                  <td>
                    <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{b.bill_number}</code>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td>{b.customer?.name || 'Walk-in Customer'}</td>
                  <td>{b.cashier?.full_name || b.cashier?.username || 'System'}</td>
                  <td>
                    <span className="badge badge-info">{b.payment_method}</span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ₹{parseFloat(b.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className="badge badge-success">{b.payment_status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedBill(b)}
                      className="btn btn-secondary btn-icon btn-sm"
                      style={{ marginRight: '0.5rem' }}
                      title="View Bill Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(b.id, b.bill_number)}
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={14} />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2>Invoice #{selectedBill.bill_number}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedBill.created_at).toLocaleString()}
                </div>
              </div>
              <button onClick={() => setSelectedBill(null)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ backgroundColor: '#0F172A', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Billed To:</span>
                <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{selectedBill.customer?.name || 'Walk-in Customer'}</div>
                <div style={{ color: 'var(--text-muted)' }}>Phone: {selectedBill.customer?.phone || 'N/A'}</div>
              </div>

              <div style={{ backgroundColor: '#0F172A', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Issued By:</span>
                <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{selectedBill.cashier?.full_name || selectedBill.cashier?.username}</div>
                <div style={{ color: 'var(--text-muted)' }}>Payment: {selectedBill.payment_method} ({selectedBill.payment_status})</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="table-container" style={{ marginBottom: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product?.name || 'Product'}</strong>
                      </td>
                      <td>{item.quantity}</td>
                      <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        ₹{parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ fontSize: '0.85rem', padding: '1rem', backgroundColor: '#0F172A', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span>₹{parseFloat(selectedBill.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Discount ({selectedBill.discount_percentage}%):</span>
                <span>- ₹{parseFloat(selectedBill.discount_amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST ({selectedBill.gst_percentage}%):</span>
                <span>+ ₹{parseFloat(selectedBill.gst_amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 800, fontSize: '1.1rem' }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--accent-emerald)' }}>₹{parseFloat(selectedBill.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => handleDownloadInvoice(selectedBill.id, selectedBill.bill_number)} className="btn btn-primary">
                <Download size={16} />
                <span>Download PDF Invoice</span>
              </button>
              <button onClick={() => setSelectedBill(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
