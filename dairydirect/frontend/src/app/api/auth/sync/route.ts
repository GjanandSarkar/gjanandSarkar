/**
 * POST /api/auth/sync
 * Syncs auth state with profile — works seamlessly for both Supabase Auth (Google/Phone)
 * and custom sessions. Automatically provisions customer profile if first login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { verifyAccessToken, extractTokenFromRequest, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { cacheUserProfile, checkRateLimit } from '@/lib/aws/redis';
import { getClientIP } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@gjanandsarkar.com,patelroshu1218@gmail.com')
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
        userPhone = user.phone || userPhone;
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
          userPhone = u.phone || userPhone;
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

    // If userName is still null, derive from email or phone
    if (!userName && userEmail) {
      const emailPrefix = userEmail.split('@')[0];
      // Format email prefix e.g. "roshan.patel" or "roshanpatel" -> readable name
      userName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Determine initial role
    const isEnvAdmin =
      (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) ||
      (userPhone && ADMIN_PHONES.includes(userPhone));
    const initialRole = isEnvAdmin ? 'admin' : 'customer';

    // Upsert profile in PostgreSQL / Supabase
    let profile: any = null;
    let savedAddresses: any[] = [];

    try {
      const profileRes = await query<{
        id: string;
        phone: string | null;
        email: string | null;
        name: string | null;
        avatar_url: string | null;
        role: string;
        loyalty_points: number;
        referral_code: string;
        created_at: string;
      }>(
        `INSERT INTO profiles (id, email, phone, name, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE 
         SET email = COALESCE(EXCLUDED.email, profiles.email),
             phone = COALESCE(EXCLUDED.phone, profiles.phone),
             name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
             avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url),
             role = CASE WHEN $7 = 'admin' THEN 'admin'::user_role ELSE profiles.role END,
             updated_at = now()
         RETURNING id, phone, email, name, avatar_url, role, loyalty_points, referral_code, created_at`,
        [userId, userEmail, userPhone, userName, userAvatar, initialRole, initialRole]
      );
      profile = profileRes.rows[0];

      const addressResult = await query<{ id: string; label: string; address: string; pincode: string | null; is_default: boolean }>(
        'SELECT id, label, address, pincode, is_default FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [profile.id]
      );
      savedAddresses = addressResult.rows || [];
    } catch (dbErr) {
      try {
        const sb = getAdminSupabase();
        const { data, error } = await sb
          .from('profiles')
          .upsert({
            id: userId,
            email: userEmail,
            phone: userPhone,
            name: userName,
            avatar_url: userAvatar,
            role: initialRole,
          })
          .select()
          .single();

        if (!error && data) {
          profile = data;
        }

        const { data: addrs } = await sb
          .from('user_addresses')
          .select('id, label, address, pincode, is_default')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        if (addrs) {
          savedAddresses = addrs;
        }
      } catch {}

      if (!profile) {
        profile = {
          id: userId,
          email: userEmail,
          phone: userPhone,
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
      name: profile?.name || userName || (userEmail ? userEmail.split('@')[0] : 'Customer'),
      avatar_url: profile?.avatar_url || userAvatar || null,
      saved_addresses: savedAddresses,
    };

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
    response.cookies.set('gs_access_token', accessToken, {
      httpOnly: false,
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
