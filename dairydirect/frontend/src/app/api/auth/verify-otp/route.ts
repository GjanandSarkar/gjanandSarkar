/**
 * POST /api/auth/verify-otp
 * Verifies OTP and issues JWT tokens.
 * Creates user profile if new user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/aws/redis';
import { query } from '@/lib/aws/rds';
import { signAccessToken, signRefreshToken, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from '@/lib/auth/jwt';
import { sanitizePhone } from '@/lib/security/sanitize';
import { checkRateLimit, cacheUserProfile } from '@/lib/aws/redis';
import { getClientIP } from '@/lib/api/auth-middleware';
import { sendEmail } from '@/lib/aws/ses';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { syncUserToUsersTable } from '@/lib/supabase/sync-users';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Rate limit verify attempts (prevent brute force)
    const limit = await checkRateLimit(ip, 'otp_verify', 10, 300);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone: rawPhone, otp } = body;

    if (!rawPhone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const phone = sanitizePhone(rawPhone);
    if (!phone) {
      return NextResponse.json({ error: 'Enter a valid Indian mobile number' }, { status: 400 });
    }

    // Verify OTP from Redis
    const otpResult = await verifyOTP(phone, otp.toString().trim());
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.error }, { status: 401 });
    }

    // Find or create user profile (only profiles table is updated on login)
    let profile: { id: string; name: string | null; role: string; email: string | null } | null = null;
    let isNewUser = false;

    try {
      const existingResult = await query<{ id: string; name: string | null; role: string; email: string | null; is_active: boolean }>(
        'SELECT id, name, role, email, is_active FROM profiles WHERE phone = $1',
        [phone]
      );

      if (existingResult.rows.length > 0) {
        profile = existingResult.rows[0];

        if (!profile) {
          return NextResponse.json({ error: 'Account error' }, { status: 500 });
        }

        if (!existingResult.rows[0].is_active) {
          return NextResponse.json({ error: 'Account suspended. Please contact support.' }, { status: 403 });
        }

        // Update profile login timestamp
        try {
          await query('UPDATE profiles SET updated_at = now(), last_login_at = now() WHERE id = $1', [profile.id]);
        } catch {
          await query('UPDATE profiles SET updated_at = now() WHERE id = $1', [profile.id]).catch(() => {});
        }
      } else {
        // Create new user in profiles table
        isNewUser = true;
        const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map((p) => p.trim());
        const isAdmin = adminPhones.includes(phone);

        const newProfileResult = await query<{ id: string; name: string | null; role: string; email: string | null }>(
          `INSERT INTO profiles (phone, role, updated_at)
           VALUES ($1, $2, now())
           RETURNING id, name, role, email`,
          [phone, isAdmin ? 'admin' : 'customer']
        );
        profile = newProfileResult.rows[0];
      }
    } catch (rdsErr: any) {
      console.warn('[VerifyOTP] RDS query error, using Supabase fallback:', rdsErr.message);

      // Supabase fallback for profiles table
      try {
        const sb = getAdminSupabase();
        const { data: existingSbProfile } = await sb
          .from('profiles')
          .select('id, name, role, email, is_active')
          .eq('phone', phone)
          .maybeSingle();

        if (existingSbProfile) {
          if (existingSbProfile.is_active === false) {
            return NextResponse.json({ error: 'Account suspended. Please contact support.' }, { status: 403 });
          }
          await sb.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', existingSbProfile.id);
          profile = existingSbProfile;
        } else {
          isNewUser = true;
          const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map((p) => p.trim());
          const isAdmin = adminPhones.includes(phone);

          const { data: newSbProfile, error: insertError } = await sb
            .from('profiles')
            .insert({
              phone,
              role: isAdmin ? 'admin' : 'customer',
              updated_at: new Date().toISOString(),
            })
            .select('id, name, role, email')
            .single();

          if (insertError || !newSbProfile) {
            console.error('[VerifyOTP] Supabase profile insert error:', insertError);
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
          }
          profile = newSbProfile;
        }
      } catch (sbErr: any) {
        console.error('[VerifyOTP] Supabase profile fallback error:', sbErr.message);
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Failed to find or create user profile' }, { status: 500 });
    }

    // Sync users table in Supabase and RDS
    await syncUserToUsersTable({
      id: profile.id,
      phone,
      name: profile.name,
      email: profile.email,
    });

    // Issue JWT tokens
    const accessToken = await signAccessToken({
      userId: profile.id,
      phone,
      email: profile.email ?? undefined,
      role: profile.role as 'customer' | 'admin',
    });
    const refreshToken = await signRefreshToken(profile.id);

    // Cache profile in Redis
    await cacheUserProfile(profile.id, profile);

    // Set tokens as HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      token: accessToken,  // Also return in body for client-side storage fallback
      userId: profile.id,
      profile: {
        id: profile.id,
        name: profile.name,
        phone,
        email: profile.email,
        role: profile.role,
      },
      isNewUser,
    });

    response.cookies.set('gs_access_token', accessToken, getAccessTokenCookieOptions());
    response.cookies.set('gs_refresh_token', refreshToken, getRefreshTokenCookieOptions());

    return response;
  } catch (error: any) {
    console.error('[VerifyOTP] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
