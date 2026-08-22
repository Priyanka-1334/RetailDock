import React from 'react';
import { User, ShieldCheck, Mail, Calendar, Key, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">
            <User size={26} color="var(--primary)" />
            <span>Profile & Account Settings</span>
          </h1>
          <p className="page-subtitle">Manage your operator identity, active role, and security session</p>
        </div>
      </div>

      {/* Main Profile Dashboard Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Avatar & User Card */}
        <div className="card" style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '1rem',
            boxShadow: '0 6px 20px var(--primary-glow)',
            border: '3px solid #1E293B'
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
            {user?.full_name || user?.username}
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            @{user?.username}
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'center' }}>
            <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>
              <Shield size={12} />
              <span>{user?.role}</span>
            </span>
          </div>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--text-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontWeight: 600 }}>Active Session</span>
            </div>
            <div>JWT Authenticated • RetailDock POS</div>
          </div>
        </div>

        {/* Right Column: Detailed Account Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 1: Account Information */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ fontSize: '1rem' }}>
                <UserCheck size={18} color="var(--primary)" />
                <span>Account Information</span>
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Username</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 700, marginTop: '0.25rem' }}>
                  {user?.username}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Full Name</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 700, marginTop: '0.25rem' }}>
                  {user?.full_name || 'System Operator'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Email Address</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="var(--text-muted)" />
                  <span>{user?.email || 'No email registered'}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Registration Date</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Permissions & Role Scope */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ fontSize: '1rem' }}>
                <ShieldCheck size={18} color="var(--accent-emerald)" />
                <span>Role Permissions & Scope</span>
              </h3>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                Assigned System Role: <strong style={{ color: '#fff' }}>{user?.role}</strong>
              </div>
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#0F172A',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem'
              }}>
                {isAdmin ? (
                  <span style={{ color: 'var(--accent-emerald)' }}>
                    ✓ Full Administrative Privileges: POS Checkout, Product & Category Management, Inventory Audit Logs, User RBAC, Analytics, and PDF/Excel Exports.
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-cyan)' }}>
                    ✓ Cashier Privileges: POS Checkout Terminal, Catalog Viewing, Stock Verification, Customer Lookup, and PDF Invoice Receipts.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
