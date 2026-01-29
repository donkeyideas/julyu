import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Store Portal Authentication Helper
 * Verifies store owner access and returns store owner data
 */

export interface StoreOwner {
  id: string
  user_id: string
  business_name: string
  business_type: 'bodega' | 'convenience' | 'grocery' | 'market'
  tax_id?: string
  business_license?: string
  business_address?: string
  business_phone?: string
  business_email?: string
  application_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
  approval_date?: string
  reviewed_by?: string
  rejection_reason?: string
  commission_rate: number
  subscription_tier_id?: string
  stripe_account_id?: string
  stripe_account_status?: string
  accepts_orders: boolean
  auto_accept_orders: boolean
  created_at: string
  updated_at: string
}

export interface StoreOwnerAuthResult {
  storeOwner?: StoreOwner
  user?: any
  error?: string
  status?: number
}

/**
 * Get authenticated store owner from request
 * Verifies user is logged in and has an approved store owner account
 */
export async function getStoreOwner(request?: NextRequest): Promise<StoreOwnerAuthResult> {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        error: 'Unauthorized - Please log in',
        status: 401
      }
    }

    // Get store owner record
    const { data: storeOwner, error: storeError } = await supabase
      .from('store_owners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (storeError || !storeOwner) {
      return {
        error: 'Not a store owner - Please apply to become a store owner',
        status: 403
      }
    }

    // Check if store owner is approved
    if (storeOwner.application_status !== 'approved') {
      const statusMessages: Record<string, string> = {
        pending: 'Your application is pending review',
        under_review: 'Your application is currently under review',
        rejected: 'Your application was rejected',
        suspended: 'Your account has been suspended'
      }

      return {
        error: statusMessages[storeOwner.application_status] || 'Account not approved',
        status: 403
      }
    }

    return {
      storeOwner: storeOwner as StoreOwner,
      user
    }
  } catch (error) {
    console.error('Store owner auth error:', error)
    return {
      error: 'Authentication failed',
      status: 500
    }
  }
}

/**
 * Get store owner with less strict checks (for application status page)
 * Returns store owner even if not approved
 */
export async function getStoreOwnerAnyStatus(request?: NextRequest): Promise<StoreOwnerAuthResult> {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        error: 'Unauthorized - Please log in',
        status: 401
      }
    }

    const { data: storeOwner, error: storeError } = await supabase
      .from('store_owners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (storeError || !storeOwner) {
      return {
        error: 'Not a store owner',
        status: 403
      }
    }

    return {
      storeOwner: storeOwner as StoreOwner,
      user
    }
  } catch (error) {
    console.error('Store owner auth error:', error)
    return {
      error: 'Authentication failed',
      status: 500
    }
  }
}

/**
 * Check if user has an existing store owner account
 */
export async function hasStoreOwnerAccount(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('store_owners')
      .select('id')
      .eq('user_id', userId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Check store owner account error:', error)
    return false
  }
}

/**
 * Get store owner's bodega stores
 */
export async function getStoreOwnerStores(storeOwnerId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('bodega_stores')
      .select('*')
      .eq('store_owner_id', storeOwnerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get stores error:', error)
      return { stores: [], error: error.message }
    }

    return { stores: data || [], error: null }
  } catch (error) {
    console.error('Get stores error:', error)
    return { stores: [], error: 'Failed to fetch stores' }
  }
}

/**
 * Verify admin access for store management
 */
export async function verifyAdminAccess(): Promise<{ isAdmin: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Unauthorized' }
    }

    // Get user profile with subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { isAdmin: false, error: 'User profile not found' }
    }

    // Only enterprise tier users have admin access
    const isAdmin = profile.subscription_tier === 'enterprise'

    if (!isAdmin) {
      return { isAdmin: false, error: 'Admin access required' }
    }

    return { isAdmin: true }
  } catch (error) {
    console.error('Verify admin access error:', error)
    return { isAdmin: false, error: 'Access verification failed' }
  }
}
