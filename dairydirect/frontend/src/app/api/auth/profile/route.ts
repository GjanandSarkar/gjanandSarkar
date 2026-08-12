import { NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { extractTokenFromRequest, verifyAccessToken, signAccessToken } from '@/lib/auth/jwt';
import { cacheUserProfile, invalidateUserProfileCache } from '@/lib/aws/redis';

export async function PATCH(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    const body = await request.json().catch(() => ({}));
    let { first_name, last_name, name, phone, avatar_url, address } = body;

    if (
      (first_name && /\d/.test(first_name)) ||
      (last_name && /\d/.test(last_name)) ||
      (name && /\d/.test(name))
    ) {
      return NextResponse.json(
        { error: 'Name cannot contain numbers.' },
        { status: 400 }
      );
    }

    if (first_name !== undefined || last_name !== undefined) {
      const cleanFirst = (first_name || '').trim();
      const cleanLast = (last_name || '').trim();
      first_name = cleanFirst;
      last_name = cleanLast;
      name = `${cleanFirst} ${cleanLast}`.trim();
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      const cleanPhone = String(phone).trim().replace(/\D/g, '');
      if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit mobile number.' },
          { status: 400 }
        );
      }
    }

    let userId: string | null = null;
    let userEmail: string | null = null;

    // 1. Verify custom JWT
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload?.userId) {
        userId = payload.userId;
        userEmail = payload.email || null;
      }
    }

    // 2. Fallback to Supabase Auth token
    if (!userId && (body.token || token)) {
      try {
        const supabase = getAdminSupabase();
        const candidateToken = body.token || token;
        const { data: { user }, error } = await supabase.auth.getUser(candidateToken);
        if (!error && user) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch (err) {
        console.error('[AuthProfile] Supabase token error:', err);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let updatedProfile: any = null;

    // 1. Update PostgreSQL RDS
    try {
      const updateRes = await query<{
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
        `UPDATE profiles
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             name = COALESCE($4, name),
             phone = COALESCE($5, phone),
             avatar_url = COALESCE($6, avatar_url),
             updated_at = now()
         WHERE id = $1
         RETURNING id, phone, email, first_name, last_name, name, avatar_url, role, loyalty_points, referral_code, created_at`,
        [
          userId,
          first_name !== undefined ? first_name : null,
          last_name !== undefined ? last_name : null,
          name !== undefined ? name : null,
          phone !== undefined ? phone : null,
          avatar_url !== undefined ? avatar_url : null
        ]
      );
      if (updateRes.rows && updateRes.rows.length > 0) {
        updatedProfile = updateRes.rows[0];
      }

      // Sync into users table in PostgreSQL
      try {
        await query(
          `UPDATE users
           SET first_name = COALESCE($2, first_name),
               last_name = COALESCE($3, last_name),
               name = COALESCE($4, name),
               phone = COALESCE($5, phone)
           WHERE id = $1`,
          [
            userId,
            first_name !== undefined ? first_name : null,
            last_name !== undefined ? last_name : null,
            name !== undefined ? name : null,
            phone !== undefined ? phone : null
          ]
        );
      } catch (uPgErr) {
        console.warn('[AuthProfile] PG users table update notice:', uPgErr);
      }
    } catch (pgErr) {
      console.warn('[AuthProfile] PostgreSQL update warning:', pgErr);
    }

    // 2. Update Supabase table
    try {
      const supabase = getAdminSupabase();
      const updates: any = {};
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        updatedProfile = updatedProfile || data;
      }

      // Also update public.users table in Supabase
      try {
        const userUpdates: any = {};
        if (first_name !== undefined) userUpdates.first_name = first_name;
        if (last_name !== undefined) userUpdates.last_name = last_name;
        if (name !== undefined) userUpdates.name = name;
        if (phone !== undefined) userUpdates.phone = phone;
        if (Object.keys(userUpdates).length > 0) {
          await supabase.from('users').update(userUpdates).eq('id', userId);
        }
      } catch (uSbErr) {
        console.warn('[AuthProfile] Supabase users table update notice:', uSbErr);
      }

      // Also update Supabase Auth user metadata
      const metaUpdates: any = {};
      if (name !== undefined) {
        metaUpdates.full_name = name;
        metaUpdates.name = name;
      }
      if (avatar_url !== undefined) {
        metaUpdates.avatar_url = avatar_url;
        metaUpdates.picture = avatar_url;
      }
      if (Object.keys(metaUpdates).length > 0) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: metaUpdates,
        });
      }
    } catch (sbErr) {
      console.warn('[AuthProfile] Supabase update warning:', sbErr);
    }

    if (!updatedProfile) {
      updatedProfile = {
        id: userId,
        email: userEmail,
        name: name || '',
        phone: phone || '',
        avatar_url: avatar_url || null,
        role: 'customer',
      };
    }

    // Fetch user addresses
    let savedAddresses: any[] = [];
    try {
      const addressResult = await query<{ id: string; label: string; address: string; pincode: string | null; is_default: boolean }>(
        'SELECT id, label, address, pincode, is_default FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      savedAddresses = addressResult.rows || [];
    } catch {
      try {
        const supabase = getAdminSupabase();
        const { data: addrs } = await supabase
          .from('user_addresses')
          .select('id, label, address, pincode, is_default')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });
        if (addrs) savedAddresses = addrs;
      } catch {}
    }

    const finalProfile = {
      ...updatedProfile,
      saved_addresses: savedAddresses,
    };

    // Invalidate and refresh cache
    await invalidateUserProfileCache(userId);
    await cacheUserProfile(userId, finalProfile);

    // Refresh access token
    const newAccessToken = await signAccessToken({
      userId: finalProfile.id,
      name: finalProfile.name || undefined,
      avatar_url: finalProfile.avatar_url || undefined,
      role: finalProfile.role as 'customer' | 'admin',
      email: finalProfile.email || undefined,
      phone: finalProfile.phone || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: finalProfile,
      data: {
        user: finalProfile,
        accessToken: newAccessToken,
      },
    });

    response.cookies.set('gs_access_token', newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[AuthProfile] Error updating profile:', err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
