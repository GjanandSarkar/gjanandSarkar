/**
 * POST /api/orders/place
 * Secure, atomic order placement.
 *
 * Payment verification requirements for 'razorpay' method:
 *   (a) HMAC-SHA256 signature verified against RAZORPAY_KEY_SECRET
 *   (b) Payment fetched from Razorpay API; status must be 'captured'
 *   (c) payment.order_id must equal razorpayOrderId from client
 *   (d) payment.amount (paise) must equal server-computed total × 100
 *       looked up from razorpay_pending_orders (never trusts client amount)
 *   (e) razorpay_pending_orders.user_id must equal the authenticated user
 *
 * 'upi' is no longer accepted as a standalone payment method — it must go
 * through Razorpay (select 'razorpay' and the UPI handle in the Razorpay SDK).
 * Only 'cod' may produce payment_status = 'pending'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderPricing } from '@/lib/pricing';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { checkRateLimit, invalidateUserProfileCache, invalidateAdminCaches, invalidateSellerProfileCache, invalidateSellerAnalyticsCache } from '@/lib/aws/redis';
import { PlaceOrderSchema } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';
import { verifyRazorpayPaymentSignature, getRazorpayClient } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Rate limit: max 10 orders per minute per IP
    const limit = await checkRateLimit(ip, 'place_order', 10, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many order attempts. Please slow down.' },
        { status: 429 }
      );
    }

    // Authenticate user
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to place an order.' }, { status: 401 });
    }

    const body = await request.json();
    const orderData = body.orderData || body;

    // Validate input with Zod
    const parseResult = PlaceOrderSchema.safeParse(orderData);
    if (!parseResult.success) {
      console.error('[PlaceOrder] Validation failed:', JSON.stringify({
        errors: parseResult.error.issues,
        received: {
          paymentMethod: orderData?.paymentMethod,
          addressId: orderData?.addressId,
          itemCount: orderData?.items?.length,
          firstItem: orderData?.items?.[0] ? {
            productId: orderData.items[0].productId,
            variantId: orderData.items[0].variantId,
            quantity: orderData.items[0].quantity,
          } : null,
        },
      }, null, 2));
      return NextResponse.json(
        {
          error: 'Invalid order data',
          details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | '),
        },
        { status: 400 }
      );
    }

    const { items, addressId, paymentMethod, couponCode, deliverySlot,
            razorpayOrderId, razorpayPaymentId, razorpaySignature, reservationId } = parseResult.data;

    // ─── UPI direct payment is disabled ───
    // UPI must go through Razorpay checkout (paymentMethod = 'razorpay').
    // Only COD is allowed as a non-Razorpay payment method.
    if (paymentMethod === 'upi') {
      return NextResponse.json(
        { error: "UPI payments must go through Razorpay checkout. Please select 'Online Payment' and choose UPI inside the payment flow." },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();

    // ─── RAZORPAY PAYMENT VERIFICATION (all 5 checks) ───
    if (paymentMethod === 'razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { error: 'Razorpay payment IDs are required for online payment.' },
          { status: 400 }
        );
      }

      // (a) Verify HMAC-SHA256 signature
      const isSignatureValid = verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
      if (!isSignatureValid) {
        console.error('[PlaceOrder] SIGNATURE MISMATCH — possible payment fraud', {
          userId: auth.userId,
          razorpayOrderId,
          ip,
        });
        return NextResponse.json(
          { error: 'Payment signature verification failed. Request rejected.' },
          { status: 400 }
        );
      }

      // (e) Look up server-side pending order to verify user ownership and expected amount
      const { data: pendingOrder, error: pendingErr } = await sb
        .from('razorpay_pending_orders')
        .select('user_id, expected_amount_paise, currency, consumed')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (pendingErr || !pendingOrder) {
        console.error('[PlaceOrder] No pending order record found for razorpay_order_id:', razorpayOrderId);
        return NextResponse.json(
          { error: 'Payment record not found. Please start a new payment from the checkout page.' },
          { status: 400 }
        );
      }

      // (e) Verify ownership — the pending order must belong to THIS user
      if (pendingOrder.user_id !== auth.userId) {
        console.error('[PlaceOrder] User mismatch for razorpay_order_id:', razorpayOrderId, {
          pendingUserId: pendingOrder.user_id,
          requestUserId: auth.userId,
        });
        return NextResponse.json(
          { error: 'Payment does not belong to the authenticated user.' },
          { status: 403 }
        );
      }

      // Prevent duplicate order for already-consumed payment
      if (pendingOrder.consumed) {
        // Check if an order was already created with this razorpay_order_id
        const { data: existingOrder } = await sb
          .from('orders')
          .select('id, order_number')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        if (existingOrder) {
          return NextResponse.json({
            success: true,
            orderId: existingOrder.id,
            orderNumber: existingOrder.order_number,
            total: 0,
            loyaltyEarned: 0,
            idempotent: true,
          });
        }
        return NextResponse.json(
          { error: 'This payment has already been used.' },
          { status: 400 }
        );
      }

      // (b) Fetch payment from Razorpay API and verify status = 'captured'
      let razorpayPayment: any;
      try {
        const rzClient = getRazorpayClient();
        razorpayPayment = await (rzClient.payments as any).fetch(razorpayPaymentId);
      } catch (rzErr: any) {
        console.error('[PlaceOrder] Razorpay payment fetch failed:', rzErr.message);
        return NextResponse.json(
          { error: 'Could not verify payment with payment provider. Please contact support.' },
          { status: 500 }
        );
      }

      if (razorpayPayment.status !== 'captured') {
        console.error('[PlaceOrder] Payment not captured:', {
          paymentId: razorpayPaymentId,
          status: razorpayPayment.status,
        });
        return NextResponse.json(
          { error: `Payment is not captured (current status: ${razorpayPayment.status}). Cannot create order.` },
          { status: 400 }
        );
      }

      // (c) Verify payment.order_id matches the razorpayOrderId from client
      if (razorpayPayment.order_id !== razorpayOrderId) {
        console.error('[PlaceOrder] payment.order_id mismatch:', {
          clientOrderId: razorpayOrderId,
          paymentOrderId: razorpayPayment.order_id,
        });
        return NextResponse.json(
          { error: 'Payment order ID mismatch. Request rejected.' },
          { status: 400 }
        );
      }

      // (d) Verify payment.amount (paise) matches server-computed expected amount
      const capturedAmountPaise = Number(razorpayPayment.amount);
      if (capturedAmountPaise !== pendingOrder.expected_amount_paise) {
        console.error('[PlaceOrder] Amount mismatch:', {
          capturedPaise: capturedAmountPaise,
          expectedPaise: pendingOrder.expected_amount_paise,
          userId: auth.userId,
        });
        return NextResponse.json(
          { error: 'Captured payment amount does not match order total. Request rejected.' },
          { status: 400 }
        );
      }
    }

    // ─── Validate Product & Seller Status ───────────────────────────────────
    const productIds = Array.from(new Set(items.map((i) => i.productId).filter(Boolean)));
    if (productIds.length > 0) {
      const { data: prodsWithSellers } = await sb
        .from('products')
        .select('id, name, is_active, approval_status, seller_id, sellers:seller_id(status, store_name)')
        .in('id', productIds);

      if (prodsWithSellers) {
        for (const p of prodsWithSellers) {
          if (p.approval_status !== 'approved' || !p.is_active) {
            return NextResponse.json(
              { error: `Cannot place order. Product "${p.name}" is currently ${p.approval_status || 'unavailable'}.` },
              { status: 400 }
            );
          }
          const seller = (p as any).sellers;
          if (p.seller_id && seller && seller.status !== 'active') {
            return NextResponse.json(
              { error: `Cannot place order. Seller "${seller.store_name}" is currently ${seller.status}.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // ─── Server-side pricing calculation ────────────────────────────────────
    const pricingItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
    const pricing = await calculateOrderPricing(pricingItems, couponCode);

    // ─── Derive payment_status SERVER-SIDE — never trust the client ─────────
    // Only COD may produce 'pending'. Razorpay has already been verified above.
    const derivedPaymentStatus = paymentMethod === 'razorpay' ? 'paid' : 'pending'; // COD only

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    // ─── Snapshot delivery address ───────────────────────────────────────────
    let shippingAddressSnapshot: string | null = null;
    if (addressId) {
      const { data: a } = await sb.from('user_addresses').select('*').eq('id', addressId).maybeSingle();
      if (a) {
        shippingAddressSnapshot = JSON.stringify({
          id: a.id,
          full_name: a.full_name,
          mobile_number: a.mobile_number,
          address_type: a.address_type,
          flat_house_building: a.flat_house_building || (a as any).building,
          area_street_sector_village: a.area_street_sector_village || (a as any).street,
          landmark: a.landmark,
          town_city: a.town_city || (a as any).city,
          state: a.state,
          pincode: a.pincode,
          country: a.country || 'India',
          saturday_delivery: a.saturday_delivery,
          sunday_delivery: a.sunday_delivery,
          delivery_instructions: a.delivery_instructions || (a as any).instructions,
          formatted_address: (a as any).address || [
            a.flat_house_building || (a as any).building,
            a.area_street_sector_village || (a as any).street,
            a.landmark ? `Near ${a.landmark}` : null,
            `${a.town_city || (a as any).city}, ${a.state} - ${a.pincode}`,
            a.country || 'India',
          ].filter(Boolean).join(', '),
        });
      }
    }

    // ─── Atomic order placement via Supabase RPC ─────────────────────────────
    const canonicalPaymentMethod = paymentMethod === 'cod' ? 'COD' : 'Razorpay';

    const { data: rpcRes, error: rpcErr } = await sb.rpc('place_order_atomic', {
      p_user_id: auth.userId,
      p_address_id: addressId,
      p_shipping_address: shippingAddressSnapshot,
      p_delivery_slot: deliverySlot || null,
      p_delivery_date: deliveryDate.toISOString(),
      p_notes: (orderData as any)?.notes || null,
      p_payment_method: canonicalPaymentMethod,
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_coupon_code: couponCode || null,
      p_razorpay_order_id: razorpayOrderId || null,
      p_razorpay_payment_id: razorpayPaymentId || null,
      p_razorpay_signature: razorpaySignature || null,
      p_reservation_id: reservationId || (orderData as any)?.reservationId || null,
      p_idempotency_key: (orderData as any)?.idempotencyKey || reservationId || razorpayPaymentId || null,
    });

    if (rpcErr || !rpcRes || !rpcRes.success) {
      const errorMsg = rpcErr?.message || rpcRes?.error || 'Failed to place order';
      console.error('[PlaceOrder Atomic] Error:', errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const placedOrderId: string = rpcRes.order_id;
    const placedOrderNumber: string = rpcRes.order_number;

    // Mark pending order as consumed now that order is confirmed
    if (razorpayOrderId) {
      await sb
        .from('razorpay_pending_orders')
        .update({ consumed: true })
        .eq('razorpay_order_id', razorpayOrderId);
    }

    // In-app notification
    try {
      await sb.from('notifications').insert({
        user_id: auth.userId,
        role_target: 'customer',
        title: 'Order Confirmed! 🎉',
        message: `Your order ${placedOrderNumber} has been confirmed. Total: ₹${rpcRes.total_amount || pricing.total}. Expected delivery tomorrow.`,
        type: 'order',
        related_id: placedOrderId,
      });
    } catch (notifErr) {
      console.warn('[PlaceOrder] Failed to insert notification:', notifErr);
    }

    // Record inventory reservation if not already reserved
    if (!reservationId) {
      try {
        for (const item of items) {
          await sb.from('inventory_reservations').insert({
            variant_id: item.variantId,
            user_id: auth.userId,
            quantity: item.quantity,
            status: 'committed',
            expires_at: new Date(Date.now() + 600000).toISOString(),
            order_id: placedOrderId,
          });
        }
      } catch (resErr) {
        console.warn('[PlaceOrder] Reservation record warning:', resErr);
      }
    }

    // ─── Post-Transaction Cache Invalidation ─────────────────────────────────
    await revalidateInventory({ productId: items[0]?.productId });

    setImmediate(async () => {
      try {
        await invalidateUserProfileCache(auth.userId);
        await invalidateAdminCaches();

        if (productIds.length > 0) {
          const { data: orderedProducts, error: orderedErr } = await sb
            .from('products')
            .select('seller_id, created_by')
            .in('id', productIds);

          if (orderedErr) {
            console.error('[PlaceOrder] seller cache invalidation lookup failed:', orderedErr.message);
          }

          const sellerIds = new Set<string>();
          const ownerUserIds = new Set<string>();

          (orderedProducts ?? []).forEach((row: any) => {
            if (row.seller_id) sellerIds.add(row.seller_id);
            if (row.created_by) ownerUserIds.add(row.created_by);
          });

          if (sellerIds.size > 0) {
            const { data: sellerRows } = await sb
              .from('sellers')
              .select('id, user_id')
              .in('id', Array.from(sellerIds));

            (sellerRows ?? []).forEach((row: any) => {
              if (row.user_id) ownerUserIds.add(row.user_id);
            });

            await Promise.all(
              Array.from(sellerIds).map((id) =>
                invalidateSellerAnalyticsCache(id).catch(() => {})
              )
            );
          }

          await Promise.all(
            Array.from(ownerUserIds).map((uid) =>
              invalidateSellerProfileCache(uid).catch(() => {})
            )
          );
        }
      } catch (e) {
        // non-blocking
      }
    });

    return NextResponse.json({
      success: true,
      orderId: placedOrderId,
      orderNumber: placedOrderNumber,
      total: pricing.total,
      loyaltyEarned: Math.floor(pricing.total),
    });
  } catch (error: any) {
    console.error('[PlaceOrder] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}