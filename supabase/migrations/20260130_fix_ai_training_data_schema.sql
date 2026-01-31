-- Fix AI Training Data table schema
-- This migration ensures all required columns exist

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  use_case VARCHAR(100),
  input_text TEXT,
  expected_output TEXT,
  actual_output TEXT,
  feedback VARCHAR(20) CHECK (feedback IN ('positive', 'negative', 'neutral')),
  user_id UUID,
  validated BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS accuracy_score DECIMAL(5,2);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS user_feedback VARCHAR(20);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS use_case VARCHAR(100);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS validation_notes TEXT;
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_training_data_use_case ON ai_training_data(use_case);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_validated ON ai_training_data(validated);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_user_feedback ON ai_training_data(user_feedback);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_created_at ON ai_training_data(created_at);

-- Enable RLS
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

-- Create policy for service role full access
DROP POLICY IF EXISTS "Service role full access to ai_training_data" ON ai_training_data;
CREATE POLICY "Service role full access to ai_training_data"
  ON ai_training_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure training_data_exports table exists
CREATE TABLE IF NOT EXISTS training_data_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  export_date TIMESTAMPTZ DEFAULT NOW(),
  record_count INT,
  format VARCHAR(20),
  use_case VARCHAR(100),
  filters JSONB DEFAULT '{}'
);

-- Enable RLS on exports table
ALTER TABLE training_data_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to training_data_exports" ON training_data_exports;
CREATE POLICY "Service role full access to training_data_exports"
  ON training_data_exports FOR ALL
  USING (true)
  WITH CHECK (true);
