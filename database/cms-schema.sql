-- CMS Database Schema for Julyu
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PAGE CONTENT TABLE
-- Stores metadata and content for each page
-- ============================================
CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug VARCHAR(100) UNIQUE NOT NULL, -- 'home', 'features', 'pricing', 'about'
  title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_page_content_slug ON page_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_content_published ON page_content(is_published);

-- ============================================
-- PAGE SECTIONS TABLE
-- Stores individual sections within a page
-- ============================================
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES page_content(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL, -- 'hero', 'demo', 'features', 'testimonials', 'cta'
  section_title VARCHAR(255),
  content JSONB NOT NULL DEFAULT '{}',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, section_key)
);

-- Index for faster section lookups
CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_key ON page_sections(section_key);

-- ============================================
-- TESTIMONIALS TABLE
-- Stores customer testimonials
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255), -- e.g., "Busy Parent", "Budget Conscious Shopper"
  author_location VARCHAR(255), -- e.g., "Cincinnati, OH"
  author_image_url TEXT,
  quote TEXT NOT NULL,
  savings_amount DECIMAL(10, 2), -- Monthly savings amount
  rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster testimonial lookups
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);

-- ============================================
-- SITE SETTINGS TABLE
-- Stores global site configuration
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MEDIA LIBRARY TABLE
-- Stores uploaded images and files
-- ============================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50), -- 'image', 'document', 'video'
  mime_type VARCHAR(100),
  file_size INT, -- in bytes
  alt_text VARCHAR(255),
  width INT,
  height INT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for media lookups
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);

-- ============================================
-- FEATURED STATS TABLE
-- Stores the animated stats shown on home page
-- ============================================
CREATE TABLE IF NOT EXISTS featured_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key VARCHAR(50) UNIQUE NOT NULL, -- 'total_savings', 'active_users', 'avg_savings'
  label VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL, -- '$4.2M', '127K', '23%'
  prefix VARCHAR(10), -- '$', etc.
  suffix VARCHAR(10), -- 'M', 'K', '%', etc.
  numeric_value DECIMAL(15, 2), -- For calculations
  display_order INT DEFAULT 0,
  is_animated BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all CMS tables
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published pages"
  ON page_content FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can read visible sections"
  ON page_sections FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can read active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active stats"
  ON featured_stats FOR SELECT
  USING (is_active = true);

-- Admin full access (requires admin role in user metadata)
CREATE POLICY "Admins have full access to pages"
  ON page_content FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins have full access to sections"
  ON page_sections FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins have full access to testimonials"
  ON testimonials FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins have full access to settings"
  ON site_settings FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins have full access to media"
  ON media_library FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins have full access to stats"
  ON featured_stats FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- SEED DATA - Default content
-- ============================================

-- Insert default home page
INSERT INTO page_content (page_slug, title, meta_description, is_published, published_at)
VALUES (
  'home',
  'Julyu - The Bloomberg Terminal for Grocery Consumers',
  'AI-powered grocery price comparison across 50+ retailers. Save $287/month with professional-grade tools.',
  true,
  NOW()
) ON CONFLICT (page_slug) DO NOTHING;

-- Insert default home page sections
INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
SELECT
  id,
  'hero',
  'Hero Section',
  '{
    "headline": "The Bloomberg Terminal for Grocery Consumers",
    "subheadline": "AI-powered price intelligence across 50+ retailers. Save $287/month with professional-grade tools.",
    "cta_primary": {"text": "Start Saving Today", "href": "/auth/signup"},
    "cta_secondary": {"text": "Try Demo", "href": "#demo"}
  }'::jsonb,
  1,
  true
