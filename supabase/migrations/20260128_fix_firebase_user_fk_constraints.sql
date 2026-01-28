-- ============================================
-- Fix foreign key constraints for Firebase/Google users
-- These tables reference auth.users(id) but Firebase/Google users
-- only exist in public.users, not in auth.users.
-- Drop the FK constraints so both auth providers work.
-- ============================================

-- Drop FK constraint on user_preferences
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Drop FK constraint on user_consent
ALTER TABLE user_consent DROP CONSTRAINT IF EXISTS user_consent_user_id_fkey;

-- Drop FK constraints on subscription-related tables
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE promo_code_redemptions DROP CONSTRAINT IF EXISTS promo_code_redemptions_user_id_fkey;

-- Add ALL potentially missing columns to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS budget_monthly DECIMAL(10,2);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS favorite_stores JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS shopping_frequency VARCHAR(20) DEFAULT 'weekly';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_translate_chat BOOLEAN DEFAULT TRUE;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
