import React from 'react';
import { User, ShieldCheck, Mail, Calendar, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User size={28} color="var(--primary)" />
            <span>User Profile & Session Details</span>
          </h1>
          <p className="page-subtitle">Authenticated operator identity and system permissions</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#fff' }}>{user?.full_name || user?.username}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`}>{user?.role}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>• Username: @{user?.username}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={18} color="var(--text-subtle)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Email Address</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{user?.email || 'No email registered'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Role Access Controls</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                {isAdmin ? 'Full Administrative Access (Users, Inventory, POS, Analytics, Exports)' : 'Cashier Access (POS Checkout, Catalog View, Invoice History)'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} color="var(--text-subtle)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Account Registration Date</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
