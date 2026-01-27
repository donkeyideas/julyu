/**
 * LLM Cost Tracker
 * Records all LLM API calls with cost data for monitoring and budgeting.
 * Wraps the existing aiTracker with orchestrator-aware metadata.
 */

import { aiTracker } from '@/lib/ai/tracker'
import type { LLMTaskType, LLMResponse, CostRecord, CostEstimate } from '@/types/llm'
import { MODEL_PRICING } from '@/types/llm'

/**
 * Track a completed LLM call
 */
export async function trackLLMCall(params: {
  taskType: LLMTaskType
  response: LLMResponse
  responseTimeMs: number
  userId?: string
  cached?: boolean
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { taskType, response, responseTimeMs, userId, cached, metadata } = params

  // Don't track cached responses as API calls
  if (cached) return

  try {
    await aiTracker.trackUsage({
      model_name: response.model,
      provider: response.provider,
      use_case: taskType,
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
      response_time_ms: responseTimeMs,
      cost: response.usage.cost,
      success: true,
      user_id: userId,
      request_payload: metadata,
    })
  } catch (error) {
    console.warn('[LLM Cost Tracker] Failed to track usage:', error)
  }
}

/**
 * Track a failed LLM call
 */
export async function trackLLMError(params: {
  taskType: LLMTaskType
  model: string
  provider: string
  responseTimeMs: number
  errorMessage: string
  userId?: string
}): Promise<void> {
  try {
    await aiTracker.trackUsage({
      model_name: params.model,
      provider: params.provider,
      use_case: params.taskType,
      input_tokens: 0,
      output_tokens: 0,
      response_time_ms: params.responseTimeMs,
      cost: 0,
      success: false,
      error_message: params.errorMessage,
      user_id: params.userId,
    })
  } catch (error) {
    console.warn('[LLM Cost Tracker] Failed to track error:', error)
  }
}

/**
 * Estimate cost before making a call (for budget checks)
 */
export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): CostEstimate {
  const pricing = MODEL_PRICING[model] || { inputPerMillion: 0, outputPerMillion: 0 }
  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPerMillion

  // Determine provider from model name
  let provider = 'unknown'
  if (model.startsWith('deepseek')) provider = 'deepseek'
  else if (model.startsWith('gpt')) provider = 'openai'
  else if (model.startsWith('claude')) provider = 'anthropic'

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCost: inputCost + outputCost,
    model,
    provider,
  }
}

/**
 * Store training data alongside the cost record
 */
export async function storeTrainingData(params: {
  taskType: LLMTaskType
  input: unknown
  output: unknown
  model: string
  accuracyScore?: number
}): Promise<void> {
  try {
    await aiTracker.storeTrainingData({
      input: params.input,
      output: params.output,
      model_name: params.model,
      use_case: params.taskType,
      accuracy_score: params.accuracyScore,
    })
  } catch (error) {
    console.warn('[LLM Cost Tracker] Failed to store training data:', error)
  }
}
