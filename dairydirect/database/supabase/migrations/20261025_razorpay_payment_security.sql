-- ============================================================
-- Migration: 20261025_razorpay_payment_security
-- Purpose:   Store a server-side record of every Razorpay order
--            created via /api/payments/razorpay/create so that
--            /api/orders/place can verify:
--              (a) the razorpay_order_id was created for THIS user
--              (b) the expected amount matches the server-computed total
--            This prevents forged/replayed payment requests.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.razorpay_pending_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id   TEXT NOT NULL UNIQUE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expected_amount_paise BIGINT NOT NULL,          -- server-computed total × 100 (paise)
  currency            TEXT NOT NULL DEFAULT 'INR',
  coupon_code         TEXT,
  items_snapshot      JSONB,                       -- [{variantId, quantity}] for audit
  consumed            BOOLEAN NOT NULL DEFAULT FALSE, -- set TRUE when order is placed
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours'
);

-- Index for the payment-verify path
CREATE INDEX IF NOT EXISTS idx_razorpay_pending_orders_razorpay_order_id
  ON public.razorpay_pending_orders (razorpay_order_id);

-- Index for cleanup cron
CREATE INDEX IF NOT EXISTS idx_razorpay_pending_orders_expires_at
  ON public.razorpay_pending_orders (expires_at)
  WHERE consumed = FALSE;

-- RLS: users can only read their own pending orders; server-side (service role) writes
ALTER TABLE public.razorpay_pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pending orders"
  ON public.razorpay_pending_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access (used by API routes)
CREATE POLICY "Service role full access"
  ON public.razorpay_pending_orders
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Clean up expired unconsumed records automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_razorpay_pending_orders()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.razorpay_pending_orders
  WHERE consumed = FALSE AND expires_at < NOW();
$$;

COMMENT ON TABLE public.razorpay_pending_orders IS
  'Server-side record of Razorpay orders created by /api/payments/razorpay/create. '
  'Used by /api/orders/place to verify amount, currency and ownership before creating a paid order.';
