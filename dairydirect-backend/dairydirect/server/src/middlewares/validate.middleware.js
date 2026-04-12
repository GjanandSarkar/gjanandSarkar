// src/middlewares/validate.middleware.js — Zod Request Validation
// Validates req.body against a Zod schema before reaching the controller

import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request body against a Zod schema
 * On success: attaches parsed/coerced data to req.validatedBody
 * On failure: throws ApiError(400) with field-level error details
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      received: issue.received,
    }));

    return next(new ApiError(400, 'Validation failed. Check the errors array.', errors));
  }

  // Attach coerced, safe data — controllers use this, not req.body
  req.validatedBody = result.data;
  next();
};

/**
 * Validate query parameters against a Zod schema
 * On success: attaches parsed data to req.validatedQuery
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return next(new ApiError(400, 'Invalid query parameters.', errors));
  }

  req.validatedQuery = result.data;
  next();
};
