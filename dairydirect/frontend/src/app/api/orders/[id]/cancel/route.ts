import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { startRefund } from '@/lib/refunds';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authentication
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Please sign in to cancel an order.' }, { status: 401 });

  // 2. Input validation. Only the order id comes from the client.
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 255) : 'Cancelled by customer';

  // 3. Ownership, status check and update happen atomically inside the database function.
  const { data, error } = await supabaseAdmin.rpc('cancel_order_atomic', {
    p_order_id: id,
    p_user_id: user.id,
    p_reason: reason,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('ORDER_NOT_FOUND'))
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (msg.includes('CANCEL_NOT_ALLOWED')) {
      const current = msg.split('CANCEL_NOT_ALLOWED:')[1]?.trim();
      return NextResponse.json(
        { error: 'This order can no longer be cancelled.', currentStatus: current },
        { status: 409 },
      );
    }
    console.error('cancel_order_atomic failed', error);
    return NextResponse.json({ error: 'Could not cancel the order. Please try again.' }, { status: 500 });
  }

  // 4. Refund is separate from cancellation. The order stays cancelled even if the refund call fails.
  //    startRefund must be idempotent and may only mark a refund completed after Razorpay confirms it
  //    (refund.processed webhook).
  let refund: 'not_needed' | 'initiated' | 'queued_for_admin' = 'not_needed';
  if (data?.refund_needed) {
    try {
      await startRefund({ orderId: id, requestId: null, amount: Number(data.amount) });
      refund = 'initiated';
    } catch (e) {
      console.error('refund start failed for cancelled order', id, e);
      refund = 'queued_for_admin';
    }
  }

  return NextResponse.json({ ok: true, status: 'cancelled', refund });
}
