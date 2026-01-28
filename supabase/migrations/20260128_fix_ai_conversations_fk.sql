-- ============================================
-- Fix FK constraints that reference auth.users instead of public.users
--
-- Problem: Tables created with REFERENCES users(id) (no schema prefix)
-- resolve to auth.users in Supabase. Firebase/Google sign-in users only
-- exist in public.users, causing FK violations on INSERT.
--
-- Solution: Drop the broken FK constraints and re-add them pointing
-- to public.users(id) explicitly.
-- ============================================

-- AI Conversations (CRITICAL - this is blocking conversation history)
ALTER TABLE ai_conversations DROP CONSTRAINT IF EXISTS ai_conversations_user_id_fkey;
ALTER TABLE ai_conversations
  ADD CONSTRAINT ai_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- AI Insights
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_user_id_fkey;
ALTER TABLE ai_insights
  ADD CONSTRAINT ai_insights_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- AI Feedback
ALTER TABLE ai_feedback DROP CONSTRAINT IF EXISTS ai_feedback_user_id_fkey;
ALTER TABLE ai_feedback
  ADD CONSTRAINT ai_feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Alert Notifications
ALTER TABLE alert_notifications DROP CONSTRAINT IF EXISTS alert_notifications_user_id_fkey;
ALTER TABLE alert_notifications
  ADD CONSTRAINT alert_notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- User Budgets
ALTER TABLE user_budgets DROP CONSTRAINT IF EXISTS user_budgets_user_id_fkey;
ALTER TABLE user_budgets
  ADD CONSTRAINT user_budgets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Budget Recommendations
ALTER TABLE budget_recommendations DROP CONSTRAINT IF EXISTS budget_recommendations_user_id_fkey;
ALTER TABLE budget_recommendations
  ADD CONSTRAINT budget_recommendations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- User Feature Overrides
ALTER TABLE user_feature_overrides DROP CONSTRAINT IF EXISTS user_feature_overrides_user_id_fkey;
ALTER TABLE user_feature_overrides
  ADD CONSTRAINT user_feature_overrides_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- AB Test Assignments
ALTER TABLE ab_assignments DROP CONSTRAINT IF EXISTS ab_assignments_user_id_fkey;
ALTER TABLE ab_assignments
  ADD CONSTRAINT ab_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- AB Test Conversions
ALTER TABLE ab_conversions DROP CONSTRAINT IF EXISTS ab_conversions_user_id_fkey;
ALTER TABLE ab_conversions
  ADD CONSTRAINT ab_conversions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

-- User Deal Interactions
ALTER TABLE user_deal_interactions DROP CONSTRAINT IF EXISTS user_deal_interactions_user_id_fkey;
ALTER TABLE user_deal_interactions
  ADD CONSTRAINT user_deal_interactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- AI Model Usage
ALTER TABLE ai_model_usage DROP CONSTRAINT IF EXISTS ai_model_usage_user_id_fkey;
ALTER TABLE ai_model_usage
  ADD CONSTRAINT ai_model_usage_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

-- User Activity
ALTER TABLE user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;
ALTER TABLE user_activity
  ADD CONSTRAINT user_activity_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
