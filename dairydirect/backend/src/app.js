// src/app.js — Express Application Bootstrap
// DairyDirect | Security Middleware → Routes → Error Handler

import express from "express";
import helmet from "helmet";
import cors from "cors";

import { generalLimiter, authLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { authenticate } from "./middlewares/auth.middleware.js";
import { supabase } from "./utils/supabase.js";

const app = express();

// ─── 1. Security Headers ──────────────────────────────────
app.use(helmet());

// ─── 2. CORS ─────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001",
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
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── 3. Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── 4. Rate Limiting ──────────────────────────────────────
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/", generalLimiter);

// ─── 5. Health Check ───────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "✅ DairyDirect API is running" });
});

// ─── 6. Public Routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ─── 7. Protected Routes ───────────────────────────────────
app.use("/api/users", authenticate, userRoutes);
app.use("/api/orders", authenticate, orderRoutes);
app.use("/api/subscriptions", authenticate, subscriptionRoutes);
app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/admin", authenticate, adminRoutes);

// ─── 8. 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ─── 9. Global Error Handler ──────────────────────────────
app.use(errorHandler);

export default app;
