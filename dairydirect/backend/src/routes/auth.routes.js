// src/routes/auth.routes.js — Authentication Routes
import express from 'express';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  res.json({
    message: 'Signup endpoint - TODO',
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({
    message: 'Login endpoint - TODO',
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  res.json({
    message: 'Refresh token endpoint - TODO',
  });
});

export default router;
