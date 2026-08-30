const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

/** Generate a cryptographically secure 6-digit OTP. */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/** OTP expiry timestamp (5 minutes from now). */
function otpExpiry() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

/* ── Email transporter (lazy init) ──────────────────────────────── */
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

/** Send OTP via email. */
async function sendOTPEmail(email, otp) {
  if (!process.env.SMTP_USER) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@swachlens.app',
    to: email,
    subject: 'SwachhLens — Your Password Reset OTP',
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;">
        <h2 style="color:#22c55e;">SwachhLens</h2>
        <p>Your password reset OTP is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#111;">${otp}</p>
        <p style="color:#666;">Expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      </div>
    `,
  });
}

/** Send OTP via SMS (stub — plug in Twilio / MSG91). */
async function sendOTPSMS(phone, otp) {
  // TODO: Integrate Twilio / MSG91 / Gupshup
  console.log(`[SMS] OTP for ${phone}: ${otp}`);
}

module.exports = { generateOTP, otpExpiry, sendOTPEmail, sendOTPSMS, OTP_EXPIRY_MINUTES };
