-- Migration: Add participant_ids array to chat_conversations
-- This column enables fast filtering of conversations by participant

-- Add the participant_ids column
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS participant_ids UUID[] DEFAULT '{}';

-- Create index for array containment queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants
ON chat_conversations USING GIN (participant_ids);

-- Update RLS policy to use the array for faster lookups
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON chat_conversations;
CREATE POLICY "Users can view conversations they participate in"
  ON chat_conversations FOR SELECT
  USING (
    auth.uid() = ANY(participant_ids) OR
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_conversations.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Allow authenticated users to update conversations they participate in
DROP POLICY IF EXISTS "Users can update their conversations" ON chat_conversations;
CREATE POLICY "Users can update their conversations"
  ON chat_conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- Grant INSERT and UPDATE to authenticated users
GRANT INSERT, UPDATE ON chat_conversations TO authenticated;
