/**
 * Consent Manager
 * Manages user consent for data processing activities.
 * Supports GDPR/CCPA consent types with audit trail.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export type ConsentType = 'data_aggregation' | 'ai_training' | 'marketing' | 'analytics'

export interface ConsentRecord {
  id: string
  consent_type: ConsentType
  granted: boolean
  granted_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface ConsentStatus {
  data_aggregation: boolean
  ai_training: boolean
  marketing: boolean
  analytics: boolean
}

const DEFAULT_CONSENT: ConsentStatus = {
  data_aggregation: false,
  ai_training: false,
  marketing: false,
  analytics: false,
}

/**
 * Get all consent records for a user.
 */
export async function getUserConsent(userId: string): Promise<ConsentStatus> {
  const supabase = createServiceRoleClient()

  const { data: records } = await supabase
    .from('user_consent')
    .select('consent_type, granted')
    .eq('user_id', userId)

  const rows = (records ?? []) as Array<{ consent_type: string; granted: boolean }>

  const status = { ...DEFAULT_CONSENT }
  for (const row of rows) {
    if (row.consent_type in status) {
      status[row.consent_type as ConsentType] = row.granted
    }
  }

  return status
}

/**
 * Update a single consent type for a user.
 */
export async function updateConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  const now = new Date().toISOString()

  // Upsert based on user_id + consent_type unique index
  const { error } = await supabase
    .from('user_consent')
    .upsert(
      {
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: granted ? now : null,
        revoked_at: granted ? null : now,
        ip_address: ipAddress || null,
      },
      { onConflict: 'user_id,consent_type' }
    )

  if (error) {
    console.error('[ConsentManager] Update error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update multiple consent types at once.
 */
export async function updateBulkConsent(
  userId: string,
  consents: Partial<ConsentStatus>,
  ipAddress?: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  const entries = Object.entries(consents) as Array<[ConsentType, boolean]>
  for (const [type, granted] of entries) {
    const result = await updateConsent(userId, type, granted, ipAddress)
    if (!result.success && result.error) {
      errors.push(`${type}: ${result.error}`)
    }
  }

  return { success: errors.length === 0, errors }
}

/**
 * Check if a user has granted a specific consent.
 */
export async function hasConsent(
  userId: string,
  consentType: ConsentType
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('user_consent')
    .select('granted')
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .single()

  const row = data as { granted: boolean } | null
  return row?.granted ?? false
}

/**
 * Revoke all consents for a user (used during account deletion).
 */
export async function revokeAllConsent(userId: string): Promise<void> {
  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  await supabase
    .from('user_consent')
    .update({ granted: false, revoked_at: now })
    .eq('user_id', userId)
}
