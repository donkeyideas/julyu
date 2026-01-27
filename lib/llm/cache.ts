/**
 * LLM Response Cache
 * Two-tier caching: in-memory (fast) + Supabase (persistent).
 * Reduces duplicate API calls and costs.
 */

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import type { LLMResponse, LLMCacheOptions } from '@/types/llm'

const DEFAULT_TTL_SECONDS = 900 // 15 minutes

// In-memory cache (per-process, lost on restart)
const memoryCache = new Map<string, { response: LLMResponse; expiresAt: number }>()

// Periodic cleanup of expired entries
let cleanupInterval: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryCache) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key)
      }
    }
  }, 60_000) // Clean every 60s
  // Don't block process exit
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref()
  }
}

/**
 * Generate a deterministic cache key from model + messages
 */
export function generateCacheKey(
  model: string,
  messages: Array<{ role: string; content: string | unknown[] }>,
  temperature?: number
): string {
  // Include model, message content, and temperature in the key
  const payload = JSON.stringify({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    })),
    temperature: temperature ?? 0.7,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Get a cached response
 */
export async function getCachedResponse(
  cacheKey: string,
  options?: LLMCacheOptions
): Promise<LLMResponse | null> {
  if (options?.enabled === false) return null

  ensureCleanup()

  // 1. Check in-memory cache first
  const memEntry = memoryCache.get(cacheKey)
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return { ...memEntry.response, cached: true }
  }

  // 2. Check Supabase cache
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('llm_cache')
      .select('response, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!error && data?.response) {
      const response = data.response as unknown as LLMResponse

      // Promote to memory cache
      const ttl = options?.ttlSeconds || DEFAULT_TTL_SECONDS
      memoryCache.set(cacheKey, {
        response,
        expiresAt: Date.now() + ttl * 1000,
      })

      return { ...response, cached: true }
    }
  } catch {
    // Cache miss or DB unavailable — not an error
  }

  return null
}

/**
 * Store a response in cache
 */
export async function setCachedResponse(
  cacheKey: string,
  modelId: string,
  response: LLMResponse,
  options?: LLMCacheOptions
): Promise<void> {
  if (options?.enabled === false) return

  ensureCleanup()

  const ttl = options?.ttlSeconds || DEFAULT_TTL_SECONDS
  const expiresAt = new Date(Date.now() + ttl * 1000)

  // 1. Store in memory
  memoryCache.set(cacheKey, {
    response,
    expiresAt: expiresAt.getTime(),
  })

  // 2. Store in Supabase (fire-and-forget)
  try {
    const supabase = createServerClient()
    await supabase
      .from('llm_cache')
      .upsert(
        {
          cache_key: cacheKey,
          model_id: modelId,
          response: response as unknown as Record<string, unknown>,
          token_count: response.usage.totalTokens,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'cache_key' }
      )
  } catch {
    // DB write failure is non-critical
  }
}

/**
 * Clear expired cache entries from Supabase
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('llm_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[LLM Cache] Error clearing expired entries:', error)
      return 0
    }

    return data?.length || 0
  } catch {
    return 0
  }
}
