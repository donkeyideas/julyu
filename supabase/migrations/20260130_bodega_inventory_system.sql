-- ============================================
-- Bodega Inventory System - Complete Database Schema
-- ============================================
-- This migration creates all tables needed for the bodega inventory and ordering system

-- ============================================
-- 1. STORE OWNER ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS store_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) CHECK (business_type IN ('bodega', 'convenience', 'grocery', 'market')) DEFAULT 'bodega',
  tax_id VARCHAR(50),
  business_license VARCHAR(100),
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),

  -- Application & Approval Status
  application_status VARCHAR(20) DEFAULT 'pending' CHECK (
    application_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  application_date TIMESTAMPTZ DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Pricing Model (Admin-Configurable)
  commission_rate DECIMAL(5,2) DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  subscription_tier_id UUID, -- Future: link to subscription plans
  custom_commission_rate DECIMAL(5,2), -- Admin override

  -- Stripe Connect for Payouts
  stripe_account_id VARCHAR(255),
  stripe_account_status VARCHAR(50),
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Store Settings
  accepts_orders BOOLEAN DEFAULT TRUE,
  auto_accept_orders BOOLEAN DEFAULT FALSE,
  order_notification_email VARCHAR(255),
  order_notification_phone VARCHAR(20),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE store_owners IS 'Store owner accounts for bodegas and local stores';
COMMENT ON COLUMN store_owners.commission_rate IS 'Commission percentage charged per order (default 15%)';
COMMENT ON COLUMN store_owners.stripe_account_id IS 'Stripe Connect account ID for receiving payouts';

-- ============================================
-- 2. BODEGA STORE LOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS bodega_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id UUID NOT NULL REFERENCES store_owners(id) ON DELETE CASCADE,

  -- Store Details
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10) NOT NULL,
  phone VARCHAR(20),

  -- Location (for distance calculation)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Operating Hours
  hours JSONB DEFAULT '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "9:00-18:00", "sunday": "10:00-16:00"}',
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Store Status
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,

  -- Images
  storefront_image_url TEXT,
  logo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bodega_stores IS 'Physical store locations owned by store_owners';
COMMENT ON COLUMN bodega_stores.hours IS 'Store operating hours in JSON format';
COMMENT ON COLUMN bodega_stores.verified IS 'Admin-verified store (shows verification badge)';

-- ============================================
-- 3. BODEGA INVENTORY
-- ============================================
CREATE TABLE IF NOT EXISTS bodega_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_store_id UUID NOT NULL REFERENCES bodega_stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), -- Links to existing products table

  -- Inventory Details
  sku VARCHAR(100), -- Store's internal SKU
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  in_stock BOOLEAN DEFAULT TRUE,
  low_stock_threshold INT DEFAULT 5,

  -- Pricing
  cost_price DECIMAL(10,2), -- What store paid (for their analytics)
  sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0), -- What they're selling for
  msrp DECIMAL(10,2), -- Manufacturer suggested retail price

  -- Custom Product Info (if not in main products table)
  custom_name VARCHAR(500),
  custom_brand VARCHAR(255),
  custom_size VARCHAR(100),
  custom_image_url TEXT,
  custom_category VARCHAR(100),

  -- Inventory Management
  last_restocked_at TIMESTAMPTZ,
  restock_frequency_days INT,
  auto_reorder BOOLEAN DEFAULT FALSE,

  -- Metadata
  update_method VARCHAR(20) CHECK (update_method IN ('manual', 'receipt', 'pos', 'api')) DEFAULT 'manual',
  last_updated_by UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bodega_store_id, product_id),
  UNIQUE(bodega_store_id, sku)
);

COMMENT ON TABLE bodega_inventory IS 'Store inventory - products available at each bodega';
COMMENT ON COLUMN bodega_inventory.update_method IS 'How inventory was added: manual, receipt OCR, POS sync, or API';
COMMENT ON COLUMN bodega_inventory.custom_name IS 'Used when product not in main products table';

-- ============================================
-- 4. POS INTEGRATION CONFIGURATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS pos_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_store_id UUID NOT NULL REFERENCES bodega_stores(id) ON DELETE CASCADE,

  -- POS System
  pos_provider VARCHAR(50) CHECK (pos_provider IN ('square', 'clover', 'shopify', 'lightspeed', 'toast', 'other')) NOT NULL,

  -- API Configuration (encrypted)
  api_key_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  merchant_id VARCHAR(255),
  location_id VARCHAR(255),
  api_endpoint TEXT,

  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INT DEFAULT 60 CHECK (sync_frequency_minutes > 0),
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  sync_error_message TEXT,

  -- Field Mapping (JSONB for flexibility)
  field_mapping JSONB DEFAULT '{"price": "amount", "quantity": "stock", "sku": "item_id", "name": "item_name"}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bodega_store_id, pos_provider)
);

