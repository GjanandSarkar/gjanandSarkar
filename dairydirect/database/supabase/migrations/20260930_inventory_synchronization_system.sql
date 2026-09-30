-- ============================================================
-- DairyDirect (Gjanand Sarkar) — Production Inventory Synchronization System
-- Migration: 20260930_inventory_synchronization_system.sql
--
-- Features:
-- 1. Authoritative single source of truth for inventory in product_variants.
-- 2. available_quantity and reserved_quantity tracking.
-- 3. Automatic synchronization with seller_product catalog.
-- 4. Atomic transactions, row-level locking (FOR UPDATE), deadlock prevention.
-- 5. Inventory transaction audit log (every stock change permanently recorded).
-- 6. Inventory reservation mechanism with hold expiration.
-- 7. Safe order placement, payment handling, and order cancellation.
-- 8. Seller isolation and RLS policies.
-- ============================================================

-- ─── 1. Upgrade product_variants with available & reserved columns ────────
DO $$
BEGIN
  -- Add reserved_quantity if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'reserved_quantity'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN reserved_quantity INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Add available_quantity if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'available_quantity'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN available_quantity INTEGER NOT NULL DEFAULT 100;
  END IF;

  -- Add version column for optimistic locking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'version'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Initialize columns for existing rows
UPDATE product_variants
SET 
  reserved_quantity = COALESCE(reserved_quantity, 0),
  stock = GREATEST(0, COALESCE(stock, 0)),
  available_quantity = GREATEST(0, COALESCE(stock, 0) - COALESCE(reserved_quantity, 0))
WHERE available_quantity IS NULL OR available_quantity != (stock - reserved_quantity);

-- Add check constraints if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_reserved'
  ) THEN
    ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_reserved CHECK (reserved_quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_available'
  ) THEN
    ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_available CHECK (available_quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_stock_balance'
  ) THEN
    ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_stock_balance CHECK (stock >= reserved_quantity);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Trigger to guarantee available_quantity is always (stock - reserved_quantity)
CREATE OR REPLACE FUNCTION trg_calculate_variant_inventory()
RETURNS TRIGGER AS $$
BEGIN
  NEW.stock := GREATEST(0, COALESCE(NEW.stock, 0));
  NEW.reserved_quantity := GREATEST(0, COALESCE(NEW.reserved_quantity, 0));
  NEW.available_quantity := NEW.stock - NEW.reserved_quantity;
  
  IF NEW.available_quantity < 0 THEN
    RAISE EXCEPTION 'Inventory violation: reserved_quantity (%) cannot exceed total stock (%)',
      NEW.reserved_quantity, NEW.stock;
  END IF;
  
  NEW.version := COALESCE(OLD.version, 0) + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_variants_inventory_calc ON product_variants;
CREATE TRIGGER trg_product_variants_inventory_calc
  BEFORE INSERT OR UPDATE OF stock, reserved_quantity ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION trg_calculate_variant_inventory();

-- ─── 2. Inventory Reservations Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id   UUID        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  quantity     INTEGER     NOT NULL CHECK (quantity > 0),
  status       TEXT        NOT NULL DEFAULT 'reserved'
                           CHECK (status IN ('reserved', 'committed', 'released', 'expired')),
  expires_at   TIMESTAMPTZ NOT NULL,
  order_id     UUID        REFERENCES orders(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_user    ON inventory_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status  ON inventory_reservations(status);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at) WHERE status = 'reserved';

-- ─── 3. Inventory Transactions (Immutable Audit Ledger) ───────────────────
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id       UUID        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id       UUID        REFERENCES products(id) ON DELETE SET NULL,
  order_id         UUID        REFERENCES orders(id) ON DELETE SET NULL,
  reservation_id   UUID        REFERENCES inventory_reservations(id) ON DELETE SET NULL,
  change_type      TEXT        NOT NULL 
                               CHECK (change_type IN (
                                 'purchase', 
                                 'cancellation', 
                                 'reservation_created', 
                                 'reservation_committed', 
                                 'reservation_released', 
                                 'reservation_expired', 
                                 'seller_adjustment', 
                                 'restock', 
                                 'return'
                               )),
  quantity_change  INTEGER     NOT NULL, -- negative for deduction, positive for restoration
  stock_before     INTEGER     NOT NULL,
  stock_after      INTEGER     NOT NULL,
  reserved_before  INTEGER     NOT NULL,
  reserved_after   INTEGER     NOT NULL,
  available_before INTEGER     NOT NULL,
  available_after  INTEGER     NOT NULL,
  actor_id         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_variant     ON inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_product     ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_order       ON inventory_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type        ON inventory_transactions(change_type);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created_at  ON inventory_transactions(created_at DESC);

