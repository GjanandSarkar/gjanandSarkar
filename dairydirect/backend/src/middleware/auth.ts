import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtUserPayload } from '../utils/jwt';
import { UnauthorizedError } from '../errors/AppError';
import { getSupabaseAdmin } from '../config/database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

/**
 * Require valid JWT Bearer token or Supabase Auth token
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    // 1. First try custom JWT
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    } catch {
      // 2. Fallback to Supabase Auth verification if configured
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          req.user = {
            userId: user.id,
            role: (user.user_metadata?.role || 'customer') as any,
            email: user.email,
            phone: user.phone,
            name: user.user_metadata?.name || user.user_metadata?.full_name,
          };
          return next();
        }
      }

      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication: Populates req.user if valid token present, otherwise proceeds without error
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = {
          userId: user.id,
          role: (user.user_metadata?.role || 'customer') as any,
          email: user.email,
          phone: user.phone,
        };
      }
    }
  }
  next();
}
