// src/routes/order.routes.js — Order Routes
import express from 'express';

const router = express.Router();

// GET /api/orders
router.get('/', (req, res) => {
  res.json({
    message: 'Get all orders endpoint - TODO',
    orders: [],
  });
});

// POST /api/orders
router.post('/', (req, res) => {
  res.json({
    message: 'Create order endpoint - TODO',
  });
});

export default router;
