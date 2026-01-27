/**
 * Promo Codes Library — CRUD + validation + redemption for promo codes.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { PromoCode } from '@/shared/types/subscriptions'

/**
 * Get all promo codes (for admin).
 */
export async function getPromoCodes(): Promise<PromoCode[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch promo codes: ${error.message}`)
  return (data ?? []) as unknown as PromoCode[]
}

/**
 * Create a new promo code.
 */
export async function createPromoCode(input: {
  code: string
  description?: string
  type: 'percentage' | 'fixed' | 'free_months'
  value: number
  max_uses?: number | null
  valid_from?: string | null
  valid_until?: string | null
  applicable_plans?: string[]
}): Promise<PromoCode> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      max_uses: input.max_uses ?? null,
      valid_from: input.valid_from ?? null,
      valid_until: input.valid_until ?? null,
      applicable_plans: input.applicable_plans ?? [],
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to create promo code: ${error?.message}`)
  return data as unknown as PromoCode
}

/**
 * Update an existing promo code.
 */
export async function updatePromoCode(
  id: string,
  updates: Partial<{
    code: string
    description: string | null
    type: 'percentage' | 'fixed' | 'free_months'
    value: number
    max_uses: number | null
    valid_from: string | null
    valid_until: string | null
    applicable_plans: string[]
    is_active: boolean
  }>
): Promise<PromoCode> {
  const supabase = createServiceRoleClient()

  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if (payload.code && typeof payload.code === 'string') {
    payload.code = (payload.code as string).toUpperCase()
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to update promo code: ${error?.message}`)
  return data as unknown as PromoCode
}

/**
 * Delete a promo code.
 */
export async function deletePromoCode(id: string): Promise<void> {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('promo_codes').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete promo code: ${error.message}`)
}

/**
 * Validate a promo code for a specific plan.
 * Returns the promo code if valid, or throws an error.
 */
export async function validatePromoCode(
  code: string,
  planSlug: string
): Promise<PromoCode> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) {
    throw new Error('Invalid promo code')
  }

  const promo = data as unknown as PromoCode

  if (!promo.is_active) {
    throw new Error('This promo code is no longer active')
  }

  if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
    throw new Error('This promo code is not yet valid')
  }

  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    throw new Error('This promo code has expired')
  }

  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
    throw new Error('This promo code has reached its maximum number of uses')
  }

  const applicablePlans = Array.isArray(promo.applicable_plans) ? promo.applicable_plans : []
  if (applicablePlans.length > 0 && !applicablePlans.includes(planSlug)) {
    throw new Error('This promo code is not applicable to the selected plan')
  }

  return promo
}

/**
 * Check if a user has already redeemed a specific promo code.
 */
export async function hasUserRedeemedCode(userId: string, promoCodeId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('promo_code_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('promo_code_id', promoCodeId)
    .single()

  return !!data
}

/**
 * Redeem a promo code for a user. Increments usage and creates a redemption record.
 * The UNIQUE(user_id, promo_code_id) constraint prevents double-use.
 */
export async function redeemPromoCode(
  userId: string,
  promoCodeId: string,
  subscriptionId?: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Insert redemption record (will fail on duplicate due to UNIQUE constraint)
  const { error: redemptionError } = await supabase
    .from('promo_code_redemptions')
    .insert({
      user_id: userId,
      promo_code_id: promoCodeId,
      subscription_id: subscriptionId ?? null,
    })

  if (redemptionError) {
    if (redemptionError.code === '23505') {
      throw new Error('You have already used this promo code')
    }
    throw new Error(`Failed to redeem promo code: ${redemptionError.message}`)
  }

  // Increment current_uses
  const { data: current } = await supabase
    .from('promo_codes')
    .select('current_uses')
    .eq('id', promoCodeId)
    .single()

  const currentUses = (current as { current_uses: number } | null)?.current_uses ?? 0

  await supabase
    .from('promo_codes')
    .update({ current_uses: currentUses + 1 })
    .eq('id', promoCodeId)
}
