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
  User,
  LogOut,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { isAdmin, logout } = useAuth();

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
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          <Store size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>RetailDock</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
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
                padding: '0.55rem 0.75rem',
                margin: '0.15rem 0',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none'
              })}
            >
              <Icon size={17} />
              <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Logout - Pinned to Bottom */}
      <div className="sidebar-footer">
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-rose)' }}
          title="Sign Out of Terminal"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
