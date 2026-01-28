-- Add missing columns to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_translate_chat BOOLEAN DEFAULT TRUE;
