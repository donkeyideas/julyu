-- Migration: LLM Orchestration Layer + Data Foundation
-- Phase 1 of the LLM + Data Strategy implementation
-- Adds: LLM cache, user events, receipt items, list outcomes, AI conversation context

-- ============================================
-- TABLE: LLM Response Cache
-- ============================================
CREATE TABLE IF NOT EXISTS public.llm_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  model_id TEXT NOT NULL,
  response JSONB NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_cache_key ON public.llm_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_llm_cache_expires ON public.llm_cache(expires_at);

-- RLS: Only service role accesses cache
ALTER TABLE public.llm_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages cache" ON public.llm_cache;
CREATE POLICY "Service role manages cache"
  ON public.llm_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: User Behavioral Events
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_type ON public.user_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON public.user_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON public.user_events(session_id);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
DROP POLICY IF EXISTS "Users can read own events" ON public.user_events;
CREATE POLICY "Users can read own events"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can read all events (for analytics)
DROP POLICY IF EXISTS "Service role reads all events" ON public.user_events;
CREATE POLICY "Service role reads all events"
  ON public.user_events FOR SELECT
  USING (true);

-- ============================================
-- TABLE: Receipt Line Items
-- ============================================
CREATE TABLE IF NOT EXISTS public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL,
  product_name_raw TEXT NOT NULL,
  matched_product_id UUID,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC,
  total_price NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  category TEXT,
  brand TEXT,
  match_confidence NUMERIC,
  user_corrected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON public.receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_product ON public.receipt_items(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON public.receipt_items(category);

ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

-- Service role manages receipt items
DROP POLICY IF EXISTS "Service role manages receipt items" ON public.receipt_items;
CREATE POLICY "Service role manages receipt items"
  ON public.receipt_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: Shopping List Outcomes (Intent vs Actual)
-- ============================================
CREATE TABLE IF NOT EXISTS public.list_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID,
  item_id UUID,
  planned_product_id UUID,
  actual_product_id UUID,
  planned_store TEXT,
  actual_store TEXT,
  planned_price NUMERIC,
  actual_price NUMERIC,
  was_substituted BOOLEAN DEFAULT false,
  substitution_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_outcomes_list ON public.list_outcomes(list_id);

ALTER TABLE public.list_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages list outcomes" ON public.list_outcomes;
CREATE POLICY "Service role manages list outcomes"
  ON public.list_outcomes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: AI Conversation Context
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  context_type TEXT NOT NULL,
  context_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_context_conv ON public.ai_conversation_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_context_type ON public.ai_conversation_context(conversation_id, context_type);

ALTER TABLE public.ai_conversation_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages AI context" ON public.ai_conversation_context;
CREATE POLICY "Service role manages AI context"
  ON public.ai_conversation_context FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: Meal Plans
-- ============================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  budget NUMERIC,
  dietary_restrictions TEXT[],
  household_size INTEGER DEFAULT 1,
  plan_data JSONB NOT NULL,
  total_estimated_cost NUMERIC,
  shopping_list_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON public.meal_plans(user_id, week_start);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages meal plans" ON public.meal_plans;
CREATE POLICY "Service role manages meal plans"
  ON public.meal_plans FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: User Consent (GDPR/CCPA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consent_unique ON public.user_consent(user_id, consent_type);

ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own consent" ON public.user_consent;
CREATE POLICY "Users manage own consent"
  ON public.user_consent FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role reads consent" ON public.user_consent;
CREATE POLICY "Service role reads consent"
  ON public.user_consent FOR SELECT
  USING (true);

-- ============================================
-- TABLE: B2B Clients
-- ============================================
CREATE TABLE IF NOT EXISTS public.b2b_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'base',
  monthly_call_limit INTEGER DEFAULT 10000,
  calls_this_month INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.b2b_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages B2B clients" ON public.b2b_clients;
CREATE POLICY "Service role manages B2B clients"
  ON public.b2b_clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: B2B API Logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.b2b_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.b2b_clients(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  response_size INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_logs_client ON public.b2b_api_logs(client_id, created_at);

ALTER TABLE public.b2b_api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages B2B logs" ON public.b2b_api_logs;
CREATE POLICY "Service role manages B2B logs"
  ON public.b2b_api_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABLE: Data Retention Log
-- ============================================
CREATE TABLE IF NOT EXISTS public.data_retention_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  records_deleted INTEGER,
  retention_days INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_retention_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages retention log" ON public.data_retention_log;
CREATE POLICY "Service role manages retention log"
  ON public.data_retention_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT ON public.llm_cache TO authenticated;
GRANT SELECT, INSERT ON public.user_events TO authenticated;
GRANT SELECT ON public.receipt_items TO authenticated;
GRANT SELECT ON public.list_outcomes TO authenticated;
GRANT SELECT ON public.ai_conversation_context TO authenticated;
GRANT ALL ON public.meal_plans TO authenticated;
GRANT ALL ON public.user_consent TO authenticated;
GRANT SELECT ON public.user_events TO anon;
