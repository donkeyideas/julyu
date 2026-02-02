-- Comparison Cache
-- Caches full shopping list comparison results to eliminate repeat API calls
-- Same list searched again = 0 API calls (instant response)

CREATE TABLE IF NOT EXISTS comparison_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_hash VARCHAR(64) NOT NULL,           -- MD5 of sorted, normalized items
  location_context VARCHAR(100),            -- zip code or lat/lng area for location-specific results
  results JSONB NOT NULL,                   -- Full comparison response
  item_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,          -- 4-hour TTL (prices can change)
  hit_count INT DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  UNIQUE(list_hash, location_context)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_comparison_cache_lookup
  ON comparison_cache(list_hash, location_context);
CREATE INDEX IF NOT EXISTS idx_comparison_cache_expires
  ON comparison_cache(expires_at);

-- Function to clean expired comparison cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_comparison_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM comparison_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE comparison_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access
DROP POLICY IF EXISTS "Service role can manage comparison cache" ON comparison_cache;
CREATE POLICY "Service role can manage comparison cache"
  ON comparison_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE comparison_cache IS 'Caches full shopping list comparison results';
COMMENT ON COLUMN comparison_cache.list_hash IS 'MD5 hash of sorted, normalized item list';
COMMENT ON COLUMN comparison_cache.location_context IS 'Location identifier (zip or lat,lng area)';
COMMENT ON COLUMN comparison_cache.results IS 'Full JSON comparison response';
COMMENT ON COLUMN comparison_cache.hit_count IS 'Number of times this cache was used';
COMMENT ON COLUMN comparison_cache.expires_at IS 'Expiration time (4 hours by default)';
