import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  PieChart as PieIcon,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatCard } from '../components/StatCard';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [salesReport, setSalesReport] = useState(null);
  const [productReport, setProductReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [profitReport, setProfitReport] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes, invRes, profitRes, lowStockRes] = await Promise.all([
        api.get('/api/reports/sales'),
        api.get('/api/reports/products'),
        api.get('/api/reports/inventory'),
        api.get('/api/reports/profit'),
        api.get('/api/inventory/low-stock')
      ]);

      setSalesReport(salesRes.data);
      setProductReport(prodRes.data);
      setInventoryReport(invRes.data);
      setProfitReport(profitRes.data);
      setLowStockItems(lowStockRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={32} style={{ marginBottom: '1rem' }} />
        <div>Loading RetailDock business analytics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Welcome back, {user?.full_name || user?.username}!</span>
          </h1>
          <p className="page-subtitle">
            {isAdmin ? 'System Administrator Dashboard • Live Store Metrics' : 'Cashier Terminal Overview • Active POS Station'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <NavLink to="/billing" className="btn btn-primary">
            <ShoppingCart size={18} />
            <span>Open POS Checkout</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Today's Revenue"
          value={`₹${salesReport?.today_sales.toLocaleString() || '0.00'}`}
          subtitle={`${salesReport?.total_bills || 0} Bills Generated Today`}
          icon={DollarSign}
          color="var(--accent-emerald)"
        />

        <StatCard
          title="Monthly Sales"
          value={`₹${salesReport?.monthly_sales.toLocaleString() || '0.00'}`}
          subtitle={`Avg. Bill: ₹${salesReport?.average_bill_value || '0.00'}`}
          icon={TrendingUp}
          color="var(--primary)"
        />

        <StatCard
          title="Low Stock Alerts"
          value={inventoryReport?.low_stock_count || 0}
          subtitle={`Out of stock: ${inventoryReport?.out_of_stock_count || 0}`}
          icon={AlertTriangle}
          color="var(--accent-amber)"
        />

        {isAdmin ? (
          <StatCard
            title="Estimated Net Profit"
            value={`₹${profitReport?.total_profit.toLocaleString() || '0.00'}`}
            subtitle={`Margin: ${profitReport?.profit_margin_percentage || 0}%`}
            icon={Receipt}
            color="var(--accent-purple)"
          />
        ) : (
          <StatCard
            title="Total Inventory Products"
            value={inventoryReport?.total_products || 0}
            subtitle={`Total Units: ${inventoryReport?.total_stock_count || 0}`}
            icon={Package}
            color="var(--accent-cyan)"
          />
        )}
      </div>

      {/* Charts Section */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        {/* Sales Trend Chart (Span 2) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={20} color="var(--primary)" />
              <span>30-Day Sales Trend</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Daily Revenue (₹)</span>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesReport?.daily_breakdown || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                <XAxis dataKey="date" stroke={isDark ? '#64748B' : '#475569'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#475569'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#151C2C' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    borderRadius: '8px',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  itemStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                  labelStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieIcon size={20} color="var(--accent-cyan)" />
              <span>Sales by Category</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {productReport?.category_breakdown.length === 0 ? (
              <div style={{ margin: 'auto', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productReport?.category_breakdown}
                    dataKey="total_sales"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {productReport?.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#151C2C' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                      borderRadius: '8px',
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                    labelStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section: Low-Stock Alerts & Top Products */}
      <div className="grid-2">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--accent-amber)' }}>
              <AlertTriangle size={20} />
              <span>Low-Stock Inventory Alerts</span>
            </div>
            <NavLink to="/inventory" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>
              Manage Stock →
            </NavLink>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
              ✓ All products maintain healthy stock levels!
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{item.product_code}</div>
                      </td>
                      <td style={{ color: item.quantity === 0 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 700 }}>
                        {item.quantity} units
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.low_stock_threshold} units</td>
                      <td>
                        <span className={`badge ${item.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {item.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Package size={20} color="var(--accent-emerald)" />
              <span>Top-Selling Products</span>
            </div>
            {isAdmin && (
              <NavLink to="/reports" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>
                Full Analytics →
              </NavLink>
            )}
          </div>

          {productReport?.top_selling.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
              No sales completed yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold Qty</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport?.top_selling.slice(0, 5).map((item) => (
                    <tr key={item.product_id}>
                      <td>
                        <strong>{item.product_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{item.category_name}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.total_quantity_sold}</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        ₹{item.total_revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
