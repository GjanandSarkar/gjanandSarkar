import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { startRefund } from '@/lib/refunds';
import { writeAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data, error } = await supabaseAdmin.rpc('cancel_order_atomic', {
    p_order_id: id,
    p_user_id: auth.user.id,
    p_reason: body.reason ?? 'Cancelled by admin on behalf',
    p_actor_role: 'admin',
  });

  if (error) {
    const status = error.message.includes('CANCEL_NOT_ALLOWED') ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (data?.refund_needed) {
    try {
      await startRefund({ orderId: id, requestId: null, amount: Number(data.amount) });
    } catch (err: any) {
      console.error('[AdminCancelOrder] Refund initiation error:', err);
    }
  }

  await writeAudit(
    auth.user.id,
    'order_cancel_on_behalf',
    'order',
    id,
    { previous_status: data?.previous_status },
    { reason: body.reason },
    req
  );

  const { data: order } = await supabaseAdmin.from('orders').select('user_id').eq('id', id).single();
  if (order?.user_id) {
    await notify(['customer'], 'order_cancelled', id, order.user_id);
  }

  return NextResponse.json({ ok: true, ...data });
}
