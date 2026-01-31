import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ApiCallLog {
  apiName: string           // 'kroger', 'walmart', 'stripe', 'doordash', 'deepseek', etc.
  endpoint?: string         // The specific endpoint called
  method?: string           // GET, POST, PUT, DELETE
  requestParams?: Record<string, unknown>  // Sanitized params (no secrets!)
  statusCode?: number
  responseTimeMs?: number
  success?: boolean
  errorMessage?: string
  cost?: number             // Cost of the call if applicable
  tokensUsed?: number       // For LLM APIs
  userId?: string           // User who triggered the call
  useCase?: string          // 'price_comparison', 'receipt_scan', 'checkout', etc.
  metadata?: Record<string, unknown>
}

/**
 * Log an API call to the database for tracking and analytics
 * This is non-blocking and won't fail the parent request
 */
export async function logApiCall(log: ApiCallLog): Promise<void> {
  try {
    const supabase = createServiceRoleClient() as any

    // Sanitize request params - remove any potential secrets
    const sanitizedParams = log.requestParams
      ? sanitizeParams(log.requestParams)
      : undefined

    await supabase.from('api_call_logs').insert({
      api_name: log.apiName,
      endpoint: log.endpoint,
      method: log.method || 'GET',
      request_params: sanitizedParams,
      status_code: log.statusCode,
      response_time_ms: log.responseTimeMs,
      success: log.success ?? true,
      error_message: log.errorMessage,
      cost: log.cost || 0,
      tokens_used: log.tokensUsed,
      user_id: log.userId,
      use_case: log.useCase,
      metadata: log.metadata,
    })
  } catch (error) {
    // Don't fail the parent request if logging fails
    console.error('[API Logger] Failed to log API call:', error)
  }
}

/**
 * Helper to time an API call and log it
 */
export async function withApiLogging<T>(
  apiName: string,
  endpoint: string,
  fn: () => Promise<T>,
  options?: Partial<ApiCallLog>
): Promise<T> {
  const startTime = Date.now()
  let success = true
  let errorMessage: string | undefined
  let statusCode: number | undefined

  try {
    const result = await fn()
    return result
  } catch (error) {
    success = false
    errorMessage = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    const responseTimeMs = Date.now() - startTime

    // Log async - don't await
    logApiCall({
      apiName,
      endpoint,
      success,
      errorMessage,
      statusCode,
      responseTimeMs,
      ...options,
    })
  }
}

/**
 * Remove sensitive data from request params before logging
 */
function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password', 'secret', 'token', 'api_key', 'apikey', 'authorization',
    'auth', 'key', 'credential', 'private', 'bearer', 'access_token',
    'refresh_token', 'client_secret', 'card_number', 'cvv', 'ssn'
  ]

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(params)) {
    const keyLower = key.toLowerCase()
    if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeParams(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Get API usage statistics
 */
export async function getApiStats(options?: {
  apiName?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const supabase = createServiceRoleClient() as any

  let query = supabase
    .from('api_call_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.apiName) {
    query = query.eq('api_name', options.apiName)
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString())
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString())
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data, count }
}
