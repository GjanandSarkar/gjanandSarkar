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

/**
 * A seller's contracted position on the platform.
 *
 * Gjanand Sarkar collaborates with exactly one company per category, so a
 * seller's `category` is not a preference — it is the boundary of everything
 * they are allowed to write. `status` must be 'active' before they can
 * publish anything.
 */
export type SellerContext = {
  sellerId: string;
  userId: string | null;
  category: string;
  status: string;
  storeName: string | null;
};

/** Seller states that are permitted to create or modify catalogue entries. */
const SELLER_WRITE_ALLOWED_STATUSES = new Set(['active']);

/**
 * Resolve the seller record attached to a user, if any.
 * Always reads from the database — never trusts a client-supplied seller id.
 */
export async function getSellerForUser(userId: string): Promise<SellerContext | null> {
  try {
    const sb = getAdminSupabase();
    const { data } = await sb
      .from('sellers')
      .select('id, user_id, category, status, store_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;

    return {
      sellerId: data.id,
      userId: data.user_id ?? null,
      category: data.category ?? '',
      status: data.status ?? 'pending',
      storeName: data.store_name ?? null,
    };
  } catch (err) {
    console.warn('[AuthMiddleware] getSellerForUser failed:', err);
    return null;
  }
}

export function sellerCanWrite(seller: SellerContext | null): boolean {
  return Boolean(seller && SELLER_WRITE_ALLOWED_STATUSES.has(seller.status));
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gjanandsarkar09@gmail.com,bestjavacoding444@gmail.com')
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
    const effectiveRole = (cachedProfile.role ?? userRole) as AuthUser['role'];
    const isAdmin = isEnvAdmin || effectiveRole === 'admin';
    return {
      userId,
      // Previously this collapsed every non-admin to 'customer', silently
      // destroying the 'seller' role for any request that hit the cache.
      role: isAdmin ? 'admin' : effectiveRole === 'seller' ? 'seller' : 'customer',
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
        role: isAdmin ? 'admin' : (row.role as AuthUser['role']),
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

  // Supabase-only deployments never reach the RDS branch above, so without
  // this lookup the user's real role in `profiles` was never consulted: every
  // seller and every database-assigned admin silently degraded to 'customer'
  // unless their role happened to be baked into a custom JWT.
  if (userRole !== 'admin') {
    try {
      const sb = getAdminSupabase();
      const { data: profile } = await sb
        .from('profiles')
        .select('role, phone, email')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role) {
        userRole = profile.role as AuthUser['role'];
        userPhone = profile.phone ?? userPhone;
        userEmail = profile.email ?? userEmail;
      }
    } catch (err) {
      console.warn('[AuthMiddleware] Supabase profile lookup failed:', err);
    }
  }

  const isAdmin = isEnvAdmin || userRole === 'admin';
  const result: AuthUser = {
    userId,
    role: isAdmin ? 'admin' : userRole === 'seller' ? 'seller' : 'customer',
    phone: userPhone,
    email: userEmail,
    isAdmin,
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
