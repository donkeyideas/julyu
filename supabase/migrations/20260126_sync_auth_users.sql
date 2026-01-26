-- Migration: Sync auth.users to public.users table
-- This ensures users who sign up via Supabase Auth appear in the admin dashboard

-- ============================================
-- FUNCTION: Handle new user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, last_login, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.created_at,
    NEW.last_sign_in_at,
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    last_login = EXCLUDED.last_login;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: On auth.users insert
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Handle user login (update last_login)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login = NEW.last_sign_in_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: On auth.users update (login)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();

-- ============================================
-- ONE-TIME SYNC: Copy existing auth users to public.users
-- ============================================
INSERT INTO public.users (id, email, full_name, created_at, last_login, subscription_tier)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  created_at,
  last_sign_in_at,
  'free'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
  last_login = COALESCE(EXCLUDED.last_login, public.users.last_login);

-- ============================================
-- RLS POLICIES FOR USERS TABLE
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (admin API routes) can read all users
DROP POLICY IF EXISTS "Service role can read all users" ON public.users;
CREATE POLICY "Service role can read all users"
  ON public.users FOR SELECT
  USING (true);

-- Service role can update all users
DROP POLICY IF EXISTS "Service role can update all users" ON public.users;
CREATE POLICY "Service role can update all users"
  ON public.users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add id column as primary key if it's not already UUID matching auth.users
-- First, ensure the id column can reference auth.users
DO $$
BEGIN
  -- Add foreign key constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Constraint might already exist or foreign key not possible, skip
    NULL;
END $$;

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
