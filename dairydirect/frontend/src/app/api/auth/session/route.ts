import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    if (token === 'new_user') {
      return NextResponse.json({ error: 'New user. Complete onboarding first.' }, { status: 401 });
    }

    const tokenHash = getTokenHash(token);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, profiles(*)')
      .eq('token_hash', tokenHash)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const expiresAt = new Date(session.expires_at);
    if (new Date() > expiresAt) {
      await supabaseAdmin.from('sessions').delete().eq('id', session.id);
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: session.profiles,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}