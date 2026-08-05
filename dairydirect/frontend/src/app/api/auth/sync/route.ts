/**
 * POST /api/auth/sync
 * Syncs auth state with profile — used after login to get full user data.
 * AWS version: validates JWT instead of Supabase token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { verifyAccessToken, extractTokenFromRequest } from '@/lib/auth/jwt';
import { cacheUserProfile, checkRateLimit } from '@/lib/aws/redis';
import { getClientIP } from '@/lib/api/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateResult = await checkRateLimit(ip, 'auth_sync', 30, 60);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Get token from body or header
    const body = await request.json().catch(() => ({}));
    const headerToken = extractTokenFromRequest(request);
    const bodyToken = body.token;
    const token = headerToken || bodyToken;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get full profile from DB
    const result = await query<{
      id: string;
      phone: string | null;
      email: string | null;
      name: string | null;
      avatar_url: string | null;
      role: string;
      default_upi_id: string | null;
      loyalty_points: number;
      referral_code: string;
      created_at: string;
    }>(
      `SELECT id, phone, email, name, avatar_url, role, default_upi_id, 
              loyalty_points, referral_code, created_at
       FROM profiles WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = result.rows[0];

    // Get saved addresses
    const addressResult = await query<{ label: string; address: string }>(
      'SELECT label, address FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
      [profile.id]
    );

    const profileWithAddresses = {
      ...profile,
      saved_addresses: addressResult.rows,
    };

    // Refresh cache
    await cacheUserProfile(profile.id, profileWithAddresses);

    return NextResponse.json({ success: true, data: { user: profileWithAddresses } });
  } catch (error: any) {
    console.error('[AuthSync] Error:', error.message);
    return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 401 });
  }
}
