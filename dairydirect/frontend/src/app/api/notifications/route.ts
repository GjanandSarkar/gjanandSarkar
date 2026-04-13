import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifySession(token: string | null): Promise<{ userId: string; role: string } | null> {
  if (!token || token === 'new_user') return null;
  
  const tokenHash = getTokenHash(token);
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!session) return null;
  
  const expiresAt = new Date(session.expires_at);
  if (new Date() > expiresAt) return null;
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', session.user_id)
    .single();

  return {
    userId: session.user_id,
    role: profile?.role ?? 'customer'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const auth = await verifySession(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .or(
        `user_id.eq.${auth.userId},` +
        `and(user_id.is.null,role_target.eq.${auth.role}),` +
        `and(user_id.is.null,role_target.eq.all)`
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('getNotifications error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, notificationId, all } = body;

    const auth = await verifySession(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (notificationId) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (all) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.userId)
        .eq('is_read', false);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}