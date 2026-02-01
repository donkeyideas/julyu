-- SerpApi Rate Limiting Configuration
-- Adds SerpApi (Walmart price data) to the rate limiting system

-- First, drop the existing check constraints
ALTER TABLE rate_limit_config DROP CONSTRAINT IF EXISTS rate_limit_config_api_name_check;
ALTER TABLE api_usage_tracking DROP CONSTRAINT IF EXISTS api_usage_tracking_api_name_check;

-- Add new check constraints that include 'serpapi'
ALTER TABLE rate_limit_config
  ADD CONSTRAINT rate_limit_config_api_name_check
  CHECK (api_name IN ('tesco', 'grocery-prices', 'serpapi'));

ALTER TABLE api_usage_tracking
  ADD CONSTRAINT api_usage_tracking_api_name_check
  CHECK (api_name IN ('tesco', 'grocery-prices', 'serpapi'));

-- Insert SerpApi rate limit configuration
-- Free tier: 250 searches/month, limit to ~8/day to spread usage
INSERT INTO rate_limit_config (api_name, daily_limit, monthly_limit, is_enabled)
VALUES ('serpapi', 10, 250, TRUE)
ON CONFLICT (api_name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- Comments
COMMENT ON COLUMN rate_limit_config.api_name IS 'API identifier: tesco, grocery-prices, or serpapi';
