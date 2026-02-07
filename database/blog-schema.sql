-- Blog Posts Schema
-- Run this in Supabase SQL Editor

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  seo_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT,
  canonical_url TEXT,
  meta_robots TEXT DEFAULT 'index, follow',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  word_count INT NOT NULL DEFAULT 0,
  read_time_minutes INT NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies - service role can do everything
CREATE POLICY "Service role full access on blog_posts"
  ON blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Public can read published posts
CREATE POLICY "Public can read published blog_posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');
