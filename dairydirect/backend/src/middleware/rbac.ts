import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/profile';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

/**
 * Require specific user role (e.g. 'admin' or 'seller')
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
}

/**
 * Convenience helper for admin-only routes
 */
export const requireAdmin = requireRole('admin');

/**
 * Convenience helper for seller or admin routes
 */
export const requireSellerOrAdmin = requireRole('seller', 'admin');
