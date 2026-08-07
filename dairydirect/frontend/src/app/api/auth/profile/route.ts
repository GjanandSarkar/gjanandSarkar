import { NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { extractTokenFromRequest, verifyAccessToken, signAccessToken } from '@/lib/auth/jwt';
import { cacheUserProfile, invalidateUserProfileCache } from '@/lib/aws/redis';

export async function PATCH(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const { name, phone, avatar_url, address } = body;

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
        name: string | null;
        avatar_url: string | null;
        role: string;
        loyalty_points: number;
        referral_code: string;
        created_at: string;
      }>(
        `UPDATE profiles
         SET name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = now()
         WHERE id = $1
         RETURNING id, phone, email, name, avatar_url, role, loyalty_points, referral_code, created_at`,
        [userId, name !== undefined ? name : null, phone !== undefined ? phone : null, avatar_url !== undefined ? avatar_url : null]
      );
      if (updateRes.rows && updateRes.rows.length > 0) {
        updatedProfile = updateRes.rows[0];
      }
    } catch (pgErr) {
      console.warn('[AuthProfile] PostgreSQL update warning:', pgErr);
    }

    // 2. Update Supabase table
    try {
      const supabase = getAdminSupabase();
      const updates: any = {};
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
