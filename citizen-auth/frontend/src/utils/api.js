const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (d) => request('POST', '/auth/register', d),
  login: (d) => request('POST', '/auth/login', d),
  forgotPassword: (d) => request('POST', '/auth/forgot-password', d),
  verifyOtp: (d) => request('POST', '/auth/verify-otp', d),
  resetPassword: (d) => request('POST', '/auth/reset-password', d),
  me: (token) =>
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
};
