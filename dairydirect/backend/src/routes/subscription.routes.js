// src/routes/subscription.routes.js — Subscription Routes
import express from "express";
import { getUserSubscriptions, createSubscription, getSubscriptionById, updateSubscription, cancelSubscription } from "../controllers/subscriptionController.js";

const router = express.Router();

// GET /api/subscriptions
router.get("/", getUserSubscriptions);

// POST /api/subscriptions
router.post("/", createSubscription);

// GET /api/subscriptions/:id
router.get("/:id", getSubscriptionById);

// PATCH /api/subscriptions/:id
router.patch("/:id", updateSubscription);

// DELETE /api/subscriptions/:id
router.delete("/:id", cancelSubscription);

export default router;
