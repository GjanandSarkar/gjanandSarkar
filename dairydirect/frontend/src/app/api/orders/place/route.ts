import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { calculateOrderPricing } from '@/lib/pricing';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20, // 20 requests per minute per IP
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      await limiter.check(5, ip); // Max 5 order placements per minute per IP
    } catch {
      return NextResponse.json({ error: 'Too Many Requests. Please try again later.' }, { status: 429 });
    }

    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderData } = body;

    const { items, addressId, paymentMethod, paymentStatus, couponCode, upiId } = orderData;
    
    const pricingItems = items.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity }));
    const pricing = await calculateOrderPricing(pricingItems, couponCode);

    if (!pricing.isProfitSafe) {
      return NextResponse.json({ 
        error: pricing.message || 'Profit margin violation. Order rejected.' 
      }, { status: 400 });
    }

    if (paymentMethod === 'upi') {
      if (!upiId) return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 });
      if (!upiId.includes('@')) return NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
      
      await supabaseAdmin
        .from('profiles')
        .update({ default_upi_id: upiId })
        .eq('id', auth.userId);
    }

    const deliveryDate = new Date(Date.now() + 86400000).toISOString();

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: auth.userId,
        address_id: addressId,
        total_amount: pricing.total,
        status: 'confirmed',
        payment_method: paymentMethod || 'COD',
        payment_status: paymentStatus || 'pending',
        payment_details: upiId ? { upi_id: upiId } : null,
        delivery_date: deliveryDate,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Insert order error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const orderId = newOrder.id;

    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('id, weight, price, products(name)')
      .in('id', pricingItems.map((i: any) => i.variantId));

    const orderItems = items.map((item: any) => {
      const v = (variants || []).find(v => v.id === item.variantId);
      return {
        order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: v ? parseFloat(v.price) : 0,
      };
    });

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Insert order items error:', itemsError);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', auth.userId)
      .single();

    await supabaseAdmin.from('notifications').insert({
      user_id: auth.userId,
      role_target: 'customer',
      title: 'Order Confirmed! 🎉',
      message: `Your order has been confirmed. Total: ₹${pricing.total}`,
      type: 'order',
      related_id: orderId,
    });

    await supabaseAdmin.from('notifications').insert({
      role_target: 'admin',
      title: `New Order Received`,
      message: `${profile?.name || 'A customer'} placed an order for ₹${pricing.total}.`,
      type: 'order',
      related_id: orderId,
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Place order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}