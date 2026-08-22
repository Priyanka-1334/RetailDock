import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const Categories = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      addToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, formData);
        addToast('Category updated successfully!', 'success');
      } else {
        await api.post('/api/categories', formData);
        addToast('Category created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category? Products linked to this category will be uncategorized.')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      addToast('Category deleted', 'info');
      fetchCategories();
    } catch (err) {
      addToast('Failed to delete category', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderTree size={28} color="var(--accent-cyan)" />
            <span>Product Categories</span>
          </h1>
          <p className="page-subtitle">Organize store products into logical category groups</p>
        </div>
        {isAdmin && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      <div className="grid-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{cat.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                  {cat.description || 'No description provided'}
                </p>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => handleOpenModal(cat)} className="btn btn-secondary btn-icon btn-sm">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="btn btn-danger btn-icon btn-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Catalog Items</span>
              <span className="badge badge-info">{cat.product_count || 0} Products</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
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
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
