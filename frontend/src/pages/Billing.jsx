import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  Download,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Tag,
  User
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const Billing = () => {
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
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
          max_stock: product.quantity,
          discount_percentage: 0
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

  const updateCartItemDiscount = (product_id, discPct) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === product_id
          ? { ...item, discount_percentage: parseFloat(discPct || '0') }
          : item
      )
    );
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter((item) => item.product_id !== product_id));
  };

  // Live calculations with per-item discounts
  const subtotal = cart.reduce((sum, item) => {
    const lineSub = item.quantity * item.unit_price;
    const lineDisc = lineSub * ((item.discount_percentage || 0) / 100);
    return sum + (lineSub - lineDisc);
  }, 0);
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
      {/* Compact Page Header */}
      <div className="page-header" style={{ marginBottom: '0.75rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.35rem' }}>
            <ShoppingCart size={24} color="var(--primary)" />
            <span>POS Billing & Checkout Terminal</span>
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Real-time inventory stock checkout and billing</p>
        </div>
      </div>

      {/* POS Workspace Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '1rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Search Bar & Product Catalog Compact List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Search & Category Filter Controls */}
          <div className="card" style={{ marginBottom: '0.65rem', padding: '0.65rem 0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }} className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search product name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ height: '36px', fontSize: '0.82rem', paddingLeft: '2.5rem' }}
                />
              </div>
              <div style={{ width: '170px' }}>
                <select
                  className="form-select"
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  style={{ height: '36px', fontSize: '0.82rem' }}
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

          {/* Compact Product Catalog List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading product catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                No matching products found.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="card"
                  style={{
                    padding: '0.6rem 0.85rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    opacity: prod.quantity > 0 ? 1 : 0.55
                  }}
                >
                  {/* Product Details */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'monospace' }}>
                        {prod.product_code}
                      </span>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-subtle)' }}>
                        • {prod.category?.name || 'Uncategorized'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.name}
                    </div>
                  </div>

                  {/* Pricing, Stock & Add Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        ₹{parseFloat(prod.selling_price).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Stock: <strong style={{ color: prod.quantity > 0 ? '#F8FAFC' : 'var(--accent-rose)' }}>{prod.quantity}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(prod)}
                      disabled={prod.quantity <= 0}
                      className={`btn btn-sm ${prod.quantity > 0 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        minWidth: '68px',
                        justifyContent: 'center',
                        cursor: prod.quantity > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Order Cart Panel */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0.88rem 1rem'
        }}>
          {/* Cart Header */}
          <div className="card-header" style={{ marginBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Active Order ({cart.length})</h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Searchable Customer/User Selection for Active Order */}
          <div style={{ marginBottom: '0.65rem', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {/* Search Input / Selected Customer Pill */}
              <div style={{ flex: 1, position: 'relative' }}>
                {selectedCustomerId ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.65rem',
                    backgroundColor: '#1E293B',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    height: '36px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <User size={15} color="var(--primary)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customers.find((c) => c.id === parseInt(selectedCustomerId))?.name || 'Customer'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ({customers.find((c) => c.id === parseInt(selectedCustomerId))?.phone || 'No phone'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerSearch('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Clear customer selection"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="search-bar" style={{ height: '36px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-subtle)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search customer by name or phone..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                      style={{ height: '36px', fontSize: '0.82rem', paddingLeft: '2.2rem', paddingRight: '0.65rem' }}
                    />
                  </div>
                )}

                {/* Autocomplete Dropdown List */}
                {!selectedCustomerId && isCustomerDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    marginTop: '0.25rem',
                    backgroundColor: '#151C2C',
                    border: '1px solid #334155',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}>
                    {/* Walk-in Customer Option */}
                    <div
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerSearch('');
                        setIsCustomerDropdownOpen(false);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        fontWeight: 600
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      • Walk-in Customer (Default)
                    </div>

                    {/* Filtered Customers List */}
                    {customers
                      .filter((c) => {
                        if (!customerSearch) return true;
                        const term = customerSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(term) ||
                          (c.phone && c.phone.includes(term)) ||
                          (c.email && c.email.toLowerCase().includes(term))
                        );
                      })
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id.toString());
                            setCustomerSearch('');
                            setIsCustomerDropdownOpen(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{c.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                              {c.phone || 'No phone'} {c.email ? `• ${c.email}` : ''}
                            </div>
                          </div>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Select</span>
                        </div>
                      ))}

                    {customers.filter((c) => {
                      if (!customerSearch) return true;
                      const term = customerSearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(term) ||
                        (c.phone && c.phone.includes(term)) ||
                        (c.email && c.email.toLowerCase().includes(term))
                      );
                    }).length === 0 && (
                      <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        No matching customers found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Add Customer Button */}
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="btn btn-secondary btn-icon"
                style={{ padding: '0.45rem', flexShrink: 0 }}
                title="Quick Add Customer"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {/* Cart Items List with Complete Independent Item Controls */}
          <div style={{ marginBottom: '0.65rem' }}>
            {cart.length === 0 ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                Cart is empty. Click catalog items to add.
              </div>
            ) : (
              cart.map((item) => {
                const lineSubtotal = item.unit_price * item.quantity;
                const lineDiscount = lineSubtotal * ((item.discount_percentage || 0) / 100);
                const lineNetTotal = lineSubtotal - lineDiscount;

                return (
                  <div
                    key={item.product_id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#0F172A',
                      border: '1px solid var(--border-color)',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}
                  >
                    {/* Item Name & Net Line Total */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          ₹{item.unit_price.toFixed(2)} / unit
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                          ₹{lineNetTotal.toFixed(2)}
                        </div>
                        {lineDiscount > 0 && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--accent-rose)' }}>
                            -₹{lineDiscount.toFixed(2)} ({item.discount_percentage}%)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Independent Quantity Controls, Item Discount & Remove Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product_id, -1)}
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Decrease Quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '22px', textAlign: 'center', color: '#fff' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product_id, 1)}
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Increase Quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Item-level Discount Selector & Remove Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <select
                          className="form-select"
                          value={item.discount_percentage || 0}
                          onChange={(e) => updateCartItemDiscount(item.product_id, e.target.value)}
                          style={{ height: '28px', fontSize: '0.72rem', padding: '0 1.5rem 0 0.4rem', width: '82px' }}
                          title="Item Discount"
                        >
                          <option value="0">0% Disc</option>
                          <option value="5">5% Off</option>
                          <option value="10">10% Off</option>
                          <option value="15">15% Off</option>
                          <option value="20">20% Off</option>
                          <option value="25">25% Off</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product_id)}
                          className="btn btn-danger btn-icon btn-sm"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Remove Item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Overall Order Discount & Tax Controls */}
          <div style={{
            backgroundColor: '#0F172A',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '0.65rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Order Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  style={{ height: '32px', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>GST Tax (%)</label>
                <select
                  className="form-select"
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  style={{ height: '32px', fontSize: '0.78rem', padding: '0 1.4rem 0 0.5rem' }}
                >
                  <option value="0">0% Exempt</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% Standard</option>
                  <option value="28">28% Luxury</option>
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`btn btn-sm ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                >
                  <Banknote size={12} /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`btn btn-sm ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                >
                  <QrCode size={12} /> UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                >
                  <CreditCard size={12} /> Card
                </button>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Summary */}
          <div style={{ fontSize: '0.82rem', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
              <span>Cart Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', color: 'var(--accent-rose)' }}>
                <span>Order Discount ({discountPct}%):</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
              <span>GST Tax ({gstPct}%):</span>
              <span>+ ₹{gstAmount.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.45rem',
              marginTop: '0.45rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '1.05rem',
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
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.88rem' }}
          >
            <CheckCircle2 size={16} />
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
