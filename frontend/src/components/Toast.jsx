import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    let cleanMessage = message;
    if (typeof message === 'object' && message !== null) {
      if (Array.isArray(message)) {
        cleanMessage = message
          .map((m) => {
            if (typeof m === 'string') return m;
            if (m && typeof m === 'object') {
              const field = Array.isArray(m.loc) ? m.loc[m.loc.length - 1] : '';
              const msg = m.msg || 'Invalid value';
              return field && field !== 'body' ? `${field}: ${msg}` : msg;
            }
            return 'Validation error';
          })
          .join(', ');
      } else {
        cleanMessage = message.message || message.msg || message.detail || JSON.stringify(message);
      }
    }

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message: String(cleanMessage || 'Notification'), type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={20} color="var(--accent-emerald)" />}
            {toast.type === 'error' && <AlertTriangle size={20} color="var(--accent-rose)" />}
            {toast.type === 'info' && <Info size={20} color="var(--primary)" />}
            <span style={{ fontSize: '0.85rem', flex: 1, fontWeight: 500 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
