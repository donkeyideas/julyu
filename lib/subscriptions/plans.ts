/**
 * Subscription Plans Library — CRUD operations for subscription plans.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { SubscriptionPlan, FeatureKey } from '@/shared/types/subscriptions'

/**
 * Get all active plans, sorted by sort_order (for pricing page).
 */
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch active plans: ${error.message}`)
  return (data ?? []) as unknown as SubscriptionPlan[]
}

/**
 * Get all plans including inactive (for admin).
 */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch plans: ${error.message}`)
  return (data ?? []) as unknown as SubscriptionPlan[]
}

/**
 * Get a plan by its slug.
 */
export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as unknown as SubscriptionPlan
}

/**
 * Get a plan by its ID.
 */
export async function getPlanById(id: string): Promise<SubscriptionPlan | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as SubscriptionPlan
}

/**
 * Update a plan's fields.
 */
export async function updatePlan(
  id: string,
  updates: Partial<{
    name: string
    price: number
    billing_interval: 'month' | 'year'
    stripe_price_id: string | null
    features: FeatureKey[]
    description: string | null
    is_active: boolean
    is_self_serve: boolean
    sort_order: number
    max_calls_per_day: number
    max_calls_per_minute: number
    max_tokens_per_day: number
    highlight: boolean
  }>
): Promise<SubscriptionPlan> {
  // Validate stripe_price_id format if provided
  if (updates.stripe_price_id && !updates.stripe_price_id.startsWith('price_')) {
    throw new Error(`Invalid Stripe Price ID. Must start with "price_" (you may have entered a Product ID starting with "prod_"). Go to Stripe > Product > click the price row to copy the Price ID.`)
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to update plan: ${error?.message}`)
  return data as unknown as SubscriptionPlan
}

/**
 * Toggle a specific feature on/off for a plan.
 */
export async function togglePlanFeature(
  planId: string,
  featureKey: FeatureKey,
  enabled: boolean
): Promise<SubscriptionPlan> {
  const plan = await getPlanById(planId)
  if (!plan) throw new Error('Plan not found')

  const currentFeatures = Array.isArray(plan.features) ? [...plan.features] : []

  let updatedFeatures: FeatureKey[]
  if (enabled) {
    if (!currentFeatures.includes(featureKey)) {
      updatedFeatures = [...currentFeatures, featureKey]
    } else {
      updatedFeatures = currentFeatures
    }
  } else {
    updatedFeatures = currentFeatures.filter(f => f !== featureKey)
  }

  return updatePlan(planId, { features: updatedFeatures })
}
