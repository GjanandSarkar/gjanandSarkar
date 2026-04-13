import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOrderId(): string {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function verifySession(token: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
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
    isAdmin: profile?.role === 'admin'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const orderId = searchParams.get('id');

    const auth = await verifySession(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('id', orderId);
    } else if (!auth.isAdmin) {
      query = query.eq('user_id', auth.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getOrders error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}