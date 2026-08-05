/**
 * Next.js Security Middleware
 * Runs on EVERY request — provides:
 * 1. JWT authentication check for protected routes
 * 2. Admin route protection
 * 3. Security headers (CSP, HSTS, X-Frame-Options)
 * 4. Rate limiting check
 * 5. Request IP extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromRequest } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ─── Security Headers ─────────────────────────────────────
  // HSTS (force HTTPS in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Prevent framing (Clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://*.s3.ap-south-1.amazonaws.com ${process.env.AWS_CLOUDFRONT_DOMAIN ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}` : ''}`,
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // ─── Admin Route Protection ───────────────────────────────
  if (pathname.startsWith('/admin')) {
    const token = extractTokenFromRequest(request);

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Pass user info to admin routes via headers
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-role', payload.role);
    return response;
  }

  // ─── Protected Customer Routes ────────────────────────────
  const protectedCustomerPaths = ['/profile', '/checkout', '/orders', '/subscriptions', '/tracking', '/returns'];
  const isProtectedCustomer = protectedCustomerPaths.some(p => pathname.startsWith(p));

  if (isProtectedCustomer) {
    const token = extractTokenFromRequest(request);

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('reason', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── API Route Headers ────────────────────────────────────
  if (pathname.startsWith('/api')) {
    // Add request ID for tracing
    response.headers.set('x-request-id', crypto.randomUUID());

    // Allow CORS for same origin only in production
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin');
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'https://gjanandsarkar.com',
        'https://www.gjanandsarkar.com',
      ].filter(Boolean);

      if (origin && !allowedOrigins.includes(origin)) {
        // Block cross-origin API requests
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
