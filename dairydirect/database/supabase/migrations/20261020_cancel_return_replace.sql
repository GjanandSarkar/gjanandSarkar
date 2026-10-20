-- =============================================================================
-- Migration: 20261020_cancel_return_replace.sql
-- DairyDirect: Order Cancellation, Return & Replacement System
-- =============================================================================

-- 1) orders: lifecycle timestamps and cancel info
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS out_for_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- 2) business settings: policy windows
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS return_window_hours integer NOT NULL DEFAULT 168,
  ADD COLUMN IF NOT EXISTS replacement_window_hours integer NOT NULL DEFAULT 168;

-- 3) return_requests: drop old status CHECKs, migrate data, add new rules
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint
           WHERE conrelid = 'public.return_requests'::regclass AND contype = 'c'
             AND (pg_get_constraintdef(oid) ILIKE '%refunded%' OR pg_get_constraintdef(oid) ILIKE '%status%')
  LOOP EXECUTE format('ALTER TABLE public.return_requests DROP CONSTRAINT IF EXISTS %I', c.conname); END LOOP;
END $$;

UPDATE return_requests SET status = CASE status
  WHEN 'pending' THEN 'initiated' 
  WHEN 'submitted' THEN 'initiated'
  WHEN 'under_review' THEN 'initiated' 
  WHEN 'approved' THEN 'initiated'
  WHEN 'return_in_progress' THEN 'picked_up'
  WHEN 'item_received' THEN 'received' 
  WHEN 'inspection_completed' THEN 'received'
  WHEN 'refund_pending' THEN 'refund_initiated'
  ELSE status END;

ALTER TABLE return_requests
  ADD CONSTRAINT return_requests_status_chk CHECK (status IN
    ('initiated','picked_up','received','refund_initiated','refunded','completed','rejected')),
  ADD COLUMN IF NOT EXISTS pickup_address_id uuid REFERENCES user_addresses(id),
  ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_initiated_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS replacement_tracking_no text,
  ADD COLUMN IF NOT EXISTS replacement_dispatched_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.return_requests'::regclass AND conname = 'return_requests_type_chk'
  ) THEN
    ALTER TABLE return_requests ADD CONSTRAINT return_requests_type_chk CHECK (request_type IN ('return','replacement'));
  END IF;
END $$;

ALTER TABLE return_requests ALTER COLUMN status SET DEFAULT 'initiated';

-- One active return/replacement request per order item
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_request_per_item
  ON return_requests(order_item_id) WHERE status NOT IN ('refunded','completed','rejected');

-- 4) status timeline for all status bars
CREATE TABLE IF NOT EXISTS status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('order','return','replacement')),
  entity_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('customer','seller','admin','system')),
  actor_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_events_entity ON status_events(entity_type, entity_id, created_at);

-- 5) refunds (partial refunds, COD manual refunds, Razorpay tracking)
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_request_id uuid REFERENCES return_requests(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('razorpay','manual_upi')),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','completed','failed')),
  razorpay_refund_id text UNIQUE,
  destination jsonb,                -- COD: { upi_id } from profiles.default_upi_id
  failure_reason text,
  speed_requested text NOT NULL DEFAULT 'normal',
  speed_processed text,
  razorpay_payment_id text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_per_request ON refunds(return_request_id) WHERE return_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_per_cancel ON refunds(order_id) WHERE return_request_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_pending ON refunds(status, created_at) WHERE status = 'initiated';

-- 6) inventory: allow replacement movements
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint
           WHERE conrelid = 'public.inventory_transactions'::regclass AND contype = 'c'
             AND (pg_get_constraintdef(oid) ILIKE '%reservation_committed%' OR pg_get_constraintdef(oid) ILIKE '%change_type%')
  LOOP EXECUTE format('ALTER TABLE public.inventory_transactions DROP CONSTRAINT %I', c.conname); END LOOP;
END $$;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_change_type_chk CHECK (change_type IN
  ('purchase','cancellation','item_cancellation','reservation_created','reservation_committed','reservation_released',
   'reservation_expired','seller_adjustment','restock','return','replacement'));

