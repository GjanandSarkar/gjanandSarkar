import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { writeAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authenticate and enforce Seller role
  const auth = await requireSeller(req);
  if (!auth.ok) return auth.response;

  // 2. Validate Order UUID
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid order id format.' }, { status: 400 });
  }

  // 3. Strictly Verify Seller Ownership of Products in This Order
  // Non-admin sellers can only confirm cash collection for orders containing their own products
  if (!auth.user.isAdmin) {
    const sellerId = auth.seller?.id || auth.seller?.sellerId;
    const { data: orderItems, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, products(seller_id, created_by)')
      .eq('order_id', id);

    if (itemsErr || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Order not found or has no items.' }, { status: 404 });
    }

    const ownsProductsInOrder = orderItems.some((item: any) => {
      const p = item.products;
      if (!p) return false;
      return (sellerId && p.seller_id === sellerId) || p.created_by === auth.user.id;
    });

    if (!ownsProductsInOrder) {
      return NextResponse.json(
        { error: 'Forbidden: Sellers can only confirm payment for their own product orders.' },
        { status: 403 }
      );
    }
  }

  // 4. Optional amount validation
  const body = await req.json().catch(() => ({}));
  const amount = body?.amount !== undefined && body?.amount !== null ? Number(body.amount) : null;

  if (amount !== null && (isNaN(amount) || amount <= 0)) {
    return NextResponse.json({ error: 'Invalid collection amount specified.' }, { status: 400 });
  }

  // 5. Atomic database confirmation using row-lock
  const { data, error } = await supabaseAdmin.rpc('confirm_cod_payment_atomic', {
    p_order_id: id,
    p_admin_id: auth.user.id,
    p_amount: amount,
    p_actor_role: 'seller',
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
    console.error('[SellerConfirmCODPayment] RPC error:', error);
    return NextResponse.json({ error: 'Failed to record cash payment confirmation.' }, { status: 500 });
  }

  // 6. Immutable Audit Log Recording
  await writeAudit(
    auth.user.id,
    'seller_cod_payment_confirmed',
    'order',
    id,
    { payment_status: 'pending' },
    { payment_status: 'paid', amount: data.amount, confirmed_by: auth.user.id, role: 'seller' },
    req
  );

  // 7. Notify Customer
  try {
    const { data: ord } = await supabaseAdmin.from('orders').select('user_id').eq('id', id).single();
    if (ord?.user_id) {
      await notify(['customer'], 'payment_completed', id, ord.user_id);
    }
  } catch (err) {
    console.warn('[SellerConfirmCODPayment] Notification error:', err);
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
