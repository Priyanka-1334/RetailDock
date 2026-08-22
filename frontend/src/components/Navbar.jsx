import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Bell, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0
    }}>
      {/* Top Left Search */}
      <div style={{ width: '320px' }} className="search-bar">
        <Search size={16} />
        <input
          type="text"
          className="form-input"
          placeholder="Quick search products, bills, customers..."
          style={{ height: '38px', fontSize: '0.85rem' }}
        />
      </div>

      {/* Top Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#0F172A',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>Active Role: <strong style={{ color: '#fff' }}>{user?.role}</strong></span>
        </div>

        <NavLink
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'var(--text-main)'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <User size={18} />
          </div>
        </NavLink>
      </div>
    </header>
  );
};
