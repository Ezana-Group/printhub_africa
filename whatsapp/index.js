/**
 * index.js — PrintHub Africa WhatsApp Service
 * Entry point for the standalone Express application.
 *
 * Start:     node index.js
 * Dev mode:  npx nodemon index.js
 */

require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const webhookRouter         = require('./routes/webhook');
const metaWebhookRouter     = require('./routes/metaWebhook');
const inboxRouter           = require('./routes/inbox');
const { router: authRouter } = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Trust proxy (required for Railway / Render / Nginx) ─────────────────────
app.set('trust proxy', 1);

// ─── Rate limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // max 10 outbound sends per minute
  message: { error: 'Send rate limit exceeded. Max 10 messages/minute.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts — try again in 15 minutes.' },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// For webhook: capture raw body for HMAC verification, then also parse JSON
app.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString('utf8');
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Health check (no auth required) ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'printhub-whatsapp',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── Dashboard — serve static files ──────────────────────────────────────────
app.use('/whatsapp-inbox', express.static(path.join(__dirname, 'dashboard')));
// Catch-all for SPA routing inside the dashboard
app.get('/whatsapp-inbox/*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/webhook',       webhookRouter);
app.use('/webhook/meta',  metaWebhookRouter);
app.use('/api/auth',      authLimiter, authRouter);
app.use('/api/inbox',     sendLimiter, inboxRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Connect to MongoDB and start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`\n🚀 PrintHub WhatsApp service running`);
      console.log(`   Port:      ${PORT}`);
      console.log(`   Webhook:   ${process.env.BASE_URL || 'http://localhost:' + PORT}/webhook`);
      console.log(`   Dashboard: ${process.env.BASE_URL || 'http://localhost:' + PORT}/whatsapp-inbox`);
      console.log(`   Health:    ${process.env.BASE_URL || 'http://localhost:' + PORT}/health\n`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});
