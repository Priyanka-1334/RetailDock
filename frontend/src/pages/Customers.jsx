import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const Customers = () => {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customers', {
        params: search ? { search } : {}
      });
      setCustomers(response.data);
    } catch (err) {
      addToast('Failed to load customer directory', 'error');
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
      addToast(err.response?.data?.detail || 'Failed to save customer', 'error');
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
                    <button onClick={() => handleOpenModal(c)} className="btn btn-secondary btn-icon btn-sm">
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};
