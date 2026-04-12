// src/routes/auth.routes.js — Authentication Routes
import express from "express";
import { signup, login, refreshToken } from "../controllers/authController.js";
import {
  requestOTP,
  verifyOTPAndLogin,
  resendOTP,
} from "../controllers/otpController.js";

const router = express.Router();

// Legacy signup endpoint
router.post("/signup", signup);

// Legacy login endpoint (kept for backward compatibility)
router.post("/login", login);

// OTP-based Authentication
// Step 1: Request OTP
router.post("/request-otp", requestOTP);

// Step 2: Verify OTP and get JWT token
router.post("/verify-otp", verifyOTPAndLogin);

// Step 3: Resend OTP
router.post("/resend-otp", resendOTP);

// Refresh token
router.post("/refresh", refreshToken);

export default router;
