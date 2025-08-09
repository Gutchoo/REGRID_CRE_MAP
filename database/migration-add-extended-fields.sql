-- Migration: Add Extended Regrid Data Fields
-- Run this migration on existing Supabase databases to add new columns

-- Add new columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS use_code TEXT,
ADD COLUMN IF NOT EXISTS use_description TEXT,
ADD COLUMN IF NOT EXISTS zoning TEXT,
ADD COLUMN IF NOT EXISTS zoning_description TEXT,
ADD COLUMN IF NOT EXISTS num_stories INTEGER,
ADD COLUMN IF NOT EXISTS num_units INTEGER,
ADD COLUMN IF NOT EXISTS num_rooms INTEGER,
ADD COLUMN IF NOT EXISTS subdivision TEXT,
ADD COLUMN IF NOT EXISTS lot_size_acres DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS lot_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS tax_year TEXT,
ADD COLUMN IF NOT EXISTS parcel_value_type TEXT,
ADD COLUMN IF NOT EXISTS census_tract TEXT,
ADD COLUMN IF NOT EXISTS census_block TEXT,
ADD COLUMN IF NOT EXISTS qoz_tract TEXT,
ADD COLUMN IF NOT EXISTS last_refresh_date DATE,
ADD COLUMN IF NOT EXISTS regrid_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS owner_mailing_address TEXT,
ADD COLUMN IF NOT EXISTS owner_mail_city TEXT,
ADD COLUMN IF NOT EXISTS owner_mail_state TEXT,
ADD COLUMN IF NOT EXISTS owner_mail_zip TEXT;

-- Add indexes for commonly queried new fields
CREATE INDEX IF NOT EXISTS idx_properties_zoning ON properties(zoning);
CREATE INDEX IF NOT EXISTS idx_properties_use_code ON properties(use_code);
CREATE INDEX IF NOT EXISTS idx_properties_subdivision ON properties(subdivision);
CREATE INDEX IF NOT EXISTS idx_properties_last_refresh_date ON properties(last_refresh_date);
CREATE INDEX IF NOT EXISTS idx_properties_census_tract ON properties(census_tract);

-- Add comment to track migration
COMMENT ON TABLE properties IS 'Extended with comprehensive Regrid API data fields - Migration completed';

-- Verify migration by showing new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
AND column_name IN (
  'use_code', 'use_description', 'zoning', 'zoning_description',
  'num_stories', 'num_units', 'num_rooms', 'subdivision',
  'lot_size_acres', 'lot_size_sqft', 'tax_year', 'parcel_value_type',
  'census_tract', 'census_block', 'qoz_tract',
  'last_refresh_date', 'regrid_updated_at',
  'owner_mailing_address', 'owner_mail_city', 'owner_mail_state', 'owner_mail_zip'
)
ORDER BY column_name;