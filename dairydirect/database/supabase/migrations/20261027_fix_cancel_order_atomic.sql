-- =============================================================================
-- Migration: 20261027_fix_cancel_order_atomic.sql
-- Fix cancel_order_atomic parameter compatibility & seller authorization
-- =============================================================================

-- Ensure cancelled audit columns exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancelled_at   timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason  text,
  ADD COLUMN IF NOT EXISTS cancelled_by   text;

-- 1. Main atomic cancellation function supporting pending, confirmed, out_for_delivery
CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id   uuid,
  p_user_id    uuid DEFAULT NULL,
  p_reason     text DEFAULT 'Cancelled',
  p_actor_role text DEFAULT 'customer',
  p_actor_id   uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o               orders%ROWTYPE;
  it              record;
  v_var           product_variants%ROWTYPE;
  v_actor         uuid;
  v_is_admin      boolean := false;
  v_is_seller     boolean := false;
  v_restock       boolean := true;
BEGIN
  -- Resolve actor ID from either p_user_id or p_actor_id
  v_actor := COALESCE(p_user_id, p_actor_id);

  -- Row lock: a concurrent status update must wait for this transaction
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- If already cancelled, return success idempotently
  IF o.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order is already cancelled', 'status', 'cancelled');
  END IF;

  -- Delivered orders cannot be cancelled
  IF o.status = 'delivered' THEN
    RAISE EXCEPTION 'CANCEL_NOT_ALLOWED:delivered';
  END IF;

  -- Only pending, confirmed, and out_for_delivery can be cancelled
  IF o.status NOT IN ('pending', 'confirmed', 'out_for_delivery') THEN
    RAISE EXCEPTION 'CANCEL_NOT_ALLOWED:%', o.status;
  END IF;

  -- Verify permissions:
  -- Admin role bypasses check
  IF p_actor_role = 'admin' THEN
    v_is_admin := true;
  ELSIF v_actor IS NOT NULL THEN
    -- Check if actor is platform admin in profiles
    SELECT EXISTS (
      SELECT 1 FROM profiles WHERE id = v_actor AND role = 'admin'
    ) INTO v_is_admin;
  END IF;

  IF NOT v_is_admin THEN
    -- Customer authorization: must be their own order
    IF p_actor_role = 'customer' AND o.user_id IS NOT NULL AND o.user_id <> v_actor THEN
      RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;

    -- Seller authorization: must own at least one product in this order
    IF p_actor_role = 'seller' THEN
      SELECT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN sellers s ON s.id = p.seller_id
        WHERE oi.order_id = p_order_id 
          AND (s.user_id = v_actor OR p.created_by = v_actor::text)
      ) INTO v_is_seller;

      -- If seller check via products failed, check seller_product table
      IF NOT v_is_seller THEN
        SELECT EXISTS (
          SELECT 1 FROM order_items oi
          JOIN seller_product sp ON sp.product_id = oi.product_id
          JOIN sellers s ON s.id = sp.seller_id
          WHERE oi.order_id = p_order_id
            AND (s.user_id = v_actor OR sp.seller_user_id = v_actor)
        ) INTO v_is_seller;
      END IF;

      -- Fallback: if actor is the customer themselves
      IF NOT v_is_seller AND (o.user_id IS NULL OR o.user_id <> v_actor) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_SELLER_CANCELLATION';
      END IF;
    END IF;
  END IF;

  -- Restock inventory for pending and confirmed orders (goods still in store/warehouse)
  v_restock := (o.status IN ('pending', 'confirmed'));

  IF v_restock THEN
    FOR it IN SELECT * FROM order_items WHERE order_id = p_order_id AND variant_id IS NOT NULL LOOP
      SELECT * INTO v_var FROM product_variants WHERE id = it.variant_id FOR UPDATE;
      IF FOUND THEN
        UPDATE product_variants 
        SET stock = stock + it.quantity,
            available_quantity = available_quantity + it.quantity,
            version = COALESCE(version, 0) + 1
        WHERE id = it.variant_id;

        -- Record inventory restoration transaction if table exists
        BEGIN
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
            v_actor, 'Order cancelled: ' || COALESCE(p_reason, '')
          );
        EXCEPTION WHEN OTHERS THEN
          -- Non-blocking log insertion failure
          NULL;
        END;
      END IF;
    END LOOP;
  END IF;

  -- Update order record
  UPDATE orders
  SET status = 'cancelled',
      cancelled_at = now(),
      cancel_reason = p_reason,
      cancelled_by = COALESCE(p_actor_role, 'system'),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'cancelled',
    'refund_needed', (o.payment_status = 'paid' OR o.payment_status = 'completed'),
    'amount', o.total_amount
  );
END;
$$;

-- 2. PostgREST 3-argument overload for backwards compatibility with { p_order_id, p_actor_id, p_reason }
CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id   uuid,
  p_actor_id   uuid,
  p_reason     text DEFAULT 'Cancelled'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN cancel_order_atomic(
    p_order_id   => p_order_id,
    p_user_id    => p_actor_id,
    p_reason     => p_reason,
    p_actor_role => 'seller',
    p_actor_id   => p_actor_id
  );
END;
$$;

-- Grant execution permissions to authenticated users and service_role
GRANT EXECUTE ON FUNCTION cancel_order_atomic(uuid, uuid, text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cancel_order_atomic(uuid, uuid, text) TO authenticated, service_role;
