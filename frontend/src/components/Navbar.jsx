import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
      {/* Top Left Fully Expanded Search Bar (Fills all remaining available space) */}
      <div style={{ flex: 1, marginRight: '2rem' }} className="search-bar">
        <Search size={16} />
        <input
          type="text"
          className="form-input"
          placeholder="Quick search products, bills, customers..."
          style={{ height: '38px', fontSize: '0.85rem', width: '100%' }}
        />
      </div>

      {/* Top Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        {/* Theme Toggle Icon Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: theme === 'dark' ? '#F59E0B' : '#4F46E5',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Profile Round Icon with Login User Name on the Right Side */}
        <NavLink
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: 'var(--text-main)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            transition: 'var(--transition)'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px var(--primary-glow)',
            flexShrink: 0
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : <User size={18} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.full_name || user?.username || 'Operator Profile'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
              {user?.role || 'Operator'}
            </span>
          </div>
        </NavLink>
      </div>
    </header>
  );
};