COMMENT ON TABLE pos_integrations IS 'POS system integrations (Square, Clover, etc.) for automatic inventory sync';
COMMENT ON COLUMN pos_integrations.field_mapping IS 'Maps POS system fields to our database fields';

-- ============================================
-- 5. CUSTOMER ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS bodega_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Parties
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bodega_store_id UUID REFERENCES bodega_stores(id) ON DELETE SET NULL,
  store_owner_id UUID REFERENCES store_owners(id) ON DELETE SET NULL,

  -- Order Details
  items JSONB NOT NULL, -- Array of {product_id, name, quantity, price, subtotal}
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  delivery_fee DECIMAL(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
  service_fee DECIMAL(10,2) DEFAULT 0 CHECK (service_fee >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),

  -- Commission Calculation
  commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
  store_payout DECIMAL(10,2) NOT NULL CHECK (store_payout >= 0), -- total - commission - delivery_fee

  -- Order Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')
  ),

  -- Delivery
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'delivery')) DEFAULT 'delivery',
  delivery_address TEXT,
  delivery_instructions TEXT,

  -- DoorDash Drive Integration
  doordash_delivery_id VARCHAR(255),
  doordash_status VARCHAR(50),
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  tracking_url TEXT,

  -- Timestamps
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Customer Info (denormalized for convenience)
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bodega_orders IS 'Customer orders from bodegas with delivery tracking';
COMMENT ON COLUMN bodega_orders.items IS 'JSONB array of order items with product details';
COMMENT ON COLUMN bodega_orders.store_payout IS 'Amount store receives after commission and fees';

-- ============================================
-- 6. COMMISSION TIERS (Admin-Configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Tier Criteria
  min_monthly_orders INT DEFAULT 0 CHECK (min_monthly_orders >= 0),
  min_monthly_revenue DECIMAL(10,2) DEFAULT 0 CHECK (min_monthly_revenue >= 0),

  -- Commission Rates
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  delivery_fee_split DECIMAL(5,2) DEFAULT 0 CHECK (delivery_fee_split >= 0 AND delivery_fee_split <= 100), -- % of delivery fee store keeps

  -- Benefits
  features JSONB DEFAULT '[]', -- e.g., ["priority_placement", "featured_badge", "analytics_premium"]

  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE commission_tiers IS 'Admin-configurable commission tiers for store owners';
COMMENT ON COLUMN commission_tiers.features IS 'JSONB array of features included in this tier';

-- ============================================
-- 7. STORE PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS store_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id UUID REFERENCES store_owners(id) ON DELETE SET NULL,

  -- Payout Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Financial Summary
  total_orders INT DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0 CHECK (gross_revenue >= 0), -- Total order value
  total_commissions DECIMAL(10,2) DEFAULT 0 CHECK (total_commissions >= 0),
  total_delivery_fees DECIMAL(10,2) DEFAULT 0 CHECK (total_delivery_fees >= 0),
  net_payout DECIMAL(10,2) NOT NULL CHECK (net_payout >= 0), -- What store receives

  -- Orders Included
  order_ids JSONB DEFAULT '[]', -- Array of order IDs included in payout

  -- Stripe Connect Payout
  stripe_payout_id VARCHAR(255),
  stripe_status VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'paid', 'failed')
  ),
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE store_payouts IS 'Periodic payouts to store owners via Stripe Connect';
COMMENT ON COLUMN store_payouts.net_payout IS 'Amount transferred to store owner (gross - commissions - fees)';

-- ============================================
-- 8. DOORDASH DELIVERY JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES bodega_orders(id) ON DELETE SET NULL,

  -- DoorDash Details
  doordash_delivery_id VARCHAR(255) UNIQUE,
  external_delivery_id VARCHAR(255), -- Our reference

  -- Pickup
  pickup_address TEXT NOT NULL,
  pickup_business_name VARCHAR(255),
  pickup_phone VARCHAR(20),
  pickup_instructions TEXT,
  pickup_time TIMESTAMPTZ,

  -- Dropoff
  dropoff_address TEXT NOT NULL,
  dropoff_business_name VARCHAR(255),
  dropoff_phone VARCHAR(20),
  dropoff_instructions TEXT,
  dropoff_time TIMESTAMPTZ,

  -- Driver
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  driver_location JSONB, -- {lat, lng, timestamp}

  -- Status
  status VARCHAR(50) DEFAULT 'created',
  tracking_url TEXT,

  -- Cost
  delivery_fee DECIMAL(10,2),
  tip_amount DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  doordash_quote JSONB,
  doordash_response JSONB,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE delivery_jobs IS 'DoorDash Drive delivery jobs for order fulfillment';
