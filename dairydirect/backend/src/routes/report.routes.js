// src/routes/report.routes.js — Report Routes
import express from "express";

const router = express.Router();

// GET /api/reports/sales
router.get("/sales", (req, res) => {
  res.json({
    message: "Sales report endpoint",
    data: {},
  });
});

// GET /api/reports/inventory
router.get("/inventory", (req, res) => {
  res.json({
    message: "Inventory report endpoint",
    data: {},
  });
});

// GET /api/reports/users
router.get("/users", (req, res) => {
  res.json({
    message: "Users report endpoint",
    data: {},
  });
});

export default router;
