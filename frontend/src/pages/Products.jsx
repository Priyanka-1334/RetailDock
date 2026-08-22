import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const Products = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    category_id: '',
    description: '',
    cost_price: '',
    selling_price: '',
    quantity: '',
    low_stock_threshold: '10'
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;

      const [prodRes, catRes] = await Promise.all([
        api.get('/api/products', { params }),
        api.get('/api/categories')
      ]);

      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_code: product.product_code,
        name: product.name,
        category_id: product.category_id || '',
        description: product.description || '',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        description: '',
        cost_price: '',
        selling_price: '',
        quantity: '10',
        low_stock_threshold: '5'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_code: formData.product_code,
        name: formData.name,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        description: formData.description,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold)
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
        addToast('Product updated successfully!', 'success');
      } else {
        await api.post('/api/products', payload);
        addToast('New product added to inventory!', 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      addToast('Product deleted from database', 'info');
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete product', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={28} color="var(--primary)" />
            <span>Product Catalog</span>
          </h1>
          <p className="page-subtitle">Manage store products, pricing, and stock levels</p>
        </div>
        {isAdmin && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }} className="search-bar">
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by product name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Stock Qty</th>
              <th>Status</th>
              {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{p.product_code}</code>
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{p.description}</div>
                    )}
                  </td>
                  <td>{p.category?.name || 'Uncategorized'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{parseFloat(p.cost_price).toFixed(2)}</td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>₹{parseFloat(p.selling_price).toFixed(2)}</td>
                  <td style={{ fontWeight: 800 }}>{p.quantity}</td>
                  <td>
                    {p.quantity === 0 ? (
                      <span className="badge badge-danger">
                        <XCircle size={12} />
                        <span>OUT OF STOCK</span>
                      </span>
                    ) : p.is_low_stock ? (
                      <span className="badge badge-warning">
                        <AlertTriangle size={12} />
                        <span>LOW STOCK</span>
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        <span>IN STOCK</span>
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="action-btn action-btn-edit"
                          title="Edit Product"
                          aria-label="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="action-btn action-btn-delete"
                          title="Delete Product"
                          aria-label="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
