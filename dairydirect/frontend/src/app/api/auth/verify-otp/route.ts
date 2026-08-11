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
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Verify OTP from Redis / memory
    const otpResult = await verifyOTP(phone, otp.toString().trim());
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.error }, { status: 401 });
    }

    // Find or create user profile
    let profile: { id: string; name: string | null; role: string; email: string | null } | null = null;
    let isNewUser = false;
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map((p) => p.trim());
    const isAdmin = adminPhones.includes(phone);

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

        // Update last login
        await query('UPDATE profiles SET updated_at = now() WHERE id = $1', [profile.id]).catch(() => {});
      } else {
        // Create new user
        isNewUser = true;
        const newProfileResult = await query<{ id: string; name: string | null; role: string; email: string | null }>(
          `INSERT INTO profiles (phone, name, role)
           VALUES ($1, $2, $3)
           RETURNING id, name, role, email`,
          [phone, `User ${phone.slice(-4)}`, isAdmin ? 'admin' : 'customer']
        );
        profile = newProfileResult.rows[0];
        if (profile) {
          try {
            await query(
              `INSERT INTO users (id, phone, name, email, created_at)
               VALUES ($1, $2, $3, $4, now())
               ON CONFLICT (id) DO UPDATE
               SET phone = COALESCE(EXCLUDED.phone, users.phone),
                   name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name)`,
              [profile.id, phone, profile.name, profile.email || null]
            );
          } catch (uPgErr) {
            console.warn('[VerifyOTP] PG users table sync notice:', uPgErr);
          }
        }
      }
    } catch (pgErr) {
      console.warn('[VerifyOTP] Direct PostgreSQL query failed, attempting Supabase client:', (pgErr as any)?.message);
      try {
        const sb = getAdminSupabase();
        if (sb) {
          const { data: existing, error: fetchErr } = await sb
            .from('profiles')
            .select('id, name, role, email, is_active')
            .eq('phone', phone)
            .maybeSingle();

          if (existing) {
            profile = existing;
          } else {
            isNewUser = true;
            const { data: created, error: insertErr } = await sb
              .from('profiles')
              .insert({
                phone,
                name: `User ${phone.slice(-4)}`,
                role: isAdmin ? 'admin' : 'customer',
                loyalty_points: 100,
              })
              .select('id, name, role, email')
              .single();

            if (created) {
              profile = created;
            } else if (insertErr) {
              console.error('[VerifyOTP] Supabase insert error:', insertErr.message);
            }
          }

          if (profile) {
            try {
              await sb.from('users').upsert({
                id: profile.id,
                phone,
                name: profile.name,
                email: profile.email || null,
              }, { onConflict: 'id' });
            } catch (uSbErr) {
              console.warn('[VerifyOTP] Supabase users table sync notice:', uSbErr);
            }
          }
        }
      } catch (sbErr) {
        console.error('[VerifyOTP] Supabase client error:', sbErr);
      }
    }


    if (!profile) {
      profile = {
        id: `phone-${phone.replace(/\+/g, '')}`,
        name: `User ${phone.slice(-4)}`,
        role: isAdmin ? 'admin' : 'customer',
        email: null,
      };
    }

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
