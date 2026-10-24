import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notify } from '@/lib/notify';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireSeller(req);
  if (!auth.ok) return auth.response;
  const { id: orderId, itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!status || !['packed', 'handed_to_dispatch'].includes(status)) {
    return NextResponse.json({ error: 'Status must be packed or handed_to_dispatch' }, { status: 400 });
  }

  // Load item and verify ownership
  const { data: item } = await supabaseAdmin
    .from('order_items')
    .select('*, products(seller_id)')
    .eq('id', itemId)
    .eq('order_id', orderId)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
  }

  const itemSellerId = item.products?.seller_id || item.seller_id;
  if (auth.user.role !== 'admin' && itemSellerId !== auth.seller.sellerId) {
    return NextResponse.json({ error: 'Unauthorized to modify this order item' }, { status: 403 });
  }

  // Update item status
  const { error: updateError } = await supabaseAdmin
    .from('order_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Check if all items in the order are packed/processed
  const { data: allItems } = await supabaseAdmin
    .from('order_items')
    .select('status')
    .eq('order_id', orderId)
    .neq('status', 'cancelled');

  const allPacked = (allItems ?? []).length > 0 && (allItems ?? []).every((i: { status: string }) => i.status === 'packed' || i.status === 'handed_to_dispatch');
  if (allPacked) {
    const { data: currentOrder } = await supabaseAdmin.from('orders').select('status').eq('id', orderId).single();
    if (currentOrder && currentOrder.status === 'confirmed') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      await supabaseAdmin.from('status_events').insert({
        entity_type: 'order',
        entity_id: orderId,
        from_status: 'confirmed',
        to_status: 'processing',
        actor_role: 'seller',
        actor_id: auth.user.id,
        note: 'All items marked packed by seller',
      });
      await notify(['admin', 'customer'], 'order_processing', orderId);
    }
  }

  return NextResponse.json({ ok: true, itemId, status });
}
