/**
 * GET/POST/DELETE /api/auth/session
 * Session management — checks auth status, refreshes expired access tokens, and logs out.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import {
  extractTokenFromRequest,
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '@/lib/auth/jwt';
import { getCachedUserProfile, cacheUserProfile } from '@/lib/aws/redis';

export async function GET(request: NextRequest) {
  try {
    const accessToken = extractTokenFromRequest(request);

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        // Try cache first
        let profile = await getCachedUserProfile(payload.userId);
        if (!profile) {
          const res = await query(
            'SELECT id, name, phone, email, role, avatar_url FROM profiles WHERE id = $1 AND is_active = true',
            [payload.userId]
          );
          if (res.rows.length > 0) {
            profile = res.rows[0];
            await cacheUserProfile(payload.userId, profile);
          }
        }

        if (profile) {
          return NextResponse.json({
            authenticated: true,
            user: profile,
          });
        }
      }
    }

    // If access token invalid/expired, check refresh token
    const refreshToken = request.cookies.get('gs_refresh_token')?.value;
    if (refreshToken) {
      const refreshUserId = await verifyRefreshToken(refreshToken);
      if (refreshUserId) {
        const res = await query<{ id: string; name: string | null; phone: string | null; email: string | null; role: string; avatar_url: string | null }>(
          'SELECT id, name, phone, email, role, avatar_url FROM profiles WHERE id = $1 AND is_active = true',
          [refreshUserId]
        );

        if (res.rows.length > 0) {
          const profile = res.rows[0];
          const newAccessToken = await signAccessToken({
            userId: profile.id,
            phone: profile.phone ?? undefined,
            email: profile.email ?? undefined,
            role: profile.role as 'customer' | 'admin',
          });
          const newRefreshToken = await signRefreshToken(profile.id);

          const response = NextResponse.json({
            authenticated: true,
            user: profile,
            refreshed: true,
          });

          response.cookies.set('gs_access_token', newAccessToken, getAccessTokenCookieOptions());
          response.cookies.set('gs_refresh_token', newRefreshToken, getRefreshTokenCookieOptions());
          return response;
        }
      }
    }

    return NextResponse.json({ authenticated: false, user: null });
  } catch (error: any) {
    console.error('[Session GET] Error:', error.message);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

// DELETE /api/auth/session — Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('gs_access_token');
  response.cookies.delete('gs_refresh_token');
  return response;
}
