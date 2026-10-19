const fs = require('fs');

// 1. Update Login.jsx
const loginContent = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEwaste } from '../context/EwasteContext';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useEwaste();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res?.user) {
        navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
            <LogIn size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Sign in to your EcoCycle account</p>
        </div>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-title)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meghana@example.com"
                required
                disabled={isSubmitting}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-title)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isSubmitting}
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing In...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Register here</Link>
        </p>

        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-gray-100)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text-title)' }}>Quick Demo Logins (Click to autofill):</strong>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => fillDemo('meghana@example.com')}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0', cursor: 'pointer', color: '#059669', fontWeight: 600 }}
            >
              • Citizen: meghana@example.com (password123)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@ecocycle.com')}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0', cursor: 'pointer', color: '#047857', fontWeight: 600 }}
            >
              • Admin: admin@ecocycle.com (password123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/Login.jsx', loginContent, 'utf8');
console.log('Updated Login.jsx');

// 2. Update Register.jsx
const registerContent = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEwaste } from '../context/EwasteContext';
import { UserPlus, User, Mail, Phone, Lock, Loader2, AlertCircle } from 'lucide-react';

const Register = () => {
  const { register } = useEwaste();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'user'
      });
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: <User size={18} />, placeholder: 'Meghana Rao' },
    { name: 'email', label: 'Email Address', type: 'email', icon: <Mail size={18} />, placeholder: 'meghana@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel', icon: <Phone size={18} />, placeholder: '+91 98765 43210' },
    { name: 'password', label: 'Password', type: 'password', icon: <Lock size={18} />, placeholder: 'Create a secure password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: <Lock size={18} />, placeholder: 'Repeat your password' },
  ];

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
            <UserPlus size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)' }}>Create Account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Join EcoCycle and start recycling responsibly</p>
        </div>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fields.map((f) => (
            <div key={f.name}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-title)' }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>{f.icon}</span>
                <input
                  className="input"
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required
                  disabled={isSubmitting}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/Register.jsx', registerContent, 'utf8');
console.log('Updated Register.jsx');

// 3. Update RegisterEwaste.jsx
const registerEwasteContent = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEwaste } from '../context/EwasteContext';
import { CalendarPlus, Package, MapPin, Clock, FileText, Loader2, AlertCircle } from 'lucide-react';

const RegisterEwaste = () => {
  const { currentUser, createRequest, categories } = useEwaste();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemName: '',
    category: categories[0]?.name || 'Computers & Laptops',
    quantity: 1,
    condition: 'Working (Reusable)',
    weightKg: '',
    address: currentUser?.address || '',
    city: currentUser?.city || 'Bengaluru',
    pincode: currentUser?.pincode || '',
    preferredDate: '',
    timeSlot: 'Morning (09:00 AM - 12:00 PM)',
    instructions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Please login first to submit an e-waste collection request.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const created = await createRequest(form);
      if (created) {
        navigate(\`/track?id=\${created.id}\`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditions = [
    'Working (Reusable)',
    'Partially Working / Repairable',
    'Non-functional / Scrap',
    'Minor Defect (Repairable)'
  ];

  const timeSlots = [
    'Morning (09:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 04:00 PM)',
    'Evening (04:00 PM - 07:00 PM)'
  ];

  const inputStyle = { paddingLeft: '40px' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-title)' };
  const iconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
            <CalendarPlus size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)' }}>Schedule E-Waste Pickup</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Our certified collection agents will collect your items right from your doorstep</p>
        </div>

        {!currentUser && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            color: '#1e40af',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <span>Please sign in to link this pickup request to your account.</span>
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          </div>
        )}

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Item Name */}
          <div>
            <label style={labelStyle}>Item Name / Description</label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={iconStyle} />
              <input
                className="input"
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                placeholder="e.g. Dell Latitude Laptop & HP Monitor"
                required
                disabled={isSubmitting}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Category & Quantity row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                className="input"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                className="input"
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Condition & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Condition</label>
              <select
                className="input"
                name="condition"
                value={form.condition}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Approx. Weight (kg)</label>
              <input
                className="input"
                type="number"
                name="weightKg"
                step="0.1"
                min="0.1"
                value={form.weightKg}
                onChange={handleChange}
                placeholder="e.g. 4.5"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Pickup Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={iconStyle} />
              <input
                className="input"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Door/Flat number, Building, Street"
                required
                disabled={isSubmitting}
                style={inputStyle}
              />
            </div>
          </div>

          {/* City & Pincode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                className="input"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Bengaluru"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label style={labelStyle}>Pincode</label>
              <input
                className="input"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="560038"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Date & Time Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Preferred Date</label>
              <div>
                <input
                  className="input"
                  type="date"
                  name="preferredDate"
                  value={form.preferredDate}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Time Slot</label>
              <div>
                <select
                  className="input"
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {timeSlots.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label style={labelStyle}>Special Instructions (Optional)</label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ ...iconStyle, top: '18px' }} />
              <textarea
                className="input"
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Ring flat 402 buzzer, items kept near security desk"
                disabled={isSubmitting}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !currentUser}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Registering Pickup Request...
              </>
            ) : (
              <>
                <CalendarPlus size={18} /> Submit Pickup Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterEwaste;
`;
fs.writeFileSync('C:/Users/megha/my-website/src/pages/RegisterEwaste.jsx', registerEwasteContent, 'utf8');
console.log('Updated RegisterEwaste.jsx');
