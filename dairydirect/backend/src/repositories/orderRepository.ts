import { query, withTransaction } from '../config/database';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../models/order';
import { generateCode } from '../utils/crypto';
import { AppError } from '../errors/AppError';

export const orderRepository = {
  async placeAtomicOrder(data: {
    userId: string | null;
    addressId: string | null;
    shippingAddress: string | null;
    deliverySlot: string | null;
    deliveryDate: string | null;
    notes: string | null;
    paymentMethod: string;
    items: Array<{ variantId: string; quantity: number }>;
    couponCode?: string | null;
  }): Promise<{ order: Order; items: OrderItem[] }> {
    return withTransaction(async (client) => {
      // 1. Fetch business settings
      const settingsRes = await client.query(
        'SELECT standard_delivery_fee, free_delivery_threshold FROM business_settings LIMIT 1'
      );
      const standardDeliveryFee = parseFloat(settingsRes.rows[0]?.standard_delivery_fee || '25.00');
      const freeDeliveryThreshold = parseFloat(settingsRes.rows[0]?.free_delivery_threshold || '299.00');

      let subtotal = 0;
      const orderItemsToInsert: Array<{
        productId: string;
        variantId: string;
        productName: string;
        variantWeight: string;
        quantity: number;
        price: number;
        costPrice: number;
      }> = [];

      // 2. Validate stock & lock variant rows (Concurrency safe with SELECT FOR UPDATE)
      for (const item of data.items) {
        const variantRes = await client.query(
          `SELECT pv.*, p.name AS product_name, p.is_active AS product_active
           FROM product_variants pv
           JOIN products p ON p.id = pv.product_id
           WHERE pv.id = $1 AND pv.is_active = true
           FOR UPDATE`,
          [item.variantId]
        );

        if (variantRes.rows.length === 0 || !variantRes.rows[0].product_active) {
          throw new AppError(`Product variant not available or inactive: ${item.variantId}`, 400, 'PRODUCT_UNAVAILABLE');
        }

        const variant = variantRes.rows[0];
        if (variant.stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${variant.product_name}". Available: ${variant.stock}, Requested: ${item.quantity}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        // Deduct inventory
        await client.query(
          'UPDATE product_variants SET stock = stock - $1, updated_at = now() WHERE id = $2',
          [item.quantity, item.variantId]
        );

        const price = parseFloat(variant.price);
        const costPrice = parseFloat(variant.cost_price || '0');
        subtotal += price * item.quantity;

        orderItemsToInsert.push({
          productId: variant.product_id,
          variantId: variant.id,
          productName: variant.product_name,
          variantWeight: variant.weight,
          quantity: item.quantity,
          price,
          costPrice,
        });
      }

      if (subtotal === 0) {
        throw new AppError('Order must contain at least one item', 400, 'EMPTY_ORDER');
      }

      // 3. Delivery Fee calculation
      const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;

      // 4. Coupon Discount calculation & validation
      let discountAmount = 0;
      if (data.couponCode && data.couponCode.trim()) {
        const couponRes = await client.query(
          `SELECT * FROM coupons
           WHERE UPPER(code) = UPPER($1)
             AND is_active = true
             AND (expiry_date IS NULL OR expiry_date > now())
             AND (max_uses IS NULL OR used_count < max_uses)
           FOR UPDATE`,
          [data.couponCode.trim()]
        );

        if (couponRes.rows.length > 0) {
          const coupon = couponRes.rows[0];
          const minOrder = parseFloat(coupon.min_order_value || '0');

          if (subtotal >= minOrder) {
            const couponVal = parseFloat(coupon.value);
            if (coupon.type === 'flat') {
              discountAmount = couponVal;
            } else {
              discountAmount = Math.round((subtotal * couponVal) / 100 * 100) / 100;
              if (coupon.max_discount) {
                discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount));
              }
            }

            // Increment coupon usage
            await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [coupon.id]);
          }
        }
      }

      // 5. Total calculation & loyalty points
      const totalAmount = Math.max(0, Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100);
      const loyaltyEarned = Math.floor(totalAmount);
      const orderNumber = generateCode('ORD', 8);

      // 6. Insert Order
      const orderRes = await client.query<Order>(
        `INSERT INTO orders (
          order_number, user_id, address_id, shipping_address, status,
          subtotal, delivery_fee, discount_amount, total_amount,
          payment_method, payment_status, delivery_slot, delivery_date,
          coupon_code, loyalty_earned, notes
        ) VALUES (
          $1, $2, $3, $4, 'pending',
          $5, $6, $7, $8,
          COALESCE($9, 'COD'), 'pending', $10, $11,
          $12, $13, $14
        ) RETURNING *`,
        [
          orderNumber,
          data.userId || null,
          data.addressId || null,
          data.shippingAddress || null,
          subtotal,
          deliveryFee,
          discountAmount,
          totalAmount,
          data.paymentMethod || 'COD',
          data.deliverySlot || null,
          data.deliveryDate || null,
          data.couponCode || null,
          loyaltyEarned,
          data.notes || null,
        ]
      );

      const order = orderRes.rows[0];

      // 7. Insert Order Items
      const createdItems: OrderItem[] = [];
      for (const item of orderItemsToInsert) {
        const itemRes = await client.query<OrderItem>(
          `INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, variant_weight, quantity, price, cost_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            order.id,
            item.productId,
            item.variantId,
            item.productName,
            item.variantWeight,
            item.quantity,
            item.price,
            item.costPrice,
          ]
        );
        createdItems.push(itemRes.rows[0]);
      }

      // 8. Award loyalty points & clear user cart
      if (data.userId) {
        await client.query(
          'UPDATE profiles SET loyalty_points = loyalty_points + $1, updated_at = now() WHERE id = $2',
          [loyaltyEarned, data.userId]
        );
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [data.userId]);
      }

      return { order, items: createdItems };
    });
  },

  async findById(id: string): Promise<Order | null> {
    const orderRes = await query<Order>(
      `SELECT o.*, p.name AS user_name, p.phone AS user_phone, p.email AS user_email
       FROM orders o
       LEFT JOIN profiles p ON p.id = o.user_id
       WHERE o.id = $1 OR o.order_number = $1`,
      [id]
    );

    if (!orderRes.rows[0]) return null;

    const order = orderRes.rows[0];
    const itemsRes = await query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
      [order.id]
    );
    order.items = itemsRes.rows;

    return order;
  },

  async findAll(params: {
    userId?: string;
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const { userId, status, limit = 50, offset = 0 } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (userId) {
      conditions.push(`o.user_id = $${idx++}`);
      values.push(userId);
    }

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(`SELECT COUNT(*) FROM orders o ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const dataQuery = `
      SELECT
        o.*,
        p.name AS user_name,
        p.phone AS user_phone,
        p.email AS user_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'product_name', oi.product_name,
              'variant_weight', oi.variant_weight,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN profiles p ON p.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      GROUP BY o.id, p.name, p.phone, p.email
      ORDER BY o.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limit, offset);
    const dataRes = await query<Order>(dataQuery, values);

    return { orders: dataRes.rows, total };
  },

  async updateStatus(id: string, status: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order | null> {
    const fields = ['status = $1', 'updated_at = now()'];
    const values: any[] = [status];
    let idx = 2;

    if (paymentStatus) {
      fields.push(`payment_status = $${idx++}`);
      values.push(paymentStatus);
    }

    values.push(id);
    const res = await query<Order>(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0] ? this.findById(id) : null;
  },

  async updateRazorpayDetails(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId?: string,
    razorpaySignature?: string,
    paymentStatus: PaymentStatus = 'paid'
  ): Promise<Order | null> {
    const res = await query<Order>(
      `UPDATE orders
       SET razorpay_order_id = COALESCE($1, razorpay_order_id),
           razorpay_payment_id = COALESCE($2, razorpay_payment_id),
           razorpay_signature = COALESCE($3, razorpay_signature),
           payment_status = $4,
           status = CASE WHEN $4 = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END,
           updated_at = now()
       WHERE id = $5 OR razorpay_order_id = $1
       RETURNING *`,
      [razorpayOrderId, razorpayPaymentId || null, razorpaySignature || null, paymentStatus, orderId]
    );

    return res.rows[0] ? this.findById(res.rows[0].id) : null;
  },
};
