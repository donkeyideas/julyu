/**
 * Rate Limiting Service for RapidAPI
 *
 * Tracks API usage and enforces limits to prevent overage charges
 */

import { createServerClient } from '@/lib/supabase/server'

export interface RateLimitConfig {
  api_name: 'tesco' | 'grocery-prices'
  daily_limit: number
  monthly_limit: number
  alert_threshold_50: boolean
  alert_threshold_75: boolean
  alert_threshold_90: boolean
  is_enabled: boolean
}

export interface UsageStats {
  api_name: string
  calls_today: number
  calls_this_month: number
  daily_limit: number
  monthly_limit: number
  daily_percentage: number
  monthly_percentage: number
  can_make_call: boolean
  limit_reached: boolean
  alert_triggered: boolean
}

/**
 * Check if an API call can be made (rate limit check)
 */
export async function canMakeApiCall(apiName: 'tesco' | 'grocery-prices'): Promise<{
  allowed: boolean
  reason?: string
  usage?: UsageStats
}> {
  try {
    const supabase = createServerClient()

    // Check if API is enabled
    const { data: config } = await supabase
      .from('ai_model_config')
      .select('config')
      .eq('model_name', 'rapidapi')
      .eq('is_active', true)
      .single()

    if (!config) {
      return { allowed: false, reason: 'RapidAPI not configured' }
    }

    const isEnabled = apiName === 'tesco'
      ? config.config?.tescoEnabled
      : config.config?.groceryPricesEnabled

    if (!isEnabled) {
      return { allowed: false, reason: `${apiName} API is not enabled` }
    }

    // Get rate limit configuration
    const { data: rateConfig } = await supabase
      .from('rate_limit_config')
      .select('*')
      .eq('api_name', apiName)
      .single()

    if (!rateConfig || !rateConfig.is_enabled) {
      // No rate limiting configured - allow call
      return { allowed: true }
    }

    // Get usage stats for today and this month
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM

    const { data: usage } = await supabase
      .from('api_usage_tracking')
      .select('calls_count')
      .eq('api_name', apiName)
      .gte('date', today)

    const callsToday = usage?.reduce((sum, u) => sum + (u.calls_count || 0), 0) || 0

    const { data: monthUsage } = await supabase
      .from('api_usage_tracking')
      .select('calls_count')
      .eq('api_name', apiName)
      .gte('date', `${thisMonth}-01`)

    const callsThisMonth = monthUsage?.reduce((sum, u) => sum + (u.calls_count || 0), 0) || 0

    const dailyPercentage = (callsToday / rateConfig.daily_limit) * 100
    const monthlyPercentage = (callsThisMonth / rateConfig.monthly_limit) * 100

    const usageStats: UsageStats = {
      api_name: apiName,
      calls_today: callsToday,
      calls_this_month: callsThisMonth,
      daily_limit: rateConfig.daily_limit,
      monthly_limit: rateConfig.monthly_limit,
      daily_percentage: dailyPercentage,
      monthly_percentage: monthlyPercentage,
      can_make_call: callsToday < rateConfig.daily_limit && callsThisMonth < rateConfig.monthly_limit,
      limit_reached: callsToday >= rateConfig.daily_limit || callsThisMonth >= rateConfig.monthly_limit,
      alert_triggered: dailyPercentage >= 50 || monthlyPercentage >= 50,
    }

    // Check if limits are reached
    if (callsToday >= rateConfig.daily_limit) {
      return {
        allowed: false,
        reason: `Daily limit reached (${callsToday}/${rateConfig.daily_limit})`,
        usage: usageStats,
      }
    }

    if (callsThisMonth >= rateConfig.monthly_limit) {
      return {
        allowed: false,
        reason: `Monthly limit reached (${callsThisMonth}/${rateConfig.monthly_limit})`,
        usage: usageStats,
      }
    }

    return { allowed: true, usage: usageStats }
  } catch (error: any) {
    console.error('[Rate Limiter] Error checking rate limit:', error)
    // On error, allow the call but log it
    return { allowed: true, reason: 'Rate limit check failed, allowing call' }
  }
}

/**
 * Track an API call (increment counter)
 */
export async function trackApiCall(apiName: 'tesco' | 'grocery-prices', callSuccessful: boolean = true): Promise<void> {
  try {
    const supabase = createServerClient()
    const today = new Date().toISOString().split('T')[0]

    // Get or create today's usage record
    const { data: existing } = await supabase
      .from('api_usage_tracking')
      .select('*')
      .eq('api_name', apiName)
      .eq('date', today)
      .single()

    if (existing) {
      // Update existing record
      await supabase
        .from('api_usage_tracking')
        .update({
          calls_count: existing.calls_count + 1,
          successful_calls: callSuccessful ? existing.successful_calls + 1 : existing.successful_calls,
          failed_calls: !callSuccessful ? existing.failed_calls + 1 : existing.failed_calls,
          last_call_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new record
      await supabase
        .from('api_usage_tracking')
        .insert({
          api_name: apiName,
          date: today,
          calls_count: 1,
          successful_calls: callSuccessful ? 1 : 0,
          failed_calls: !callSuccessful ? 1 : 0,
          last_call_at: new Date().toISOString(),
        })
    }

    console.log(`[Rate Limiter] Tracked ${apiName} API call (success: ${callSuccessful})`)
  } catch (error: any) {
    console.error('[Rate Limiter] Error tracking API call:', error)
  }
}

/**
 * Get usage statistics for all APIs
 */
export async function getUsageStats(): Promise<{
  tesco: UsageStats | null
  groceryPrices: UsageStats | null
}> {
  try {
    const supabase = createServerClient()
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7)

    // Get Tesco stats
    const tescoCheck = await canMakeApiCall('tesco')
    const groceryCheck = await canMakeApiCall('grocery-prices')

    return {
      tesco: tescoCheck.usage || null,
      groceryPrices: groceryCheck.usage || null,
    }
  } catch (error: any) {
    console.error('[Rate Limiter] Error getting usage stats:', error)
    return { tesco: null, groceryPrices: null }
  }
}

/**
 * Reset rate limits (for testing or new billing cycle)
 */
export async function resetRateLimits(apiName?: 'tesco' | 'grocery-prices'): Promise<void> {
  try {
    const supabase = createServerClient()

    if (apiName) {
      // Reset specific API
      await supabase
        .from('api_usage_tracking')
        .delete()
        .eq('api_name', apiName)
    } else {
      // Reset all
      await supabase
        .from('api_usage_tracking')
        .delete()
        .in('api_name', ['tesco', 'grocery-prices'])
    }

    console.log(`[Rate Limiter] Reset rate limits for ${apiName || 'all APIs'}`)
  } catch (error: any) {
    console.error('[Rate Limiter] Error resetting rate limits:', error)
  }
}
