-- Scraper Health Events
-- Persistent log of every external-source call (Flipp, Target, Kroger, Walmart,
-- Open Food Facts, equivalence classifier, geocoding) so the admin maintenance
-- module can show what's failing and where.
--
-- We keep this OUT of api_search_cache so cache-table queries stay fast and
-- single-purpose. This table is append-only and gets pruned by a retention job.

CREATE TABLE IF NOT EXISTS scraper_health_events (
  id BIGSERIAL PRIMARY KEY,

  -- Source identifier: flipp | target | kroger | walmart | off | equivalence | geocoding | bodega
  source VARCHAR(40) NOT NULL,

  -- Specific operation within that source — e.g. "search_items", "get_product",
  -- "search_stores", "classify", "geocode_zip". Free-form but stable per source.
  operation VARCHAR(80) NOT NULL,

  -- Outcome
  success BOOLEAN NOT NULL,
  http_status INT,                    -- when applicable (HTTP-based sources)
  error_message TEXT,                 -- truncated to ~500 chars in the writer
  error_kind VARCHAR(40),             -- 'bot_blocked' | 'rate_limited' | 'no_key' | 'timeout' | 'parse_error' | 'no_results' | 'unknown'

  -- Performance
  latency_ms INT,

  -- Context — useful for clustering failures
  query VARCHAR(500),                 -- the search term we sent
  zip VARCHAR(10),                    -- the postal code in play
  result_count INT,                   -- how many records came back (0 is informative)

  -- Cost / token tracking for LLM-backed sources (DeepSeek classifier)
  input_tokens INT,
  output_tokens INT,
  cost_usd NUMERIC(10, 6),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes optimized for the admin dashboard queries: per-source recency,
-- failure clustering, and time-window aggregation.
CREATE INDEX IF NOT EXISTS idx_scraper_health_source_created
  ON scraper_health_events (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_health_failures
  ON scraper_health_events (source, success, created_at DESC)
  WHERE success = FALSE;
CREATE INDEX IF NOT EXISTS idx_scraper_health_created
  ON scraper_health_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_health_error_kind
  ON scraper_health_events (error_kind, created_at DESC)
  WHERE error_kind IS NOT NULL;

-- Retention: keep 30 days of detailed events. Older rows get pruned by a job.
-- For now we rely on a manual / cron delete; the rollup table below covers
-- longer-term trending if needed.

-- Rollup view: handy for the dashboard's "last 24h" / "last 7d" summary cards.
-- We use a view rather than a materialized table so the numbers are always live;
-- query volume here is low (a few admin page-views per day).
CREATE OR REPLACE VIEW scraper_health_summary_24h AS
SELECT
  source,
  COUNT(*) AS calls,
  COUNT(*) FILTER (WHERE success) AS successes,
  COUNT(*) FILTER (WHERE NOT success) AS failures,
  ROUND(
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE (COUNT(*) FILTER (WHERE success))::numeric * 100 / COUNT(*)
    END,
    1
  ) AS success_rate_pct,
  ROUND(AVG(latency_ms) FILTER (WHERE success))::int AS avg_latency_ms_ok,
  COUNT(*) FILTER (WHERE error_kind = 'bot_blocked') AS bot_blocked_count,
  COUNT(*) FILTER (WHERE error_kind = 'rate_limited') AS rate_limited_count,
  COUNT(*) FILTER (WHERE error_kind = 'no_key') AS no_key_count,
  COUNT(*) FILTER (WHERE error_kind = 'no_results') AS no_results_count,
  SUM(cost_usd) AS total_cost_usd,
  MAX(created_at) AS last_call_at
FROM scraper_health_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source;

CREATE OR REPLACE VIEW scraper_health_summary_7d AS
SELECT
  source,
  COUNT(*) AS calls,
  COUNT(*) FILTER (WHERE success) AS successes,
  COUNT(*) FILTER (WHERE NOT success) AS failures,
  ROUND(
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE (COUNT(*) FILTER (WHERE success))::numeric * 100 / COUNT(*)
    END,
    1
  ) AS success_rate_pct,
  ROUND(AVG(latency_ms) FILTER (WHERE success))::int AS avg_latency_ms_ok,
  SUM(cost_usd) AS total_cost_usd
FROM scraper_health_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source;

-- RLS — service-role only. The admin API hits these via service role; no
-- end-user-facing path reads this table.
ALTER TABLE scraper_health_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON scraper_health_events;
CREATE POLICY "service_role_full_access"
  ON scraper_health_events FOR ALL
  USING (true)
  WITH CHECK (true);
