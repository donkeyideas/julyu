-- ============================================
-- Geocoding Cache Table
-- ============================================

-- Cache geocoding results to minimize API calls and improve performance
CREATE TABLE IF NOT EXISTS geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_key VARCHAR(255) UNIQUE NOT NULL, -- address or zip code used for lookup
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  formatted_address TEXT NOT NULL,
  confidence DECIMAL(3, 2), -- confidence score from geocoding service (0-1)
  source VARCHAR(50) NOT NULL, -- 'positionstack', 'zip_database', 'cache', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_geocode_cache_lookup ON geocode_cache(lookup_key);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_expires ON geocode_cache(expires_at);

-- Automatically delete expired cache entries
CREATE OR REPLACE FUNCTION delete_expired_geocode_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM geocode_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE geocode_cache IS 'Caches geocoding results for 30 days to minimize API calls and improve performance';
COMMENT ON COLUMN geocode_cache.lookup_key IS 'The address or zip code that was geocoded (normalized for consistency)';
COMMENT ON COLUMN geocode_cache.confidence IS 'Confidence score from the geocoding service (0-1)';
COMMENT ON COLUMN geocode_cache.source IS 'Which geocoding service provided the result';
