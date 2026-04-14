import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

async function verifySession(token: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!token || token === 'new_user') return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    userId: user.id,
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

    const isHistory = searchParams.get('history') === 'true';

    if (isHistory) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('order_items(product_id)')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(10); // Look at last 10 orders

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const productIds = new Set<string>();
      data?.forEach(order => {
        (order.order_items as any[])?.forEach(item => {
          if (productIds.size < 5) productIds.add(item.product_id);
        });
      });

      return NextResponse.json({ productIds: Array.from(productIds) });
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