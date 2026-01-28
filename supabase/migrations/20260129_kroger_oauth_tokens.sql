-- ============================================
-- Kroger OAuth Tokens
-- ============================================

-- Store user-specific Kroger OAuth tokens for cart operations
-- Tokens are encrypted using the same encryption scheme as API keys
CREATE TABLE IF NOT EXISTS kroger_user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT, -- OAuth scopes granted (e.g., 'cart.basic:write product.compact')
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_kroger_tokens_user ON kroger_user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_kroger_tokens_expires ON kroger_user_tokens(expires_at);

-- Automatically delete expired tokens
CREATE OR REPLACE FUNCTION delete_expired_kroger_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM kroger_user_tokens WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE kroger_user_tokens IS 'Stores encrypted OAuth tokens for Kroger cart integration - requires user authorization';
COMMENT ON COLUMN kroger_user_tokens.access_token_encrypted IS 'Encrypted access token for Kroger API cart operations';
COMMENT ON COLUMN kroger_user_tokens.refresh_token_encrypted IS 'Encrypted refresh token to renew expired access tokens';
COMMENT ON COLUMN kroger_user_tokens.scope IS 'OAuth scopes granted by the user';
