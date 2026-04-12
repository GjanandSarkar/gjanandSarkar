-- ============================================================================
-- ADD OTP TABLE TO EXISTING SUPABASE DATABASE
-- ============================================================================
-- Run this in your Supabase SQL Editor to create the OTP store table

-- ─────────────────────────────────────────────────────────────────────────
-- OTP_STORE TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_otp_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX idx_otp_verified ON otp_store(verified);
CREATE INDEX idx_otp_created ON otp_store(created_at);

-- Optional: Create a function to clean up expired OTPs periodically
-- Note: You may need to set up a cron job or trigger in Supabase

-- Allow public access to OTP endpoints (if needed)
-- ALTER TABLE otp_store ENABLE ROW LEVEL SECURITY;
