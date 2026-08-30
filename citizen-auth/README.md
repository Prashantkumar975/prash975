# SwachhLens Citizen Auth

Full-stack citizen registration and password recovery system.

## Architecture

```
citizen-auth/
├── backend/          Express.js API
│   ├── server.js     Entry point
│   ├── db.js         PostgreSQL pool + schema init
│   ├── schema.sql    Database tables
│   ├── middleware/    JWT auth guard
│   ├── routes/       Auth routes (register, login, OTP, reset)
│   └── utils/        OTP generation + email/SMS delivery
└── frontend/         React (Vite) app
    └── src/
        ├── App.jsx              Root with view switching
        └── components/
            ├── RegisterForm.jsx Registration form
            └── ForgotPassword.jsx  3-step OTP reset flow
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env        # Edit with your database + SMTP credentials
npm install
npm run dev                  # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create citizen account |
| POST | `/api/auth/login` | Login (username/phone/email + password) |
| POST | `/api/auth/forgot-password` | Generate & send OTP |
| POST | `/api/auth/verify-otp` | Verify 6-digit OTP |
| POST | `/api/auth/reset-password` | Set new password (requires reset token) |
| GET | `/api/auth/me` | Get current user (requires JWT) |

## Database Tables

- **citizens**: id, username (unique), phone (unique), email (unique), password_hash, created_at
- **otp_requests**: id, citizen_id, otp_code, expires_at (5 min), verified, created_at

## OTP Flow

1. User enters phone or email → `POST /forgot-password`
2. System generates 6-digit OTP, stores with 5-min expiry, sends via email/SMS
3. User enters OTP → `POST /verify-otp` → returns short-lived reset token
4. User sets new password → `POST /reset-password` with reset token
