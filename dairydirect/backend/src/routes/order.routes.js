// src/routes/order.routes.js — Order Routes
import express from "express";
import { createOrder, getUserOrders, getOrderById, updateOrderStatus } from "../controllers/orderController.js";

const router = express.Router();

// GET /api/orders
router.get("/", getUserOrders);

// POST /api/orders
router.post("/", createOrder);

// GET /api/orders/:id
router.get("/:id", getOrderById);

// PATCH /api/orders/:id/status
router.patch("/:id/status", updateOrderStatus);

export default router;
