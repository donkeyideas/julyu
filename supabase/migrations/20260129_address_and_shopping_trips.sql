-- Add default address fields to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_zip_code VARCHAR(10) DEFAULT '';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_address TEXT DEFAULT '';

-- Shopping trips table (tracks "Shop Here" clicks from Compare Prices)
CREATE TABLE IF NOT EXISTS shopping_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  comparison_id UUID,
  store_name VARCHAR(255) NOT NULL,
  store_retailer VARCHAR(100),
  store_address TEXT,
  shopping_method VARCHAR(50) NOT NULL,
  delivery_partner VARCHAR(100),
  items_count INT DEFAULT 0,
  estimated_total DECIMAL(10,2) DEFAULT 0,
  estimated_savings DECIMAL(10,2) DEFAULT 0,
  items_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_trips_user ON shopping_trips(user_id, created_at);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
