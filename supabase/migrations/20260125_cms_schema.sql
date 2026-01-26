-- CMS Database Schema Migration for Julyu
-- This migration creates the CMS tables needed for the admin content management

-- ============================================
-- SITE SETTINGS TABLE
-- Stores global site configuration and page content
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
-- PAGE CONTENT TABLE
-- Stores metadata and content for each page
-- ============================================
CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug VARCHAR(100) UNIQUE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_page_content_slug ON page_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_content_published ON page_content(is_published);

-- ============================================
-- PAGE SECTIONS TABLE
-- Stores individual sections within a page
-- ============================================
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES page_content(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  section_title VARCHAR(255),
  content JSONB NOT NULL DEFAULT '{}',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_key ON page_sections(section_key);

-- ============================================
-- TESTIMONIALS TABLE
-- Stores customer testimonials
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255),
  author_location VARCHAR(255),
  author_image_url TEXT,
  quote TEXT NOT NULL,
  savings_amount DECIMAL(10, 2),
  rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);

-- ============================================
-- MEDIA LIBRARY TABLE
-- Stores uploaded images and files
-- ============================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  file_size INT,
  alt_text VARCHAR(255),
  width INT,
  height INT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);

-- ============================================
-- FEATURED STATS TABLE
-- Stores the animated stats shown on home page
-- ============================================
CREATE TABLE IF NOT EXISTS featured_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL,
  prefix VARCHAR(10),
  suffix VARCHAR(10),
  numeric_value DECIMAL(15, 2),
  display_order INT DEFAULT 0,
  is_animated BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all CMS tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_stats ENABLE ROW LEVEL SECURITY;

-- Public read access policies
DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read published pages" ON page_content;
CREATE POLICY "Public can read published pages"
  ON page_content FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Public can read visible sections" ON page_sections;
CREATE POLICY "Public can read visible sections"
  ON page_sections FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Public can read active testimonials" ON testimonials;
CREATE POLICY "Public can read active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active stats" ON featured_stats;
CREATE POLICY "Public can read active stats"
  ON featured_stats FOR SELECT
  USING (is_active = true);

-- Admin full access (using service role or admin metadata)
DROP POLICY IF EXISTS "Service role has full access to site_settings" ON site_settings;
CREATE POLICY "Service role has full access to site_settings"
  ON site_settings FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to page_content" ON page_content;
CREATE POLICY "Service role has full access to page_content"
  ON page_content FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to page_sections" ON page_sections;
CREATE POLICY "Service role has full access to page_sections"
  ON page_sections FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to testimonials" ON testimonials;
CREATE POLICY "Service role has full access to testimonials"
  ON testimonials FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to media_library" ON media_library;
CREATE POLICY "Service role has full access to media_library"
  ON media_library FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to featured_stats" ON featured_stats;
CREATE POLICY "Service role has full access to featured_stats"
  ON featured_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SEED DATA - Default content
-- ============================================

-- Insert default site settings
INSERT INTO site_settings (key, value, description)
VALUES
  ('site_name', '"Julyu"', 'The name of the website'),
  ('tagline', '"The Bloomberg Terminal for Grocery Consumers"', 'Main tagline'),
  ('support_email', '"support@julyu.com"', 'Support email address'),
  ('social_links', '{"twitter": "https://twitter.com/julyu", "facebook": "https://facebook.com/julyu", "instagram": "https://instagram.com/julyu"}', 'Social media links'),
  ('footer_text', '"AI-powered grocery intelligence that saves you hundreds monthly."', 'Footer description text')
ON CONFLICT (key) DO NOTHING;

-- Insert default home page
INSERT INTO page_content (page_slug, title, meta_description, is_published, published_at)
VALUES (
  'home',
  'Julyu - The Bloomberg Terminal for Grocery Consumers',
  'AI-powered grocery price comparison across 50+ retailers. Save $287/month with professional-grade tools.',
  true,
  NOW()
) ON CONFLICT (page_slug) DO NOTHING;

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
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS update_featured_stats_updated_at ON featured_stats;
CREATE TRIGGER update_featured_stats_updated_at
  BEFORE UPDATE ON featured_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
