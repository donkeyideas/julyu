-- Migration: User Dashboard AI Features
-- Date: 2026-01-25
-- Description: Add tables for AI Assistant, Insights, Budget, Feature Flags, and Training Data Management

-- ============================================
-- PRICE ALERTS ENHANCEMENTS
-- ============================================

-- Add notification tracking to price_alerts
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS notification_method VARCHAR(20) DEFAULT 'email';
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- Alert notifications history
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES price_alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  method VARCHAR(20), -- 'email', 'push', 'in_app'
  status VARCHAR(20) DEFAULT 'sent',
  current_price DECIMAL(10,2),
  target_price DECIMAL(10,2)
);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_user ON alert_notifications(user_id);

-- ============================================
-- USER PREFERENCES ENHANCEMENTS
-- ============================================

-- Add AI and budget preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ai_assistant_history JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS budget_monthly DECIMAL(10,2);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS favorite_categories JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS favorite_stores JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS shopping_frequency VARCHAR(20) DEFAULT 'weekly';

-- ============================================
-- AI CONVERSATIONS (Chat Assistant)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at);

-- ============================================
-- AI INSIGHTS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'savings', 'spending', 'prediction', 'recommendation', 'alert'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  priority INT DEFAULT 0,
  dismissed BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON ai_insights(dismissed);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires ON ai_insights(expires_at);

-- ============================================
-- USER BUDGETS
-- ============================================

CREATE TABLE IF NOT EXISTS user_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100),
  monthly_limit DECIMAL(10,2),
  current_spent DECIMAL(10,2) DEFAULT 0,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

CREATE INDEX IF NOT EXISTS idx_user_budgets_user ON user_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_budgets_month ON user_budgets(month);

CREATE TABLE IF NOT EXISTS budget_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50), -- 'substitution', 'store_change', 'timing', 'bulk_buy'
  title VARCHAR(255),
  description TEXT,
  potential_savings DECIMAL(10,2),
  metadata JSONB,
  implemented BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_recommendations_type ON budget_recommendations(recommendation_type);

-- ============================================
-- FEATURE FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_segment JSONB, -- Filter criteria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

CREATE TABLE IF NOT EXISTS user_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  is_enabled BOOLEAN,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_user ON user_feature_overrides(user_id);

-- ============================================
-- A/B TESTING
-- ============================================

CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sample_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);

CREATE TABLE IF NOT EXISTS ab_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  config JSONB, -- Variant-specific configuration
  allocation_percentage INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_variants_experiment ON ab_variants(experiment_id);

CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);

CREATE TABLE IF NOT EXISTS ab_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  conversion_type VARCHAR(100),
  value DECIMAL(10,2),
  metadata JSONB,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_conversions_experiment ON ab_conversions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversions_variant ON ab_conversions(variant_id);

-- ============================================
-- AI FEEDBACK
-- ============================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'assistant', 'insight', 'prediction', 'substitution', 'recommendation'
  interaction_id UUID, -- Reference to specific interaction
  feedback_type VARCHAR(20), -- 'thumbs_up', 'thumbs_down', 'detailed'
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 if applicable
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_feedback ON ai_feedback(feedback_type);

-- ============================================
-- TRAINING DATA ENHANCEMENTS
-- ============================================

-- Enhance existing ai_training_data table
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS use_case VARCHAR(100);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS accuracy_score DECIMAL(3,2);
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS user_feedback VARCHAR(20); -- 'positive', 'negative', 'neutral'
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS validation_notes TEXT;
ALTER TABLE ai_training_data ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_training_data_use_case ON ai_training_data(use_case);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_validated ON ai_training_data(validated);

CREATE TABLE IF NOT EXISTS training_data_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  export_date TIMESTAMPTZ DEFAULT NOW(),
  record_count INT,
  file_url TEXT,
  format VARCHAR(20), -- 'jsonl', 'csv', 'parquet'
  use_case VARCHAR(100),
  filters JSONB,
  exported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_exports_date ON training_data_exports(export_date);
CREATE INDEX IF NOT EXISTS idx_training_exports_use_case ON training_data_exports(use_case);

-- ============================================
-- MODEL REGISTRY & ROUTING
-- ============================================

CREATE TABLE IF NOT EXISTS model_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  base_model VARCHAR(100),
  training_data_export_id UUID REFERENCES training_data_exports(id),
  status VARCHAR(20) DEFAULT 'training' CHECK (status IN ('training', 'ready', 'deployed', 'retired')),
  performance_metrics JSONB,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry(status);
CREATE INDEX IF NOT EXISTS idx_model_registry_name ON model_registry(name);

CREATE TABLE IF NOT EXISTS model_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES model_registry(id) ON DELETE CASCADE,
  evaluation_type VARCHAR(50),
  metrics JSONB,
  test_set_size INT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_evaluations_model ON model_evaluations(model_id);

CREATE TABLE IF NOT EXISTS model_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  use_case VARCHAR(100) NOT NULL,
  conditions JSONB, -- {"user_tier": "free", "complexity": "low"}
  primary_model VARCHAR(100),
  fallback_model VARCHAR(100),
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_routing_use_case ON model_routing_rules(use_case);
CREATE INDEX IF NOT EXISTS idx_model_routing_active ON model_routing_rules(is_active);

-- ============================================
-- PRODUCT SUBSTITUTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS product_substitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_product_id UUID REFERENCES products(id),
  substitute_product_id UUID REFERENCES products(id),
  substitution_type VARCHAR(50), -- 'brand_alternative', 'size_alternative', 'category_similar', 'dietary_compatible'
  similarity_score DECIMAL(3,2),
  ai_generated BOOLEAN DEFAULT TRUE,
  user_confirmed INT DEFAULT 0, -- Number of users who confirmed this works
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_subs_original ON product_substitutions(original_product_id);
CREATE INDEX IF NOT EXISTS idx_product_subs_type ON product_substitutions(substitution_type);

-- ============================================
-- DEALS
-- ============================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  deal_type VARCHAR(50), -- 'sale', 'bogo', 'coupon', 'clearance'
  original_price DECIMAL(10,2),
  deal_price DECIMAL(10,2),
  description TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_product ON deals(product_id);
CREATE INDEX IF NOT EXISTS idx_deals_store ON deals(store_id);
CREATE INDEX IF NOT EXISTS idx_deals_valid ON deals(valid_until);

CREATE TABLE IF NOT EXISTS user_deal_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20), -- 'viewed', 'saved', 'used', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_interactions_user ON user_deal_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_interactions_deal ON user_deal_interactions(deal_id);

-- ============================================
-- ADD TOTAL_SPENT TO COMPARISONS
-- ============================================

ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2);
ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS item_count INT;
ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS best_store VARCHAR(255);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deal_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_own_conversations ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_insights ON ai_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_budgets ON user_budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_budget_recommendations ON budget_recommendations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_feedback ON ai_feedback
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_alert_notifications ON alert_notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_deal_interactions ON user_deal_interactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- INSERT DEFAULT FEATURE FLAGS
-- ============================================

INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
  ('ai_assistant', 'AI Shopping Assistant chat feature', true, 100),
  ('smart_insights', 'AI-generated savings insights', true, 100),
  ('budget_optimizer', 'Budget optimization recommendations', true, 100),
  ('price_predictions', 'AI price predictions', false, 0),
  ('personalized_deals', 'Personalized deal recommendations', true, 50)
ON CONFLICT (name) DO NOTHING;
