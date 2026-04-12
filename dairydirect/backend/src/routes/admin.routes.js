// src/routes/admin.routes.js — Admin Routes
import express from "express";

const router = express.Router();

// GET /api/admin/dashboard
router.get("/dashboard", (req, res) => {
  res.json({
    message: "Admin dashboard data",
    stats: {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
    },
  });
});

// GET /api/admin/users
router.get("/users", (req, res) => {
  res.json({
    message: "All users",
    users: [],
  });
});

// GET /api/admin/orders
router.get("/orders", (req, res) => {
  res.json({
    message: "All orders",
    orders: [],
  });
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", (req, res) => {
  res.json({
    message: `Update user ${req.params.id}`,
  });
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", (req, res) => {
  res.json({
    message: `Delete user ${req.params.id}`,
  });
});

export default router;
