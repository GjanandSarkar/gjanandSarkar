import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

async function verifySession(token: string | null): Promise<string | null> {
  if (!token || token === 'new_user') return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
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