-- AI Model Usage Tracking
-- Tracks all AI API calls for cost analysis and monitoring

CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  use_case VARCHAR(100) NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  response_time_ms INT DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  request_payload JSONB,
  response_payload JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_model ON ai_model_usage(model_name);
CREATE INDEX idx_ai_usage_provider ON ai_model_usage(provider);
CREATE INDEX idx_ai_usage_created ON ai_model_usage(created_at);
CREATE INDEX idx_ai_usage_user ON ai_model_usage(user_id);
CREATE INDEX idx_ai_usage_success ON ai_model_usage(success);

-- AI Training Data Storage
-- Stores all AI inputs/outputs for future model training

CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  use_case VARCHAR(100) NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  accuracy_score DECIMAL(3,2) CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_model ON ai_training_data(model_name);
CREATE INDEX idx_training_usecase ON ai_training_data(use_case);
CREATE INDEX idx_training_created ON ai_training_data(created_at);
CREATE INDEX idx_training_feedback ON ai_training_data(user_feedback);
CREATE INDEX idx_training_accuracy ON ai_training_data(accuracy_score);

-- AI Model Configuration
-- Stores API keys and model configurations securely

CREATE TABLE IF NOT EXISTS ai_model_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT,
  api_endpoint VARCHAR(255),
  model_version VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_model ON ai_model_config(model_name);
CREATE INDEX idx_config_active ON ai_model_config(is_active);

-- AI Performance Metrics
-- Aggregated performance metrics for each model

CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  metric_date DATE NOT NULL,
  total_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2) DEFAULT 0,
  total_tokens INT DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  accuracy_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, metric_date)
);

CREATE INDEX idx_perf_model ON ai_performance_metrics(model_name);
CREATE INDEX idx_perf_date ON ai_performance_metrics(metric_date);


