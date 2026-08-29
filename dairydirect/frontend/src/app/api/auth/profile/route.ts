import { NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { extractTokenFromRequest, verifyAccessToken, signAccessToken } from '@/lib/auth/jwt';
import { cacheUserProfile, invalidateUserProfileCache } from '@/lib/aws/redis';
import { syncUserToUsersTable } from '@/lib/supabase/sync-users';
import { sanitizePhone } from '@/lib/security/sanitize';

export async function PATCH(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const { name, first_name, last_name, phone, avatar_url, address, country } = body;

    // Validate and format phone number to store ONLY 10 digits in database
    let validatedPhone = phone;
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const rawDigits = String(phone).replace(/\D/g, '');
      const fullPhone = String(phone).startsWith('+91') ? String(phone) : `+91${rawDigits}`;
      const sanitized = sanitizePhone(fullPhone);
      if (!sanitized) {
        return NextResponse.json({ error: 'Enter a valid Indian mobile number' }, { status: 400 });
      }
      // Store ONLY 10 digits in database (no country code)
      validatedPhone = sanitized.replace(/^\+91/, '').replace(/\D/g, '');
    }

    let userId: string | null = null;
    let userEmail: string | null = null;

    // Compute first_name, last_name, and full name
    let computedFirstName = first_name !== undefined ? (first_name || null) : null;
    let computedLastName = last_name !== undefined ? (last_name || null) : null;

    if (!computedFirstName && !computedLastName && name) {
      const parts = name.trim().split(/\s+/);
      computedFirstName = parts[0] || null;
      computedLastName = parts.slice(1).join(' ') || null;
    }

    const computedName = (computedFirstName || computedLastName)
      ? `${computedFirstName || ''} ${computedLastName || ''}`.trim()
      : (name !== undefined ? name : null);

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
        first_name?: string | null;
        last_name?: string | null;
        name: string | null;
        avatar_url: string | null;
        country: string | null;
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
             country = COALESCE($7, country),
             updated_at = now()
         WHERE id = $1
         RETURNING id, phone, email, first_name, last_name, name, avatar_url, country, role, loyalty_points, referral_code, created_at`,
        [
          userId, 
          computedFirstName, 
          computedLastName, 
          computedName, 
          validatedPhone !== undefined ? validatedPhone : null, 
          avatar_url !== undefined ? avatar_url : null,
          country !== undefined ? country : null
        ]
      );
      if (updateRes.rows && updateRes.rows.length > 0) {
        updatedProfile = updateRes.rows[0];
      }
    } catch (pgErr) {
      // Fallback for PG table if first_name/last_name/country columns are not added yet
      try {
        const fallbackRes = await query<any>(
          `UPDATE profiles
           SET name = COALESCE($2, name),
               phone = COALESCE($3, phone),
               avatar_url = COALESCE($4, avatar_url),
               updated_at = now()
           WHERE id = $1
           RETURNING id, phone, email, name, avatar_url, role, loyalty_points, referral_code, created_at`,
          [userId, computedName, validatedPhone !== undefined ? validatedPhone : null, avatar_url !== undefined ? avatar_url : null]
        );
        if (fallbackRes.rows && fallbackRes.rows.length > 0) {
          updatedProfile = fallbackRes.rows[0];
        }
      } catch (fallbackErr) {
        console.warn('[AuthProfile] PostgreSQL update warning:', fallbackErr);
      }
    }

    // 2. Update Supabase table
    try {
      const supabase = getAdminSupabase();
      const updates: any = {};
      if (computedFirstName !== null) updates.first_name = computedFirstName;
      if (computedLastName !== null) updates.last_name = computedLastName;
      if (computedName !== null) updates.name = computedName;
      if (validatedPhone !== undefined) updates.phone = validatedPhone;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (country !== undefined) updates.country = country;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        // Fallback update without first_name/last_name if columns are missing
        const { data: fallbackData } = await supabase
          .from('profiles')
          .update({ name: computedName || undefined, phone: phone || undefined, avatar_url: avatar_url || undefined })
          .eq('id', userId)
          .select()
          .single();
        if (fallbackData) updatedProfile = updatedProfile || fallbackData;
      } else if (data) {
        updatedProfile = updatedProfile || data;
      }

      // Also update Supabase Auth user metadata
      const metaUpdates: any = {};
      if (computedFirstName !== null) metaUpdates.first_name = computedFirstName;
      if (computedLastName !== null) metaUpdates.last_name = computedLastName;
      if (computedName !== null) {
        metaUpdates.full_name = computedName;
        metaUpdates.name = computedName;
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

    // Sync users table in Supabase and RDS
    await syncUserToUsersTable({
      id: userId,
      phone: finalProfile.phone,
      name: finalProfile.name,
      first_name: finalProfile.first_name,
      last_name: finalProfile.last_name,
      email: finalProfile.email,
      country: finalProfile.country,
    });

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
