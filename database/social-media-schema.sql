-- Social Media Posts Schema
-- Used by the admin Social Media management page

-- Social Media Posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED')),
  hashtags TEXT[] DEFAULT '{}',
  image_prompt TEXT,
  topic TEXT,
  tone TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publish_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX idx_social_posts_status ON social_media_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_media_posts(scheduled_at);
CREATE INDEX idx_social_posts_created ON social_media_posts(created_at DESC);

-- Enable RLS
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on social_media_posts"
  ON social_media_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_posts_updated_at();
