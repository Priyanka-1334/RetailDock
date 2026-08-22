import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  UserCheck,
  LogOut,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'POS Billing', path: '/billing', icon: ShoppingCart },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Invoice History', path: '/bills', icon: Receipt },
    { label: 'Customers', path: '/customers', icon: UserCheck },
    ...(isAdmin ? [{ label: 'Analytics & Reports', path: '/reports', icon: BarChart3 }] : []),
    ...(isAdmin ? [{ label: 'User Management', path: '/users', icon: Users }] : []),
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          <Store size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>RetailDock</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>v1.0 • Enterprise POS</span>
        </div>
      </div>

      {/* User Role Banner */}
      <div style={{
        margin: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#151C2C',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{user?.username}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.full_name || 'System Operator'}</div>
        </div>
        <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`}>
          {user?.role}
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                margin: '0.25rem 0',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none'
              })}
            >
              <Icon size={18} />
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', color: '#FB7185' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
