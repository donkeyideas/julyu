-- Rate Limiting System for RapidAPI
-- Tracks API usage and enforces limits to prevent overage charges

-- Rate Limit Configuration Table
CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(50) UNIQUE NOT NULL CHECK (api_name IN ('tesco', 'grocery-prices')),
  daily_limit INT NOT NULL DEFAULT 1000,
  monthly_limit INT NOT NULL DEFAULT 10000,
  alert_threshold_50 BOOLEAN DEFAULT TRUE,
  alert_threshold_75 BOOLEAN DEFAULT TRUE,
  alert_threshold_90 BOOLEAN DEFAULT TRUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Tracking Table
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(50) NOT NULL CHECK (api_name IN ('tesco', 'grocery-prices')),
  date DATE NOT NULL,
  calls_count INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(api_name, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_api_name ON rate_limit_config(api_name);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_api_date ON api_usage_tracking(api_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON api_usage_tracking(date DESC);

-- Insert default rate limits
INSERT INTO rate_limit_config (api_name, daily_limit, monthly_limit, is_enabled)
VALUES
  ('tesco', 1000, 10000, TRUE),
  ('grocery-prices', 1000, 10000, TRUE)
ON CONFLICT (api_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin access only
CREATE POLICY "Admin can view rate limits"
  ON rate_limit_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.subscription_tier = 'enterprise'
    )
  );

CREATE POLICY "Admin can update rate limits"
  ON rate_limit_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.subscription_tier = 'enterprise'
    )
  );

CREATE POLICY "Admin can view usage tracking"
  ON api_usage_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.subscription_tier = 'enterprise'
    )
  );

CREATE POLICY "Admin can manage usage tracking"
  ON api_usage_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.subscription_tier = 'enterprise'
    )
  );

-- Comments
COMMENT ON TABLE rate_limit_config IS 'Configuration for API rate limits';
COMMENT ON TABLE api_usage_tracking IS 'Daily API usage tracking for rate limiting';
COMMENT ON COLUMN rate_limit_config.daily_limit IS 'Maximum API calls allowed per day';
COMMENT ON COLUMN rate_limit_config.monthly_limit IS 'Maximum API calls allowed per month';
COMMENT ON COLUMN api_usage_tracking.calls_count IS 'Total API calls made on this date';
COMMENT ON COLUMN api_usage_tracking.successful_calls IS 'Number of successful API calls';
COMMENT ON COLUMN api_usage_tracking.failed_calls IS 'Number of failed API calls';
