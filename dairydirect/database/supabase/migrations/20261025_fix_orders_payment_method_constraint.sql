-- ============================================================================
-- 20261025_fix_orders_payment_method_constraint.sql
--
-- Fixes:
-- 1. "orders_payment_method_check" constraint violation on online checkouts.
-- 2. "total_price" of relation "order_items" does not exist.
--
-- Normalises place_order_atomic to canonical column schema:
-- order_items: (order_id, product_id, variant_id, product_name, variant_weight, quantity, price, cost_price)
-- orders: accepts both mixed-case and uppercase payment methods.
-- ============================================================================

-- 1. Relax the check constraint on orders table
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'COD', 'Razorpay', 'UPI', 'Card', 'NetBanking', 'Wallet',
    'RAZORPAY', 'CARD', 'NETBANKING', 'WALLET'
  ));

-- 2. Drop all overloads of place_order_atomic cleanly
DO $cleanup$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'place_order_atomic'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.place_order_atomic(%s)', r.args);
  END LOOP;
END
$cleanup$;

-- 3. Create canonical place_order_atomic matching live schema
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_user_id             UUID,
  p_address_id          UUID,
  p_shipping_address    TEXT,
  p_delivery_slot       TEXT,
  p_delivery_date       TIMESTAMPTZ,
  p_notes               TEXT,
  p_payment_method      TEXT,
  p_items               JSONB,          -- [{ "variant_id": "<uuid>", "quantity": <int> }]
  p_coupon_code         TEXT DEFAULT NULL,
  p_razorpay_order_id   TEXT DEFAULT NULL,
  p_razorpay_payment_id TEXT DEFAULT NULL,
  p_razorpay_signature  TEXT DEFAULT NULL,
  p_reservation_id      UUID DEFAULT NULL,
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_payment_method TEXT;
  v_order_id       UUID;
  v_subtotal       NUMERIC(10,2) := 0.00;
  v_delivery_fee   NUMERIC(10,2) := 25.00;
  v_free_threshold NUMERIC(10,2) := 299.00;
  v_discount       NUMERIC(10,2) := 0.00;
  v_total          NUMERIC(10,2) := 0.00;
  v_loyalty_earn   INTEGER := 0;
  v_item           RECORD;
  v_variant        RECORD;
  v_coupon         RECORD;
  v_order_number   TEXT;
  v_payment_status TEXT;
  v_existing       RECORD;
