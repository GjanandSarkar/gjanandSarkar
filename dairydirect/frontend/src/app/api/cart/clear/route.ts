import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifySession(token: string | null): Promise<string | null> {
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
  
  return session.user_id;
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json();

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}