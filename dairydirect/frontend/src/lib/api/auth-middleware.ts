/**
 * Universal Auth Middleware (Supabase Pro & JWT)
 * Supports Supabase Auth (Google / Phone OTP) and custom JWT sessions.
 * Enforces Role-Based Access Control (RBAC) across all admin and customer API routes.
 */

import { verifyAccessToken, extractTokenFromRequest } from '@/lib/auth/jwt';
import { getCachedUserProfile, cacheUserProfile } from '@/lib/aws/redis';
import { query } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';

// ─── Short-lived in-process auth cache ────────────────────────────────────────
// Keyed by a truncated token (last 32 chars) → AuthUser result
// 30-second TTL prevents hammering Supabase getUser() on every API request.
const authCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const AUTH_CACHE_TTL_MS = 30_000; // 30 seconds

function getCachedAuth(token: string): AuthUser | null {
  const key = token.slice(-32);
  const entry = authCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authCache.delete(key);
    return null;
  }
  return entry.user;
}

function setCachedAuth(token: string, user: AuthUser): void {
  const key = token.slice(-32);
  // Evict oldest entries if cache grows too large
  if (authCache.size > 500) {
    const firstKey = authCache.keys().next().value;
    if (firstKey) authCache.delete(firstKey);
  }
  authCache.set(key, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
}

export type AuthUser = {
  userId: string;
  role: 'customer' | 'admin' | 'seller';
  phone: string | null;
  email: string | null;
  isAdmin: boolean;
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gjanandsarkar09@gmail.com')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

const ADMIN_PHONES = (process.env.ADMIN_PHONES || '+919876543210')
  .split(',')
  .map((p) => p.trim());

/**
 * Verify authentication from request (Custom JWT or Supabase Auth Token)
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = extractTokenFromRequest(request);

  // Fast path: return cached result for recently-seen tokens
  if (token) {
    const cached = getCachedAuth(token);
    if (cached) return cached;
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  let userPhone: string | null = null;
  let userRole: 'customer' | 'admin' | 'seller' = 'customer';

  // 1. Check Custom JWT
  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload?.userId) {
      userId = payload.userId;
      userRole = payload.role;
      userEmail = payload.email || null;
      userPhone = payload.phone || null;
    }
  }

  // 2. Fallback: Check Supabase Auth Bearer Token if not resolved
  // NOTE: This is a remote network call — only reached if JWT verification failed.
  if (!userId && token) {
    try {
      const supabase = getAdminSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
        userPhone = user.phone || null;
      }
    } catch {}
  }

  if (!userId) return null;

  // Check admin overrides from env
  const isEnvAdmin =
    (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) ||
    (userPhone && ADMIN_PHONES.includes(userPhone));

  if (isEnvAdmin) {
    userRole = 'admin';
  }

  // Try Redis cache to avoid database roundtrip
  const cached = await getCachedUserProfile(userId);
  if (cached) {
    const cachedProfile = cached as { role?: string; phone?: string | null; email?: string | null };
    const isAdmin = isEnvAdmin || (cachedProfile.role ?? userRole) === 'admin';
    return {
      userId,
      role: isAdmin ? 'admin' : 'customer',
      phone: cachedProfile.phone ?? userPhone,
      email: cachedProfile.email ?? userEmail,
      isAdmin,
    };
  }

  // Check Database for live role & profile
  try {
    const result = await query<{ role: string; phone: string | null; email: string | null }>(
      'SELECT role, phone, email FROM profiles WHERE id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const isAdmin = isEnvAdmin || row.role === 'admin';
      const authUser: AuthUser = {
        userId,
        role: isAdmin ? 'admin' : (row.role as 'customer' | 'admin'),
        phone: row.phone || userPhone,
        email: row.email || userEmail,
        isAdmin,
      };
      if (token) setCachedAuth(token, authUser);
      cacheUserProfile(userId, { role: row.role, phone: row.phone, email: row.email }).catch(() => {});
      return authUser;
    }
  } catch (err) {
    console.warn('[AuthMiddleware] PostgreSQL not configured, using Supabase auth.');
  }

  const result: AuthUser = {
    userId,
    role: isEnvAdmin || userRole === 'admin' ? 'admin' : 'customer',
    phone: userPhone,
    email: userEmail,
    isAdmin: isEnvAdmin || userRole === 'admin',
  };

  // Cache the resolved auth user to avoid repeated DB/Supabase lookups
  if (token) setCachedAuth(token, result);
  cacheUserProfile(userId, { role: result.role, phone: result.phone, email: result.email }).catch(() => {});

  return result;
}

/**
 * Require admin role. Returns user if admin, null otherwise.
 */
export async function requireAdmin(request: Request): Promise<AuthUser | null> {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/**
 * Get client IP address
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}
