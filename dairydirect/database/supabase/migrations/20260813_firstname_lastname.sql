-- ============================================================
-- Migration: Add first_name & last_name columns and backfill existing name data
-- Safe & Idempotent: Run directly in Supabase SQL Editor
-- ============================================================

-- 1. Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 3. Automatic Backfill for profiles table (Splits full name into first_name and last_name)
UPDATE profiles
SET first_name = split_part(trim(name), ' ', 1),
    last_name = CASE 
      WHEN position(' ' in trim(name)) > 0 
      THEN substring(trim(name) from position(' ' in trim(name)) + 1) 
      ELSE '' 
    END
WHERE (first_name IS NULL OR first_name = '') 
  AND name IS NOT NULL 
  AND name != '' 
  AND name !~ '[0-9]';

-- 4. Automatic Backfill for users table (Splits full name into first_name and last_name)
UPDATE users
SET first_name = split_part(trim(name), ' ', 1),
    last_name = CASE 
      WHEN position(' ' in trim(name)) > 0 
      THEN substring(trim(name) from position(' ' in trim(name)) + 1) 
      ELSE '' 
    END
WHERE (first_name IS NULL OR first_name = '') 
  AND name IS NOT NULL 
  AND name != '' 
  AND name !~ '[0-9]';
