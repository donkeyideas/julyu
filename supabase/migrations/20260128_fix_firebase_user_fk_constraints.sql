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

-- Add missing columns to user_preferences if not already added
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_translate_chat BOOLEAN DEFAULT TRUE;