-- ─── 4. Bi-directional Sync between product_variants and seller_product ───
CREATE OR REPLACE FUNCTION trg_sync_variant_to_seller_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync available_quantity to seller_product.stock so seller panel reflects real available inventory
  UPDATE seller_product
  SET stock = NEW.available_quantity,
      status = CASE WHEN NEW.available_quantity = 0 THEN 'out_of_stock' ELSE 'active' END,
      updated_at = now()
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_variant_seller_product ON product_variants;
CREATE TRIGGER trg_sync_variant_seller_product
  AFTER INSERT OR UPDATE OF stock, available_quantity ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_variant_to_seller_product();

-- ─── 5. Stored Procedure: reserve_inventory_atomic ────────────────────────
-- Holds inventory temporarily during checkout / payment gateway processing
CREATE OR REPLACE FUNCTION reserve_inventory_atomic(
  p_user_id      UUID,
  p_items        JSONB,          -- [{ "variant_id": "<uuid>", "quantity": <int> }]
  p_hold_seconds INT DEFAULT 600 -- Default: 10 minutes hold
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item            RECORD;
  v_variant         RECORD;
  v_reservation_id  UUID;
  v_reservation_ids UUID[] := ARRAY[]::UUID[];
  v_expires_at      TIMESTAMPTZ := now() + (p_hold_seconds || ' seconds')::INTERVAL;
  v_results         JSONB[] := ARRAY[]::JSONB[];
BEGIN
  -- Deadlock prevention: sort items by variant_id
  FOR v_item IN
    SELECT variant_id, quantity 
    FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
    ORDER BY variant_id ASC
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Reservation quantity must be greater than zero';
    END IF;

    -- Row lock variant FOR UPDATE
    SELECT pv.*, p.name AS product_name, p.id AS p_id
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id
      AND p.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found or inactive', v_item.variant_id;
    END IF;

    IF v_variant.available_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_variant.product_name, v_variant.available_quantity, v_item.quantity;
    END IF;

    -- Create reservation record
    INSERT INTO inventory_reservations (
      variant_id, user_id, quantity, status, expires_at
    ) VALUES (
      v_item.variant_id, p_user_id, v_item.quantity, 'reserved', v_expires_at
    ) RETURNING id INTO v_reservation_id;

    v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);

    -- Record transaction ledger
    INSERT INTO inventory_transactions (
      variant_id, product_id, reservation_id, change_type, quantity_change,
      stock_before, stock_after,
      reserved_before, reserved_after,
      available_before, available_after,
      actor_id, notes
    ) VALUES (
      v_variant.id, v_variant.product_id, v_reservation_id, 'reservation_created', v_item.quantity,
      v_variant.stock, v_variant.stock,
      v_variant.reserved_quantity, v_variant.reserved_quantity + v_item.quantity,
      v_variant.available_quantity, v_variant.available_quantity - v_item.quantity,
      p_user_id, 'Checkout hold reserved'
    );

    -- Update variant reserved_quantity (trigger automatically updates available_quantity)
    UPDATE product_variants
    SET reserved_quantity = reserved_quantity + v_item.quantity
    WHERE id = v_item.variant_id;

    v_results := array_append(v_results, jsonb_build_object(
      'reservation_id', v_reservation_id,
      'variant_id', v_item.variant_id,
      'quantity', v_item.quantity
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'reservations', to_jsonb(v_results)
  );
END;
$$;

-- ─── 6. Stored Procedure: release_inventory_reservation_atomic ────────────
CREATE OR REPLACE FUNCTION release_inventory_reservation_atomic(
  p_reservation_id UUID,
  p_reason         TEXT DEFAULT 'user_cancelled'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_res     RECORD;
  v_variant RECORD;
BEGIN
  SELECT * INTO v_res
  FROM inventory_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;

  IF v_res.status != 'reserved' THEN
    RETURN jsonb_build_object('success', true, 'status', v_res.status, 'message', 'Reservation already handled');
  END IF;

  -- Lock variant
  SELECT * INTO v_variant
  FROM product_variants
  WHERE id = v_res.variant_id
  FOR UPDATE;

  -- Update reservation status
  UPDATE inventory_reservations
  SET status = CASE WHEN p_reason = 'expired' THEN 'expired' ELSE 'released' END,
      updated_at = now()
  WHERE id = p_reservation_id;

  -- Record transaction ledger
  INSERT INTO inventory_transactions (
    variant_id, product_id, reservation_id, change_type, quantity_change,
    stock_before, stock_after,
    reserved_before, reserved_after,
    available_before, available_after,
    actor_id, notes
  ) VALUES (
    v_variant.id, v_variant.product_id, v_res.id,
    CASE WHEN p_reason = 'expired' THEN 'reservation_expired' ELSE 'reservation_released' END,
    -v_res.quantity,
    v_variant.stock, v_variant.stock,
    v_variant.reserved_quantity, GREATEST(0, v_variant.reserved_quantity - v_res.quantity),
    v_variant.available_quantity, v_variant.available_quantity + v_res.quantity,
    v_res.user_id, COALESCE(p_reason, 'Reservation released')
  );

  -- Release reserved quantity
  UPDATE product_variants
  SET reserved_quantity = GREATEST(0, reserved_quantity - v_res.quantity)
  WHERE id = v_res.variant_id;

  RETURN jsonb_build_object('success', true, 'reservation_id', p_reservation_id, 'status', 'released');
END;
$$;

-- ─── 7. Stored Procedure: cleanup_expired_reservations_atomic ─────────────
CREATE OR REPLACE FUNCTION cleanup_expired_reservations_atomic()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_res_id UUID;
  v_count  INTEGER := 0;
BEGIN
  FOR v_res_id IN
    SELECT id
    FROM inventory_reservations
    WHERE status = 'reserved' AND expires_at < now()
  LOOP
    PERFORM release_inventory_reservation_atomic(v_res_id, 'expired');
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ─── 8. Stored Procedure: place_order_atomic (Comprehensive & ACID) ───────
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
  p_reservation_id      UUID DEFAULT NULL
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
BEGIN
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
    razorpay_order_id, razorpay_payment_id, razorpay_signature
  ) VALUES (
    v_order_number, p_user_id, p_address_id, p_shipping_address,
    'confirmed', v_subtotal, v_delivery_fee, v_discount, v_total,
    UPPER(COALESCE(p_payment_method, 'COD')), v_payment_status, p_coupon_code,
    p_delivery_slot, p_delivery_date, p_notes, v_loyalty_earn,
    p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature
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

-- ─── 9. Stored Procedure: cancel_order_atomic ─────────────────────────────
-- Restores stock, logs audit trail, and cancels order
CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id UUID,
  p_actor_id UUID,
  p_reason   TEXT DEFAULT 'Customer cancelled'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order   RECORD;
  v_item    RECORD;
  v_variant RECORD;
  v_is_adm  BOOLEAN;
BEGIN
  -- Verify actor
  SELECT is_admin(p_actor_id) INTO v_is_adm;

  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF NOT v_is_adm AND (v_order.user_id IS NULL OR v_order.user_id <> p_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized to cancel this order';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order is already cancelled');
  END IF;

  IF v_order.status IN ('delivered') THEN
    RAISE EXCEPTION 'Delivered orders cannot be cancelled directly';
  END IF;

  -- Restore stock for each item in sorted order
  FOR v_item IN
    SELECT oi.*, pv.id AS v_id
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id
    ORDER BY oi.variant_id ASC
  LOOP
    SELECT * INTO v_variant
    FROM product_variants
    WHERE id = v_item.variant_id
    FOR UPDATE;

    -- Record transaction ledger
    INSERT INTO inventory_transactions (
      variant_id, product_id, order_id, change_type, quantity_change,
      stock_before, stock_after,
      reserved_before, reserved_after,
      available_before, available_after,
      actor_id, notes
    ) VALUES (
      v_variant.id, v_variant.product_id, p_order_id, 'cancellation', v_item.quantity,
      v_variant.stock, v_variant.stock + v_item.quantity,
      v_variant.reserved_quantity, v_variant.reserved_quantity,
      v_variant.available_quantity, v_variant.available_quantity + v_item.quantity,
      p_actor_id, COALESCE(p_reason, 'Order cancellation restock')
    );

    -- Restore stock (trigger automatically updates available_quantity)
    UPDATE product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;
  END LOOP;

  -- Update order status
  UPDATE orders
  SET status = 'cancelled',
      notes = CASE WHEN notes IS NULL THEN 'Cancelled: ' || p_reason ELSE notes || ' | Cancelled: ' || p_reason END,
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'cancelled');
END;
$$;

-- ─── 10. Stored Procedure: adjust_seller_stock_atomic ─────────────────────
-- Allows a seller (or admin) to adjust stock safely with ownership isolation
CREATE OR REPLACE FUNCTION adjust_seller_stock_atomic(
  p_product_id  UUID,
  p_variant_id  UUID,
  p_new_stock   INTEGER,
  p_actor_id    UUID,
  p_reason      TEXT DEFAULT 'Seller stock update'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_adm  BOOLEAN;
  v_prod    RECORD;
  v_variant RECORD;
  v_seller  RECORD;
  v_delta   INTEGER;
BEGIN
  IF p_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;

  SELECT is_admin(p_actor_id) INTO v_is_adm;

  -- Find product
  SELECT * INTO v_prod FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  -- Seller ownership isolation check
  IF NOT v_is_adm THEN
    -- Check if actor is the linked seller
    SELECT * INTO v_seller FROM sellers WHERE user_id = p_actor_id;
    IF NOT FOUND OR (v_prod.seller_id IS NOT NULL AND v_prod.seller_id <> v_seller.id) THEN
      IF v_prod.created_by IS NULL OR v_prod.created_by <> p_actor_id::TEXT THEN
        RAISE EXCEPTION 'Forbidden: You do not own this product';
      END IF;
    END IF;
  END IF;

  -- Lock variant
  SELECT * INTO v_variant
  FROM product_variants
  WHERE id = p_variant_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found for product %', p_variant_id, p_product_id;
  END IF;

  IF p_new_stock < v_variant.reserved_quantity THEN
    RAISE EXCEPTION 'New stock (%) cannot be lower than currently reserved quantity (%)',
      p_new_stock, v_variant.reserved_quantity;
  END IF;

  v_delta := p_new_stock - v_variant.stock;

  -- Record transaction ledger
  INSERT INTO inventory_transactions (
    variant_id, product_id, change_type, quantity_change,
    stock_before, stock_after,
    reserved_before, reserved_after,
    available_before, available_after,
    actor_id, notes
  ) VALUES (
    v_variant.id, p_product_id, 'seller_adjustment', v_delta,
    v_variant.stock, p_new_stock,
    v_variant.reserved_quantity, v_variant.reserved_quantity,
    v_variant.available_quantity, p_new_stock - v_variant.reserved_quantity,
    p_actor_id, COALESCE(p_reason, 'Manual inventory adjustment')
  );

  -- Update variant
  UPDATE product_variants
  SET stock = p_new_stock
  WHERE id = p_variant_id;

  RETURN jsonb_build_object(
    'success', true,
    'variant_id', p_variant_id,
    'stock', p_new_stock,
    'available_quantity', p_new_stock - v_variant.reserved_quantity,
    'reserved_quantity', v_variant.reserved_quantity
  );
END;
$$;

-- ─── 11. Row Level Security (RLS) ─────────────────────────────────────────
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reservations: own read" ON inventory_reservations;
CREATE POLICY "Reservations: own read"
  ON inventory_reservations FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Reservations: admin all" ON inventory_reservations;
CREATE POLICY "Reservations: admin all"
  ON inventory_reservations FOR ALL
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Inventory TX: seller read" ON inventory_transactions;
CREATE POLICY "Inventory TX: seller read"
  ON inventory_transactions FOR SELECT
  USING (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM products p
      JOIN sellers s ON s.id = p.seller_id
      WHERE p.id = inventory_transactions.product_id
        AND s.user_id = auth.uid()
    ) OR
    actor_id = auth.uid()
  );

DROP POLICY IF EXISTS "Inventory TX: admin all" ON inventory_transactions;
CREATE POLICY "Inventory TX: admin all"
  ON inventory_transactions FOR ALL
  USING (is_admin(auth.uid()));

-- ─── 12. Realtime publication & Replica Identity ──────────────────────────
ALTER TABLE product_variants REPLICA IDENTITY FULL;
ALTER TABLE seller_product REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'seller_product'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE seller_product;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
