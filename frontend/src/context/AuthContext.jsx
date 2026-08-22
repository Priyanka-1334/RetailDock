import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('retaildock_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('retaildock_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
          localStorage.setItem('retaildock_user', JSON.stringify(response.data));
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    const { access_token, user: userData } = response.data;
    
    setToken(access_token);
    setUser(userData);
    
    localStorage.setItem('retaildock_token', access_token);
    localStorage.setItem('retaildock_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('retaildock_token');
    localStorage.removeItem('retaildock_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isCashier: user?.role === 'CASHIER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
