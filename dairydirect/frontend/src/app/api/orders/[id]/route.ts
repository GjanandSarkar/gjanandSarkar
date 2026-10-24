import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { itemActions, canCancel } from '@/lib/orders/policy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCustomer(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  const isOwner = order?.user_id === auth.user.id;
  if (!order || (!isOwner && auth.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const productIds = (order.order_items || []).map((i: any) => i.product_id).filter(Boolean);
  const [events, requests, settings, products, refunds] = await Promise.all([
    supabaseAdmin.from('status_events').select('to_status, created_at').eq('entity_type', 'order').eq('entity_id', id),
    supabaseAdmin.from('return_requests').select('*').eq('order_id', id),
    supabaseAdmin.from('business_settings').select('*').limit(1).single(),
    productIds.length > 0
      ? supabaseAdmin.from('products').select('id, category').in('id', productIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from('refunds').select('*').eq('order_id', id),
  ]);

  const category = Object.fromEntries((products.data ?? []).map((p: any) => [p.id, p.category]));
  const times = Object.fromEntries((events.data ?? []).map((e: any) => [e.to_status, e.created_at]));
  const activeByItem = new Set(
    (requests.data ?? [])
      .filter((r: any) => !['refunded', 'completed', 'rejected'].includes(r.status))
      .map((r: any) => r.order_item_id)
  );

  const policy = settings.data || {
    freshness_guarantee_hours: 24,
    return_window_hours: 168,
    replacement_window_hours: 168,
  };

  const items = (order.order_items || []).map((i: any) => ({
    ...i,
    actions: itemActions(
      order,
      {
        category: category[i.product_id] ?? 'Other',
        delivered_at: i.delivered_at,
        hasActiveRequest: activeByItem.has(i.id),
      },
      policy
    ),
    request: (requests.data ?? []).find((r: any) => r.order_item_id === i.id) ?? null,
  }));

  return NextResponse.json({
    order: { ...order, order_items: undefined },
    items,
    times,
    refunds: refunds.data ?? [],
    canCancel: canCancel(order.status),
  });
}
