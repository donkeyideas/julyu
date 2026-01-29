-- Safe migration that checks for existing objects
-- Run this in Supabase SQL Editor

-- Create store_owners table if it doesn't exist
CREATE TABLE IF NOT EXISTS store_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) CHECK (business_type IN ('bodega', 'convenience', 'grocery', 'market')),
  tax_id VARCHAR(50),
  business_license VARCHAR(100),
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  application_status VARCHAR(20) DEFAULT 'pending' CHECK (
    application_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  approval_date TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  subscription_tier_id UUID,
  stripe_account_id VARCHAR(255),
  stripe_account_status VARCHAR(50),
  accepts_orders BOOLEAN DEFAULT TRUE,
  auto_accept_orders BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bodega_stores table if it doesn't exist
CREATE TABLE IF NOT EXISTS bodega_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_owner_id UUID REFERENCES store_owners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  hours JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  storefront_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bodega_inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS bodega_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bodega_store_id UUID REFERENCES bodega_stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku VARCHAR(100),
  stock_quantity INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  sale_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  custom_name VARCHAR(500),
  custom_brand VARCHAR(255),
  custom_size VARCHAR(100),
  custom_image_url TEXT,
  update_method VARCHAR(20) CHECK (update_method IN ('manual', 'receipt', 'pos', 'api')),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bodega_store_id, product_id)
);

-- Create POS integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS pos_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bodega_store_id UUID REFERENCES bodega_stores(id) ON DELETE CASCADE,
  pos_provider VARCHAR(50) CHECK (pos_provider IN ('square', 'clover', 'shopify', 'other')),
  api_key_encrypted TEXT,
  access_token_encrypted TEXT,
  merchant_id VARCHAR(255),
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INT DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bodega_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS bodega_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  bodega_store_id UUID REFERENCES bodega_stores(id),
  store_owner_id UUID REFERENCES store_owners(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  store_payout DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'delivery')),
  delivery_address TEXT,
  doordash_delivery_id VARCHAR(255),
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create commission_tiers table if it doesn't exist
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  commission_percentage DECIMAL(5,2) NOT NULL,
  min_monthly_orders INT DEFAULT 0,
  min_monthly_revenue DECIMAL(10,2) DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS store_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_owner_id UUID REFERENCES store_owners(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_orders INT DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  total_commissions DECIMAL(10,2) DEFAULT 0,
  net_payout DECIMAL(10,2) NOT NULL,
  stripe_payout_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES bodega_orders(id),
  doordash_delivery_id VARCHAR(255) UNIQUE,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'created',
  tracking_url TEXT,
  delivery_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (will skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_store_owners_user ON store_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_bodega_stores_owner ON bodega_stores(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_bodega_stores_zip ON bodega_stores(zip);
CREATE INDEX IF NOT EXISTS idx_bodega_inventory_store ON bodega_inventory(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_store ON bodega_orders(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_customer ON bodega_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_status ON bodega_orders(status, ordered_at);

-- Create RLS policies (drop first if exists)
DO $$ BEGIN
  -- Store owners policies
  DROP POLICY IF EXISTS "Store owners can read own data" ON store_owners;
  CREATE POLICY "Store owners can read own data" ON store_owners
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Store owners can update own data" ON store_owners;
  CREATE POLICY "Store owners can update own data" ON store_owners
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_payouts ENABLE ROW LEVEL SECURITY;

-- Insert default commission tier if none exist
INSERT INTO commission_tiers (name, description, commission_percentage, is_default, is_active)
SELECT 'Standard', 'Default commission tier for new stores', 15.00, true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_tiers WHERE is_default = true);
