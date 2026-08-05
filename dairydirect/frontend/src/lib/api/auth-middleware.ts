/**
 * Auth Middleware — AWS Version
 * Replaces Supabase auth token verification with custom JWT.
 * Used by all protected API routes.
 */

import { verifyAccessToken, extractTokenFromRequest } from '@/lib/auth/jwt';
import { getCachedUserProfile } from '@/lib/aws/redis';
import { query } from '@/lib/aws/rds';

export type AuthUser = {
  userId: string;
  role: 'customer' | 'admin';
  phone: string | null;
  email: string | null;
  isAdmin: boolean;
};

/**
 * Verify the JWT from the request and return user context.
 * Returns null if unauthorized.
 * 
 * Usage in API routes:
 *   const auth = await getAuthUser(request);
 *   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   if (!auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  // Verify JWT
  const payload = await verifyAccessToken(token);
  if (!payload?.userId) return null;

  // Try cache first to avoid DB hit on every request
  const cached = await getCachedUserProfile(payload.userId);
  if (cached) {
    return {
      userId: payload.userId,
      role: cached.role ?? payload.role,
      phone: cached.phone ?? null,
      email: cached.email ?? null,
      isAdmin: (cached.role ?? payload.role) === 'admin',
    };
  }

  // Verify user still exists in DB and get current role (role might have changed)
  try {
    const result = await query<{ role: string; phone: string | null; email: string | null }>(
      'SELECT role, phone, email FROM profiles WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) return null;

    const { role, phone, email } = result.rows[0];
    const authUser: AuthUser = {
      userId: payload.userId,
      role: role as 'customer' | 'admin',
      phone,
      email,
      isAdmin: role === 'admin',
    };

    return authUser;
  } catch (err) {
    // If DB is temporarily unavailable, use JWT claims (slightly less secure but avoids outage)
    console.error('[AuthMiddleware] DB check failed, using JWT claims:', err);
    return {
      userId: payload.userId,
      role: payload.role,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      isAdmin: payload.role === 'admin',
    };
  }
}

/**
 * Require admin role. Returns the user if admin, null otherwise.
 */
export async function requireAdmin(request: Request): Promise<AuthUser | null> {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/**
 * Get client IP from request headers (handles proxies)
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    '127.0.0.1'
  );
}
