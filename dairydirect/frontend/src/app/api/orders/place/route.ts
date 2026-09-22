/**
 * POST /api/orders/place
 * Transactional order placement with AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { calculateOrderPricing } from '@/lib/pricing';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { checkRateLimit, invalidateProductsCache, invalidateUserProfileCache } from '@/lib/aws/redis';
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from '@/lib/aws/ses';
import { sendSMS } from '@/lib/aws/sns';
import { PlaceOrderSchema } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

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
      // Log detailed validation errors server-side for debugging
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
            price: orderData.items[0].price,
            priceType: typeof orderData.items[0].price,
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

    const { items, addressId, paymentMethod, couponCode, upiId, deliverySlot,
            razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseResult.data;

    // ─── Validate Razorpay IDs (CRITICAL security check) ───
    // For Razorpay payments, we MUST have the payment IDs to link the payment to the order.
    // This prevents placing "paid" orders without an actual Razorpay transaction.
    if (paymentMethod === 'razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { error: 'Razorpay payment IDs are required for online payment' },
          { status: 400 }
        );
      }

      // ─── Idempotency Check: Prevent duplicate orders for same payment ───
      // If an order already exists with this razorpay_order_id, return it instead of creating another
      const sb = getAdminSupabase();
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
          total: 0, // Already processed
          loyaltyEarned: 0,
          idempotent: true,
        });
      }
    }

    // Validate UPI if selected
    if (paymentMethod === 'upi') {
      if (!upiId) return NextResponse.json({ error: 'UPI ID is required for UPI payment' }, { status: 400 });
      if (!upiId.includes('@')) return NextResponse.json({ error: 'Invalid UPI ID format (e.g. name@okhdfc)' }, { status: 400 });
    }

    // ─── Derive payment_status SERVER-SIDE — never trust the client ───
    const derivedPaymentStatus = paymentMethod === 'razorpay' ? 'paid' : 
                                  paymentMethod === 'upi' ? 'paid' : 
                                  'pending'; // COD is always pending

    // Calculate pricing server-side
    const pricingItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
    const pricing = await calculateOrderPricing(pricingItems, couponCode);

    // Calculate delivery date (tomorrow)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    let placedOrderId: string | null = null;
    let placedOrderNumber: string | null = null;

    // Fetch delivery address snapshot so past order record is permanently preserved
    let shippingAddressSnapshot: string | null = null;
    if (addressId) {
      if (isPgConfigured) {
        try {
          const addrRes = await query('SELECT * FROM user_addresses WHERE id = $1', [addressId]);
          if (addrRes.rows.length > 0) {
            const a = addrRes.rows[0];
            shippingAddressSnapshot = JSON.stringify({
              id: a.id,
              full_name: a.full_name,
              mobile_number: a.mobile_number,
              address_type: a.address_type,
              flat_house_building: a.flat_house_building || a.building,
              area_street_sector_village: a.area_street_sector_village || a.street,
              landmark: a.landmark,
              town_city: a.town_city || a.city,
              state: a.state,
              pincode: a.pincode,
              country: a.country || 'India',
              saturday_delivery: a.saturday_delivery,
              sunday_delivery: a.sunday_delivery,
              delivery_instructions: a.delivery_instructions || a.instructions,
              formatted_address: a.address || [
                a.flat_house_building || a.building,
                a.area_street_sector_village || a.street,
                a.landmark ? `Near ${a.landmark}` : null,
                `${a.town_city || a.city}, ${a.state} - ${a.pincode}`,
                a.country || 'India'
              ].filter(Boolean).join(', ')
            });
          }
        } catch (e) {}
      }

      if (!shippingAddressSnapshot) {
        const sb = getAdminSupabase();
        const { data: a } = await sb.from('user_addresses').select('*').eq('id', addressId).maybeSingle();
        if (a) {
          shippingAddressSnapshot = JSON.stringify({
            id: a.id,
            full_name: a.full_name,
            mobile_number: a.mobile_number,
            address_type: a.address_type,
            flat_house_building: a.flat_house_building || a.building,
            area_street_sector_village: a.area_street_sector_village || a.street,
            landmark: a.landmark,
            town_city: a.town_city || a.city,
            state: a.state,
            pincode: a.pincode,
            country: a.country || 'India',
            saturday_delivery: a.saturday_delivery,
            sunday_delivery: a.sunday_delivery,
            delivery_instructions: a.delivery_instructions || a.instructions,
            formatted_address: a.address || [
              a.flat_house_building || a.building,
              a.area_street_sector_village || a.street,
              a.landmark ? `Near ${a.landmark}` : null,
              `${a.town_city || a.city}, ${a.state} - ${a.pincode}`,
              a.country || 'India'
            ].filter(Boolean).join(', ')
          });
        }
      }
    }

    // ─── 1. Attempt via AWS RDS PostgreSQL Transaction ───
    if (isPgConfigured) {
      try {
        const txResult = await withTransaction(async (client) => {
          // Deduct stock
          for (const item of pricingItems) {
            await client.query(
              'UPDATE product_variants SET stock = GREATEST(0, stock - $1) WHERE id = $2',
              [item.quantity, item.variantId]
            );
          }

          // Create order record with razorpay IDs and shipping_address snapshot
          const orderResult = await client.query<{ id: string; order_number?: string }>(
            `INSERT INTO orders (
               user_id, address_id, shipping_address, status, subtotal, delivery_fee, discount_amount,
               total_amount, payment_method, payment_status, coupon_code, delivery_slot,
               delivery_date, loyalty_earned,
               razorpay_order_id, razorpay_payment_id, razorpay_signature
             ) VALUES ($1, $2, $3, 'confirmed', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             RETURNING id, order_number`,
            [
              auth.userId,
              addressId,
              shippingAddressSnapshot,
              pricing.subtotal,
              pricing.deliveryFee,
              pricing.discount,
              pricing.total,
              paymentMethod.toUpperCase(),
              derivedPaymentStatus,
              couponCode || null,
              deliverySlot || null,
              deliveryDate.toISOString(),
              Math.floor(pricing.total),
              razorpayOrderId || null,
              razorpayPaymentId || null,
              razorpaySignature || null,
            ]
          );

          const orderId = orderResult.rows[0].id;
          const orderNum = orderResult.rows[0].order_number || `ORD-${orderId.substring(0, 8).toUpperCase()}`;

          // Insert order items
          for (const item of items) {
            await client.query(
              `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
               VALUES ($1, $2, $3, $4, $5)`,
              [orderId, item.productId, item.variantId, item.quantity, item.price || 0]
            );
          }

          // Save default UPI ID if provided
          if (upiId && paymentMethod === 'upi') {
            await client.query('UPDATE profiles SET default_upi_id = $1 WHERE id = $2', [upiId, auth.userId]);
          }

          // Award loyalty points
          await client.query('UPDATE profiles SET loyalty_points = loyalty_points + $1 WHERE id = $2', [
            Math.floor(pricing.total),
            auth.userId,
          ]);

          // Increment coupon usage
          if (couponCode && pricing.couponApplied) {
            await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)', [
              couponCode,
            ]);
          }

          // Create in-app notification
          await client.query(
            `INSERT INTO notifications (user_id, role_target, title, message, type, related_id)
             VALUES ($1, 'customer', $2, $3, 'order', $4)`,
            [
              auth.userId,
              'Order Confirmed! 🎉',
              `Your order ${orderNum} has been confirmed. Total: ₹${pricing.total}. Expected delivery tomorrow.`,
              orderId,
            ]
          );

          return { orderId, orderNumber: orderNum };
        });

        placedOrderId = txResult.orderId;
        placedOrderNumber = txResult.orderNumber;
      } catch (pgErr: any) {
        console.warn('[PlaceOrder] PostgreSQL transaction failed, using Supabase fallback:', pgErr.message);
      }
    }

    // ─── 2. Fallback via Supabase Admin Client ───
    if (!placedOrderId) {
      const sb = getAdminSupabase();

      // Insert Order with razorpay IDs and shipping_address snapshot
      const { data: orderDataRes, error: orderErr } = await sb
        .from('orders')
        .insert({
          user_id: auth.userId,
          address_id: addressId,
          shipping_address: shippingAddressSnapshot,
          status: 'confirmed',
          subtotal: pricing.subtotal,
          delivery_fee: pricing.deliveryFee,
          discount_amount: pricing.discount,
          total_amount: pricing.total,
          payment_method: paymentMethod.toUpperCase(),
          payment_status: derivedPaymentStatus,
          coupon_code: couponCode || null,
          delivery_slot: deliverySlot || null,
          delivery_date: deliveryDate.toISOString(),
          loyalty_earned: Math.floor(pricing.total),
          // Store razorpay IDs for payment tracking & webhook reconciliation
          razorpay_order_id: razorpayOrderId || null,
          razorpay_payment_id: razorpayPaymentId || null,
          razorpay_signature: razorpaySignature || null,
        })
        .select('id, order_number')
        .single();

      if (orderErr || !orderDataRes) {
        throw new Error(orderErr?.message || 'Failed to create order record in Supabase');
      }

      placedOrderId = orderDataRes.id;
      placedOrderNumber = orderDataRes.order_number || `ORD-${orderDataRes.id.substring(0, 8).toUpperCase()}`;

      // Insert Order Items
      const orderItemInserts = items.map((item) => ({
        order_id: placedOrderId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price || 0,
      }));

      const { error: itemsErr } = await sb.from('order_items').insert(orderItemInserts);
      if (itemsErr) {
        console.error('[PlaceOrder] Failed to insert items in Supabase:', itemsErr.message);
      }

      // Deduct variant stock
      for (const item of items) {
        const { data: vData } = await sb.from('product_variants').select('stock').eq('id', item.variantId).single();
        if (vData) {
          const newStock = Math.max(0, (vData.stock || 0) - item.quantity);
          await sb.from('product_variants').update({ stock: newStock }).eq('id', item.variantId);
        }
      }

      // Create Notification
      await sb.from('notifications').insert({
        user_id: auth.userId,
        role_target: 'customer',
        title: 'Order Confirmed! 🎉',
        message: `Your order ${placedOrderNumber} has been confirmed. Total: ₹${pricing.total}. Expected delivery tomorrow.`,
        type: 'order',
        related_id: placedOrderId,
      });
    }

    // ─── Post-Transaction Non-Critical Operations (Async) ───
    setImmediate(async () => {
      try {
        await invalidateProductsCache();
        await invalidateUserProfileCache(auth.userId);
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