FROM page_content WHERE page_slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
SELECT
  id,
  'how_it_works',
  'How It Works',
  '{
    "title": "How Julyu Works",
    "subtitle": "Three simple steps to start saving hundreds on groceries",
    "steps": [
      {"number": 1, "title": "Scan Your Receipts", "description": "Take a photo of any grocery receipt. Our AI extracts items and prices automatically."},
      {"number": 2, "title": "We Track Prices", "description": "We monitor prices across 50+ retailers in real-time, finding the best deals for your items."},
      {"number": 3, "title": "Save Money", "description": "Get personalized recommendations on where to shop and save an average of $287/month."}
    ]
  }'::jsonb,
  2,
  true
FROM page_content WHERE page_slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
SELECT
  id,
  'features',
  'Features',
  '{
    "title": "Everything You Need to Save",
    "subtitle": "Professional-grade tools for the everyday shopper",
    "features": [
      {"icon": "camera", "title": "Receipt Scanning", "description": "AI-powered OCR extracts items and prices instantly", "color": "green"},
      {"icon": "bell", "title": "Price Alerts", "description": "Get notified when your favorite items go on sale", "color": "blue"},
      {"icon": "list", "title": "Smart Lists", "description": "Organize shopping lists with real-time price updates", "color": "purple"},
      {"icon": "chart", "title": "Price Comparison", "description": "Compare prices across 50+ retailers instantly", "color": "orange"},
      {"icon": "trending", "title": "Savings Analytics", "description": "Track your savings over time with detailed reports", "color": "pink"},
      {"icon": "map", "title": "Store Finder", "description": "Find the best prices at stores near you", "color": "cyan"}
    ]
  }'::jsonb,
  3,
  true
FROM page_content WHERE page_slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- Insert default testimonials
INSERT INTO testimonials (author_name, author_title, author_location, quote, savings_amount, rating, is_featured, display_order)
VALUES
  ('Sarah M.', 'Busy Parent', 'Cincinnati, OH', 'Julyu has completely changed how I shop for groceries. I save at least $50 every week just by knowing which store has the best prices for my regular items.', 217.00, 5, true, 1),
  ('Michael R.', 'Budget Conscious', 'Columbus, OH', 'The receipt scanning feature is incredible. I just snap a photo and it tracks all my spending automatically. Now I can see exactly where my money goes.', 342.00, 5, true, 2),
  ('Jennifer L.', 'Smart Shopper', 'Cleveland, OH', 'I was skeptical at first, but the price alerts have saved me so much money. I got notified when diapers went on sale and stocked up!', 189.00, 5, true, 3),
  ('David K.', 'Family of Five', 'Dayton, OH', 'With five kids, every dollar counts. Julyu helps me find the best deals and plan my shopping trips efficiently. Game changer!', 456.00, 5, true, 4)
ON CONFLICT DO NOTHING;

-- Insert default featured stats
INSERT INTO featured_stats (stat_key, label, value, prefix, suffix, numeric_value, display_order)
VALUES
  ('total_savings', 'Total Savings', '4.2', '$', 'M', 4200000, 1),
  ('active_users', 'Active Users', '127', '', 'K', 127000, 2),
  ('avg_savings', 'Avg. Savings', '23', '', '%', 23, 3),
  ('retailers', 'Retailers', '50', '', '+', 50, 4)
ON CONFLICT (stat_key) DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, description)
VALUES
  ('site_name', '"Julyu"', 'The name of the website'),
  ('tagline', '"The Bloomberg Terminal for Grocery Consumers"', 'Main tagline'),
  ('support_email', '"support@julyu.com"', 'Support email address'),
  ('social_links', '{"twitter": "https://twitter.com/julyu", "facebook": "https://facebook.com/julyu", "instagram": "https://instagram.com/julyu"}', 'Social media links'),
  ('footer_text', '"AI-powered grocery intelligence that saves you hundreds monthly."', 'Footer description text')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_page_content_updated_at ON page_content;
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page_sections_updated_at ON page_sections;
CREATE TRIGGER update_page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_featured_stats_updated_at ON featured_stats;
CREATE TRIGGER update_featured_stats_updated_at
  BEFORE UPDATE ON featured_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
