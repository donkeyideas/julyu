-- ============================================
-- Subscription Plans, Promo Codes, User Subscriptions
-- ============================================

-- Subscription Plans — admin-managed plan definitions
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_self_serve BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_calls_per_day INTEGER NOT NULL DEFAULT 10,
  max_calls_per_minute INTEGER NOT NULL DEFAULT 3,
  max_tokens_per_day INTEGER NOT NULL DEFAULT 50000,
  highlight BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo Codes — discount/free-months codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_months')),
  value NUMERIC(10, 2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applicable_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Subscriptions — active subscription record
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'free')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  promo_code_id UUID REFERENCES promo_codes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo Code Redemptions — one-use-per-user tracking
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_user ON promo_code_redemptions(user_id);

-- Seed default plans
INSERT INTO subscription_plans (name, slug, price, billing_interval, features, description, is_active, is_self_serve, sort_order, max_calls_per_day, max_calls_per_minute, max_tokens_per_day, highlight)
VALUES
  (
    'Free',
    'free',
    0,
    'month',
    '["basic_comparisons", "basic_price_tracking", "basic_receipts"]'::jsonb,
    'Get started with basic grocery price comparison',
    true,
    true,
    0,
    10,
    3,
    50000,
    false
  ),
  (
    'Premium',
    'premium',
    15.00,
    'month',
    '["ai_chat", "receipt_scan", "price_alerts", "meal_planning", "smart_lists", "spending_insights", "unlimited_comparisons", "unlimited_receipts", "advanced_analytics"]'::jsonb,
    'Full access to AI-powered grocery savings tools',
    true,
    true,
    1,
    100,
    10,
    500000,
    true
  ),
  (
    'Enterprise',
    'enterprise',
    0,
    'month',
    '["ai_chat", "receipt_scan", "price_alerts", "meal_planning", "smart_lists", "spending_insights", "unlimited_comparisons", "unlimited_receipts", "advanced_analytics", "white_label", "api_access", "dedicated_support"]'::jsonb,
    'Custom solutions for businesses and organizations',
    true,
    false,
    2,
    10000,
    60,
    5000000,
    false
  )
ON CONFLICT (slug) DO NOTHING;
