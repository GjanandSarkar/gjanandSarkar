import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { writeAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authenticate and enforce Admin role
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // 2. Validate Order UUID
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }

  // 3. Optional client payload verification
  const body = await req.json().catch(() => ({}));
  const amount = body?.amount !== undefined && body?.amount !== null ? Number(body.amount) : null;

  if (amount !== null && (isNaN(amount) || amount <= 0)) {
    return NextResponse.json({ error: 'Invalid collection amount specified.' }, { status: 400 });
  }

  // 4. Atomic conditional update inside the database
  const { data, error } = await supabaseAdmin.rpc('confirm_cod_payment_atomic', {
    p_order_id: id,
    p_admin_id: auth.user.id,
    p_amount: amount,
    p_actor_role: 'admin',
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('ORDER_NOT_FOUND')) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    if (msg.includes('NOT_COD_ORDER')) {
      return NextResponse.json(
        { error: 'Only Cash on Delivery (COD) orders can have cash collection confirmed.' },
        { status: 400 }
      );
    }
    if (msg.includes('ALREADY_PAID')) {
      return NextResponse.json(
        { error: 'Payment for this order has already been marked as Paid.' },
        { status: 409 }
      );
    }
    if (msg.includes('ORDER_CANCELLED')) {
      return NextResponse.json(
        { error: 'Cannot confirm cash collection for a cancelled order.' },
        { status: 400 }
      );
    }
    if (msg.includes('ORDER_NOT_DELIVERED')) {
      return NextResponse.json(
        { error: 'Cash collection can only be confirmed once the order is out for delivery or delivered.' },
        { status: 400 }
      );
    }
    if (msg.includes('AMOUNT_MISMATCH')) {
      return NextResponse.json(
        { error: 'Confirmed amount does not match the actual order total.' },
        { status: 400 }
      );
    }
    console.error('[ConfirmCODPayment] RPC failed:', error);
    return NextResponse.json({ error: 'Failed to record cash payment confirmation.' }, { status: 500 });
  }

  // 5. Immutable Audit Log Recording
  await writeAudit(
    auth.user.id,
    'cod_payment_confirmed',
    'order',
    id,
    { payment_status: 'pending' },
    { payment_status: 'paid', amount: data.amount, confirmed_by: auth.user.id },
    req
  );

  // 6. Notify Customer
  try {
    const { data: ord } = await supabaseAdmin.from('orders').select('user_id').eq('id', id).single();
    if (ord?.user_id) {
      await notify(['customer'], 'payment_completed', id, ord.user_id);
    }
  } catch (err) {
    console.warn('[ConfirmCODPayment] Notification error:', err);
  }

  return NextResponse.json({
    ok: true,
    orderId: id,
    payment_status: 'paid',
    amount: data.amount,
    confirmed_at: data.confirmed_at,
    confirmed_by: data.confirmed_by,
  });
}
