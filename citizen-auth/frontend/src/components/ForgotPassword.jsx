import { useState } from 'react';
import { api } from '../utils/api';

/**
 * 3-step forgot password flow:
 *   Step 1: Enter phone or email (identifier)
 *   Step 2: Enter 6-digit OTP
 *   Step 3: Set new password + confirm
 */
export default function ForgotPassword({ onSwitch }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  /* ── Step 1: Request OTP ── */
  async function handleRequestOTP(e) {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) return setError('Enter your phone number or email.');

    setLoading(true);
    try {
      await api.forgotPassword({ identifier });
      setSuccess('OTP sent! Check your phone or email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 2: Verify OTP ── */
  async function handleVerifyOTP(e) {
    e.preventDefault();
    setError('');
    if (!otp.trim() || otp.length !== 6) return setError('Enter the 6-digit OTP.');

    setLoading(true);
    try {
      const data = await api.verifyOtp({ identifier, otp });
      setResetToken(data.resetToken);
      setSuccess('OTP verified! Set your new password.');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 3: Reset password ── */
  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');

    if (!newPassword) return setError('New password is required.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await api.resetPassword({ resetToken, newPassword, confirmPassword });
      setSuccess('Password updated! You can now log in.');
      setTimeout(() => onSwitch?.('login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Reset Password</h2>

      {/* Step indicator */}
      <div style={styles.steps}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ ...styles.stepDot, ...(s <= step ? styles.stepActive : {}) }}>
            {s < step ? '✓' : s}
          </div>
        ))}
      </div>

      {success && <p style={styles.success}>{success}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* Step 1: Identifier */}
      {step === 1 && (
        <form onSubmit={handleRequestOTP} style={styles.form}>
          <p style={styles.hint}>Enter the phone number or email linked to your account.</p>
          <label style={styles.field}>
            <span style={styles.label}>Phone or Email</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+91 98765 43210 or you@example.com"
              style={styles.input}
            />
          </label>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOTP} style={styles.form}>
          <p style={styles.hint}>Enter the 6-digit code sent to your phone/email.</p>
          <label style={styles.field}>
            <span style={styles.label}>OTP Code</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{ ...styles.input, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'monospace' }}
            />
          </label>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>← Change identifier</button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} style={styles.form}>
          <p style={styles.hint}>Set a new password for your account.</p>
          <label style={styles.field}>
            <span style={styles.label}>New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </label>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      <p style={styles.switch}>
        <button type="button" onClick={() => onSwitch?.('login')} style={styles.link}>← Back to Login</button>
      </p>
    </div>
  );
}

const styles = {
  card: { maxWidth: 420, margin: '60px auto', padding: 32, borderRadius: 16, background: '#1a2234', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  steps: { display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 },
  stepDot: { width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, border: '2px solid rgba(255,255,255,0.15)', color: '#64748b' },
  stepActive: { borderColor: '#22c55e', color: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.3)' },
  success: { fontSize: 13, color: '#4ade80', marginBottom: 12, textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)' },
  error: { fontSize: 13, color: '#f87171', marginBottom: 12, textAlign: 'center' },
  hint: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' },
  btn: { padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', textAlign: 'center', marginTop: 4 },
  switch: { textAlign: 'center', marginTop: 20 },
  link: { background: 'none', border: 'none', color: '#4ade80', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
};
