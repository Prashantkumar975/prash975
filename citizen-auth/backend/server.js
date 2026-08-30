require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ──
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SwachhLens Citizen Auth API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
