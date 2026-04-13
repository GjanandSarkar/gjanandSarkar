import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOrderId(): string {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function verifySession(token: string | null): Promise<string | null> {
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
  
  return session.user_id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, orderData } = body;

    const userId = await verifySession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerName, customerPhone, items, total } = orderData;
    const orderId = generateOrderId();
    const deliveryDate = new Date(Date.now() + 86400000).toISOString();

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        total,
        status: 'Confirmed',
        delivery_date: deliveryDate,
      });

    if (orderError) {
      console.error('Insert order error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      product_name: item.productName,
      variant_weight: item.variantWeight,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Insert order items error:', itemsError);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      role_target: 'customer',
      title: 'Order Confirmed! 🎉',
      body: `Your order ${orderId} has been confirmed. Delivery tomorrow, 7–9 AM.`,
      type: 'order',
      related_id: orderId,
    });

    await supabaseAdmin.from('notifications').insert({
      role_target: 'admin',
      title: `New Order: ${orderId}`,
      body: `${customerName || profile?.name || 'A customer'} placed an order for ₹${total}.`,
      type: 'order',
      related_id: orderId,
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Place order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}