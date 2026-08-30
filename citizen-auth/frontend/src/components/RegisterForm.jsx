import { useState } from 'react';
import { api } from '../utils/api';

export default function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({ username: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.username.trim()) return setError('Username is required.');
    if (!form.phone.trim()) return setError('Phone number is required.');
    if (!form.password) return setError('Password is required.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const data = await api.register(form);
      localStorage.setItem('token', data.token);
      alert(`Welcome ${data.citizen.username}! Account created.`);
      onSwitch?.('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Create Account</h2>
      <p style={styles.subtitle}>Join SwachhLens and start reporting waste.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Username *" value={form.username} onChange={set('username')} placeholder="e.g. aanya_sharma" />
        <Field label="Phone Number *" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        <Field label="Email (optional)" value={form.email} onChange={set('email')} placeholder="you@example.com" type="email" />
        <Field label="Password *" value={form.password} onChange={set('password')} type="password" placeholder="••••••••" />
        <Field label="Confirm Password *" value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="••••••••" />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p style={styles.switch}>
        Already have an account?{' '}
        <button type="button" onClick={() => onSwitch?.('login')} style={styles.link}>Log in</button>
      </p>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input {...props} style={styles.input} />
    </label>
  );
}

const styles = {
  card: { maxWidth: 420, margin: '60px auto', padding: 32, borderRadius: 16, background: '#1a2234', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' },
  error: { fontSize: 13, color: '#f87171', margin: 0 },
  btn: { padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  switch: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#94a3b8' },
  link: { background: 'none', border: 'none', color: '#4ade80', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
};
