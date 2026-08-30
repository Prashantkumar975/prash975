import { useState } from 'react';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function App() {
  const [view, setView] = useState('register'); // 'register' | 'login' | 'forgot'
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.identifier || !loginForm.password) {
      return setLoginError('All fields are required.');
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      alert(`Welcome back, ${data.citizen.username}!`);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <span style={styles.logo}>♻️ SwachhLens Auth</span>
      </nav>

      {view === 'register' && <RegisterForm onSwitch={setView} />}

      {view === 'login' && (
        <div style={styles.card}>
          <h2 style={styles.title}>Log In</h2>
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.field}>
              <span style={styles.label}>Username, Phone, or Email</span>
              <input
                value={loginForm.identifier}
                onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                placeholder="Enter identifier"
                style={styles.input}
              />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                style={styles.input}
              />
            </label>
            {loginError && <p style={styles.error}>{loginError}</p>}
            <button type="submit" disabled={loginLoading} style={styles.btn}>
              {loginLoading ? 'Signing in…' : 'Log In'}
            </button>
          </form>
          <div style={styles.links}>
            <button onClick={() => setView('forgot')} style={styles.link}>Forgot password?</button>
            <button onClick={() => setView('register')} style={styles.link}>Create account</button>
          </div>
        </div>
      )}

      {view === 'forgot' && <ForgotPassword onSwitch={setView} />}
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#0a0f1a', fontFamily: 'Inter, system-ui, sans-serif' },
  nav: { padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,15,26,0.9)' },
  logo: { fontFamily: 'Space Grotesk, system-ui, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff' },
  card: { maxWidth: 420, margin: '60px auto', padding: 32, borderRadius: 16, background: '#1a2234', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' },
  error: { fontSize: 13, color: '#f87171', margin: 0 },
  btn: { padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  links: { display: 'flex', justifyContent: 'space-between', marginTop: 16 },
  link: { background: 'none', border: 'none', color: '#4ade80', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
};
