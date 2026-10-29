-- =============================================================================
-- Migration: Order Cancellation, Product Return, and Seller/Admin Management
-- =============================================================================
-- 1. Extends order_items with item-level status, cancelled_at, delivered_at
-- 2. Extends return_requests with order_item_id, product_id, seller_id, request_type,
--    seller_notes, seller_status, rejection_reason, history, updated_at
-- 3. Adds cancel_order_item_atomic function for atomic inventory restoration
-- 4. Adds RLS policies for sellers to read and update their product return/cancellation requests
-- =============================================================================

-- 1. Extend order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 2. Extend return_requests table
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'return';
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS seller_notes text;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS seller_status text DEFAULT 'pending';
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_return_requests_item ON return_requests(order_item_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_seller ON return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_type ON return_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- 3. Atomic Order Item Cancellation Procedure
CREATE OR REPLACE FUNCTION cancel_order_item_atomic(
  p_order_item_id UUID,
  p_actor_id      UUID,
  p_reason        TEXT DEFAULT 'Cancelled',
  p_request_id    UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item          RECORD;
  v_order         RECORD;
  v_variant       RECORD;
  v_is_adm        BOOLEAN;
  v_is_seller     BOOLEAN := false;
  v_remaining     INTEGER;
BEGIN
  -- Verify actor admin status
  SELECT is_admin(p_actor_id) INTO v_is_adm;

  -- Lock and fetch order item
  SELECT oi.*, p.seller_id as prod_seller_id, p.created_by as prod_created_by
  INTO v_item
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.id = p_order_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item % not found', p_order_item_id;
  END IF;

  -- Fetch and lock parent order
  SELECT * INTO v_order
  FROM orders
  WHERE id = v_item.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', v_item.order_id;
  END IF;

  -- Verify authorization
  IF NOT v_is_adm AND (v_order.user_id IS NULL OR v_order.user_id <> p_actor_id) THEN
    SELECT EXISTS (
      SELECT 1 FROM sellers s
      WHERE (s.id = v_item.prod_seller_id OR s.id = v_item.seller_id) 
        AND (s.user_id = p_actor_id OR v_item.prod_created_by = p_actor_id::text)
    ) INTO v_is_seller;

    IF NOT v_is_seller THEN
      RAISE EXCEPTION 'Unauthorized to cancel this order item';
    END IF;
  END IF;

  -- Check if already cancelled (idempotent guard against double restock)
  IF v_item.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Item is already cancelled', 'order_item_id', p_order_item_id);
  END IF;

  IF v_item.status = 'delivered' THEN
    RAISE EXCEPTION 'Delivered items cannot be cancelled directly. Submit a return request.';
  END IF;

  -- Fetch variant and lock
  SELECT * INTO v_variant
  FROM product_variants
  WHERE id = v_item.variant_id
  FOR UPDATE;

  IF FOUND THEN
    -- Insert into inventory ledger
    INSERT INTO inventory_transactions (
      variant_id, product_id, order_id, change_type, quantity_change,
      stock_before, stock_after,
      reserved_before, reserved_after,
      available_before, available_after,
      actor_id, notes
    ) VALUES (
      v_variant.id, v_variant.product_id, v_item.order_id, 'item_cancellation', v_item.quantity,
      v_variant.stock, v_variant.stock + v_item.quantity,
      v_variant.reserved_quantity, v_variant.reserved_quantity,
      v_variant.available_quantity, v_variant.available_quantity + v_item.quantity,
      p_actor_id, COALESCE(p_reason, 'Item cancellation restock')
    );

    -- Restore stock
    UPDATE product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;
  END IF;

  -- Update order item status
  UPDATE order_items
  SET status = 'cancelled',
      cancelled_at = now()
  WHERE id = p_order_item_id;

  -- If linked request exists, approve and resolve it
  IF p_request_id IS NOT NULL THEN
    UPDATE return_requests
    SET status = 'approved',
        resolved_at = now(),
        updated_at = now(),
        history = COALESCE(history, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'action', 'approved',
            'actor_id', p_actor_id,
            'actor_type', CASE WHEN v_is_adm THEN 'admin' WHEN v_is_seller THEN 'seller' ELSE 'customer' END,
            'timestamp', now(),
            'notes', p_reason
          )
        )
    WHERE id = p_request_id;
  END IF;

  -- Check if all items in the order are now cancelled
  SELECT count(*) INTO v_remaining
  FROM order_items
  WHERE order_id = v_item.order_id AND status <> 'cancelled';

  IF v_remaining = 0 THEN
    UPDATE orders
    SET status = 'cancelled',
        notes = CASE WHEN notes IS NULL THEN 'All items cancelled: ' || p_reason ELSE notes || ' | All items cancelled: ' || p_reason END,
        updated_at = now()
    WHERE id = v_item.order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_item_id', p_order_item_id,
    'order_id', v_item.order_id,
    'status', 'cancelled',
    'all_cancelled', (v_remaining = 0)
  );
END;
$$;

-- 4. RLS Policies on return_requests for Sellers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Return requests: seller read'
  ) THEN
    CREATE POLICY "Return requests: seller read" ON return_requests
    FOR SELECT USING (
      seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM products p
        JOIN sellers s ON s.id = p.seller_id
        WHERE (p.id = return_requests.product_id OR EXISTS (
          SELECT 1 FROM order_items oi WHERE oi.id = return_requests.order_item_id AND oi.product_id = p.id
        )) AND (s.user_id = auth.uid() OR p.created_by = auth.uid()::text)
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Return requests: seller update'
  ) THEN
    CREATE POLICY "Return requests: seller update" ON return_requests
    FOR UPDATE USING (
      seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM products p
        JOIN sellers s ON s.id = p.seller_id
        WHERE (p.id = return_requests.product_id OR EXISTS (
          SELECT 1 FROM order_items oi WHERE oi.id = return_requests.order_item_id AND oi.product_id = p.id
        )) AND (s.user_id = auth.uid() OR p.created_by = auth.uid()::text)
      )
    );
  END IF;
END $$;
