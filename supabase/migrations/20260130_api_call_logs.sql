-- API Call Logs - Track ALL external API calls across the platform
CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- API identification
  api_name VARCHAR(100) NOT NULL,  -- e.g., 'kroger', 'walmart', 'stripe', 'doordash', 'deepseek', 'openai', 'gemini'
  endpoint VARCHAR(500),            -- The specific endpoint called
  method VARCHAR(10) DEFAULT 'GET', -- GET, POST, PUT, DELETE, etc.

  -- Request details
  request_params JSONB DEFAULT '{}', -- Query params or body (sanitized, no secrets)

  -- Response details
  status_code INT,
  response_time_ms INT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Cost tracking (if applicable)
  cost DECIMAL(12, 8) DEFAULT 0,  -- Some APIs have costs per call
  tokens_used INT,                -- For LLM APIs

  -- Context
  user_id UUID,                   -- Which user triggered this (if applicable)
  use_case VARCHAR(100),          -- e.g., 'price_comparison', 'receipt_scan', 'checkout'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_name ON api_call_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_success ON api_call_logs(success);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_user ON api_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_use_case ON api_call_logs(use_case);

-- Composite index for time-based API filtering
CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_time ON api_call_logs(api_name, created_at DESC);

-- Enable RLS
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
DROP POLICY IF EXISTS "Service role full access to api_call_logs" ON api_call_logs;
CREATE POLICY "Service role full access to api_call_logs"
  ON api_call_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a view for aggregated API stats
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT
  api_name,
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  AVG(response_time_ms)::INT as avg_response_time,
  SUM(cost) as total_cost,
  SUM(tokens_used) as total_tokens
FROM api_call_logs
GROUP BY api_name, DATE_TRUNC('day', created_at);
