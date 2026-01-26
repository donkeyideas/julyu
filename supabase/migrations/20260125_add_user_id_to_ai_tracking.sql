-- Migration: Add user_id to AI tracking tables
-- Date: 2026-01-25
-- Purpose: Enable tracking AI usage per user for analytics and billing

-- Add user_id column to ai_model_usage
ALTER TABLE ai_model_usage
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add additional columns for better tracking
ALTER TABLE ai_model_usage
ADD COLUMN IF NOT EXISTS use_case VARCHAR(100),
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

-- Create index for user-based queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_model_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_model_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_model_usage(user_id, created_at);

-- Add quality tracking to training data
ALTER TABLE ai_training_data
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS corrected_output JSONB;

-- Create user_activity table for comprehensive tracking
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  page_path VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at);

-- Create training_exports table for LLM training pipeline
CREATE TABLE IF NOT EXISTS training_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_date TIMESTAMPTZ DEFAULT NOW(),
  record_count INTEGER,
  file_path VARCHAR(500),
  file_size_bytes BIGINT,
  min_quality_score DECIMAL(3,2),
  use_cases TEXT[],
  exported_by UUID REFERENCES users(id),
  notes TEXT
);

-- Create price_predictions table for ML predictions
CREATE TABLE IF NOT EXISTS price_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  predicted_price DECIMAL(10,2) NOT NULL,
  prediction_date DATE NOT NULL,
  confidence DECIMAL(3,2),
  actual_price DECIMAL(10,2),
  model_version VARCHAR(50),
  features_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_product ON price_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON price_predictions(prediction_date);
