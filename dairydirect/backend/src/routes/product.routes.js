// src/routes/product.routes.js — Product Routes
import express from "express";

const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  res.json({
    message: "Get all products endpoint - TODO",
    products: [],
  });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  res.json({
    message: `Get product ${req.params.id} endpoint - TODO`,
  });
});

export default router;
