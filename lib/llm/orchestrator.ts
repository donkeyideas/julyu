/**
 * LLM Orchestrator
 * Central router for all LLM interactions. Handles:
 * - Smart model routing by task type
 * - Automatic fallback on provider failure
 * - Response caching
 * - Rate limiting
 * - Cost tracking
 * - Training data collection
 */

import type {
  LLMMessage,
  LLMOptions,
  LLMResponse,
  LLMTask,
  LLMTaskType,
  LLMRouteConfig,
  SubscriptionTier,
} from '@/types/llm'
import type { LLMProvider } from './providers/base'
import { DeepSeekProvider } from './providers/deepseek'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { generateCacheKey, getCachedResponse, setCachedResponse } from './cache'
import { checkRateLimit, checkRateLimitDynamic, recordUsage } from './rate-limiter'
import { trackLLMCall, trackLLMError, storeTrainingData } from './cost-tracker'

// ============================================
// Route Configuration
// ============================================

const ROUTE_CONFIG: Record<LLMTaskType, LLMRouteConfig> = {
  chat: {
    taskType: 'chat',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.7, maxTokens: 1000, timeout: 60000 },
  },
  product_matching: {
    taskType: 'product_matching',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.3, maxTokens: 2000, responseFormat: 'json', timeout: 30000 },
  },
  receipt_ocr: {
    taskType: 'receipt_ocr',
    primaryProvider: 'openai',
    // No fallback — only OpenAI supports vision well enough
    defaultOptions: { temperature: 0.1, maxTokens: 4000, timeout: 60000 },
  },
  price_analysis: {
    taskType: 'price_analysis',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.4, maxTokens: 500, timeout: 30000 },
  },
  meal_planning: {
    taskType: 'meal_planning',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.6, maxTokens: 4000, responseFormat: 'json', timeout: 60000 },
  },
  list_building: {
    taskType: 'list_building',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.5, maxTokens: 2000, responseFormat: 'json', timeout: 30000 },
  },
  spending_analysis: {
    taskType: 'spending_analysis',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.4, maxTokens: 1000, timeout: 30000 },
  },
  alert_context: {
    taskType: 'alert_context',
    primaryProvider: 'deepseek',
    defaultOptions: { temperature: 0.3, maxTokens: 300, timeout: 15000 },
  },
  content_generation: {
    taskType: 'content_generation',
    primaryProvider: 'deepseek',
    fallbackProvider: 'openai',
    defaultOptions: { temperature: 0.7, maxTokens: 2000, timeout: 60000 },
  },
  data_quality: {
    taskType: 'data_quality',
    primaryProvider: 'deepseek',
    defaultOptions: { temperature: 0.2, maxTokens: 1000, responseFormat: 'json', timeout: 30000 },
  },
  translation: {
    taskType: 'translation',
    primaryProvider: 'deepseek',
    defaultOptions: { temperature: 0.3, maxTokens: 500, timeout: 15000 },
  },
  title_generation: {
    taskType: 'title_generation',
    primaryProvider: 'deepseek',
    defaultOptions: { temperature: 0.5, maxTokens: 20, timeout: 10000 },
  },
}

// ============================================
// Orchestrator Class
// ============================================

export class LLMOrchestrator {
  private providers: Map<string, LLMProvider>

  constructor() {
    this.providers = new Map()
    this.providers.set('deepseek', new DeepSeekProvider())
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('anthropic', new AnthropicProvider())
  }

