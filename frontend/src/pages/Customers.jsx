import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import api, { formatApiError } from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export const Customers = () => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  // Delete Confirmation Modal State
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customers', {
        params: search ? { search } : {}
      });
      setCustomers(response.data);
    } catch (err) {
      addToast(formatApiError(err, 'Failed to load customer directory'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenModal = (cust = null) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormData({
        name: cust.name,
        phone: cust.phone || '',
        email: cust.email || '',
        address: cust.address || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.id}`, formData);
        addToast('Customer profile updated', 'success');
      } else {
        await api.post('/api/customers', formData);
        addToast('New customer added', 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to save customer'), 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/customers/${deletingCustomer.id}`);
      addToast('Customer deleted successfully.', 'success');
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to delete customer'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserCheck size={28} color="var(--accent-emerald)" />
            <span>Customer Directory</span>
          </h1>
          <p className="page-subtitle">Manage customer profiles and contact details</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ maxWidth: '400px' }} className="search-bar">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search customer by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Address</th>
              <th>Registered Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No customers found.</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone || 'N/A'}</td>
                  <td>{c.email || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.address || 'N/A'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="btn btn-secondary btn-icon btn-sm"
                      title="Edit Customer"
                    >
                      <Edit size={14} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeletingCustomer(c)}
                        className="btn btn-danger btn-icon btn-sm"
                        style={{ marginLeft: '0.4rem' }}
                        title="Delete Customer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Delete Customer?</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#0F172A',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{deletingCustomer.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Phone: {deletingCustomer.phone || 'N/A'} • Email: {deletingCustomer.email || 'N/A'}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this customer profile?
            </p>

            <div className="modal-footer" style={{ gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
