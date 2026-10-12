/**
 * GET/POST /api/notifications
 * Notifications API with dual AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT * FROM notifications
           WHERE user_id = $1 
              OR (user_id IS NULL AND role_target = $2)
              OR (user_id IS NULL AND role_target = 'all')
           ORDER BY created_at DESC
           LIMIT 50`,
          [auth.userId, auth.role]
        );

        return NextResponse.json({ notifications: result.rows });
      } catch (err: any) {
        console.warn('[Notifications GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${auth.userId},and(user_id.is.null,role_target.eq.${auth.role}),and(user_id.is.null,role_target.eq.all)`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (error: any) {
    console.error('[Notifications GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, all } = body;

    if (notificationId) {
      if (!isValidUUID(notificationId)) {
        return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
      }

      if (isPgConfigured) {
        try {
          await query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND (user_id = $2 OR role_target IN ($3, \'all\'))',
            [notificationId, auth.userId, auth.role]
          );
          return NextResponse.json({ success: true });
        } catch (err: any) {
          console.warn('[Notifications POST] RDS failed, fallback to Supabase:', err.message);
        }
      }

      const sb = getAdminSupabase();
      await sb.from('notifications').update({ is_read: true }).eq('id', notificationId);
      return NextResponse.json({ success: true });
    }

    if (all) {
      if (isPgConfigured) {
        try {
          await query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [auth.userId]
          );
          return NextResponse.json({ success: true });
        } catch (err: any) {
          console.warn('[Notifications POST All] RDS failed, fallback to Supabase:', err.message);
        }
      }

      const sb = getAdminSupabase();
      await sb.from('notifications').update({ is_read: true }).eq('user_id', auth.userId).eq('is_read', false);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notifications POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}