BEGIN
  -- Idempotency check: if already placed under this key, return previous order
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) <> '' THEN
    SELECT id, order_number, total_amount, subtotal, delivery_fee,
           discount_amount, loyalty_earned
      INTO v_existing
      FROM orders
     WHERE user_id = p_user_id
       AND idempotency_key = p_idempotency_key
     LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success',         true,
        'replayed',        true,
        'order_id',        v_existing.id,
        'order_number',    v_existing.order_number,
        'total_amount',    v_existing.total_amount,
        'subtotal',        v_existing.subtotal,
        'delivery_fee',    v_existing.delivery_fee,
        'discount_amount', v_existing.discount_amount,
        'loyalty_earned',  v_existing.loyalty_earned
      );
    END IF;
  END IF;

  -- 1. Load business settings
  SELECT
    COALESCE(standard_delivery_fee, 25.00),
    COALESCE(free_delivery_threshold, 299.00)
  INTO v_delivery_fee, v_free_threshold
  FROM business_settings
  LIMIT 1;

  -- Clean up expired reservations if helper function exists
  BEGIN
    PERFORM cleanup_expired_reservations_atomic();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Validate stock and compute subtotal
  FOR v_item IN
    SELECT variant_id, quantity
    FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
    ORDER BY variant_id ASC
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    SELECT pv.*, p.name AS product_name
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id
      AND p.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found or inactive', v_item.variant_id;
    END IF;

    IF p_reservation_id IS NOT NULL THEN
      IF v_variant.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stock mismatch for "%". Physical stock: %, Requested: %',
          v_variant.product_name, v_variant.stock, v_item.quantity;
      END IF;
    ELSE
      IF v_variant.available_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
          v_variant.product_name, v_variant.available_quantity, v_item.quantity;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  END LOOP;

  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Free delivery threshold check
  IF v_subtotal >= v_free_threshold THEN
    v_delivery_fee := 0.00;
  END IF;

  -- 4. Coupon application
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
      AND is_active = true
      AND (expiry_date IS NULL OR expiry_date > now())
      AND (max_uses IS NULL OR used_count < max_uses)
    FOR UPDATE;

    IF FOUND AND v_subtotal >= v_coupon.min_order_value THEN
      IF v_coupon.type = 'flat' THEN
        v_discount := v_coupon.value;
      ELSE
        v_discount := ROUND((v_subtotal * v_coupon.value) / 100.0, 2);
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
          v_discount := v_coupon.max_discount;
        END IF;
      END IF;
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 5. Calculate final total
  v_total := GREATEST(v_subtotal + v_delivery_fee - v_discount, 0.00);
  v_loyalty_earn := FLOOR(v_total)::INT;

  -- 6. Normalise payment method to canonical mixed-case
  v_payment_method := CASE UPPER(COALESCE(NULLIF(TRIM(COALESCE(p_payment_method, '')), ''), 'COD'))
    WHEN 'COD'        THEN 'COD'
    WHEN 'RAZORPAY'   THEN 'Razorpay'
    WHEN 'UPI'        THEN 'UPI'
    WHEN 'CARD'       THEN 'Card'
    WHEN 'NETBANKING' THEN 'NetBanking'
    WHEN 'WALLET'     THEN 'Wallet'
    ELSE 'Razorpay'
  END;

  -- 7. Derive payment status
  v_payment_status := CASE 
    WHEN v_payment_method IN ('Razorpay', 'UPI', 'Card', 'NetBanking', 'Wallet') AND p_razorpay_payment_id IS NOT NULL THEN 'paid'
    ELSE 'pending'
  END;

  -- 8. Generate order number
  v_order_number := 'ORD-' || UPPER(SUBSTR(ENCODE(gen_random_bytes(4), 'hex'), 1, 8));

  -- 9. Insert order
  INSERT INTO orders (
    order_number, user_id, address_id, shipping_address,
    status, subtotal, delivery_fee, discount_amount, total_amount,
    payment_method, payment_status, coupon_code,
    delivery_slot, delivery_date, notes, loyalty_earned,
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    idempotency_key
  ) VALUES (
    v_order_number, p_user_id, p_address_id, p_shipping_address,
    'confirmed', v_subtotal, v_delivery_fee, v_discount, v_total,
    v_payment_method, v_payment_status, p_coupon_code,
    p_delivery_slot, p_delivery_date, p_notes, v_loyalty_earn,
    p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature,
    NULLIF(TRIM(COALESCE(p_idempotency_key, '')), '')
  ) RETURNING id INTO v_order_id;

  -- 10. Insert order items & execute atomic stock deduction & transaction log
  FOR v_item IN
    SELECT variant_id, quantity
    FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
    ORDER BY variant_id ASC
  LOOP
    SELECT pv.*, p.name AS product_name
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id;

    -- Insert item record (exact order_items schema: price and cost_price, no total_price column)
    INSERT INTO order_items (
      order_id, product_id, variant_id, product_name, variant_weight,
      quantity, price, cost_price
    ) VALUES (
      v_order_id, v_variant.product_id, v_variant.id,
      v_variant.product_name, v_variant.weight,
      v_item.quantity, v_variant.price, v_variant.cost_price
    );

    -- Stock deduction and transaction recording
    IF p_reservation_id IS NOT NULL THEN
      INSERT INTO inventory_transactions (
        variant_id, product_id, order_id, reservation_id, change_type, quantity_change,
        stock_before, stock_after,
        reserved_before, reserved_after,
        available_before, available_after,
        actor_id, notes
      ) VALUES (
        v_variant.id, v_variant.product_id, v_order_id, p_reservation_id, 'purchase', -v_item.quantity,
        v_variant.stock, v_variant.stock - v_item.quantity,
        v_variant.reserved_quantity, GREATEST(0, v_variant.reserved_quantity - v_item.quantity),
        v_variant.available_quantity, (v_variant.stock - v_item.quantity) - GREATEST(0, v_variant.reserved_quantity - v_item.quantity),
        p_user_id, 'Committed purchase from reservation'
      );

      UPDATE product_variants
      SET stock = stock - v_item.quantity,
          reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity)
      WHERE id = v_item.variant_id;
    ELSE
      INSERT INTO inventory_transactions (
        variant_id, product_id, order_id, change_type, quantity_change,
        stock_before, stock_after,
        reserved_before, reserved_after,
        available_before, available_after,
        actor_id, notes
      ) VALUES (
        v_variant.id, v_variant.product_id, v_order_id, 'purchase', -v_item.quantity,
        v_variant.stock, v_variant.stock - v_item.quantity,
        v_variant.reserved_quantity, v_variant.reserved_quantity,
        v_variant.available_quantity, v_variant.available_quantity - v_item.quantity,
        p_user_id, 'Direct order purchase'
      );

      UPDATE product_variants
      SET stock = stock - v_item.quantity
      WHERE id = v_item.variant_id;
    END IF;
  END LOOP;

  -- 11. If reservation was supplied, mark it committed
  IF p_reservation_id IS NOT NULL THEN
    UPDATE inventory_reservations
    SET status = 'committed', order_id = v_order_id, updated_at = now()
    WHERE id = p_reservation_id;
  END IF;

  -- 12. Award loyalty points
  IF p_user_id IS NOT NULL AND v_loyalty_earn > 0 THEN
    UPDATE profiles
    SET loyalty_points = loyalty_points + v_loyalty_earn
    WHERE id = p_user_id;
  END IF;

  -- 13. Clear user cart
  IF p_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'replayed',         false,
    'order_id',         v_order_id,
    'order_number',     v_order_number,
    'total_amount',     v_total,
    'subtotal',         v_subtotal,
    'delivery_fee',     v_delivery_fee,
    'discount_amount',  v_discount,
    'loyalty_earned',   v_loyalty_earn
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_atomic TO authenticated, service_role;
