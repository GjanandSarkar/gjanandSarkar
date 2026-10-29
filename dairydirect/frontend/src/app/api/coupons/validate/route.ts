/**
 * POST /api/coupons/validate
 * Validates a coupon code against cart items and returns pricing breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderPricing } from '@/lib/pricing';
import { checkRateLimit } from '@/lib/aws/redis';
import { getClientIP } from '@/lib/api/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, couponCode } = body;

    const ip = getClientIP(request);
    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const limit = await checkRateLimit(ip, 'coupon_val', 30, 60);
      if (!limit.allowed) {
        return NextResponse.json({ error: 'Too many coupon attempts. Please try again later.' }, { status: 429 });
      }
    } else {
      const limit = await checkRateLimit(ip, 'pricing_calc', 150, 60);
      if (!limit.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    const pricing = await calculateOrderPricing(items, couponCode);

    if (couponCode && pricing.discount === 0) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid coupon, expired, or minimum order value not met.' 
      });
    }

    return NextResponse.json({
      valid: true,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      nextTierAmount: pricing.nextTierAmount,
      isProfitSafe: pricing.isProfitSafe,
    });
  } catch (error: any) {
    console.error('[CouponValidate] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Validation failed' }, { status: 500 });
  }
}
