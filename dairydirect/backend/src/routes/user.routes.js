// src/routes/user.routes.js — User Routes
import express from 'express';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({
    message: 'User profile endpoint - TODO',
  });
});

// PATCH /api/users/profile
router.patch('/profile', (req, res) => {
  res.json({
    message: 'Update profile endpoint - TODO',
  });
});

export default router;
