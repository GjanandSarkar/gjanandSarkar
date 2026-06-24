import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    const auth = await getAuthUser(request);
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
        .limit(10);

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
      .select('*, order_items(*), profiles:user_id(name, phone)')
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