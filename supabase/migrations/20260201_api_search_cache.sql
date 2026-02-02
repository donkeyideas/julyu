-- API Search Cache
-- Caches search results to dramatically reduce API calls
-- E.g., 1000 users searching "milk 2%" = 1 API call per 24 hours instead of 1000

CREATE TABLE IF NOT EXISTS api_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(50) NOT NULL,
  search_query VARCHAR(255) NOT NULL,
  search_query_normalized VARCHAR(255) NOT NULL,
  location_id VARCHAR(50) DEFAULT NULL, -- For location-specific caches (e.g., Kroger store-specific prices)
  results JSONB NOT NULL,
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INT DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  UNIQUE(api_name, search_query_normalized, location_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_cache_lookup
  ON api_search_cache(api_name, search_query_normalized);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires
  ON api_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_created
  ON api_search_cache(created_at DESC);

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_search_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE api_search_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access (no user-level access needed)
CREATE POLICY "Service role can manage cache"
  ON api_search_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE api_search_cache IS 'Caches API search results to reduce API calls';
COMMENT ON COLUMN api_search_cache.search_query IS 'Original search query as entered';
COMMENT ON COLUMN api_search_cache.search_query_normalized IS 'Lowercase, trimmed query for cache lookup';
COMMENT ON COLUMN api_search_cache.results IS 'JSON array of search results';
COMMENT ON COLUMN api_search_cache.hit_count IS 'Number of times this cache entry was used';
COMMENT ON COLUMN api_search_cache.expires_at IS 'When this cache entry expires (default 24 hours)';
