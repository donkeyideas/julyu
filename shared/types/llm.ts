/**
 * LLM Orchestration Types
 * Shared types for the model-agnostic LLM layer
 */

// ============================================
// Core Provider Types
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | LLMContentPart[]
}

export interface LLMContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'low' | 'high' | 'auto'
  }
}

export interface LLMOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  responseFormat?: 'text' | 'json'
  timeout?: number
}

export interface LLMResponse {
  content: string
  usage: LLMTokenUsage
  model: string
  provider: string
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error'
  cached?: boolean
}

export interface LLMTokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
}

// ============================================
// Task Routing Types
// ============================================

export type LLMTaskType =
  | 'chat'
  | 'product_matching'
  | 'receipt_ocr'
  | 'price_analysis'
  | 'meal_planning'
  | 'list_building'
  | 'spending_analysis'
  | 'alert_context'
  | 'content_generation'
  | 'data_quality'
  | 'translation'
  | 'title_generation'

export interface LLMTask {
  type: LLMTaskType
  messages: LLMMessage[]
  options?: LLMOptions
  userId?: string
  metadata?: Record<string, unknown>
}

export interface LLMRouteConfig {
  taskType: LLMTaskType
  primaryProvider: string
  fallbackProvider?: string
  defaultOptions: LLMOptions
}

// ============================================
// Provider Types
// ============================================

export type LLMProviderId = 'deepseek' | 'openai' | 'anthropic'

export interface LLMProviderConfig {
  id: LLMProviderId
  name: string
  models: LLMModelConfig[]
  baseURL: string
  isActive: boolean
}

export interface LLMModelConfig {
  modelId: string
  displayName: string
  pricing: {
    inputPerMillion: number
    outputPerMillion: number
  }
  maxTokens: number
  supportsVision: boolean
  supportsJSON: boolean
}

// ============================================
// Cache Types
// ============================================

export interface LLMCacheEntry {
  cacheKey: string
  modelId: string
  response: LLMResponse
  createdAt: Date
  expiresAt: Date
}

export interface LLMCacheOptions {
  enabled: boolean
  ttlSeconds: number
}

// ============================================
// Rate Limiting Types
// ============================================

export type SubscriptionTier = 'free' | 'premium' | 'enterprise'

export interface RateLimitConfig {
  tier: SubscriptionTier
  maxCallsPerDay: number
  maxCallsPerMinute: number
  maxTokensPerDay: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  reason?: string
}

// ============================================
// Cost Tracking Types
// ============================================

export interface CostEstimate {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCost: number
  model: string
  provider: string
}

export interface CostRecord {
  userId: string
  provider: string
  model: string
  taskType: LLMTaskType
  inputTokens: number
  outputTokens: number
  cost: number
  responseTimeMs: number
  success: boolean
  errorMessage?: string
  timestamp: Date
}

// ============================================
// Prompt Template Types
// ============================================

export interface PromptTemplate {
  id: string
  taskType: LLMTaskType
  systemPrompt: string
  buildUserPrompt: (params: Record<string, unknown>) => string
  defaultOptions: LLMOptions
}

// ============================================
// Provider Pricing Registry
// ============================================

export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  // DeepSeek
  'deepseek-chat': { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  'deepseek-reasoner': { inputPerMillion: 0.55, outputPerMillion: 2.19 },
  // OpenAI
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  // Anthropic (future)
  'claude-sonnet-4-20250514': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-haiku-3.5': { inputPerMillion: 0.80, outputPerMillion: 4.00 },
}

// ============================================
// Rate Limit Defaults
// ============================================

export const RATE_LIMITS: Record<SubscriptionTier, RateLimitConfig> = {
  free: {
    tier: 'free',
    maxCallsPerDay: 10,
    maxCallsPerMinute: 3,
    maxTokensPerDay: 50_000,
  },
  premium: {
    tier: 'premium',
    maxCallsPerDay: 100,
    maxCallsPerMinute: 10,
    maxTokensPerDay: 500_000,
  },
  enterprise: {
    tier: 'enterprise',
    maxCallsPerDay: 10_000,
    maxCallsPerMinute: 60,
    maxTokensPerDay: 5_000_000,
  },
}
