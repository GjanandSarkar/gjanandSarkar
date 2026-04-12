// src/app.js — Express Application Bootstrap
// DairyDirect | Security Middleware → Routes → Error Handler

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { generalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import reportRoutes from './routes/report.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { authenticate } from './middlewares/auth.middleware.js';
import { supabase } from './utils/supabase.js';

const app = express();

// ─── 1. Security Headers ──────────────────────────────────
app.use(helmet());

// ─── 2. CORS ─────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3001',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── 3. Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── 4. General Rate Limiter ───────────────────────────────
app.use(generalLimiter);

// ─── 5. Health Check (Public) ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'DairyDirect API',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// ─── 6. Supabase Connection Test (Public) ─────────────────
app.get('/test-db', async (req, res) => {
  // Step 1 — Check if .env is loaded
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      success: false,
      message: '❌ .env file missing or not loaded',
      fix: 'Paste your .env file inside server/ folder and restart server',
      debug: {
        SUPABASE_URL: url ? '✅ loaded' : '❌ missing',
        SUPABASE_SERVICE_ROLE_KEY: key ? '✅ loaded' : '❌ missing',
      },
    });
  }

  // Step 2 — Try connecting to Supabase
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    res.json({
      success: true,
      message: '✅ Supabase connected successfully',
      debug: {
        SUPABASE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY: '✅ loaded',
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '❌ Supabase connected but query failed',
      error: err.message,
      fix: 'Run schema.sql in your Supabase SQL Editor — table may not exist yet',
      debug: {
        SUPABASE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY: '✅ loaded',
      },
    });
  }
});

// ─── 7. Routes ───────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes);
app.use('/products', productRoutes);
app.use('/users', authenticate, userRoutes);
app.use('/orders', authenticate, orderRoutes);
app.use('/subscriptions', authenticate, subscriptionRoutes);
app.use('/reports', authenticate, reportRoutes);
app.use('/admin', authenticate, adminRoutes);

// ─── 8. 404 Handler ──────────────────────────────────────
app.get('/test-db', async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({
      success: false,
      message: '❌ .env file missing',
      debug: {
        SUPABASE_URL: url ? '✅ loaded' : '❌ missing',
        SUPABASE_SERVICE_ROLE_KEY: key ? '✅ loaded' : '❌ missing',
      },
    });
  }
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    res.json({ success: true, message: '✅ Supabase connected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: '❌ Query failed', error: err.message });
  }
});

// ─── 9. Global Error Handler (MUST be last) ───────────────
app.use(errorHandler);

export default app;