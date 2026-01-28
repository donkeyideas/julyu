-- Fix receipts table: FK constraint + nullable image_url
-- Same pattern as ai_conversations and price_alerts FK fixes

-- 1. Fix FK constraint: point to public.users instead of auth.users
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_user_id_fkey;
ALTER TABLE receipts
  ADD CONSTRAINT receipts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Make image_url nullable (upload may fail, shouldn't block receipt creation)
ALTER TABLE receipts ALTER COLUMN image_url DROP NOT NULL;

-- 3. Add processed_at if not exists
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
