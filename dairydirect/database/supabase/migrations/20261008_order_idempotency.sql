-- ============================================================
-- Migration: accept and honour an idempotency key when placing an order
--
-- src/app/api/orders/place/route.ts calls place_order_atomic with
-- p_idempotency_key, but 20260930 declares the function without it. PostgREST
-- resolves RPC by exact argument-name set, so every checkout failed with:
--   Could not find the function public.place_order_atomic(..., p_idempotency_key, ...)
--   in the schema cache
-- No order could be placed at all.
--
-- Rather than just widening the signature, the key is now honoured. Placing an
-- order is not safe to repeat: a double click, a retried fetch, or a payment
-- gateway firing its callback twice would each create a separate order and
-- deduct stock a second time. The function now returns the original order when
-- a key is reused, and a unique index makes that guarantee hold even if two
-- requests race.
-- ============================================================

-- 1. Store the key alongside the order.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. One order per key per user. Partial, so the many historical orders with
--    no key do not collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_user_idempotency_key
  ON orders (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Remove every superseded overload so exactly one remains.
--
-- 003_functions_rls_storage.sql defines a 9-argument place_order_atomic from
-- before the inventory system existed. It is SECURITY DEFINER, writes no
-- inventory_transactions ledger rows and knows nothing about reservations or
-- available_quantity, so any caller reaching it would silently bypass stock
-- accounting. Its argument names are a prefix subset of the current ones,
-- which makes it a live footgun rather than harmless dead code.
DROP FUNCTION IF EXISTS place_order_atomic(
  UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT, JSONB, TEXT
);

DROP FUNCTION IF EXISTS place_order_atomic(
  UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, UUID
);

-- 4. Recreate with the idempotency key as a trailing optional argument.
CREATE OR REPLACE FUNCTION place_order_atomic(
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
  -- Idempotency replay guard.
  -- Placing an order is not safe to repeat: a double click, a retried fetch
  -- or a payment-gateway callback fired twice would each create a separate
  -- order and deduct stock again. If this user has already placed an order
  -- under the same key, return that order instead of creating another.
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

  -- Clean up any expired reservations first
  PERFORM cleanup_expired_reservations_atomic();

  -- 2. Validate stock and compute subtotal (row-level locks in sorted order to prevent deadlocks)
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

    -- If there's an active reservation for this variant/user, check against that
    IF p_reservation_id IS NOT NULL THEN
      -- If reserved, available_quantity was already deducted during reservation
      IF v_variant.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stock mismatch for "%". Physical stock: %, Requested: %',
          v_variant.product_name, v_variant.stock, v_item.quantity;
      END IF;
    ELSE
      -- Direct purchase (COD or direct): check available_quantity
      IF v_variant.available_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
          v_variant.product_name, v_variant.available_quantity, v_item.quantity;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  END LOOP;

  -- Guard against empty cart
  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Free delivery threshold check
  IF v_subtotal >= v_free_threshold THEN
    v_delivery_fee := 0.00;
  END IF;

  -- 4. Validate and apply coupon
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

  -- 6. Derive payment status
  v_payment_status := CASE 
    WHEN UPPER(COALESCE(p_payment_method, 'COD')) IN ('RAZORPAY', 'UPI') AND p_razorpay_payment_id IS NOT NULL THEN 'paid'
    ELSE 'pending'
  END;

  -- 7. Generate order number
  v_order_number := 'ORD-' || UPPER(SUBSTR(ENCODE(gen_random_bytes(4), 'hex'), 1, 8));

  -- 8. Insert order
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
    UPPER(COALESCE(p_payment_method, 'COD')), v_payment_status, p_coupon_code,
    p_delivery_slot, p_delivery_date, p_notes, v_loyalty_earn,
    p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature,
    NULLIF(TRIM(COALESCE(p_idempotency_key, '')), '')
  ) RETURNING id INTO v_order_id;

  -- 9. Insert order items & execute atomic stock deduction & transaction log
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

    -- Insert item record
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
      -- Commit existing reservation: decrease physical stock and release reservation
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
      -- Direct purchase deduction
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

  -- 10. If reservation was supplied, mark it committed
  IF p_reservation_id IS NOT NULL THEN
    UPDATE inventory_reservations
    SET status = 'committed', order_id = v_order_id, updated_at = now()
    WHERE id = p_reservation_id;
  END IF;

  -- 11. Award loyalty points
  IF p_user_id IS NOT NULL AND v_loyalty_earn > 0 THEN
    UPDATE profiles
    SET loyalty_points = loyalty_points + v_loyalty_earn
    WHERE id = p_user_id;
  END IF;

  -- 12. Clear user cart
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

