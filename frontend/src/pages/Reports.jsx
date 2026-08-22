import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, DollarSign, TrendingUp, Package, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { StatCard } from '../components/StatCard';

export const Reports = () => {
  const { addToast } = useToast();
  const [sales, setSales] = useState(null);
  const [products, setProducts] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes, invRes, profitRes] = await Promise.all([
        api.get('/api/reports/sales'),
        api.get('/api/reports/products'),
        api.get('/api/reports/inventory'),
        api.get('/api/reports/profit')
      ]);

      setSales(salesRes.data);
      setProducts(prodRes.data);
      setInventory(invRes.data);
      setProfit(profitRes.data);
    } catch (err) {
      addToast('Failed to load analytics reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/api/reports/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'RetailDock_Business_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Executive PDF Report downloaded!', 'success');
    } catch (err) {
      addToast('Failed to export PDF report', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/api/reports/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'RetailDock_Sales_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Sales Excel spreadsheet downloaded!', 'success');
    } catch (err) {
      addToast('Failed to export Excel report', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={32} style={{ marginBottom: '1rem' }} />
        <div>Computing analytics & profit reports...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} color="var(--accent-purple)" />
            <span>Executive Reporting & Analytics</span>
          </h1>
          <p className="page-subtitle">Real-time revenue, profit metrics, and exportable business reports</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <FileSpreadsheet size={18} color="var(--accent-emerald)" />
            <span>Export Excel</span>
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary">
            <FileText size={18} />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Total Lifetime Revenue"
          value={`₹${sales?.total_revenue.toLocaleString() || '0.00'}`}
          subtitle={`${sales?.total_bills || 0} Total Orders`}
          icon={DollarSign}
          color="var(--accent-emerald)"
        />

        <StatCard
          title="Cost of Goods Sold (COGS)"
          value={`₹${profit?.total_cost_of_goods_sold.toLocaleString() || '0.00'}`}
          subtitle="Inventory Wholesale Cost"
          icon={Package}
          color="var(--accent-amber)"
        />

        <StatCard
          title="Net Calculated Profit"
          value={`₹${profit?.total_profit.toLocaleString() || '0.00'}`}
          subtitle={`Profit Margin: ${profit?.profit_margin_percentage || '0.00'}%`}
          icon={TrendingUp}
          color="var(--accent-purple)"
        />

        <StatCard
          title="Total Inventory Value"
          value={`₹${inventory?.total_inventory_retail_value.toLocaleString() || '0.00'}`}
          subtitle={`Retail Value (${inventory?.total_products} items)`}
          icon={BarChart3}
          color="var(--primary)"
        />
      </div>

      {/* Detailed Report Sections */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Category Revenue Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Category Revenue Breakdown</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {products?.category_breakdown.map((cat) => (
                  <tr key={cat.category_id || cat.category_name}>
                    <td><strong>{cat.category_name}</strong></td>
                    <td>{cat.items_sold}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      ₹{parseFloat(cat.total_sales).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Best Sellers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top 10 Performing Products</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products?.top_selling.map((item) => (
                  <tr key={item.product_id}>
                    <td><code>{item.product_code}</code></td>
                    <td><strong>{item.product_name}</strong></td>
                    <td style={{ fontWeight: 800 }}>{item.total_quantity_sold}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      ₹{parseFloat(item.total_revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
