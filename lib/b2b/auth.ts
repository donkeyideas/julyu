/**
 * B2B API Key Authentication
 * Validates API keys and tracks usage for B2B clients.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface B2BClient {
  id: string
  company_name: string
  tier: 'base' | 'growth' | 'enterprise'
  monthly_call_limit: number
  calls_this_month: number
  is_active: boolean
}

interface AuthResult {
  authenticated: boolean
  client?: B2BClient
  error?: string
}

/**
 * Authenticate a B2B API request using the API key in the Authorization header.
 */
export async function authenticateB2B(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header. Use: Bearer <api_key>' }
  }

  const apiKey = authHeader.substring(7)

  if (!apiKey || apiKey.length < 10) {
    return { authenticated: false, error: 'Invalid API key format' }
  }

  const supabase = createServiceRoleClient() as any

  const { data, error } = await supabase
    .from('b2b_clients')
    .select('id, company_name, tier, monthly_call_limit, calls_this_month, is_active')
    .eq('api_key', apiKey)
    .single()

  if (error || !data) {
    return { authenticated: false, error: 'Invalid API key' }
  }

  const client = data as B2BClient

  if (!client.is_active) {
    return { authenticated: false, error: 'API key is deactivated' }
  }

  if (client.calls_this_month >= client.monthly_call_limit) {
    return { authenticated: false, error: 'Monthly API call limit reached' }
  }

  return { authenticated: true, client }
}

/**
 * Log a B2B API call and increment the monthly counter.
 */
export async function logB2BCall(
  clientId: string,
  endpoint: string,
  requestParams: Record<string, unknown>,
  responseSize: number,
  latencyMs: number
): Promise<void> {
  const supabase = createServiceRoleClient() as any

  // Log the API call
  await supabase.from('b2b_api_logs').insert({
    client_id: clientId,
    endpoint,
    request_params: requestParams,
    response_size: responseSize,
    latency_ms: latencyMs,
  })

  // Increment monthly call counter
  // Use raw RPC or just increment via update
  const { data: current } = await supabase
    .from('b2b_clients')
    .select('calls_this_month')
    .eq('id', clientId)
    .single()

  const currentCalls = (current as { calls_this_month: number } | null)?.calls_this_month ?? 0

  await supabase
    .from('b2b_clients')
    .update({ calls_this_month: currentCalls + 1 })
    .eq('id', clientId)
}
