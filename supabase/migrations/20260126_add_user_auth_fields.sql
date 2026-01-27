-- Add auth provider tracking fields to users table
-- This allows tracking whether users signed up with Google or email/password

-- Add auth_provider column
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';

-- Add firebase_uid for Firebase/Google auth users
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

-- Add avatar_url for profile pictures (Google users get this automatically)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add updated_at column for tracking updates
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on auth_provider for filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Create index on firebase_uid for lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Comment on columns
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: email or google';
COMMENT ON COLUMN users.firebase_uid IS 'Firebase user ID for Google auth users';
COMMENT ON COLUMN users.avatar_url IS 'Profile picture URL (from Google for Google auth)';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';
