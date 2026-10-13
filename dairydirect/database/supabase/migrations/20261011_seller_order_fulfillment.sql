-- =============================================================================
-- Migration: Seller Order Fulfillment Workflow & Access
-- =============================================================================
-- 1. Updates cancel_order_atomic to authorize sellers for their own products.
-- 2. Adds RLS policies for sellers to view their orders and order items.
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_order_atomic(
  p_order_id UUID,
  p_actor_id UUID,
  p_reason   TEXT DEFAULT 'Customer cancelled'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order     RECORD;
  v_item      RECORD;
  v_variant   RECORD;
  v_is_adm    BOOLEAN;
  v_is_seller BOOLEAN := false;
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

  -- Check if actor is customer, admin, or the seller for items in this order
  IF NOT v_is_adm AND (v_order.user_id IS NULL OR v_order.user_id <> p_actor_id) THEN
    SELECT EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN sellers s ON s.id = p.seller_id
      WHERE oi.order_id = p_order_id AND (s.user_id = p_actor_id OR p.created_by = p_actor_id::text)
    ) INTO v_is_seller;

    IF NOT v_is_seller THEN
      RAISE EXCEPTION 'Unauthorized to cancel this order';
    END IF;
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

-- RLS Policies for Sellers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Orders: seller read'
  ) THEN
    CREATE POLICY "Orders: seller read" ON orders
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN sellers s ON s.id = p.seller_id
        WHERE oi.order_id = orders.id AND (s.user_id = auth.uid() OR p.created_by = auth.uid()::text)
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Order items: seller read'
  ) THEN
    CREATE POLICY "Order items: seller read" ON order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM products p
        JOIN sellers s ON s.id = p.seller_id
        WHERE p.id = order_items.product_id AND (s.user_id = auth.uid() OR p.created_by = auth.uid()::text)
      )
    );
  END IF;
END $$;
