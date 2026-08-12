/**
 * POST /api/auth/sync
 * Syncs auth state with profile — works seamlessly for both Supabase Auth (Google/Phone)
 * and custom sessions. Automatically provisions customer profile if first login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
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
    const rateResult = await checkRateLimit(ip, 'auth_sync', 60, 60);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const headerToken = extractTokenFromRequest(request);
    const bodyToken = body.token;
    const token = headerToken || bodyToken;

    let userId: string | null = body.id || null;
    let userEmail: string | null = body.email || null;
    let userPhone: string | null = body.phone || null;
    let userName: string | null = body.name || null;
    let userAvatar: string | null = body.avatar_url || null;

    // 1. Check Custom JWT if present
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload?.userId) {
        userId = payload.userId;
        userEmail = payload.email || userEmail;
        userPhone = payload.phone || userPhone;
        userName = payload.name || userName;
        userAvatar = payload.avatar_url || userAvatar;
      }
    }

    // 2. Check Supabase Auth Token (or fetch metadata via Admin SDK)
    if (token || userId) {
      try {
        const supabase = getAdminSupabase();
        if (supabase) {
          if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
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
            }
          }

          if (userId && (!userName || !userEmail)) {
            // Fetch metadata from auth.users via admin API
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
        }
      } catch (sbErr) {
        console.error('[AuthSync] Supabase token check error:', sbErr);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID or valid token required' }, { status: 400 });
    }

    // If userName is still null, derive from email or phone
    if (!userName && userEmail) {
      const emailPrefix = userEmail.split('@')[0];
      userName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (!userName && userPhone) {
      userName = `User ${userPhone.slice(-4)}`;
    }

    // Determine initial role
    const isEnvAdmin =
      (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) ||
      (userPhone && ADMIN_PHONES.includes(userPhone));
    const initialRole = isEnvAdmin ? 'admin' : (body.role || 'customer');

    // Upsert profile in PostgreSQL / Supabase
    let profile: any = null;
    let savedAddresses: any[] = [];

    if (isPgConfigured) {
      try {
        const profileRes = await query<{
          id: string;
          phone: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
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
               role = CASE WHEN $7 = 'admin' THEN 'admin' ELSE profiles.role END,
               updated_at = now()
           RETURNING id, phone, email, first_name, last_name, name, avatar_url, role, loyalty_points, referral_code, created_at`,
          [userId, userEmail, userPhone, userName, userAvatar, initialRole, initialRole]
        );
        profile = profileRes.rows[0];

        const addressResult = await query<{ id: string; label: string; address: string; pincode: string | null; is_default: boolean }>(
          'SELECT id, label, address, pincode, is_default FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
          [profile.id]
        );
        savedAddresses = addressResult.rows || [];

        // Sync into public.users table as well
        try {
          await query(
            `INSERT INTO users (id, phone, name, email, created_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT (id) DO UPDATE
             SET phone = COALESCE(EXCLUDED.phone, users.phone),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
                 email = COALESCE(EXCLUDED.email, users.email)`,
            [userId, userPhone, userName, userEmail]
          );
        } catch (usersPgErr) {
          console.warn('[AuthSync] PostgreSQL users table sync notice:', (usersPgErr as any)?.message);
        }
      } catch (dbErr) {
        console.warn('[AuthSync] PostgreSQL pool query error, falling back to Supabase client:', (dbErr as any)?.message);
      }
    }

    // Supabase Cloud fallback (or primary when direct PG is not configured)
    if (!profile) {
      try {
        const sb = getAdminSupabase();
        if (sb) {
          const profilePayload: any = {
            id: userId,
            email: userEmail ? userEmail.toLowerCase().trim() : null,
            name: userName || (userEmail ? userEmail.split('@')[0] : 'Customer'),
            role: initialRole,
            loyalty_points: 100,
          };
          if (userPhone) profilePayload.phone = userPhone;
          if (userAvatar) profilePayload.avatar_url = userAvatar;

          // 1. Try finding by ID first
          const { data: existingById } = await sb
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (existingById) {
            const { data: updated, error: updateErr } = await sb
              .from('profiles')
              .update({
                name: profilePayload.name || existingById.name,
                avatar_url: profilePayload.avatar_url || existingById.avatar_url,
                email: profilePayload.email || existingById.email,
                phone: profilePayload.phone || existingById.phone,
                role: initialRole === 'admin' ? 'admin' : existingById.role,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId)
              .select('*')
              .single();

            if (!updateErr && updated) {
              profile = updated;
            }
          }

          // 2. If not found by ID, try finding by Email
          if (!profile && userEmail) {
            const { data: existingByEmail } = await sb
              .from('profiles')
              .select('*')
              .ilike('email', userEmail.trim())
              .maybeSingle();

            if (existingByEmail) {
              const { data: updatedByEmail, error: updateEmailErr } = await sb
                .from('profiles')
                .update({
                  name: profilePayload.name || existingByEmail.name,
                  avatar_url: profilePayload.avatar_url || existingByEmail.avatar_url,
                  phone: profilePayload.phone || existingByEmail.phone,
                  role: initialRole === 'admin' ? 'admin' : existingByEmail.role,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingByEmail.id)
                .select('*')
                .single();

              if (!updateEmailErr && updatedByEmail) {
                profile = updatedByEmail;
              }
            }
          }

          // 3. If still not found, insert new profile
          if (!profile) {
            const { data: created, error: insertError } = await sb
              .from('profiles')
              .insert(profilePayload)
              .select('*')
              .single();

            if (!insertError && created) {
              profile = created;
            } else if (insertError) {
              console.warn('[AuthSync] Supabase insert error, attempting upsert on ID:', insertError.message);
              const { data: upserted } = await sb
                .from('profiles')
                .upsert(profilePayload, { onConflict: 'id' })
                .select('*')
                .maybeSingle();

              if (upserted) {
                profile = upserted;
              }
            }
          }

          // Also upsert into public.users table
          try {
            await sb.from('users').upsert({
              id: userId,
              phone: userPhone || profile?.phone || null,
              name: userName || profile?.name || (userEmail ? userEmail.split('@')[0] : 'Customer'),
              email: userEmail ? userEmail.toLowerCase().trim() : (profile?.email || null),
            }, { onConflict: 'id' });
          } catch (sbUsersErr) {
            console.warn('[AuthSync] Supabase users table upsert notice:', (sbUsersErr as any)?.message);
          }

          if (profile) {
            const { data: addrs } = await sb
              .from('user_addresses')
              .select('id, label, address, pincode, is_default')
              .eq('user_id', profile.id)
              .order('is_default', { ascending: false });

            if (addrs) {
              savedAddresses = addrs;
            }
          }
        }
      } catch (sbCatchErr) {
        console.error('[AuthSync] Supabase catch error:', sbCatchErr);
      }
    }


  if (!profile) {
    profile = {
      id: userId,
      email: userEmail,
      phone: userPhone,
      name: userName || 'Customer',
      avatar_url: userAvatar,
      role: initialRole,
      loyalty_points: 100,
      referral_code: `REF${userId.slice(0, 4)}`,
      created_at: new Date().toISOString(),
    };
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
