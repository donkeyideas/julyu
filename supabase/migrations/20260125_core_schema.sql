-- Core Database Schema Migration for Julyu
-- This migration creates the core tables if they don't exist

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (if not using Supabase Auth directly)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  stripe_customer_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_stores INT DEFAULT 2,
  max_drive_time INT DEFAULT 20,
  time_value_per_hour DECIMAL(10,2) DEFAULT 15.00,
  dietary_restrictions JSONB DEFAULT '[]',
  preferred_retailers JSONB DEFAULT '[]',
  excluded_retailers JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{"price_alerts": true, "weekly_summary": true}',
  ai_features_enabled BOOLEAN DEFAULT TRUE,
  budget_monthly DECIMAL(10,2),
  favorite_stores JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
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

CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer VARCHAR(100) NOT NULL,
  store_number VARCHAR(50),
  name VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  hours JSONB,
  services JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_retailer ON stores(retailer);
CREATE INDEX IF NOT EXISTS idx_stores_zip ON stores(zip);

-- ============================================
-- PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prices (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_prices_effective ON prices(effective_date);
CREATE INDEX IF NOT EXISTS idx_prices_product_store ON prices(product_id, store_id);

-- ============================================
-- PRICE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- ============================================
-- RECEIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(ocr_status);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(purchase_date);

-- ============================================
-- SHOPPING LISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'Shopping List',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,
  is_template BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_updated ON shopping_lists(updated_at);

-- ============================================
-- LIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS list_items (
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

CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_product ON list_items(matched_product_id);

-- ============================================
-- COMPARISONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  results JSONB NOT NULL,
  best_option JSONB,
  alternatives JSONB DEFAULT '[]',
  total_savings DECIMAL(10,2),
  total_spent DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX IF NOT EXISTS idx_comparisons_list ON comparisons(list_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_expires ON comparisons(expires_at);
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id);

-- ============================================
-- PRICE ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  target_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  notification_sent_at TIMESTAMPTZ,
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(is_active);

-- ============================================
-- PARTNER RETAILERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_retailers (
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

CREATE INDEX IF NOT EXISTS idx_partners_active ON partner_retailers(is_active);

-- ============================================
-- AFFILIATE TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES partner_retailers(id),
  order_total DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  external_order_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON affiliate_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON affiliate_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON affiliate_transactions(transaction_date);

-- ============================================
-- USER SAVINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_saved DECIMAL(10,2) DEFAULT 0,
  trips_count INT DEFAULT 0,
  avg_savings_per_trip DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_savings_user ON user_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_month ON user_savings(month);

-- ============================================
-- AI MODEL CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_model_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  use_case VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  cost_per_1k_input DECIMAL(10, 6) DEFAULT 0,
  cost_per_1k_output DECIMAL(10, 6) DEFAULT 0,
  priority INT DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_config_use_case ON ai_model_config(use_case);
CREATE INDEX IF NOT EXISTS idx_ai_config_active ON ai_model_config(is_active);

-- ============================================
-- AI MODEL USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  use_case VARCHAR(100) NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  response_time_ms INT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_model_usage(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_use_case ON ai_model_usage(use_case);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_model_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_model_usage(user_id);

-- ============================================
-- AI TRAINING DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  use_case VARCHAR(100) NOT NULL,
  input_text TEXT NOT NULL,
  expected_output TEXT,
  actual_output TEXT,
  feedback VARCHAR(20) CHECK (feedback IN ('positive', 'negative', 'neutral')),
  user_id UUID REFERENCES auth.users(id),
  validated BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_use_case ON ai_training_data(use_case);
CREATE INDEX IF NOT EXISTS idx_training_feedback ON ai_training_data(feedback);
CREATE INDEX IF NOT EXISTS idx_training_validated ON ai_training_data(validated);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

-- User can read/write their own data
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own receipts" ON receipts;
CREATE POLICY "Users can manage own receipts"
  ON receipts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own lists" ON shopping_lists;
CREATE POLICY "Users can manage own lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own list items" ON list_items;
CREATE POLICY "Users can manage own list items"
  ON list_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = list_items.list_id
    AND shopping_lists.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage own comparisons" ON comparisons;
CREATE POLICY "Users can manage own comparisons"
  ON comparisons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own alerts" ON price_alerts;
CREATE POLICY "Users can manage own alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own savings" ON user_savings;
CREATE POLICY "Users can view own savings"
  ON user_savings FOR SELECT
  USING (auth.uid() = user_id);

-- Public read access for products, stores, prices
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read stores" ON stores;
CREATE POLICY "Public can read stores"
  ON stores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read prices" ON prices;
CREATE POLICY "Public can read prices"
  ON prices FOR SELECT
  USING (true);

-- Service role has full access for API routes
DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to stores" ON stores;
CREATE POLICY "Service role full access to stores"
  ON stores FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to prices" ON prices;
CREATE POLICY "Service role full access to prices"
  ON prices FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to ai_model_usage" ON ai_model_usage;
CREATE POLICY "Service role full access to ai_model_usage"
  ON ai_model_usage FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to ai_training_data" ON ai_training_data;
CREATE POLICY "Service role full access to ai_training_data"
  ON ai_training_data FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to user_savings" ON user_savings;
CREATE POLICY "Service role full access to user_savings"
  ON user_savings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SAMPLE DATA FOR DEMO
-- ============================================

-- Insert sample partner retailers
INSERT INTO partner_retailers (retailer_name, api_type, is_active)
VALUES
  ('Kroger', 'rest_api', true),
  ('Walmart', 'scrape', true),
  ('Target', 'rest_api', true),
  ('Costco', 'scrape', true),
  ('Instacart', 'rest_api', true)
ON CONFLICT DO NOTHING;

-- Insert sample AI model config
INSERT INTO ai_model_config (model_name, model_id, provider, use_case, is_active, cost_per_1k_input, cost_per_1k_output, priority)
VALUES
  ('DeepSeek Chat', 'deepseek-chat', 'DeepSeek', 'product_matching', true, 0.00014, 0.00028, 1),
  ('DeepSeek Chat', 'deepseek-chat', 'DeepSeek', 'assistant', true, 0.00014, 0.00028, 1),
  ('GPT-4 Vision', 'gpt-4o', 'OpenAI', 'receipt_ocr', true, 0.0025, 0.01, 1)
ON CONFLICT DO NOTHING;
