import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

async function verifySession(token: string | null): Promise<string | null> {
  if (!token || token === 'new_user') return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
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