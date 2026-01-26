/**
 * AI Usage Tracker
 * Tracks all AI API calls for cost analysis and training data collection
 */

import { createClient } from '@/lib/supabase/client'

export interface AIUsageRecord {
  model_name: string
  provider: string
  use_case: string
  input_tokens: number
  output_tokens: number
  response_time_ms: number
  cost: number
  request_payload?: any
  response_payload?: any
  success: boolean
  error_message?: string
  user_id?: string
}

export interface AITrainingData {
  input: any
  output: any
  model_name: string
  use_case: string
  accuracy_score?: number
  user_feedback?: 'positive' | 'negative' | 'neutral'
  metadata?: any
}

class AITracker {
  /**
   * Track an AI API call
   */
  async trackUsage(record: AIUsageRecord) {
    try {
      // Try to track via API route (server-side) first
      try {
        const response = await fetch('/api/ai/track-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_name: record.model_name,
            provider: record.provider,
            use_case: record.use_case,
            input_tokens: record.input_tokens,
            output_tokens: record.output_tokens,
            response_time_ms: record.response_time_ms,
            cost: record.cost,
            success: record.success,
            error_message: record.error_message,
            user_id: record.user_id,
          }),
        })
        
        if (response.ok) {
          console.log('[AI Tracker] Usage tracked via API route')
          return
        }
      } catch (apiError) {
        console.warn('[AI Tracker] API route failed, trying direct database:', apiError)
      }

      // Fallback to direct database access
      const supabase = createClient()
      
      // Store usage record (will fail silently if table doesn't exist - using test auth)
      const { error } = await supabase
        .from('ai_model_usage')
        .insert({
          model_name: record.model_name,
          provider: record.provider,
          use_case: record.use_case,
          input_tokens: record.input_tokens,
          output_tokens: record.output_tokens,
          total_tokens: record.input_tokens + record.output_tokens,
          response_time_ms: record.response_time_ms,
          cost: record.cost,
          request_payload: record.request_payload,
          response_payload: record.response_payload,
          success: record.success,
          error_message: record.error_message,
          user_id: record.user_id,
        })

      if (error) {
        // Silently fail if table doesn't exist (test auth mode)
        if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
          console.error('Error tracking AI usage:', error)
        } else {
          console.log('[AI Tracker] Table not found, usage not tracked (test mode)')
        }
      } else {
        console.log('[AI Tracker] Usage tracked successfully')
      }
    } catch (error) {
      // Silently fail in test auth mode
      console.warn('[AI Tracker] Failed to track AI usage:', error)
    }
  }

  /**
   * Store training data for future LLM model training
   */
  async storeTrainingData(data: AITrainingData) {
    try {
      const supabase = createClient()
      
      // Store training data (will fail silently if table doesn't exist - using test auth)
      const { error } = await supabase
        .from('ai_training_data')
        .insert({
          model_name: data.model_name,
          use_case: data.use_case,
          input_data: data.input,
          output_data: data.output,
          accuracy_score: data.accuracy_score,
          user_feedback: data.user_feedback,
          metadata: data.metadata,
        })

      if (error) {
        // Silently fail if table doesn't exist (test auth mode)
        if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
          console.error('Error storing training data:', error)
        }
      }
    } catch (error) {
      // Silently fail in test auth mode
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('Failed to store training data:', error)
      }
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  calculateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    // Pricing per 1M tokens (as of 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      'deepseek-chat': {
        input: 0.14, // $0.14 per 1M tokens
        output: 0.28, // $0.28 per 1M tokens
      },
      'gpt-4o': {
        input: 2.50, // $2.50 per 1M tokens
        output: 10.00, // $10.00 per 1M tokens
      },
      'gpt-4o-mini': {
        input: 0.15, // $0.15 per 1M tokens
        output: 0.60, // $0.60 per 1M tokens
      },
      'gpt-4-vision': {
        input: 10.00, // $10.00 per 1M tokens (legacy)
        output: 30.00, // $30.00 per 1M tokens
      },
      'gpt-4': {
        input: 30.00,
        output: 60.00,
      },
    }

    const prices = pricing[modelName] || { input: 0, output: 0 }
    const inputCost = (inputTokens / 1_000_000) * prices.input
    const outputCost = (outputTokens / 1_000_000) * prices.output

    return inputCost + outputCost
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(timeRange: '24h' | '7d' | '30d' | 'all' = '30d', userId?: string) {
    try {
      const supabase = createClient()

      const now = new Date()
      let startDate: Date
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      let query = supabase
        .from('ai_model_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error getting usage stats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return []
    }
  }

  /**
   * Get usage statistics grouped by user
   */
  async getUsageByUser(timeRange: '24h' | '7d' | '30d' | 'all' = '30d') {
    try {
      const allUsage = await this.getUsageStats(timeRange)

      // Group by user_id
      const byUser = allUsage.reduce((acc: Record<string, any>, record: any) => {
        const userId = record.user_id || 'anonymous'
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            total_requests: 0,
            total_tokens: 0,
            total_cost: 0,
            successful_requests: 0,
            failed_requests: 0,
            by_model: {} as Record<string, number>,
          }
        }

        acc[userId].total_requests++
        acc[userId].total_tokens += (record.input_tokens || 0) + (record.output_tokens || 0)
        acc[userId].total_cost += record.cost || 0

        if (record.success) {
          acc[userId].successful_requests++
        } else {
          acc[userId].failed_requests++
        }

        if (record.model_name) {
          acc[userId].by_model[record.model_name] = (acc[userId].by_model[record.model_name] || 0) + 1
        }

        return acc
      }, {})

      return Object.values(byUser)
    } catch (error) {
      console.error('Failed to get usage by user:', error)
      return []
    }
  }
}

export const aiTracker = new AITracker()

