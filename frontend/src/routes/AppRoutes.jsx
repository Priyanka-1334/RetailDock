import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { Categories } from '../pages/Categories';
import { Inventory } from '../pages/Inventory';
import { Billing } from '../pages/Billing';
import { BillsHistory } from '../pages/BillsHistory';
import { Customers } from '../pages/Customers';
import { Reports } from '../pages/Reports';
import { Users } from '../pages/Users';
import { Profile } from '../pages/Profile';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/bills" element={<BillsHistory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
