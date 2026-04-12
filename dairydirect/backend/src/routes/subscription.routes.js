// src/routes/subscription.routes.js — Subscription Routes
import express from "express";

const router = express.Router();

// GET /api/subscriptions
router.get("/", (req, res) => {
  res.json({
    message: "Get subscriptions endpoint",
    subscriptions: [],
  });
});

// POST /api/subscriptions
router.post("/", (req, res) => {
  res.json({
    message: "Create subscription endpoint",
  });
});

// GET /api/subscriptions/:id
router.get("/:id", (req, res) => {
  res.json({
    message: `Get subscription ${req.params.id}`,
  });
});

// PATCH /api/subscriptions/:id
router.patch("/:id", (req, res) => {
  res.json({
    message: `Update subscription ${req.params.id}`,
  });
});

// DELETE /api/subscriptions/:id
router.delete("/:id", (req, res) => {
  res.json({
    message: `Delete subscription ${req.params.id}`,
  });
});

export default router;
