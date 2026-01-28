-- ============================================
-- Fix price_alerts FK constraint + add columns
--
-- Problem: price_alerts.user_id REFERENCES auth.users(id)
-- but Firebase/Google users only exist in public.users.
-- Also adds columns for enhanced price tracking.
-- ============================================

-- Fix FK constraint to reference public.users
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_user_id_fkey;
ALTER TABLE price_alerts
  ADD CONSTRAINT price_alerts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add new columns for enhanced tracking
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS lowest_price_found DECIMAL(10,2);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
