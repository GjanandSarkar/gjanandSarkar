-- ============================================================================
-- DairyDirect (Gjanand Sarkar) — OTP Table Schema
-- Idempotent & Safe for repeated execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_otp_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON otp_store(verified);
CREATE INDEX IF NOT EXISTS idx_otp_created ON otp_store(created_at);

-- Enable RLS & Safe Policy
ALTER TABLE otp_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can verify otp" ON otp_store;
CREATE POLICY "Public can verify otp" ON otp_store FOR ALL USING (true);
