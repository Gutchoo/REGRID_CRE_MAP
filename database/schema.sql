-- ✅ Complete Supabase SQL Schema with Authentication and RLS
-- Ready to paste directly into Supabase SQL Editor

-- Create properties table with proper Supabase auth integration
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regrid_id TEXT, -- Regrid property ID for reference
  apn TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  geometry JSONB, -- GeoJSON polygon data for mapping
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  
  -- Rich property data from Regrid API
  year_built INTEGER,
  owner TEXT,
  last_sale_price DECIMAL(12, 2),
  sale_date DATE,
  county TEXT,
  qoz_status TEXT, -- Qualified Opportunity Zone status
  improvement_value DECIMAL(12, 2),
  land_value DECIMAL(12, 2),
  assessed_value DECIMAL(12, 2),
  
  property_data JSONB, -- Store full Regrid API response
  user_notes TEXT,
  tags TEXT[],
  insurance_provider TEXT,
  maintenance_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔒 Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 🛡️ Create RLS Policies for user isolation
-- Users can only see and modify their own properties
CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

-- ⚡ Create trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 🔄 Apply the trigger to properties table
CREATE TRIGGER update_properties_updated_at 
BEFORE UPDATE ON properties 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 📈 Create indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_apn ON properties(apn);
CREATE INDEX idx_properties_address ON properties(address);
CREATE INDEX idx_properties_geometry ON properties USING GIN(geometry);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_county ON properties(county);
CREATE INDEX idx_properties_year_built ON properties(year_built);
CREATE INDEX idx_properties_owner ON properties(owner);
CREATE INDEX idx_properties_qoz_status ON properties(qoz_status);

-- 🔍 Address search helper function (with proper UUID handling)
CREATE OR REPLACE FUNCTION search_properties_by_address(search_term TEXT, user_id_param UUID)
RETURNS TABLE(id UUID, address TEXT, city TEXT, state TEXT, zip_code TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.address, p.city, p.state, p.zip_code
  FROM properties p
  WHERE p.user_id = user_id_param
    AND (
      p.address ILIKE '%' || search_term || '%' OR
      p.city ILIKE '%' || search_term || '%' OR
      p.zip_code ILIKE '%' || search_term || '%'
    )
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📊 Optional: Create a view for property statistics (respects RLS)
CREATE VIEW property_stats AS
SELECT 
  user_id,
  COUNT(*) as total_properties,
  COUNT(DISTINCT state) as states_count,
  COUNT(DISTINCT city) as cities_count,
  AVG(lat) as avg_latitude,
  AVG(lng) as avg_longitude
FROM properties
GROUP BY user_id;

-- 🔒 Enable RLS on the view
ALTER VIEW property_stats SET (security_invoker = on);

-- 🎯 Grant necessary permissions (these may already exist in Supabase)
-- Grant usage on auth schema (usually already granted)
-- GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Grant access to auth.users for foreign key (usually already granted)  
-- GRANT SELECT ON auth.users TO anon, authenticated;

-- ✅ Schema ready for Supabase!
-- This schema provides:
-- - Proper authentication integration with auth.users
-- - Row Level Security for user isolation  
-- - Efficient indexes for queries
-- - Trigger for automatic timestamp updates
-- - Helper functions for search
-- - Optional statistics view
-- - Ready for Mapbox integration with geometry field