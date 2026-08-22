import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, X, Shield, User } from 'lucide-react';
import api, { formatApiError } from '../services/api';
import { useToast } from '../components/Toast';

export const Users = () => {
  const { addToast } = useToast();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'CASHIER',
    full_name: '',
    email: '',
    is_active: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users');
      setUsersList(response.data);
    } catch (err) {
      addToast(formatApiError(err, 'Failed to load user directory'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        full_name: user.full_name || '',
        email: user.email || '',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'CASHIER',
        full_name: '',
        email: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const sanitizedEmail = formData.email && formData.email.trim() ? formData.email.trim() : null;
      const sanitizedFullName = formData.full_name && formData.full_name.trim() ? formData.full_name.trim() : null;

      if (editingUser) {
        const updatePayload = {
          role: formData.role,
          full_name: sanitizedFullName,
          email: sanitizedEmail,
          is_active: formData.is_active
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await api.put(`/api/users/${editingUser.id}`, updatePayload);
        addToast('User account updated!', 'success');
      } else {
        const registerPayload = {
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          full_name: sanitizedFullName,
          email: sanitizedEmail
        };

        await api.post('/api/auth/register', registerPayload);
        addToast('New user account registered!', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to save user account'), 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      addToast('User deleted', 'info');
      fetchUsers();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to delete user'), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UsersIcon size={28} color="var(--primary)" />
            <span>User & Staff Management</span>
          </h1>
          <p className="page-subtitle">Manage system access roles (Admin & Cashier accounts)</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          <span>Register New User</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading user directory...</td>
              </tr>
            ) : (
              usersList.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.full_name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email || 'N/A'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleOpenModal(u)} className="btn btn-secondary btn-icon btn-sm" style={{ marginRight: '0.5rem' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-icon btn-sm">
                      <Trash2 size={14} />
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
              <h2>{editingUser ? 'Edit User Account' : 'Register New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete={editingUser ? "new-password" : "new-password"}
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Access Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="CASHIER">CASHIER (Billing & Inventory View)</option>
                  <option value="ADMIN">ADMIN (Full System Control)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