  /**
   * Execute an LLM task with smart routing, caching, rate limiting, and fallback.
   */
  async execute(task: LLMTask): Promise<LLMResponse> {
    const config = ROUTE_CONFIG[task.type]
    if (!config) {
      throw new Error(`Unknown task type: ${task.type}`)
    }

    // Merge options: task options override route defaults
    const options: LLMOptions = { ...config.defaultOptions, ...task.options }

    // Rate limit check (dynamic from DB, falls back to static tier-based)
    if (task.userId) {
      const limitResult = await checkRateLimitDynamic(task.userId, (task.metadata?.subscriptionTier as SubscriptionTier) || 'free')
      if (!limitResult.allowed) {
        throw new Error(limitResult.reason || 'Rate limit exceeded')
      }
    }

    // Cache check (skip for chat — too contextual)
    const cacheable = task.type !== 'chat' && task.type !== 'title_generation'
    let cacheKey: string | undefined

    if (cacheable) {
      cacheKey = generateCacheKey(
        config.primaryProvider,
        task.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        options.temperature
      )

      const cached = await getCachedResponse(cacheKey)
      if (cached) {
        // Track cached response (no cost)
        if (task.userId) {
          recordUsage(task.userId, 0)
        }
        return cached
      }
    }

    // Try primary provider
    const startTime = Date.now()
    const primaryProvider = this.providers.get(config.primaryProvider)

    if (primaryProvider) {
      try {
        const response = await primaryProvider.chat(task.messages, options)
        const responseTimeMs = Date.now() - startTime

        // Track usage
        if (task.userId) {
          recordUsage(task.userId, response.usage.totalTokens)
        }

        await trackLLMCall({
          taskType: task.type,
          response,
          responseTimeMs,
          userId: task.userId,
          metadata: task.metadata,
        })

        // Cache the response
        if (cacheable && cacheKey) {
          await setCachedResponse(cacheKey, response.model, response)
        }

        return response
      } catch (primaryError: unknown) {
        const error = primaryError as Error
        console.warn(
          `[LLM Orchestrator] Primary provider ${config.primaryProvider} failed for ${task.type}:`,
          error.message
        )

        // Track the failure
        await trackLLMError({
          taskType: task.type,
          model: primaryProvider.defaultModel,
          provider: config.primaryProvider,
          responseTimeMs: Date.now() - startTime,
          errorMessage: error.message,
          userId: task.userId,
        })

        // Try fallback if configured
        if (config.fallbackProvider) {
          const fallbackProvider = this.providers.get(config.fallbackProvider)
          if (fallbackProvider) {
            try {
              console.log(
                `[LLM Orchestrator] Trying fallback provider: ${config.fallbackProvider}`
              )
              const fallbackStart = Date.now()
              const response = await fallbackProvider.chat(task.messages, options)
              const responseTimeMs = Date.now() - fallbackStart

              if (task.userId) {
                recordUsage(task.userId, response.usage.totalTokens)
              }

              await trackLLMCall({
                taskType: task.type,
                response,
                responseTimeMs,
                userId: task.userId,
                metadata: { ...task.metadata, fallback: true },
              })

              if (cacheable && cacheKey) {
                await setCachedResponse(cacheKey, response.model, response)
              }

              return response
            } catch (fallbackError: unknown) {
              const fbError = fallbackError as Error
              console.error(
                `[LLM Orchestrator] Fallback provider ${config.fallbackProvider} also failed:`,
                fbError.message
              )

              await trackLLMError({
                taskType: task.type,
                model: fallbackProvider.defaultModel,
                provider: config.fallbackProvider,
                responseTimeMs: Date.now() - startTime,
                errorMessage: fbError.message,
                userId: task.userId,
              })
            }
          }
        }

        // Both providers failed
        throw new Error(
          `LLM request failed for ${task.type}: ${error.message}`
        )
      }
    }

    throw new Error(`No provider configured for task type: ${task.type}`)
  }

  /**
   * Convenience method: Simple chat completion
   */
  async chat(
    messages: LLMMessage[],
    options?: {
      taskType?: LLMTaskType
      userId?: string
      subscriptionTier?: SubscriptionTier
      temperature?: number
      maxTokens?: number
    }
  ): Promise<LLMResponse> {
    return this.execute({
      type: options?.taskType || 'chat',
      messages,
      options: {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      },
      userId: options?.userId,
      metadata: options?.subscriptionTier
        ? { subscriptionTier: options.subscriptionTier }
        : undefined,
    })
  }

  /**
   * Convenience method: Product matching
   */
  async matchProducts(
    userInput: string[],
    context?: { dietary?: string[]; brands?: string[] }
  ): Promise<LLMResponse> {
    const systemPrompt =
      'You are a product matching AI for a grocery price comparison platform. Match user input to structured product data. Always return valid JSON.'

    let userPrompt = `Match these grocery items:\n`
    userInput.forEach((item, i) => {
      userPrompt += `${i + 1}. ${item}\n`
    })

    if (context?.dietary?.length) {
      userPrompt += `\nDietary restrictions: ${context.dietary.join(', ')}`
    }

    userPrompt += `\nReturn JSON array with: userInput, matchedProduct, brand, size, attributes, confidence (0.0-1.0)`

    return this.execute({
      type: 'product_matching',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
  }

  /**
   * Convenience method: Receipt OCR (requires vision model)
   */
  async scanReceipt(imageBase64: string): Promise<LLMResponse> {
    return this.execute({
      type: 'receipt_ocr',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all information from this grocery receipt image.

Return JSON with: storeName, storeAddress, items (name, price, quantity, category, discount), subtotal, total, tax, purchaseDate, paymentMethod, confidence.

Rules:
- Extract ALL items visible on receipt
- Clean up item names (remove codes, abbreviations)
- Use XX.XX format for prices
- Parse date to YYYY-MM-DD
- Return valid JSON only`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      options: {
        temperature: 0.1,
        maxTokens: 4000,
      },
    })
  }

  /**
   * Convenience method: Generate a conversation title
   */
  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.execute({
        type: 'title_generation',
        messages: [
          {
            role: 'system',
            content: 'Generate a very short title (max 5 words) for this conversation. Return only the title.',
          },
          {
            role: 'user',
            content: `User said: "${firstMessage}"\n\nGenerate a short title:`,
          },
        ],
      })
      return response.content.trim() || 'New Chat'
    } catch {
      return 'New Chat'
    }
  }

  /**
   * Get provider availability status
   */
  async getProviderStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    for (const [id, provider] of this.providers) {
      status[id] = await provider.isAvailable()
    }
    return status
  }

  /**
   * Get route config for a task type
   */
  getRouteConfig(taskType: LLMTaskType): LLMRouteConfig | undefined {
    return ROUTE_CONFIG[taskType]
  }
}

// Singleton instance
export const llmOrchestrator = new LLMOrchestrator()
