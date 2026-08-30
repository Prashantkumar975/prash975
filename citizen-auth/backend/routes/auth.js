const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, queryOne, execute } = require('../db');
const { generateOTP, otpExpiry, sendOTPEmail, sendOTPSMS } = require('../utils/otp');
const authenticate = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;

function nowPlus(minutes) {
  const d = new Date(Date.now() + minutes * 60000);
  return d.toISOString();
}

/* ============================================================
 * POST /register
 * ============================================================ */
router.post('/register', async (req, res) => {
  try {
    const { username, phone, email, password, confirmPassword } = req.body;

    if (!username || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Username, phone, password and confirm password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (queryOne('SELECT 1 FROM citizens WHERE username = ?', username)) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }
    if (queryOne('SELECT 1 FROM citizens WHERE phone = ?', phone)) {
      return res.status(409).json({ error: 'Phone number is already registered.' });
    }
    if (email && queryOne('SELECT 1 FROM citizens WHERE email = ?', email)) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = execute(
      'INSERT INTO citizens (username, phone, email, password_hash) VALUES (?, ?, ?, ?)',
      username, phone, email || null, passwordHash,
    );

    const citizen = queryOne('SELECT id, username, phone, email, created_at FROM citizens WHERE id = ?', result.lastInsertRowid);
    const token = jwt.sign(
      { id: citizen.id, username: citizen.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    return res.status(201).json({ citizen, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ============================================================
 * POST /login
 * ============================================================ */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/phone/email and password are required.' });
    }

    const citizen = queryOne(
      'SELECT * FROM citizens WHERE username = ? OR phone = ? OR email = ?',
      identifier, identifier, identifier,
    );
    if (!citizen) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, citizen.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: citizen.id, username: citizen.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    return res.json({
      citizen: { id: citizen.id, username: citizen.username, phone: citizen.phone, email: citizen.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ============================================================
 * POST /forgot-password  →  generate & send OTP
 * ============================================================ */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Phone number or email is required.' });
    }

    const citizen = queryOne(
      'SELECT id, phone, email FROM citizens WHERE phone = ? OR email = ?',
      identifier, identifier,
    );
    if (!citizen) {
      return res.json({ message: 'If an account exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const expiresAt = nowPlus(5);

    execute(
      'INSERT INTO otp_requests (citizen_id, otp_code, expires_at) VALUES (?, ?, ?)',
      citizen.id, otp, expiresAt,
    );

    const promises = [];
    if (citizen.email) promises.push(sendOTPEmail(citizen.email, otp));
    if (citizen.phone) promises.push(sendOTPSMS(citizen.phone, otp));
    await Promise.all(promises);

    return res.json({ message: 'If an account exists, an OTP has been sent.' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ============================================================
 * POST /verify-otp
 * ============================================================ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required.' });
    }

    const citizen = queryOne(
      'SELECT id FROM citizens WHERE phone = ? OR email = ?',
      identifier, identifier,
    );
    if (!citizen) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const otpRow = queryOne(
      `SELECT id FROM otp_requests
       WHERE citizen_id = ? AND otp_code = ? AND verified = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`,
      citizen.id, otp,
    );

    if (!otpRow) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    execute('UPDATE otp_requests SET verified = 1 WHERE id = ?', otpRow.id);

    const resetToken = jwt.sign(
      { id: citizen.id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' },
    );

    return res.json({ message: 'OTP verified.', resetToken });
  } catch (err) {
    console.error('Verify-otp error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ============================================================
 * POST /reset-password
 * ============================================================ */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Reset token, new password, and confirm password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }
    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid token purpose.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    execute('UPDATE citizens SET password_hash = ? WHERE id = ?', passwordHash, payload.id);
    execute('UPDATE otp_requests SET verified = 1 WHERE citizen_id = ? AND verified = 0', payload.id);

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ============================================================
 * GET /me  (protected)
 * ============================================================ */
router.get('/me', authenticate, (req, res) => {
  const citizen = queryOne('SELECT id, username, phone, email, created_at FROM citizens WHERE id = ?', req.citizen.id);
  if (!citizen) return res.status(404).json({ error: 'User not found.' });
  return res.json(citizen);
});

module.exports = router;
