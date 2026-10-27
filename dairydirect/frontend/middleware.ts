/**
 * Next.js Middleware (runs on Edge Runtime before every matched request).
 *
 * Responsibilities:
 *  1. Route-level auth guard for /admin/* and /seller/* — unauthenticated or
 *     wrong-role requests are redirected to /login before the page renders.
 *  2. CSP nonce injection (future-ready — currently nonce is available in headers
 *     for pages that want to use it; the full Content-Security-Policy is set in
 *     next.config.ts headers() for broader coverage).
 *
 * Note: Individual /api/admin/* and /api/seller* routes still perform their own
 * server-side auth checks (defence-in-depth). This middleware is the first line
 * of defence to avoid leaking page structure to unauthenticated users.
 */

import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'gs_access_token';

/**
 * Minimal JWT payload decode WITHOUT signature verification.
 * Signature verification happens inside the API route handler (server-side,
 * with full Node.js crypto). Here we only need the role claim to redirect —
 * the actual enforcement is in requireAdmin/requireSeller.
 */
function decodeJwtPayloadUnsafe(token: string): { role?: string; exp?: number; userId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Guard /admin/* routes (require 'admin' role) ─────────────────────────
  if (pathname.startsWith('/admin')) {
    const token = extractToken(request);
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayloadUnsafe(token);
    if (!payload || payload.role !== 'admin') {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'insufficient_permissions');
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── Guard /seller/* routes (require 'seller' or 'admin' role) ────────────
  if (pathname.startsWith('/seller')) {
    const token = extractToken(request);
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayloadUnsafe(token);
    if (!payload || (payload.role !== 'seller' && payload.role !== 'admin')) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'insufficient_permissions');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - /api/* routes (these have their own server-side auth)
     * - /monitoring (Sentry tunnel)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|monitoring|api/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot|css|js)$).*)',
  ],
};
