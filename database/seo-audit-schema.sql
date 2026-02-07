-- ============================================
-- SEO AUDIT SYSTEM SCHEMA
-- Tables for tracking SEO/GEO audit results,
-- page scores, recommendations, and Search Console data
-- ============================================

-- ============================================
-- SEO AUDITS TABLE
-- Stores top-level audit run metadata and scores
-- ============================================
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INT NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  content_score INT NOT NULL CHECK (content_score >= 0 AND content_score <= 100),
  structured_data_score INT NOT NULL CHECK (structured_data_score >= 0 AND structured_data_score <= 100),
  performance_score INT NOT NULL CHECK (performance_score >= 0 AND performance_score <= 100),
  geo_score INT NOT NULL CHECK (geo_score >= 0 AND geo_score <= 100),
  total_issues INT DEFAULT 0,
  critical_issues INT DEFAULT 0,
  high_issues INT DEFAULT 0,
  medium_issues INT DEFAULT 0,
  low_issues INT DEFAULT 0,
  pages_audited INT DEFAULT 0,
  audit_duration_ms INT,
  triggered_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_created ON seo_audits(created_at DESC);

-- ============================================
-- SEO PAGE SCORES TABLE
-- Per-page audit results for each audit run
-- ============================================
CREATE TABLE IF NOT EXISTS seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
  page_path VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Meta tags
  has_title BOOLEAN DEFAULT false,
  title_length INT,
  title_value TEXT,
  has_description BOOLEAN DEFAULT false,
  description_length INT,
  description_value TEXT,
  has_og_title BOOLEAN DEFAULT false,
  has_og_description BOOLEAN DEFAULT false,
  has_og_image BOOLEAN DEFAULT false,
  has_twitter_card BOOLEAN DEFAULT false,
  has_canonical BOOLEAN DEFAULT false,
  canonical_value TEXT,

  -- Content analysis
  word_count INT DEFAULT 0,
  h1_count INT DEFAULT 0,
  h2_count INT DEFAULT 0,
  h3_count INT DEFAULT 0,
  h1_values TEXT[],
  img_count INT DEFAULT 0,
  img_with_alt INT DEFAULT 0,
  internal_links INT DEFAULT 0,
  external_links INT DEFAULT 0,

  -- Structured data
  has_json_ld BOOLEAN DEFAULT false,
  json_ld_types TEXT[],
  has_faq_schema BOOLEAN DEFAULT false,
  has_breadcrumb_schema BOOLEAN DEFAULT false,
  has_product_schema BOOLEAN DEFAULT false,

  -- Technical
  response_time_ms INT,
  status_code INT,

  -- GEO specific
  content_clarity_score INT CHECK (content_clarity_score >= 0 AND content_clarity_score <= 100),
  answerability_score INT CHECK (answerability_score >= 0 AND answerability_score <= 100),
  citation_worthiness_score INT CHECK (citation_worthiness_score >= 0 AND citation_worthiness_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_scores_audit ON seo_page_scores(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_path ON seo_page_scores(page_path);

-- ============================================
-- SEO RECOMMENDATIONS TABLE
-- Individual recommendations from each audit
-- ============================================
CREATE TABLE IF NOT EXISTS seo_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
  page_path VARCHAR(255),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'content', 'structured_data', 'performance', 'geo')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  current_value TEXT,
  recommended_value TEXT,
  estimated_impact VARCHAR(20) CHECK (estimated_impact IN ('high', 'medium', 'low')),
  is_auto_fixable BOOLEAN DEFAULT false,
  fix_type VARCHAR(50),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_recommendations_audit ON seo_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_severity ON seo_recommendations(severity);

-- ============================================
-- SEARCH CONSOLE DATA TABLE
-- Cached Google Search Console metrics
-- ============================================
CREATE TABLE IF NOT EXISTS search_console_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  page_path VARCHAR(255),
  query TEXT,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  position FLOAT DEFAULT 0,
  country VARCHAR(10),
  device VARCHAR(20),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_console_date ON search_console_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_page ON search_console_data(page_path);
CREATE INDEX IF NOT EXISTS idx_search_console_fetched ON search_console_data(fetched_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_console_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on seo_audits"
  ON seo_audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on seo_page_scores"
  ON seo_page_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on seo_recommendations"
  ON seo_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on search_console_data"
  ON search_console_data FOR ALL USING (true) WITH CHECK (true);
