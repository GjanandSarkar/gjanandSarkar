-- =============================================================================
-- Migration: 20261021_cod_payment_tracking.sql
-- Cash on Delivery (COD) Payment Tracking & Separate Payment / Order Statuses
-- =============================================================================

-- 1. Add COD confirmation audit columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cod_collected_amount numeric(10,2);

CREATE INDEX IF NOT EXISTS idx_orders_cod_payment 
  ON orders(payment_method, payment_status) WHERE payment_method = 'COD';

-- 2. Update advance_order_status:
-- CRITICAL REQUIREMENT: Delivering an order must NOT automatically mark its payment as Paid.
-- Payment status for COD orders remains 'pending' until explicitly confirmed by an authorized admin.
CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id uuid, 
  p_to text, 
  p_actor_role text, 
  p_actor_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  o orders%ROWTYPE; 
  ok boolean;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  ok := (o.status = 'pending'    AND p_to = 'confirmed')
     OR (o.status = 'confirmed'  AND p_to = 'processing')
     OR (o.status IN ('confirmed','processing') AND p_to = 'out_for_delivery')
     OR (o.status = 'out_for_delivery' AND p_to = 'delivered');
  IF NOT ok THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  -- Update order fulfillment status WITHOUT auto-marking COD as paid.
  -- Cash collection must be verified through the authorized collection and reconciliation workflow.
  UPDATE orders SET 
    status = p_to, 
    updated_at = now(),
    out_for_delivery_at = CASE WHEN p_to = 'out_for_delivery' THEN now() ELSE out_for_delivery_at END,
    delivered_at = CASE WHEN p_to = 'delivered' THEN now() ELSE delivered_at END
  WHERE id = p_order_id;

  IF p_to = 'delivered' THEN
    UPDATE order_items 
    SET status = 'delivered', delivered_at = now()
    WHERE order_id = p_order_id AND status <> 'cancelled';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_events') THEN
    INSERT INTO status_events (entity_type, entity_id, from_status, to_status, actor_role, actor_id)
    VALUES ('order', p_order_id, o.status, p_to, p_actor_role, p_actor_id);
  END IF;

  RETURN jsonb_build_object('from', o.status, 'to', p_to, 'user_id', o.user_id, 'payment_status', o.payment_status);
END $$;

-- 3. Stored Procedure: confirm_cod_payment_atomic
-- Enforces row-locking, status independence, amount validation, and audit recording.
CREATE OR REPLACE FUNCTION confirm_cod_payment_atomic(
  p_order_id   uuid,
  p_admin_id   uuid,
  p_amount     numeric DEFAULT NULL,
  p_actor_role text DEFAULT 'admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o orders%ROWTYPE;
BEGIN
  -- Row lock: prevents race conditions and duplicate confirmations
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Must be a COD order
  IF UPPER(o.payment_method) <> 'COD' THEN
    RAISE EXCEPTION 'NOT_COD_ORDER';
  END IF;

  -- Cannot re-confirm an already paid order
  IF o.payment_status = 'paid' THEN
    RAISE EXCEPTION 'ALREADY_PAID';
  END IF;

  -- Cannot collect cash for a cancelled order
  IF o.status = 'cancelled' THEN
    RAISE EXCEPTION 'ORDER_CANCELLED';
  END IF;

  -- Eligibility check: order must be dispatched or delivered (cannot collect cash before goods are out)
  IF o.status NOT IN ('out_for_delivery', 'delivered') THEN
    RAISE EXCEPTION 'ORDER_NOT_DELIVERED';
  END IF;

  -- Amount verification: Do not allow recording an amount different from the actual order total
  IF p_amount IS NOT NULL AND p_amount <> o.total_amount THEN
    RAISE EXCEPTION 'AMOUNT_MISMATCH';
  END IF;

  -- Atomically record payment
  UPDATE orders SET
    payment_status = 'paid',
    payment_confirmed_at = now(),
    payment_confirmed_by = p_admin_id,
    cod_collected_amount = o.total_amount,
    updated_at = now()
  WHERE id = p_order_id;

  -- Insert status event audit record
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_events') THEN
    INSERT INTO status_events (entity_type, entity_id, from_status, to_status, actor_role, actor_id, note)
    VALUES (
      'order', 
      p_order_id, 
      'payment:pending', 
      'payment:paid', 
      p_actor_role, 
      p_admin_id, 
      'COD cash collection confirmed: ₹' || o.total_amount
    );
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'payment_status', 'paid',
    'amount', o.total_amount,
    'confirmed_at', now(),
    'confirmed_by', p_admin_id
  );
END $$;

-- Only service role can execute this atomic function
REVOKE ALL ON FUNCTION confirm_cod_payment_atomic(uuid, uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_cod_payment_atomic(uuid, uuid, numeric, text) TO service_role;
