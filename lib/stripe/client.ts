/**
 * Stripe Client — Initializes and returns the Stripe SDK instance.
 * Reads from STRIPE_SECRET_KEY env var, with fallback to ai_model_config table.
 */

import Stripe from 'stripe'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

const ALGORITHM = 'aes-256-cbc'

function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return key.substring(0, 32).padEnd(32, '0')
}

function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') return ''
    const parts = encryptedText.split(':')
    if (parts.length !== 2 || parts[0].length !== 32) return ''
    const iv = Buffer.from(parts[0], 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getEncryptionKey(), 'utf8'), iv)
    let decrypted = decipher.update(parts[1], 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error: any) {
    console.error('[Stripe] Decryption error:', error.message)
    return ''
  }
}

let stripeInstance: Stripe | null = null

/**
 * Get or create a Stripe client instance.
 */
export async function getStripeClient(): Promise<Stripe> {
  if (stripeInstance) return stripeInstance

  let secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    // Fallback: read from ai_model_config table (keys are stored encrypted)
    const supabase = createServiceRoleClient() as any
    const { data } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', 'stripe-secret')
      .single()

    if (data?.api_key_encrypted) {
      secretKey = decrypt(data.api_key_encrypted)
      if (!secretKey) {
        throw new Error('Failed to decrypt Stripe secret key from database')
      }
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
    const supabase = createServiceRoleClient() as any
    const { data } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', 'stripe-webhook')
      .single()

    if (data?.api_key_encrypted) {
      secret = decrypt(data.api_key_encrypted)
      if (!secret) {
        throw new Error('Failed to decrypt Stripe webhook secret from database')
      }
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
