-- Migration: Add typing_users JSONB column to chat_conversations
-- Stores {userId: isoTimestamp} for real-time typing indicators

ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS typing_users JSONB DEFAULT '{}';
