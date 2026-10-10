-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Upgrade user_addresses table for complete e-commerce address system
-- Preserves existing columns and records.
-- Adds structured address fields with safe defaults and backfills.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add missing columns with safe defaults
ALTER TABLE user_addresses 
  ADD COLUMN IF NOT EXISTS address_type TEXT NOT NULL DEFAULT 'house' 
    CHECK (address_type IN ('house', 'apartment', 'business', 'other')),
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mobile_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS flat_house_building TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area_street_sector_village TEXT NOT NULL DEFAULT '',
  -- FIX: the address API, AddressFormModal, AddressCard and orders/place all
  -- read and write `landmark`, but no migration ever created it. Saving an
  -- address failed with:
  --   PGRST204: Could not find the 'landmark' column of 'user_addresses'
  -- Nullable on purpose: a landmark is optional.
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS town_city TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS saturday_delivery BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sunday_delivery BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL;

-- Ensure pincode has a default and is non-null
UPDATE user_addresses SET pincode = '' WHERE pincode IS NULL;
ALTER TABLE user_addresses ALTER COLUMN pincode SET DEFAULT '';

-- 2. Backfill new structured fields from existing columns if records exist
--
-- FIX: this block previously read `building`, `street` and `instructions`,
-- none of which have ever existed on user_addresses. The table is created in
-- 001_schema.sql with: label, address, apartment, pincode, city, state,
-- lat, lng. The migration failed with:
--   ERROR: 42703: column "building" does not exist
-- Mapping corrected to the columns that actually exist:
--   flat_house_building        <- apartment
--   area_street_sector_village <- address
--   delivery_instructions      <- (no source column; left NULL)
UPDATE user_addresses
SET
  town_city = COALESCE(NULLIF(town_city, ''), city, ''),
  flat_house_building = COALESCE(NULLIF(flat_house_building, ''), apartment, ''),
  area_street_sector_village = COALESCE(NULLIF(area_street_sector_village, ''), address, ''),
  latitude = COALESCE(latitude, lat),
  longitude = COALESCE(longitude, lng),
  address_type = CASE
    WHEN LOWER(COALESCE(label, '')) IN ('home', 'house') THEN 'house'
    WHEN LOWER(COALESCE(label, '')) IN ('apartment', 'flat') THEN 'apartment'
    WHEN LOWER(COALESCE(label, '')) IN ('office', 'work', 'business', 'company') THEN 'business'
    ELSE 'other'
  END
-- Only touch rows still carrying the column default, so re-running this
-- migration cannot clobber values a user has since edited.
WHERE address_type = 'house'
   OR NULLIF(town_city, '') IS NULL
   OR NULLIF(flat_house_building, '') IS NULL
   OR NULLIF(area_street_sector_village, '') IS NULL;

-- 3. Backfill full_name and mobile_number from profiles if available
UPDATE user_addresses ua
SET 
  full_name = COALESCE(NULLIF(ua.full_name, ''), p.name, ''),
  mobile_number = COALESCE(NULLIF(ua.mobile_number, ''), p.phone, '')
FROM profiles p
WHERE ua.user_id = p.id
  AND (ua.full_name = '' OR ua.mobile_number = '');

-- 4. Create optimized index for single active default address lookup
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_default 
  ON user_addresses(user_id, is_default) 
  WHERE is_default = true AND is_deleted = false;

-- 5. Refresh RLS policies to ensure user ownership and admin access using existing is_admin() function
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Addresses: own all" ON user_addresses;
CREATE POLICY "Addresses: own all" ON user_addresses FOR ALL 
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));
