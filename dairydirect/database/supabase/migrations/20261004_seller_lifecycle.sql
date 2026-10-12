-- ============================================================
-- Migration: Seller Lifecycle Management
-- Date: 2026-10-04
-- 
-- Adds seller lifecycle states (under_review, deactivated,
-- permanently_deactivated, reactivation_requested, rejected),
-- creates seller_status_history table for audit trail,
-- adds review tracking columns to sellers,
-- and updates RLS policies.
-- ============================================================

-- ─── 1. Alter sellers.status CHECK constraint ───────────────────────────────
-- Drop the existing CHECK constraint and replace with expanded values.
-- This preserves all existing data since we're only ADDING new values.
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_status_check;
ALTER TABLE sellers ADD CONSTRAINT sellers_status_check
  CHECK (status IN (
    'active',
    'pending',
    'pending_kyc',
    'pending_inquiry',
    'suspended',
    'under_review',
    'deactivated',
    'permanently_deactivated',
    'reactivation_requested',
    'rejected'
  ));

-- ─── 2. Add lifecycle tracking columns to sellers table ─────────────────────
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS review_expires_at TIMESTAMPTZ;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS reactivation_reason TEXT;

-- ─── 3. Create seller_status_history table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_status_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID        NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  previous_status   TEXT,
  new_status        TEXT,
  action            TEXT        NOT NULL,
  reason            TEXT,
  notes             TEXT,
  review_started_at TIMESTAMPTZ,
  review_expires_at TIMESTAMPTZ,
  changed_by        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB       DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_seller_status_history_seller_id
  ON seller_status_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_status_history_action
  ON seller_status_history(action);
CREATE INDEX IF NOT EXISTS idx_seller_status_history_changed_at
  ON seller_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_status_history_changed_by
  ON seller_status_history(changed_by);

-- ─── 4. RLS for seller_status_history ───────────────────────────────────────
ALTER TABLE seller_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "StatusHistory: admin all" ON seller_status_history;
CREATE POLICY "StatusHistory: admin all"
  ON seller_status_history FOR ALL USING (is_admin(auth.uid()));

-- Sellers can read their own history
DROP POLICY IF EXISTS "StatusHistory: seller read own" ON seller_status_history;
CREATE POLICY "StatusHistory: seller read own"
  ON seller_status_history FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_status_history.seller_id
        AND sellers.user_id = auth.uid()
    )
  );

-- Service role can insert (for API routes using admin client)
DROP POLICY IF EXISTS "StatusHistory: service insert" ON seller_status_history;
CREATE POLICY "StatusHistory: service insert"
  ON seller_status_history FOR INSERT WITH CHECK (true);

-- ─── 5. Grant permissions ───────────────────────────────────────────────────
GRANT ALL ON seller_status_history TO postgres, anon, authenticated, service_role;
