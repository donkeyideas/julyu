/**
 * Stripe Client — Initializes and returns the Stripe SDK instance.
 * Reads from STRIPE_SECRET_KEY env var, with fallback to ai_model_config table.
 */

import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

let stripeInstance: Stripe | null = null

/**
 * Get or create a Stripe client instance.
 */
export async function getStripeClient(): Promise<Stripe> {
  if (stripeInstance) return stripeInstance

  let secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    // Fallback: read from ai_model_config table
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', 'stripe-secret')
      .single()

    if (data?.api_key_encrypted) {
      secretKey = data.api_key_encrypted
    }
  }

  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Set STRIPE_SECRET_KEY or configure via Admin dashboard.')
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })

  return stripeInstance
}

/**
 * Get the Stripe webhook secret.
 */
export async function getWebhookSecret(): Promise<string> {
  let secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', 'stripe-webhook')
      .single()

    if (data?.api_key_encrypted) {
      secret = data.api_key_encrypted
    }
  }

  if (!secret) {
    throw new Error('Stripe webhook secret not configured')
  }

  return secret
}

/**
 * Reset the cached Stripe instance (call when API key changes).
 */
export function resetStripeClient(): void {
  stripeInstance = null
}
