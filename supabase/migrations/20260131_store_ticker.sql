-- Store Ticker: Displays partner/connected store logos on homepage
-- CMS-managed so admin can add/remove/reorder stores

CREATE TABLE IF NOT EXISTS store_ticker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_network TEXT,  -- For aggregators like Instacart
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial stores
INSERT INTO store_ticker (name, logo_url, display_order, is_active) VALUES
  ('Kroger', '/images/stores/kroger.png', 1, true),
  ('Walmart', '/images/stores/walmart.png', 2, true),
  ('Target', '/images/stores/target.png', 3, true),
  ('Costco', '/images/stores/costco.png', 4, true),
  ('Publix', '/images/stores/publix.png', 5, true),
  ('Safeway', '/images/stores/safeway.png', 6, true);

-- Enable RLS
ALTER TABLE store_ticker ENABLE ROW LEVEL SECURITY;

-- Public read access for active stores
CREATE POLICY "Public can view active stores" ON store_ticker
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage store ticker" ON store_ticker
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Index for efficient ordering
CREATE INDEX idx_store_ticker_display_order ON store_ticker(display_order);
CREATE INDEX idx_store_ticker_active ON store_ticker(is_active);
