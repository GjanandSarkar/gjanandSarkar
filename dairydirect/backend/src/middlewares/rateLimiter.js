// src/middlewares/rateLimiter.js — Express Rate Limit Configurations

import rateLimit from 'express-rate-limit';

const message = (windowMs, max) => ({
  success: false,
  error: `Too many requests. Limit: ${max} requests per ${windowMs / 60000} minutes. Try again later.`,
  code: 429,
});

/**
 * General API limiter — applied to all routes
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15 * 60 * 1000, 100),
});

/**
 * Auth limiter — stricter, applied only to /auth routes
 * 10 requests per 15 minutes per IP (prevents OTP brute-force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15 * 60 * 1000, 10),
});

/**
 * Admin limiter — moderate, for admin-only endpoints
 * 200 requests per 15 minutes per IP
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15 * 60 * 1000, 200),
});
