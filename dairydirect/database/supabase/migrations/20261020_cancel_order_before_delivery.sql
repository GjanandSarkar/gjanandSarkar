-- =============================================================================
-- Migration: 20261020_cancel_order_before_delivery.sql
-- Cancel Order Before Delivery (Atomic cancellation, conditional restock, refund trigger)
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancelled_at   timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason  text,
  ADD COLUMN IF NOT EXISTS cancelled_by   text;

-- Drop prior 3-argument overload if it existed to prevent overload resolution conflicts
DROP FUNCTION IF EXISTS cancel_order_atomic(uuid, uuid, text);

CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id   uuid,
  p_user_id    uuid,
  p_reason     text DEFAULT 'Cancelled by customer',
  p_actor_role text DEFAULT 'customer'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o         orders%ROWTYPE;
  it        record;
  v_var     product_variants%ROWTYPE;
  v_restock boolean;
BEGIN
  -- Row lock: a concurrent cancel or a Delivered update must wait for this transaction.
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;

  -- Unknown order and someone else's order look the same (no information leak).
  IF NOT FOUND OR (p_actor_role = 'customer' AND o.user_id <> p_user_id) THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Status is validated against the database value, never the client value.
  IF o.status NOT IN ('confirmed', 'out_for_delivery') THEN
    RAISE EXCEPTION 'CANCEL_NOT_ALLOWED:%', o.status;
  END IF;

  -- Confirmed: goods still in the warehouse, put stock back.
  -- Out for delivery: goods are with the courier, no automatic restock (perishables).
  v_restock := (o.status = 'confirmed');
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

  -- Seller and admin dashboards read these same rows, so they stay consistent.
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

  -- Status timeline record if status_events exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_events') THEN
    INSERT INTO status_events (entity_type, entity_id, from_status, to_status, actor_role, actor_id, note)
    VALUES ('order', p_order_id, o.status, 'cancelled', p_actor_role, p_user_id, p_reason);
  END IF;

  RETURN jsonb_build_object(
    'order_id',        p_order_id,
    'previous_status', o.status,
    'status',          'cancelled',
    'restocked',       v_restock,
    'refund_needed',   (o.payment_status = 'paid' AND o.payment_method <> 'COD'),
    'amount',          o.total_amount
  );
END $$;

-- Only the server (service role) may call it. Customers must use the API route.
REVOKE ALL ON FUNCTION cancel_order_atomic(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_order_atomic(uuid, uuid, text, text) TO service_role;
