/**
 * Scraper Health Logging
 *
 * Every external-source call (Flipp / Target / Kroger / Walmart / OFF /
 * DeepSeek classifier / geocoding) logs a single event row to
 * scraper_health_events. The admin maintenance dashboard reads from there.
 *
 * Design notes:
 *   - Writes are FIRE-AND-FORGET — we never await logEvent() in the request
 *     path. If logging fails, the scraper call still succeeds.
 *   - We classify errors into a small enum of `error_kind` values so the
 *     dashboard can show "X bot-blocked calls today" without parsing strings.
 *   - The detection rules for error_kind live next to the loggers so we can
 *     evolve them without touching every caller.
 */

export type ScraperSource =
  | 'flipp'
  | 'target'
  | 'kroger'
  | 'walmart'
  | 'off' // Open Food Facts Prices
  | 'equivalence' // DeepSeek classifier
  | 'geocoding'
  | 'bodega'
  | 'albertsons'

export type ErrorKind =
  | 'bot_blocked'
  | 'rate_limited'
  | 'no_key'
  | 'timeout'
  | 'parse_error'
  | 'no_results'
  | 'http_error'
  | 'unknown'

export interface HealthEvent {
  source: ScraperSource
  operation: string
  success: boolean
  httpStatus?: number
  errorMessage?: string
  errorKind?: ErrorKind
  latencyMs?: number
  query?: string
  zip?: string
  resultCount?: number
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
}

const MAX_ERROR_LEN = 500

function trimError(msg: string | undefined): string | undefined {
  if (!msg) return undefined
  return msg.length > MAX_ERROR_LEN ? msg.substring(0, MAX_ERROR_LEN) + '…' : msg
}

/**
 * Classify a thrown error into a stable ErrorKind. Pass through HTTP status,
 * response body preview, and the error message — whichever we have.
 *
 * IMPORTANT: body-content checks run FIRST. A 403 with a CAPTCHA challenge body
 * is bot-detection, not a missing key. Vendors like Target / Akamai routinely
 * return 403 with a CAPTCHA JSON body — if we labeled that "no_key" the admin
 * would chase a phantom missing-credential bug.
 */
export function detectErrorKind(args: {
  status?: number
  bodyPreview?: string
  message?: string
}): ErrorKind {
  const { status, bodyPreview, message } = args
  const blob = `${message || ''} ${bodyPreview || ''}`.toLowerCase()

  // CONTENT-BASED checks first — these are more specific than status alone.
  if (/captcha|captcharelativeurl|akamai|cloudflare|datadome|perimeterx|bot.?(check|detect|protect)|<!doctype html|toadmash/.test(blob)) {
    return 'bot_blocked'
  }
  if (/timeout|etimedout|econnreset|econnrefused/.test(blob)) return 'timeout'
  if (/unexpected token|invalid json|parse error|cannot read prop/.test(blob)) return 'parse_error'
  if (/api key|credentials|not configured|missing key|invalid.{0,20}key/.test(blob)) return 'no_key'

  // STATUS-BASED fallbacks — only when the body didn't reveal anything specific.
  if (status === 429) return 'rate_limited'
  if (status === 401) return 'no_key' // 401 = unauthenticated; usually a real auth miss
  if (status === 403) return 'bot_blocked' // 403 with no captcha body still smells like access denial
  if (status && status >= 500) return 'http_error'

  return 'unknown'
}

/**
 * Fire-and-forget: write a single health event row. Never throws.
 * Callers should NOT await this in the hot path — just call it.
 */
export function logEvent(event: HealthEvent): void {
  // Defer all I/O so we never block the caller. Errors are swallowed.
  ;(async () => {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any

      await supabase.from('scraper_health_events').insert({
        source: event.source,
        operation: event.operation,
        success: event.success,
        http_status: event.httpStatus ?? null,
        error_message: trimError(event.errorMessage),
        error_kind: event.errorKind ?? null,
        latency_ms: event.latencyMs ?? null,
        query: event.query ?? null,
        zip: event.zip ?? null,
        result_count: event.resultCount ?? null,
        input_tokens: event.inputTokens ?? null,
        output_tokens: event.outputTokens ?? null,
        cost_usd: event.costUsd ?? null,
      })
    } catch {
      // Logging must never break the scraper. Drop on the floor.
    }
  })()
}

/**
 * Convenience wrapper: time an async operation and log success/failure once.
 *
 *   const result = await trackOperation(
 *     { source: 'flipp', operation: 'search_items', query, zip },
 *     () => flippClient.searchItems(...)
 *   )
 *
 * The wrapped function's return value is passed through unchanged. Errors
 * are re-thrown after being logged.
 */
export async function trackOperation<T>(
  context: Omit<HealthEvent, 'success' | 'latencyMs'>,
  fn: () => Promise<T>,
  options?: {
    /** Count the result's length (if array) into result_count */
    countResult?: (result: T) => number
  },
): Promise<T> {
  const startedAt = Date.now()
  try {
    const result = await fn()
    const count =
      options?.countResult?.(result) ??
      (Array.isArray(result) ? result.length : undefined)

    logEvent({
      ...context,
      success: count === undefined || count > 0 ? true : true,
      latencyMs: Date.now() - startedAt,
      resultCount: count,
      // No-results isn't a hard failure but we mark error_kind so the dashboard
      // can surface "zero-result queries" as a separate signal.
      errorKind: count === 0 ? 'no_results' : context.errorKind,
    })
    return result
  } catch (e: any) {
    const status = e?.response?.status
    const bodyPreview =
      typeof e?.response?.data === 'string'
        ? e.response.data
        : JSON.stringify(e?.response?.data || {}).substring(0, 200)
    logEvent({
      ...context,
      success: false,
      latencyMs: Date.now() - startedAt,
      httpStatus: status,
      errorMessage: e?.message || String(e),
      errorKind:
        context.errorKind ??
        detectErrorKind({ status, bodyPreview, message: e?.message }),
    })
    throw e
  }
}
