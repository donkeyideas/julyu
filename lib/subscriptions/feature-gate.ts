/**
 * Feature Gate — Central feature checking utility
 * Determines what features a user has access to based on their subscription plan.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { FeatureKey, SubscriptionPlan } from '@/shared/types/subscriptions'

// In-memory cache: userId → { features, expiry }
const featureCache = new Map<string, { features: string[]; plan: SubscriptionPlan; expiry: number }>()
const CACHE_TTL_MS = 30_000 // 30 seconds

/**
 * Get a user's current subscription plan from the DB.
 * Falls back to the free plan if no subscription exists.
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const supabase = createServiceRoleClient()

  // Try to get the user's active subscription with joined plan
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .single()

  if (subscription && subscription.status !== 'canceled') {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single()

    if (plan) {
      return plan as unknown as SubscriptionPlan
    }
  }

  // Fallback: return the free plan
  const { data: freePlan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', 'free')
    .single()

  if (freePlan) {
    return freePlan as unknown as SubscriptionPlan
  }

  // Ultimate fallback if free plan doesn't exist in DB
  return {
    id: '',
    name: 'Free',
    slug: 'free',
    stripe_price_id: null,
    price: 0,
    billing_interval: 'month',
    features: ['basic_comparisons', 'basic_price_tracking', 'basic_receipts'],
    description: 'Free plan',
    is_active: true,
    is_self_serve: true,
    sort_order: 0,
    max_calls_per_day: 10,
    max_calls_per_minute: 3,
    max_tokens_per_day: 50000,
    highlight: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Get a user's plan features (cached for 30s).
 */
export async function getUserPlanFeatures(userId: string): Promise<string[]> {
  const cached = featureCache.get(userId)
  if (cached && cached.expiry > Date.now()) {
    return cached.features
  }

  const plan = await getUserPlan(userId)
  const features = Array.isArray(plan.features) ? plan.features : []

  featureCache.set(userId, { features, plan, expiry: Date.now() + CACHE_TTL_MS })

  return features
}

/**
 * Check if a user has access to a specific feature.
 */
export async function hasFeature(userId: string, featureKey: FeatureKey): Promise<boolean> {
  const features = await getUserPlanFeatures(userId)
  return features.includes(featureKey)
}

/**
 * Get dynamic rate limits based on the user's subscription plan.
 */
export async function getUserRateLimits(userId: string): Promise<{
  maxCallsPerDay: number
  maxCallsPerMinute: number
  maxTokensPerDay: number
}> {
  const cached = featureCache.get(userId)
  let plan: SubscriptionPlan

  if (cached && cached.expiry > Date.now()) {
    plan = cached.plan
  } else {
    plan = await getUserPlan(userId)
    const features = Array.isArray(plan.features) ? plan.features : []
    featureCache.set(userId, { features, plan, expiry: Date.now() + CACHE_TTL_MS })
  }

  return {
    maxCallsPerDay: plan.max_calls_per_day,
    maxCallsPerMinute: plan.max_calls_per_minute,
    maxTokensPerDay: plan.max_tokens_per_day,
  }
}

/**
 * Invalidate the feature cache for a user (call after subscription changes).
 */
export function invalidateFeatureCache(userId: string): void {
  featureCache.delete(userId)
}
