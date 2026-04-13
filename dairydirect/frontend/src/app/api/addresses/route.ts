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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAddresses error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ addresses: data });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId, label, address, lat, lng, isDefault } = body;

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDefault) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { error } = await supabaseAdmin
      .from('user_addresses')
      .insert({
        user_id: userId,
        label,
        address,
        latitude: lat ?? null,
        longitude: lng ?? null,
        is_default: isDefault ?? true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}