import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { calculateOrderPricing } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, couponCode } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    const pricing = await calculateOrderPricing(items, couponCode);

    if (couponCode && pricing.discount === 0) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid coupon, expired, or minimum value not met.' 
      });
    }

    return NextResponse.json({
      valid: true,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      nextTierAmount: pricing.nextTierAmount
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
