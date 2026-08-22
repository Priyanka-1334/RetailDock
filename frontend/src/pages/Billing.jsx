import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  FileText,
  Download,
  X,
  CreditCard,
  QrCode,
  Banknote
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const Billing = () => {
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart & Bill State
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [gstPct, setGstPct] = useState('18');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Checkout Success / Invoice Modal State
  const [completedBill, setCompletedBill] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories'),
        api.get('/api/customers')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      addToast('Failed to load POS catalog data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Products for left catalog pane
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.product_code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat ? p.category_id === parseInt(selectedCat) : true;
    return matchesSearch && matchesCat;
  });

  const handleAddToCart = (product) => {
    if (product.quantity <= 0) {
      addToast(`Product '${product.name}' is out of stock!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.quantity) {
        addToast(`Cannot exceed available stock (${product.quantity}) for ${product.name}`, 'error');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          product_code: product.product_code,
          unit_price: parseFloat(product.selling_price),
          quantity: 1,
          max_stock: product.quantity
        }
      ]);
    }
  };

  const updateCartQty = (product_id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product_id === product_id) {
            const newQty = item.quantity + delta;
            if (newQty > item.max_stock) {
              addToast(`Available stock limit reached (${item.max_stock})`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter((item) => item.product_id !== product_id));
  };

  // Live calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const discountAmount = subtotal * (parseFloat(discountPct || '0') / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = taxableAmount * (parseFloat(gstPct || '0') / 100);
  const grandTotal = taxableAmount + gstAmount;

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/customers', newCustomer);
      setCustomers([res.data, ...customers]);
      setSelectedCustomerId(res.data.id);
      addToast(`Customer '${res.data.name}' created!`, 'success');
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create customer', 'error');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add products before checkout.', 'error');
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        discount_percentage: parseFloat(discountPct || '0'),
        gst_percentage: parseFloat(gstPct || '0'),
        payment_method: paymentMethod
      };

      const response = await api.post('/api/bills', payload);
      setCompletedBill(response.data);
      addToast('Bill completed & stock updated successfully!', 'success');
      setCart([]);
      fetchData(); // Refresh product quantities
    } catch (err) {
      addToast(err.response?.data?.detail || 'Checkout failed', 'error');
    }
  };

  const handleDownloadInvoice = async (billId, billNum) => {
    try {
      const res = await api.get(`/api/bills/${billId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${billNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      addToast('Failed to download invoice PDF', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingCart size={28} color="var(--primary)" />
            <span>POS Billing & Checkout Terminal</span>
          </h1>
          <p className="page-subtitle">Real-time inventory stock checkout and billing</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Product Search & Quick Add Grid */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }} className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Scan product code or search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ width: '180px' }}>
                <select
                  className="form-select"
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Quick-Selection Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}>
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className="card"
                style={{
                  padding: '1rem',
                  cursor: prod.quantity > 0 ? 'pointer' : 'not-allowed',
                  opacity: prod.quantity > 0 ? 1 : 0.55,
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {prod.product_code}
                </div>
                <h4 style={{ fontSize: '0.95rem', margin: '0.35rem 0 0.5rem 0', minHeight: '2.5rem', lineHeight: '1.25' }}>
                  {prod.name}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ₹{parseFloat(prod.selling_price).toFixed(2)}
                  </span>
                  <span className={`badge ${prod.quantity > 0 ? 'badge-info' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                    {prod.quantity > 0 ? `${prod.quantity} Left` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Cart & Financial Totals */}
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
          <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 className="card-title">Active Order Cart ({cart.length})</h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)' }}>
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem' }}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
            <button onClick={() => setShowCustomerModal(true)} className="btn btn-secondary btn-icon" title="Quick Add Customer">
              <UserPlus size={18} />
            </button>
          </div>

          {/* Cart Items List */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
            {cart.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                Cart is empty. Click items from catalog to add.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border-color)',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ₹{item.unit_price.toFixed(2)} × {item.quantity} = <strong style={{ color: 'var(--accent-emerald)' }}>₹{(item.unit_price * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button onClick={() => updateCartQty(item.product_id, -1)} className="btn btn-secondary btn-icon btn-sm">
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateCartQty(item.product_id, 1)} className="btn btn-secondary btn-icon btn-sm">
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removeFromCart(item.product_id)} className="btn btn-danger btn-icon btn-sm" style={{ marginLeft: '0.25rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount & Tax Controls */}
          <div style={{
            backgroundColor: '#0F172A',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  style={{ height: '34px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>GST Tax (%)</label>
                <select
                  className="form-select"
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  style={{ height: '34px', fontSize: '0.85rem' }}
                >
                  <option value="0">0% Exempt</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% Standard</option>
                  <option value="28">28% Luxury</option>
                </select>
              </div>
            </div>

            {/* Payment Method selector */}
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`btn btn-sm ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center' }}
                >
                  <Banknote size={14} /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`btn btn-sm ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center' }}
                >
                  <QrCode size={14} /> UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center' }}
                >
                  <CreditCard size={14} /> Card
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown Summary */}
          <div style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--accent-rose)' }}>
                <span>Discount ({discountPct}%):</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              <span>GST ({gstPct}%):</span>
              <span>+ ₹{gstAmount.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justify: 'space-between',
              paddingTop: '0.65rem',
              marginTop: '0.65rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#fff'
            }}>
              <span>Grand Total:</span>
              <span style={{ color: 'var(--accent-emerald)' }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn btn-emerald"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
          >
            <CheckCircle2 size={18} />
            <span>Process Bill & Deduct Stock</span>
          </button>
        </div>
      </div>

      {/* Bill Success / Invoice Preview Modal */}
      {completedBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem' }}>Transaction Completed!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Invoice Number: <strong style={{ color: '#fff' }}>{completedBill.bill_number}</strong>
            </p>

            <div style={{
              margin: '1.5rem 0',
              padding: '1rem',
              backgroundColor: '#0F172A',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <span>{completedBill.customer?.name || 'Walk-in Customer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <span style={{ fontWeight: 700 }}>{completedBill.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Count:</span>
                <span>{completedBill.items.length} Products</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 800, fontSize: '1rem' }}>
                <span>Total Paid:</span>
                <span style={{ color: 'var(--accent-emerald)' }}>₹{parseFloat(completedBill.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleDownloadInvoice(completedBill.id, completedBill.bill_number)}
                className="btn btn-primary"
              >
                <Download size={18} />
                <span>Download PDF Invoice</span>
              </button>
              <button
                onClick={() => setCompletedBill(null)}
                className="btn btn-secondary"
              >
                <span>Close & New Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button onClick={() => setShowCustomerModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
