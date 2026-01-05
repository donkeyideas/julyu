-- Julyu Database Schema
-- Based on complete specification document

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  location GEOGRAPHY(POINT),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  stripe_customer_id VARCHAR(255)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_stores INT DEFAULT 2,
  max_drive_time INT DEFAULT 20,
  time_value_per_hour DECIMAL(10,2) DEFAULT 15.00,
  dietary_restrictions JSONB DEFAULT '[]',
  preferred_retailers JSONB DEFAULT '[]',
  excluded_retailers JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{"price_alerts": true, "weekly_summary": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_preferences_user ON user_preferences(user_id);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  upc VARCHAR(20),
  size VARCHAR(100),
  unit VARCHAR(50),
  attributes JSONB DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_upc ON products(upc);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer VARCHAR(100) NOT NULL,
  store_number VARCHAR(50),
  name VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  location GEOGRAPHY(POINT),
  phone VARCHAR(20),
  hours JSONB,
  services JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stores_retailer ON stores(retailer);
CREATE INDEX idx_stores_location ON stores USING GIST(location);
CREATE INDEX idx_stores_zip ON stores(zip);

-- Prices table
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source VARCHAR(50),
  confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  verified_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_store ON prices(store_id);
CREATE INDEX idx_prices_effective ON prices(effective_date);
CREATE INDEX idx_prices_product_store ON prices(product_id, store_id);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50)
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at);

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  image_url TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  purchase_date TIMESTAMPTZ,
  ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'complete', 'failed')),
  ocr_result JSONB,
  ocr_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_status ON receipts(ocr_status);
CREATE INDEX idx_receipts_date ON receipts(purchase_date);

-- Shopping lists
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'Shopping List',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,
  is_template BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_lists_updated ON shopping_lists(updated_at);

-- List items
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_input TEXT NOT NULL,
  matched_product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(50),
  match_confidence DECIMAL(3,2),
  alternative_matches JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_list_items_list ON list_items(list_id);
CREATE INDEX idx_list_items_product ON list_items(matched_product_id);

-- Comparisons
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  results JSONB NOT NULL,
  best_option JSONB,
  alternatives JSONB DEFAULT '[]',
  total_savings DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX idx_comparisons_list ON comparisons(list_id);
CREATE INDEX idx_comparisons_expires ON comparisons(expires_at);

-- Price alerts
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  target_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_alerts_active ON price_alerts(is_active);

-- Partner retailers
CREATE TABLE partner_retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_name VARCHAR(255) NOT NULL,
  api_type VARCHAR(50),
  api_credentials JSONB,
  revenue_share_percent DECIMAL(5,2),
  contract_start DATE,
  contract_end DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partners_active ON partner_retailers(is_active);

-- Affiliate transactions
CREATE TABLE affiliate_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  partner_id UUID REFERENCES partner_retailers(id),
  order_total DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  external_order_id VARCHAR(255)
);

CREATE INDEX idx_transactions_user ON affiliate_transactions(user_id);
CREATE INDEX idx_transactions_status ON affiliate_transactions(status);
CREATE INDEX idx_transactions_date ON affiliate_transactions(transaction_date);

-- User savings
CREATE TABLE user_savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_saved DECIMAL(10,2) DEFAULT 0,
  trips_count INT DEFAULT 0,
  avg_savings_per_trip DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX idx_savings_user ON user_savings(user_id);
CREATE INDEX idx_savings_month ON user_savings(month);

-- System metrics
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2),
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_metrics_recorded ON system_metrics(recorded_at);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_savings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - should be customized)
-- Users can only see their own data
CREATE POLICY users_own_preferences ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_lists ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_receipts ON receipts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_alerts ON price_alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_savings ON user_savings
  FOR ALL USING (auth.uid() = user_id);


