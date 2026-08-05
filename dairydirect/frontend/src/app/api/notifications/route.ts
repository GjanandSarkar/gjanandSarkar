/**
 * GET/POST /api/notifications
 * Notifications API — AWS PostgreSQL version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND (user_id = $2 OR role_target IN ($3, \'all\'))',
        [notificationId, auth.userId, auth.role]
      );
      return NextResponse.json({ success: true });
    }

    if (all) {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [auth.userId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notifications POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}