COMMENT ON COLUMN delivery_jobs.driver_location IS 'Real-time driver location for tracking';

-- ============================================
-- 9. STORE APPLICATIONS (Pre-Approval)
-- ============================================
CREATE TABLE IF NOT EXISTS store_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50),
  business_address TEXT NOT NULL,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  tax_id VARCHAR(50),

  -- Store Details
  store_name VARCHAR(255) NOT NULL,
  store_address TEXT NOT NULL,
  store_zip VARCHAR(10) NOT NULL,
  store_phone VARCHAR(20),
  estimated_inventory_size VARCHAR(20) CHECK (
    estimated_inventory_size IN ('small', 'medium', 'large')
  ),

  -- Integration Preferences
  has_pos_system BOOLEAN DEFAULT FALSE,
  pos_system_name VARCHAR(100),
  preferred_inventory_method VARCHAR(20),

  -- Documents
  business_license_url TEXT,
  tax_document_url TEXT,
  storefront_photos JSONB DEFAULT '[]',

  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'under_review', 'approved', 'rejected')
  ),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE store_applications IS 'Store owner applications before approval';
COMMENT ON COLUMN store_applications.preferred_inventory_method IS 'manual, receipt, or pos';

-- ============================================
-- 10. INVENTORY UPDATE LOG (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_inventory_id UUID REFERENCES bodega_inventory(id) ON DELETE SET NULL,
  bodega_store_id UUID NOT NULL REFERENCES bodega_stores(id) ON DELETE CASCADE,

  -- Update Details
  update_method VARCHAR(20) CHECK (update_method IN ('manual', 'receipt', 'pos', 'api')),
  updated_by UUID REFERENCES auth.users(id),

  -- Changes
  field_changed VARCHAR(50),
  old_value TEXT,
  new_value TEXT,

  -- Context
  source_receipt_id UUID REFERENCES receipts(id),
  pos_sync_batch_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_update_log IS 'Audit trail for all inventory changes';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Store Owners
CREATE INDEX IF NOT EXISTS idx_store_owners_user_id ON store_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_status ON store_owners(application_status);
CREATE INDEX IF NOT EXISTS idx_store_owners_stripe ON store_owners(stripe_account_id);

-- Bodega Stores
CREATE INDEX IF NOT EXISTS idx_bodega_stores_owner ON bodega_stores(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_bodega_stores_zip ON bodega_stores(zip);
CREATE INDEX IF NOT EXISTS idx_bodega_stores_active ON bodega_stores(is_active, verified);
CREATE INDEX IF NOT EXISTS idx_bodega_stores_location ON bodega_stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Bodega Inventory
CREATE INDEX IF NOT EXISTS idx_bodega_inventory_store ON bodega_inventory(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_bodega_inventory_product ON bodega_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_bodega_inventory_stock ON bodega_inventory(in_stock);
CREATE INDEX IF NOT EXISTS idx_bodega_inventory_sku ON bodega_inventory(sku);

-- POS Integrations
CREATE INDEX IF NOT EXISTS idx_pos_integrations_store ON pos_integrations(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_pos_integrations_active ON pos_integrations(is_active);

-- Bodega Orders
CREATE INDEX IF NOT EXISTS idx_bodega_orders_store ON bodega_orders(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_customer ON bodega_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_owner ON bodega_orders(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_status ON bodega_orders(status, ordered_at);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_date ON bodega_orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_bodega_orders_number ON bodega_orders(order_number);

-- Store Payouts
CREATE INDEX IF NOT EXISTS idx_store_payouts_owner ON store_payouts(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_payouts_period ON store_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_store_payouts_status ON store_payouts(status);

-- Delivery Jobs
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order ON delivery_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_doordash ON delivery_jobs(doordash_delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON delivery_jobs(status);

-- Store Applications
CREATE INDEX IF NOT EXISTS idx_store_applications_user ON store_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_store_applications_status ON store_applications(status);

-- Inventory Update Log
CREATE INDEX IF NOT EXISTS idx_inventory_log_store ON inventory_update_log(bodega_store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_inventory ON inventory_update_log(bodega_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_date ON inventory_update_log(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodega_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_update_log ENABLE ROW LEVEL SECURITY;

-- Store Owners: Can only read/update their own data
CREATE POLICY "Store owners can read own data"
  ON store_owners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can update own data"
  ON store_owners FOR UPDATE
  USING (auth.uid() = user_id);

-- Bodega Stores: Owners can manage their stores
CREATE POLICY "Store owners can manage own stores"
  ON bodega_stores FOR ALL
  USING (
    store_owner_id IN (
      SELECT id FROM store_owners WHERE user_id = auth.uid()
    )
  );

-- Public can view active, verified stores (for customer search)
CREATE POLICY "Public can view active stores"
  ON bodega_stores FOR SELECT
  USING (is_active = TRUE AND verified = TRUE);

-- Bodega Inventory: Owners can manage their inventory
CREATE POLICY "Store owners can manage own inventory"
  ON bodega_inventory FOR ALL
  USING (
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE store_owner_id IN (
        SELECT id FROM store_owners WHERE user_id = auth.uid()
      )
    )
  );

-- Public can view inventory of active stores
CREATE POLICY "Public can view active store inventory"
  ON bodega_inventory FOR SELECT
  USING (
    in_stock = TRUE AND
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE is_active = TRUE AND verified = TRUE
    )
  );

-- POS Integrations: Only store owners can access
CREATE POLICY "Store owners can manage own POS integrations"
  ON pos_integrations FOR ALL
  USING (
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE store_owner_id IN (
        SELECT id FROM store_owners WHERE user_id = auth.uid()
      )
    )
  );

-- Bodega Orders: Customers and store owners can view their orders
CREATE POLICY "Customers can view own orders"
  ON bodega_orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Store owners can view store orders"
  ON bodega_orders FOR SELECT
  USING (
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE store_owner_id IN (
        SELECT id FROM store_owners WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Store owners can update store orders"
  ON bodega_orders FOR UPDATE
  USING (
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE store_owner_id IN (
        SELECT id FROM store_owners WHERE user_id = auth.uid()
      )
    )
  );

-- Commission Tiers: Public can read (for transparency)
CREATE POLICY "Public can view commission tiers"
  ON commission_tiers FOR SELECT
  USING (is_active = TRUE);

-- Store Payouts: Owners can view their own payouts
CREATE POLICY "Store owners can view own payouts"
  ON store_payouts FOR SELECT
  USING (
    store_owner_id IN (
      SELECT id FROM store_owners WHERE user_id = auth.uid()
    )
  );

-- Delivery Jobs: Customers and stores can view related deliveries
CREATE POLICY "Users can view related deliveries"
  ON delivery_jobs FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM bodega_orders WHERE customer_id = auth.uid()
      UNION
      SELECT id FROM bodega_orders WHERE bodega_store_id IN (
        SELECT id FROM bodega_stores WHERE store_owner_id IN (
          SELECT id FROM store_owners WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Store Applications: Users can manage their own applications
CREATE POLICY "Users can manage own applications"
  ON store_applications FOR ALL
  USING (auth.uid() = user_id);

-- Inventory Update Log: Store owners can view their logs
CREATE POLICY "Store owners can view own inventory logs"
  ON inventory_update_log FOR SELECT
  USING (
    bodega_store_id IN (
      SELECT id FROM bodega_stores WHERE store_owner_id IN (
        SELECT id FROM store_owners WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- SEED DATA: DEFAULT COMMISSION TIERS
-- ============================================
INSERT INTO commission_tiers (name, description, commission_percentage, min_monthly_orders, min_monthly_revenue, features, is_default, sort_order) VALUES
('Default', 'Standard commission tier for new stores', 15.00, 0, 0, '["basic_analytics", "email_support"]', TRUE, 1),
('Silver', 'Reduced commission for growing stores', 12.00, 50, 5000, '["basic_analytics", "email_support", "priority_support"]', FALSE, 2),
('Gold', 'Premium tier for high-volume stores', 10.00, 100, 10000, '["premium_analytics", "priority_support", "featured_badge", "priority_placement"]', FALSE, 3),
('Platinum', 'Best rates for top performing stores', 8.00, 200, 20000, '["premium_analytics", "dedicated_support", "featured_badge", "priority_placement", "custom_branding"]', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 3959; -- Earth's radius in miles
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);

  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance in miles between two coordinates using Haversine formula';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_store_owners_updated_at BEFORE UPDATE ON store_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bodega_stores_updated_at BEFORE UPDATE ON bodega_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bodega_inventory_updated_at BEFORE UPDATE ON bodega_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_integrations_updated_at BEFORE UPDATE ON pos_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bodega_orders_updated_at BEFORE UPDATE ON bodega_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_tiers_updated_at BEFORE UPDATE ON commission_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_payouts_updated_at BEFORE UPDATE ON store_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_jobs_updated_at BEFORE UPDATE ON delivery_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_applications_updated_at BEFORE UPDATE ON store_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration creates a complete bodega inventory and ordering system with:
-- - Store owner accounts and authentication
-- - Bodega store locations with geocoding
-- - Inventory management (manual, receipt OCR, POS sync)
-- - Customer orders with DoorDash delivery
-- - Admin-configurable commission tiers
-- - Stripe Connect payouts
-- - Comprehensive RLS policies
-- - Performance indexes
-- - Audit logging
