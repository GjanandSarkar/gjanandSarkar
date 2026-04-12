// src/middlewares/errorHandler.js — Global Error Handler
// MUST be the last middleware registered in app.js

import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log all errors
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, {
    statusCode: err.statusCode,
    stack: isDev ? err.stack : undefined,
  });

  // Operational errors (ApiError instances) — safe to expose message
  if (err.isOperational) {
    const body = {
      success: false,
      error: err.message,
      code: err.statusCode,
    };

    if (err.errors?.length) {
      body.errors = err.errors;
    }

    if (isDev) {
      body.stack = err.stack;
    }

    return res.status(err.statusCode).json(body);
  }

  // Prisma-specific errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with this data already exists.',
      code: 409,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
      code: 404,
    });
  }

  // Unknown / unexpected errors — do NOT expose internals in production
  return res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error. Please try again.',
    code: 500,
    ...(isDev && { stack: err.stack }),
  });
};
