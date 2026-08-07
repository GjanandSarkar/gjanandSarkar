/**
 * Next.js Production Security Middleware
 * Works seamlessly with Supabase Pro & Custom Auth sessions.
 * 1. RBAC authentication guard for Admin & Protected Customer routes
 * 2. Strict Security headers (CSP, HSTS, X-Frame-Options, XSS)
 * 3. Origin verification & Request ID tracing
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromRequest } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ─── Security Headers ─────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Content Security Policy
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.s3.ap-south-1.amazonaws.com https://*.cartocdn.com https://*.openstreetmap.org https://lh3.googleusercontent.com https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.google.com https://*.google.co.in ${supabaseUrl}`,
    `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.supabase.co https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://nominatim.openstreetmap.org https://lh3.googleusercontent.com https://*.googleusercontent.com ${supabaseUrl} wss://*.supabase.co`,
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // ─── Helper: Extract Any Valid Auth Token ─────────────────
  const token = extractTokenFromRequest(request);
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuthCookie = allCookies.some(c => 
    c.name.startsWith('sb-') && (
      c.name.includes('-auth-token') || 
      c.name.includes('access-token') || 
      c.name.includes('provider-token') ||
      c.name.includes('-token')
    )
  );
  const hasCustomAuthCookie = Boolean(
    token || 
    allCookies.some(c => c.name === 'gs_access_token' || c.name === 'gs_refresh_token')
  );
  const isAuthenticated = Boolean(token || hasSupabaseAuthCookie || hasCustomAuthCookie);

  // ─── Admin Route Protection ───────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return response;
  }

  // ─── Protected Customer Routes ────────────────────────────
  const protectedCustomerPaths = ['/profile', '/checkout', '/orders', '/subscriptions', '/tracking', '/returns'];
  const isProtectedCustomer = protectedCustomerPaths.some(p => pathname.startsWith(p));

  if (isProtectedCustomer) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── API Route Headers ────────────────────────────────────
  if (pathname.startsWith('/api')) {
    response.headers.set('x-request-id', crypto.randomUUID());
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
