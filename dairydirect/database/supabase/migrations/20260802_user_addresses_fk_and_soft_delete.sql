-- Migration: Fix orders_address_id foreign key constraint & multi-default address cleanup

-- 1. Alter the foreign key constraint on orders table to ON DELETE SET NULL
-- This prevents the "violates foreign key constraint orders_address_id_fkey" error when deleting addresses
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_address_id_fkey;

ALTER TABLE orders
  ADD CONSTRAINT orders_address_id_fkey
  FOREIGN KEY (address_id)
  REFERENCES user_addresses(id)
  ON DELETE SET NULL;

-- 2. Add is_deleted column to user_addresses if not exists (for soft-delete support)
ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 3. Clean up multiple default addresses in database:
-- Ensures only the newest address per user has is_default = true, setting all other existing rows to is_default = false
WITH ranked_addresses AS (
  SELECT 
    id, 
    user_id, 
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY is_default DESC, updated_at DESC, created_at DESC) as rn
  FROM user_addresses
  WHERE is_default = true
)
UPDATE user_addresses
SET is_default = false
WHERE id IN (
  SELECT id FROM ranked_addresses WHERE rn > 1
);
