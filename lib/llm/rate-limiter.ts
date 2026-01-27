/**
 * LLM Rate Limiter
 * Per-user, per-tier rate limiting to prevent abuse and control costs.
 * Uses in-memory tracking with Supabase fallback for persistence.
 */

import type { SubscriptionTier, RateLimitResult, LLMTaskType } from '@/types/llm'
import { RATE_LIMITS } from '@/types/llm'
import { getUserRateLimits } from '@/lib/subscriptions/feature-gate'

// In-memory rate limit tracking
// Key format: `${userId}:daily` or `${userId}:minute`
interface RateLimitEntry {
  count: number
  tokens: number
  windowStart: number
}

const dailyLimits = new Map<string, RateLimitEntry>()
const minuteLimits = new Map<string, RateLimitEntry>()

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

// Periodic cleanup
let cleanupInterval: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()

    for (const [key, entry] of dailyLimits) {
      if (now - entry.windowStart > DAY_MS) {
        dailyLimits.delete(key)
      }
    }

    for (const [key, entry] of minuteLimits) {
      if (now - entry.windowStart > MINUTE_MS) {
        minuteLimits.delete(key)
      }
    }
  }, 30_000) // Clean every 30s

  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref()
  }
}

/**
 * Check if a user is within their rate limits
 */
export function checkRateLimit(
  userId: string,
  tier: SubscriptionTier
): RateLimitResult {
  ensureCleanup()

  const config = RATE_LIMITS[tier]
  const now = Date.now()

  // Check per-minute limit
  const minuteKey = `${userId}:minute`
  const minuteEntry = minuteLimits.get(minuteKey)

  if (minuteEntry && now - minuteEntry.windowStart < MINUTE_MS) {
    if (minuteEntry.count >= config.maxCallsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(minuteEntry.windowStart + MINUTE_MS),
        reason: `Rate limit exceeded: ${config.maxCallsPerMinute} calls per minute for ${tier} tier`,
      }
    }
  }

  // Check daily limit
  const dailyKey = `${userId}:daily`
  const dailyEntry = dailyLimits.get(dailyKey)

  if (dailyEntry && now - dailyEntry.windowStart < DAY_MS) {
    if (dailyEntry.count >= config.maxCallsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(dailyEntry.windowStart + DAY_MS),
        reason: `Daily limit exceeded: ${config.maxCallsPerDay} calls per day for ${tier} tier`,
      }
    }

    if (dailyEntry.tokens >= config.maxTokensPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(dailyEntry.windowStart + DAY_MS),
        reason: `Daily token limit exceeded: ${config.maxTokensPerDay} tokens per day for ${tier} tier`,
      }
    }

    return {
      allowed: true,
      remaining: config.maxCallsPerDay - dailyEntry.count,
      resetAt: new Date(dailyEntry.windowStart + DAY_MS),
    }
  }

  return {
    allowed: true,
    remaining: config.maxCallsPerDay,
    resetAt: new Date(now + DAY_MS),
  }
}

/**
 * Record a usage event against the rate limiter
 */
export function recordUsage(
  userId: string,
  tokensUsed: number
): void {
  ensureCleanup()

  const now = Date.now()

  // Update minute counter
  const minuteKey = `${userId}:minute`
  const minuteEntry = minuteLimits.get(minuteKey)

  if (minuteEntry && now - minuteEntry.windowStart < MINUTE_MS) {
    minuteEntry.count++
    minuteEntry.tokens += tokensUsed
  } else {
    minuteLimits.set(minuteKey, { count: 1, tokens: tokensUsed, windowStart: now })
  }

  // Update daily counter
  const dailyKey = `${userId}:daily`
  const dailyEntry = dailyLimits.get(dailyKey)

  if (dailyEntry && now - dailyEntry.windowStart < DAY_MS) {
    dailyEntry.count++
    dailyEntry.tokens += tokensUsed
  } else {
    dailyLimits.set(dailyKey, { count: 1, tokens: tokensUsed, windowStart: now })
  }
}

/**
 * Get current usage stats for a user
 */
export function getUserUsage(userId: string): {
  dailyCalls: number
  dailyTokens: number
  minuteCalls: number
} {
  const now = Date.now()

  const dailyEntry = dailyLimits.get(`${userId}:daily`)
  const minuteEntry = minuteLimits.get(`${userId}:minute`)

  return {
    dailyCalls: dailyEntry && now - dailyEntry.windowStart < DAY_MS ? dailyEntry.count : 0,
    dailyTokens: dailyEntry && now - dailyEntry.windowStart < DAY_MS ? dailyEntry.tokens : 0,
    minuteCalls: minuteEntry && now - minuteEntry.windowStart < MINUTE_MS ? minuteEntry.count : 0,
  }
}

/**
 * Check rate limits using dynamic plan-based limits from the database.
 * Falls back to tier-based limits if the DB lookup fails.
 */
export async function checkRateLimitDynamic(
  userId: string,
  fallbackTier: SubscriptionTier = 'free'
): Promise<RateLimitResult> {
  try {
    const limits = await getUserRateLimits(userId)

    ensureCleanup()
    const now = Date.now()

    // Check per-minute limit
    const minuteKey = `${userId}:minute`
    const minuteEntry = minuteLimits.get(minuteKey)

    if (minuteEntry && now - minuteEntry.windowStart < MINUTE_MS) {
      if (minuteEntry.count >= limits.maxCallsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(minuteEntry.windowStart + MINUTE_MS),
          reason: `Rate limit exceeded: ${limits.maxCallsPerMinute} calls per minute`,
        }
      }
    }

    // Check daily limit
    const dailyKey = `${userId}:daily`
    const dailyEntry = dailyLimits.get(dailyKey)

    if (dailyEntry && now - dailyEntry.windowStart < DAY_MS) {
      if (dailyEntry.count >= limits.maxCallsPerDay) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(dailyEntry.windowStart + DAY_MS),
          reason: `Daily limit exceeded: ${limits.maxCallsPerDay} calls per day`,
        }
      }

      if (dailyEntry.tokens >= limits.maxTokensPerDay) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(dailyEntry.windowStart + DAY_MS),
          reason: `Daily token limit exceeded: ${limits.maxTokensPerDay} tokens per day`,
        }
      }

      return {
        allowed: true,
        remaining: limits.maxCallsPerDay - dailyEntry.count,
        resetAt: new Date(dailyEntry.windowStart + DAY_MS),
      }
    }

    return {
      allowed: true,
      remaining: limits.maxCallsPerDay,
      resetAt: new Date(now + DAY_MS),
    }
  } catch {
    // Fallback to static tier-based limits
    return checkRateLimit(userId, fallbackTier)
  }
}
