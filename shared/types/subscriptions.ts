/**
 * Subscription & Promo Code Types
 */

export type FeatureKey =
  | 'basic_comparisons'
  | 'basic_price_tracking'
  | 'basic_receipts'
  | 'ai_chat'
  | 'receipt_scan'
  | 'price_alerts'
  | 'meal_planning'
  | 'smart_lists'
  | 'spending_insights'
  | 'unlimited_comparisons'
  | 'unlimited_receipts'
  | 'advanced_analytics'
  | 'white_label'
  | 'api_access'
  | 'dedicated_support'

export type PromoCodeType = 'percentage' | 'fixed' | 'free_months'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'free'

export type BillingInterval = 'month' | 'year'

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  stripe_price_id: string | null
  price: number
  billing_interval: BillingInterval
  features: FeatureKey[]
  description: string | null
  is_active: boolean
  is_self_serve: boolean
  sort_order: number
  max_calls_per_day: number
  max_calls_per_minute: number
  max_tokens_per_day: number
  highlight: boolean
  created_at: string
  updated_at: string
}

export interface PromoCode {
  id: string
  code: string
  description: string | null
  type: PromoCodeType
  value: number
  max_uses: number | null
  current_uses: number
  valid_from: string | null
  valid_until: string | null
  applicable_plans: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromoCodeRedemption {
  id: string
  user_id: string
  promo_code_id: string
  subscription_id: string | null
  redeemed_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  promo_code_id: string | null
  created_at: string
  updated_at: string
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  basic_comparisons: 'Basic Price Comparisons',
  basic_price_tracking: 'Basic Price Tracking',
  basic_receipts: 'Basic Receipt Storage',
  ai_chat: 'AI Shopping Assistant',
  receipt_scan: 'Receipt Scanning & OCR',
  price_alerts: 'Price Drop Alerts',
  meal_planning: 'AI Meal Planning',
  smart_lists: 'Smart Shopping Lists',
  spending_insights: 'Spending Insights & Analytics',
  unlimited_comparisons: 'Unlimited Comparisons',
  unlimited_receipts: 'Unlimited Receipt Storage',
  advanced_analytics: 'Advanced Price Analytics',
  white_label: 'White Label Solution',
  api_access: 'API Access',
  dedicated_support: 'Dedicated Support',
}
