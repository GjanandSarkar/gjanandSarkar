/**
 * POST /api/auth/sync
 * Syncs auth state with profile — works seamlessly for both Supabase Auth (Google/Phone)
 * and custom sessions. Automatically provisions customer profile if first login,
 * preserves existing profile data (phone, addresses, etc.) on re-login, and merges
 * accounts if logging in with different auth methods for the same email/phone.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { verifyAccessToken, extractTokenFromRequest, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { cacheUserProfile, checkRateLimit } from '@/lib/aws/redis';
import { getClientIP } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { syncUserToUsersTable, backfillUsersTable } from '@/lib/supabase/sync-users';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gjanandsarkar09@gmail.com')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

const ADMIN_PHONES = (process.env.ADMIN_PHONES || '+919876543210')
  .split(',')
  .map((p) => p.trim());

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateResult = await checkRateLimit(ip, 'auth_sync', 600, 60);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const headerToken = extractTokenFromRequest(request);
    const bodyToken = body.token;
    const token = headerToken || bodyToken;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    let userId: string | null = null;
    let userEmail: string | null = null;
    let userPhone: string | null = null;
    let userName: string | null = null;
    let userAvatar: string | null = null;

    // 1. Check Custom JWT if present
    const payload = await verifyAccessToken(token);
    if (payload?.userId) {
      userId = payload.userId;
      userEmail = payload.email || null;
      userPhone = payload.phone || null;
      userName = payload.name || null;
      userAvatar = payload.avatar_url || null;
    }

    // 2. Check Supabase Auth Token (or fetch metadata via Admin SDK)
    try {
      const supabase = getAdminSupabase();
      const candidateToken = body.token || token;
      const { data: { user }, error } = await supabase.auth.getUser(candidateToken);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || userEmail;
        userPhone = user.phone || user.user_metadata?.phone || userPhone;
        userName = userName 
          || user.user_metadata?.full_name 
          || user.user_metadata?.name 
          || user.user_metadata?.display_name 
          || user.user_metadata?.user_name 
          || null;
        userAvatar = userAvatar 
          || user.user_metadata?.avatar_url 
          || user.user_metadata?.picture 
          || user.user_metadata?.image 
          || null;
      } else if (userId) {
        // If we have userId from JWT, fetch metadata from auth.users via admin API
        const { data: adminUserData } = await supabase.auth.admin.getUserById(userId);
        if (adminUserData?.user) {
          const u = adminUserData.user;
          userEmail = u.email || userEmail;
          userPhone = u.phone || u.user_metadata?.phone || userPhone;
          userName = userName 
            || u.user_metadata?.full_name 
            || u.user_metadata?.name 
            || u.user_metadata?.display_name 
            || u.user_metadata?.user_name 
            || null;
          userAvatar = userAvatar 
            || u.user_metadata?.avatar_url 
            || u.user_metadata?.picture 
            || u.user_metadata?.image 
            || null;
        }
      }
    } catch (sbErr) {
      console.error('[AuthSync] Supabase token check error:', sbErr);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Normalize phone number (10 digits) if present
    const cleanPhone = userPhone ? userPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10) : null;
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;

    // If userName is still null, derive from email or phone
    if (!userName && cleanEmail) {
      const emailPrefix = cleanEmail.split('@')[0];
      userName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Determine initial role
    const isEnvAdmin =
      (cleanEmail && ADMIN_EMAILS.includes(cleanEmail)) ||
      (cleanPhone && ADMIN_PHONES.some(p => p.replace(/\D/g, '').endsWith(cleanPhone)));
    const initialRole = isEnvAdmin ? 'admin' : 'customer';

    let profile: any = null;
    let savedAddresses: any[] = [];

    // --- SMART PROFILE SYNC & RETRIEVAL ---
    try {
      // 1. Look up existing profile in RDS by ID, Email, or Phone
      const existingRes = await query<any>(
        `SELECT id, phone, email, first_name, last_name, name, avatar_url, country, role, loyalty_points, referral_code, created_at
         FROM profiles
         WHERE id = $1 
            OR ($2::text IS NOT NULL AND email IS NOT NULL AND LOWER(email) = LOWER($2))
            OR ($3::text IS NOT NULL AND phone IS NOT NULL AND phone = $3)
         ORDER BY (CASE WHEN id = $1 THEN 1 WHEN LOWER(email) = LOWER($2) THEN 2 ELSE 3 END)
         LIMIT 1`,
        [userId, cleanEmail, cleanPhone]
      );

      let existingProfile = existingRes.rows[0] || null;

      if (existingProfile) {
        const oldId = existingProfile.id;

        // If existing profile has a different ID (e.g. created via Phone OTP or another provider), re-link related tables to current userId
        if (oldId !== userId) {
          try {
            await query('UPDATE user_addresses SET user_id = $2 WHERE user_id = $1', [oldId, userId]);
            await query('UPDATE orders SET user_id = $2 WHERE user_id = $1', [oldId, userId]);
            await query('UPDATE subscriptions SET user_id = $2 WHERE user_id = $1', [oldId, userId]);
            await query('UPDATE cart_items SET user_id = $2 WHERE user_id = $1', [oldId, userId]);
            await query('UPDATE wishlist SET user_id = $2 WHERE user_id = $1', [oldId, userId]);
          } catch (relinkErr) {
            console.warn('[AuthSync] Relink warning:', relinkErr);
          }
        }

        // Merge existing profile fields: NEVER overwrite existing phone/name/email with null
        const finalEmail = existingProfile.email || cleanEmail;
        const finalPhone = existingProfile.phone || cleanPhone;
        const finalName = existingProfile.name || userName;
        const finalAvatar = existingProfile.avatar_url || userAvatar;
        const finalRole = (isEnvAdmin || existingProfile.role === 'admin') ? 'admin' : (existingProfile.role || 'customer');

        const updateRes = await query<any>(
          `INSERT INTO profiles (id, email, phone, name, avatar_url, role)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
           SET email = COALESCE(profiles.email, EXCLUDED.email),
               phone = COALESCE(profiles.phone, EXCLUDED.phone),
               name = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name),
               avatar_url = COALESCE(NULLIF(profiles.avatar_url, ''), EXCLUDED.avatar_url),
               role = CASE WHEN $7 = 'admin' THEN 'admin'::user_role ELSE profiles.role END,
               updated_at = now()
           RETURNING id, phone, email, first_name, last_name, name, avatar_url, country, role, loyalty_points, referral_code, created_at`,
          [userId, finalEmail, finalPhone, finalName, finalAvatar, finalRole, isEnvAdmin ? 'admin' : 'customer']
        );

        profile = updateRes.rows[0] || {
          ...existingProfile,
          id: userId,
          email: finalEmail,
          phone: finalPhone,
          name: finalName,
          avatar_url: finalAvatar,
          role: finalRole,
        };

        // If oldId was different, clean up duplicate old profile row if present
        if (oldId !== userId) {
          await query('DELETE FROM profiles WHERE id = $1 AND id != $2', [oldId, userId]).catch(() => {});
        }
      } else {
        // No existing profile found — Create new profile
        const insertRes = await query<any>(
          `INSERT INTO profiles (id, email, phone, name, avatar_url, role)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
           SET email = COALESCE(profiles.email, EXCLUDED.email),
               phone = COALESCE(profiles.phone, EXCLUDED.phone),
               name = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name),
               avatar_url = COALESCE(NULLIF(profiles.avatar_url, ''), EXCLUDED.avatar_url),
               role = CASE WHEN $7 = 'admin' THEN 'admin'::user_role ELSE profiles.role END,
               updated_at = now()
           RETURNING id, phone, email, first_name, last_name, name, avatar_url, country, role, loyalty_points, referral_code, created_at`,
          [userId, cleanEmail, cleanPhone, userName, userAvatar, initialRole, initialRole]
        );
        profile = insertRes.rows[0];
      }

      // Fetch user's saved addresses
      const addressResult = await query<{ id: string; label: string; address: string; pincode: string | null; is_default: boolean }>(
        'SELECT id, label, address, pincode, is_default FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [profile.id]
      );
      savedAddresses = addressResult.rows || [];
    } catch (dbErr: any) {
      console.warn('[AuthSync] RDS query error, trying Supabase fallback:', dbErr.message);

      try {
        const sb = getAdminSupabase();
        // Check Supabase profiles table for existing profile
        let existingSbProfile = null;
        if (cleanEmail) {
          const { data } = await sb.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
          existingSbProfile = data;
        }
        if (!existingSbProfile) {
          const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
          existingSbProfile = data;
        }

        const finalEmail = existingSbProfile?.email || cleanEmail;
        const finalPhone = existingSbProfile?.phone || cleanPhone;
        const finalName = existingSbProfile?.name || userName;
        const finalAvatar = existingSbProfile?.avatar_url || userAvatar;
        const finalRole = (isEnvAdmin || existingSbProfile?.role === 'admin') ? 'admin' : (existingSbProfile?.role || 'customer');

        const { data, error } = await sb
          .from('profiles')
          .upsert({
            id: userId,
            email: finalEmail,
            phone: finalPhone,
            name: finalName,
            avatar_url: finalAvatar,
            role: finalRole,
          })
          .select()
          .single();

        if (!error && data) {
          profile = data;
        } else if (existingSbProfile) {
          profile = existingSbProfile;
        }

        const { data: addrs } = await sb
          .from('user_addresses')
          .select('id, label, address, pincode, is_default')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        if (addrs) {
          savedAddresses = addrs;
        }
      } catch (sbFallbackErr: any) {
        console.warn('[AuthSync] Supabase fallback error:', sbFallbackErr.message);
      }

      if (!profile) {
        profile = {
          id: userId,
          email: cleanEmail,
          phone: cleanPhone,
          name: userName,
          avatar_url: userAvatar,
          role: initialRole,
          loyalty_points: 0,
          referral_code: '',
          created_at: new Date().toISOString(),
        };
      }
    }

    const profileWithAddresses = {
      ...profile,
      name: profile?.name || userName || (cleanEmail ? cleanEmail.split('@')[0] : 'Customer'),
      avatar_url: profile?.avatar_url || userAvatar || null,
      saved_addresses: savedAddresses,
    };

    // Sync users table in Supabase and RDS
    await syncUserToUsersTable({
      id: profile.id,
      phone: profile.phone || cleanPhone,
      name: profileWithAddresses.name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email || cleanEmail,
      country: profile.country,
      created_at: profile.created_at,
    });
    backfillUsersTable().catch(() => {});

    // Cache profile in Redis / Memory
    await cacheUserProfile(profile.id, profileWithAddresses);

    // Issue custom session tokens for edge middleware & frontend storage
    const accessToken = await signAccessToken({
      userId: profile.id,
      name: profileWithAddresses.name || undefined,
      avatar_url: profileWithAddresses.avatar_url || undefined,
      role: profile.role as 'customer' | 'admin',
      email: profile.email || undefined,
      phone: profile.phone || undefined,
    });
    const refreshToken = await signRefreshToken(profile.id);

    const response = NextResponse.json({
      success: true,
      user: profileWithAddresses,
      data: {
        user: profileWithAddresses,
        accessToken,
        refreshToken,
      },
    });

    // Set auth cookie for Edge Middleware
    // The session cookie is httpOnly: it exists so the server and middleware
    // can authenticate a request, and must never be readable by page scripts
    // (an XSS payload could otherwise exfiltrate a 7-day session token).
    // The browser gets its bearer token from the Supabase session instead,
    // so nothing client-side needs to read this.
    response.cookies.set('gs_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[AuthSync] Error:', error.message);
    return NextResponse.json({ error: 'Authentication sync failed', details: error.message }, { status: 500 });
  }
}
