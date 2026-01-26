-- Migration: Chat System Tables
-- Creates all tables needed for the community chat feature

-- ============================================
-- USER FRIENDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_friends_user ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message TEXT,
  last_message_at TIMESTAMPTZ
);

-- ============================================
-- CHAT PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'recipe', 'list', 'image')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- User Friends policies
DROP POLICY IF EXISTS "Users can view their own friend relationships" ON user_friends;
CREATE POLICY "Users can view their own friend relationships"
  ON user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON user_friends;
CREATE POLICY "Users can create friend requests"
  ON user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friend status" ON user_friends;
CREATE POLICY "Users can update friend status"
  ON user_friends FOR UPDATE
  USING (auth.uid() = friend_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete friend relationships" ON user_friends;
CREATE POLICY "Users can delete friend relationships"
  ON user_friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Service role full access for API routes
DROP POLICY IF EXISTS "Service role full access to user_friends" ON user_friends;
CREATE POLICY "Service role full access to user_friends"
  ON user_friends FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Conversations policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON chat_conversations;
CREATE POLICY "Users can view conversations they participate in"
  ON chat_conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.conversation_id = chat_conversations.id
    AND chat_participants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to chat_conversations" ON chat_conversations;
CREATE POLICY "Service role full access to chat_conversations"
  ON chat_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON chat_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON chat_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.conversation_id = chat_participants.conversation_id
    AND cp.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to chat_participants" ON chat_participants;
CREATE POLICY "Service role full access to chat_participants"
  ON chat_participants FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.conversation_id = chat_messages.conversation_id
    AND chat_participants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON chat_messages;
CREATE POLICY "Users can send messages to their conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_messages.conversation_id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to chat_messages" ON chat_messages;
CREATE POLICY "Service role full access to chat_messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON user_friends TO authenticated;
GRANT SELECT ON chat_conversations TO authenticated;
GRANT SELECT ON chat_participants TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;