-- 7) Row Level Security for status_events and refunds
ALTER TABLE status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_status_events ON status_events;
CREATE POLICY own_status_events ON status_events FOR SELECT USING (
  (entity_type = 'order' AND EXISTS (SELECT 1 FROM orders o WHERE o.id = entity_id AND o.user_id = auth.uid()))
  OR (entity_type IN ('return','replacement') AND EXISTS (SELECT 1 FROM return_requests r WHERE r.id = entity_id AND r.user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','seller'))
);

DROP POLICY IF EXISTS own_refunds ON refunds;
CREATE POLICY own_refunds ON refunds FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 8) Atomic Order Cancellation Procedure
CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id uuid, 
  p_user_id uuid, 
  p_reason text, 
  p_actor_role text DEFAULT 'customer'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  o orders%ROWTYPE; 
  it record; 
  v_var product_variants%ROWTYPE;
  v_restock boolean;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF p_actor_role = 'customer' AND o.user_id <> p_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF o.status NOT IN ('pending','confirmed','processing','out_for_delivery') THEN
    RAISE EXCEPTION 'CANCEL_NOT_ALLOWED';
  END IF;

  v_restock := o.status IN ('pending','confirmed','processing');
  IF v_restock THEN
    FOR it IN SELECT * FROM order_items WHERE order_id = p_order_id AND variant_id IS NOT NULL LOOP
      SELECT * INTO v_var FROM product_variants WHERE id = it.variant_id FOR UPDATE;
      IF FOUND THEN
        UPDATE product_variants 
        SET stock = stock + it.quantity,
            available_quantity = available_quantity + it.quantity,
            version = version + 1
        WHERE id = it.variant_id;

        INSERT INTO inventory_transactions (
          variant_id, product_id, order_id, change_type, quantity_change,
          stock_before, stock_after,
          reserved_before, reserved_after,
          available_before, available_after,
          actor_id, notes
        ) VALUES (
          it.variant_id, it.product_id, p_order_id, 'cancellation', it.quantity,
          v_var.stock, v_var.stock + it.quantity,
          v_var.reserved_quantity, v_var.reserved_quantity,
          v_var.available_quantity, v_var.available_quantity + it.quantity,
          p_user_id, 'Order cancelled: ' || COALESCE(p_reason, '')
        );
      END IF;
    END LOOP;
  END IF;

  -- Reverse loyalty earned if any
  IF o.loyalty_earned > 0 AND o.user_id IS NOT NULL THEN
    UPDATE profiles 
    SET loyalty_points = GREATEST(0, loyalty_points - o.loyalty_earned)
    WHERE id = o.user_id;
  END IF;

  -- Decrement coupon used_count if coupon was applied
  IF o.coupon_code IS NOT NULL AND TRIM(o.coupon_code) <> '' THEN
    UPDATE coupons 
    SET used_count = GREATEST(0, used_count - 1)
    WHERE UPPER(code) = UPPER(TRIM(o.coupon_code));
  END IF;

  UPDATE order_items 
  SET status = 'cancelled', cancelled_at = now() 
  WHERE order_id = p_order_id AND status <> 'cancelled';

  UPDATE orders 
  SET status = 'cancelled', 
      cancelled_at = now(), 
      cancel_reason = p_reason,
      cancelled_by = p_actor_role, 
      updated_at = now() 
  WHERE id = p_order_id;

  INSERT INTO status_events (entity_type, entity_id, from_status, to_status, actor_role, actor_id, note)
  VALUES ('order', p_order_id, o.status, 'cancelled', p_actor_role, p_user_id, p_reason);

  RETURN jsonb_build_object(
    'order_id', p_order_id, 
    'previous_status', o.status,
    'refund_needed', (o.payment_status = 'paid'), 
    'restocked', v_restock, 
    'amount', o.total_amount
  );
END $$;

-- 9) Advance Order Status Procedure (Out for Delivery, Delivered)
CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id uuid, p_to text, p_actor_role text, p_actor_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  o orders%ROWTYPE; 
  ok boolean;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;   -- same lock as cancel
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  ok := (o.status = 'pending'    AND p_to = 'confirmed')
     OR (o.status = 'confirmed'  AND p_to = 'processing')
     OR (o.status IN ('confirmed','processing') AND p_to = 'out_for_delivery')
     OR (o.status = 'out_for_delivery' AND p_to = 'delivered');
  IF NOT ok THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  UPDATE orders SET 
    status = p_to, 
    updated_at = now(),
    out_for_delivery_at = CASE WHEN p_to = 'out_for_delivery' THEN now() ELSE out_for_delivery_at END,
    delivered_at = CASE WHEN p_to = 'delivered' THEN now() ELSE delivered_at END,
    payment_status = CASE WHEN p_to = 'delivered' AND payment_method = 'COD' THEN 'paid' ELSE payment_status END
  WHERE id = p_order_id;

  IF p_to = 'delivered' THEN      -- starts the return window per item
    UPDATE order_items 
    SET status = 'delivered', delivered_at = now()
    WHERE order_id = p_order_id AND status <> 'cancelled';
  END IF;

  INSERT INTO status_events (entity_type, entity_id, from_status, to_status, actor_role, actor_id)
  VALUES ('order', p_order_id, o.status, p_to, p_actor_role, p_actor_id);

  RETURN jsonb_build_object('from', o.status, 'to', p_to, 'user_id', o.user_id);
END $$;

-- 10) Consume Replacement Stock Procedure
CREATE OR REPLACE FUNCTION consume_replacement_stock(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  v record; 
  v_var product_variants%ROWTYPE;
BEGIN
  SELECT oi.variant_id, oi.product_id, oi.quantity, r.order_id INTO v
  FROM return_requests r JOIN order_items oi ON oi.id = r.order_item_id
  WHERE r.id = p_request_id AND r.request_type = 'replacement';
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;

  SELECT * INTO v_var FROM product_variants WHERE id = v.variant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_NOT_FOUND'; END IF;
  IF v_var.available_quantity < v.quantity OR v_var.stock < v.quantity THEN 
    RAISE EXCEPTION 'OUT_OF_STOCK'; 
  END IF;

  UPDATE product_variants 
  SET stock = stock - v.quantity,
      available_quantity = available_quantity - v.quantity,
      version = version + 1
  WHERE id = v.variant_id;

  INSERT INTO inventory_transactions (
    variant_id, product_id, order_id, change_type, quantity_change,
    stock_before, stock_after,
    reserved_before, reserved_after,
    available_before, available_after,
    notes
  ) VALUES (
    v.variant_id, v.product_id, v.order_id, 'replacement', -v.quantity,
    v_var.stock, v_var.stock - v.quantity,
    v_var.reserved_quantity, v_var.reserved_quantity,
    v_var.available_quantity, v_var.available_quantity - v.quantity,
    'Replacement dispatch item deduction'
  );
END $$;
