// src/middlewares/rbac.middleware.js — Role-Based Access Control
// Usage: router.get('/admin/stats', authenticate, requireRole('ADMIN'), handler)

import { ApiError } from '../utils/ApiError.js';

/**
 * Require one or more roles
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'CUSTOMER')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before role check.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};
