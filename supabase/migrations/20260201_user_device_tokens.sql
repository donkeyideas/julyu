-- User Device Tokens for Push Notifications
-- Stores FCM tokens for mobile and web push notifications

CREATE TABLE IF NOT EXISTS user_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  device_name TEXT,
  app_version TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_active ON user_device_tokens(user_id, is_active) WHERE is_active = true;

-- Also add store owner device tokens for store portal notifications
CREATE TABLE IF NOT EXISTS store_owner_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_owner_id UUID NOT NULL REFERENCES store_owners(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  device_name TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_owner_device_tokens_owner ON store_owner_device_tokens(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_owner_device_tokens_active ON store_owner_device_tokens(store_owner_id, is_active) WHERE is_active = true;

-- Add DoorDash tracking fields to bodega_orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bodega_orders' AND column_name = 'doordash_delivery_id'
  ) THEN
    ALTER TABLE bodega_orders ADD COLUMN doordash_delivery_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bodega_orders' AND column_name = 'doordash_tracking_url'
  ) THEN
    ALTER TABLE bodega_orders ADD COLUMN doordash_tracking_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bodega_orders' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE bodega_orders ADD COLUMN cancellation_reason TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bodega_orders' AND column_name = 'delivery_instructions'
  ) THEN
    ALTER TABLE bodega_orders ADD COLUMN delivery_instructions TEXT;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_owner_device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own device tokens
CREATE POLICY user_device_tokens_own ON user_device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Store owners can only manage their own device tokens
CREATE POLICY store_owner_device_tokens_own ON store_owner_device_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM store_owners
      WHERE id = store_owner_id
      AND auth_user_id = auth.uid()
    )
  );

-- Service role can access all tokens (for sending notifications)
CREATE POLICY user_device_tokens_service ON user_device_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY store_owner_device_tokens_service ON store_owner_device_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
