import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)', trend }) => {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.35rem 0', color: '#fff' }}>{value}</div>
          {subtitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 500 }}>{subtitle}</span>
          )}
        </div>
        {Icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {trend && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: trend.isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)'
        }}>
          <span>{trend.isPositive ? '↑' : '↓'} {trend.text}</span>
        </div>
      )}
    </div>
  );
};
