-- Migration: Add AEO and CRO columns to SEO audit tables
-- Run this in Supabase SQL Editor

-- 1. Add AEO and CRO scores to seo_audits
ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS aeo_score INT DEFAULT 0
  CHECK (aeo_score >= 0 AND aeo_score <= 100);
ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS cro_score INT DEFAULT 0
  CHECK (cro_score >= 0 AND cro_score <= 100);

-- 2. Add AEO columns to seo_page_scores
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS aeo_score INT CHECK (aeo_score >= 0 AND aeo_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS schema_richness_score INT CHECK (schema_richness_score >= 0 AND schema_richness_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS faq_coverage_score INT CHECK (faq_coverage_score >= 0 AND faq_coverage_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS direct_answer_readiness_score INT CHECK (direct_answer_readiness_score >= 0 AND direct_answer_readiness_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS entity_markup_score INT CHECK (entity_markup_score >= 0 AND entity_markup_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS speakable_content_score INT CHECK (speakable_content_score >= 0 AND speakable_content_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS ai_snippet_compatibility_score INT CHECK (ai_snippet_compatibility_score >= 0 AND ai_snippet_compatibility_score <= 100);

-- 3. Add CRO columns to seo_page_scores
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS cro_score INT CHECK (cro_score >= 0 AND cro_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS cta_presence_score INT CHECK (cta_presence_score >= 0 AND cta_presence_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS form_accessibility_score INT CHECK (form_accessibility_score >= 0 AND form_accessibility_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS load_speed_impact_score INT CHECK (load_speed_impact_score >= 0 AND load_speed_impact_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS trust_signals_score INT CHECK (trust_signals_score >= 0 AND trust_signals_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS social_proof_score INT CHECK (social_proof_score >= 0 AND social_proof_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS value_proposition_score INT CHECK (value_proposition_score >= 0 AND value_proposition_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS mobile_cro_score INT CHECK (mobile_cro_score >= 0 AND mobile_cro_score <= 100);
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS cta_count INT DEFAULT 0;
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS cta_texts TEXT[];
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS form_count INT DEFAULT 0;
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS has_trust_badges BOOLEAN DEFAULT false;
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS has_testimonials BOOLEAN DEFAULT false;
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS has_social_proof BOOLEAN DEFAULT false;
ALTER TABLE seo_page_scores ADD COLUMN IF NOT EXISTS has_value_prop BOOLEAN DEFAULT false;

-- 4. Update seo_recommendations category constraint to include aeo and cro
ALTER TABLE seo_recommendations DROP CONSTRAINT IF EXISTS seo_recommendations_category_check;
ALTER TABLE seo_recommendations ADD CONSTRAINT seo_recommendations_category_check
  CHECK (category IN ('technical', 'content', 'structured_data', 'performance', 'geo', 'aeo', 'cro'));
