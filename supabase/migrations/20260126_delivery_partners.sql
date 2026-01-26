-- Delivery Partners Monetization System
-- Created: 2026-01-26
-- Purpose: Store delivery partner configurations, track clicks, and manage revenue

-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Branding
  logo_url TEXT,
  icon_letter VARCHAR(2) DEFAULT 'I',
  brand_color VARCHAR(20) DEFAULT '#22C55E',

  -- Links & Integration
  base_url TEXT NOT NULL,
  deep_link_template TEXT,
  affiliate_base_url TEXT,
  affiliate_id VARCHAR(100),

  -- API Configuration (encrypted)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  api_endpoint TEXT,
  api_config JSONB DEFAULT '{}',

  -- Revenue
  commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat', 'per_order')),
  commission_rate DECIMAL(10,4) DEFAULT 0,
  flat_commission DECIMAL(10,2),

  -- Capabilities
  supports_deep_linking BOOLEAN DEFAULT FALSE,
  supports_cart_api BOOLEAN DEFAULT FALSE,
  supports_search_url BOOLEAN DEFAULT TRUE,
  requires_partnership BOOLEAN DEFAULT FALSE,

  -- Display
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  show_in_modal BOOLEAN DEFAULT TRUE,

  -- Retailer Matching (which stores this partner supports)
  supported_retailers JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Click Tracking Table
CREATE TABLE IF NOT EXISTS delivery_partner_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Attribution
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,

  -- Context
  store_name VARCHAR(255),
  store_retailer VARCHAR(100),
  store_address TEXT,

  -- Shopping List
  items_json JSONB,
  items_count INT,
  estimated_total DECIMAL(10,2),

  -- Link Generated
  generated_url TEXT,
  deep_link_used BOOLEAN DEFAULT FALSE,

  -- Revenue Tracking (snapshot at click time)
  commission_rate DECIMAL(10,4),
  estimated_commission DECIMAL(10,2),

  -- Conversion (updated later via webhook/callback)
  converted BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMPTZ,
  order_total DECIMAL(10,2),
  actual_commission DECIMAL(10,2),
  external_order_id VARCHAR(255),

  -- Metadata
  session_id VARCHAR(255),
  user_agent TEXT,
  referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_partners_active ON delivery_partners(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_slug ON delivery_partners(slug);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_user ON delivery_partner_clicks(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_partner ON delivery_partner_clicks(partner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_converted ON delivery_partner_clicks(converted, created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_delivery_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_partners_updated_at ON delivery_partners;
CREATE TRIGGER delivery_partners_updated_at
  BEFORE UPDATE ON delivery_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_partners_updated_at();

-- Insert default delivery partners (seed data)
INSERT INTO delivery_partners (
  name, slug, description, icon_letter, brand_color, base_url,
  deep_link_template, commission_type, commission_rate, flat_commission,
  supports_search_url, supported_retailers, sort_order, is_active
) VALUES
(
  'Instacart',
  'instacart',
  'Delivery in as fast as 1 hour',
  'I',
  '#FF6B00',
  'https://www.instacart.com',
  'https://www.instacart.com/store/{retailer}/storefront?search={search}',
  'per_order',
  0,
  10.00,
  TRUE,
  '["kroger", "safeway", "publix", "costco", "aldi", "cvs", "walgreens"]',
  1,
  TRUE
),
(
  'Shipt',
  'shipt',
  'Same-day delivery from local stores',
  'S',
  '#00B140',
  'https://www.shipt.com',
  'https://www.shipt.com/search?q={search}',
  'per_order',
  0,
  10.00,
  TRUE,
  '["target", "meijer", "heb", "kroger"]',
  2,
  TRUE
),
(
  'DoorDash',
  'doordash',
  'Fast delivery from nearby stores',
  'D',
  '#FF3008',
  'https://www.doordash.com',
  'https://www.doordash.com/convenience/',
  'percentage',
  0.05,
  NULL,
  FALSE,
  '["walgreens", "cvs", "7-eleven"]',
  3,
  TRUE
),
(
  'Walmart Grocery',
  'walmart',
  'Delivery & pickup available',
  'W',
  '#0071DC',
  'https://www.walmart.com/grocery',
  'https://www.walmart.com/search?q={search}&cat_id=976759',
  'percentage',
  0.04,
  NULL,
  TRUE,
  '["walmart"]',
  4,
  TRUE
),
(
  'Amazon Fresh',
  'amazon',
  'Free delivery with Prime',
  'A',
  '#FF9900',
  'https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo',
  'https://www.amazon.com/s?k={search}&i=amazonfresh',
  'percentage',
  0.03,
  NULL,
  TRUE,
  '["amazon", "whole-foods"]',
  5,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  deep_link_template = EXCLUDED.deep_link_template,
  updated_at = NOW();

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON delivery_partners TO authenticated;
-- GRANT ALL ON delivery_partner_clicks TO authenticated;
