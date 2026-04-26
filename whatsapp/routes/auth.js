/**
 * auth.js
 * POST /api/auth/login  — dashboard login
 * GET  /api/auth/me     — verify token
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();

const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
// Pre-hash at startup so we're not hashing on every request
let HASHED_PASSWORD = null;
(async () => {
  HASHED_PASSWORD = await bcrypt.hash(
    process.env.DASHBOARD_PASSWORD || 'changeme',
    12
  );
})();

// ─── Middleware: verify JWT ────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const usernameOk = username === DASHBOARD_USERNAME;
  // Always run bcrypt to prevent timing attacks
  const passwordOk = await bcrypt.compare(
    password,
    HASHED_PASSWORD || '$2a$12$invalidhashtopreventtimingattacks'
  );

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username, role: 'agent' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

module.exports = { router, requireAuth };
