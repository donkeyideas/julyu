import axios from 'axios'
import { aiTracker } from '@/lib/ai/tracker'
import { getApiKey } from './config'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

/**
 * DeepSeek API Client for Product Matching
 * Used for semantic understanding of user input
 */
export class DeepSeekClient {
  private baseURL: string
  private apiKey: string | null = null

  constructor() {
    this.baseURL = DEEPSEEK_BASE_URL
  }

  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      console.log('[DeepSeek] Using cached API key, length:', this.apiKey.length)
      return this.apiKey
    }
    
    // Try to get from database or environment
    console.log('[DeepSeek] Fetching API key from config...')
    const key = await getApiKey('deepseek-chat')
    console.log('[DeepSeek] Key retrieved, type:', typeof key, 'value:', key ? `${key.substring(0, 10)}...` : 'null')
    
    if (!key || key.trim() === '') {
      console.error('[DeepSeek] No API key found')
      throw new Error('DeepSeek API key not configured. Please configure it in Admin → AI Models.')
    }
    
    const trimmed = key.trim()
    console.log('[DeepSeek] Trimmed key length:', trimmed.length)
    console.log('[DeepSeek] Trimmed key starts with:', trimmed.substring(0, 10))
    console.log('[DeepSeek] Trimmed key ends with:', trimmed.substring(Math.max(0, trimmed.length - 10)))
    
    // Validate format
    if (!trimmed.startsWith('sk-')) {
      console.error('[DeepSeek] ERROR: API key does not start with "sk-"')
      console.error('[DeepSeek] Key preview (first 30):', trimmed.substring(0, 30))
      console.error('[DeepSeek] Key preview (last 30):', trimmed.substring(Math.max(0, trimmed.length - 30)))
      throw new Error(`Invalid DeepSeek API key format - should start with "sk-" but starts with "${trimmed.substring(0, 3)}"`)
    }
    
    if (trimmed.length < 20) {
      console.error('[DeepSeek] ERROR: API key too short:', trimmed.length)
      throw new Error(`DeepSeek API key appears to be invalid (too short: ${trimmed.length} chars)`)
    }
    
    this.apiKey = trimmed
    console.log('[DeepSeek] API key validated successfully, length:', this.apiKey.length)
    return this.apiKey
  }

  /**
   * Match user input to products using semantic understanding
   */
  async matchProducts(
    userInput: string[],
    context?: {
      dietary?: string[]
      location?: { lat: number; lng: number }
      previousPurchases?: string[]
    }
  ) {
    const apiKey = await this.getApiKey()

    // TODO: Implement product matching using DeepSeek Chat API
    // This should use the chat completions endpoint with a carefully crafted prompt
    // Reference: DeepSeek API documentation
    
    const prompt = this.buildMatchingPrompt(userInput, context)
    
    const startTime = Date.now()
    
    try {
      // Ensure API key is trimmed and valid
      const trimmedKey = apiKey.trim()
      
      console.log('[DeepSeek] Using API key, length:', trimmedKey.length, 'starts with:', trimmedKey.substring(0, 5))
      
      if (!trimmedKey || trimmedKey.length < 20) {
        console.error('[DeepSeek] ERROR: API key too short:', trimmedKey.length)
        throw new Error(`Invalid API key format - key is too short (${trimmedKey.length} chars, expected at least 20)`)
      }
      
      if (!trimmedKey.startsWith('sk-')) {
        console.error('[DeepSeek] ERROR: API key does not start with "sk-"')
        console.error('[DeepSeek] Key preview:', trimmedKey.substring(0, 20))
        throw new Error(`Invalid DeepSeek API key format - should start with "sk-" but starts with "${trimmedKey.substring(0, 3)}"`)
      }
      
      console.log('[DeepSeek] Making API request to:', `${this.baseURL}/v1/chat/completions`)
      console.log('[DeepSeek] API key validated, length:', trimmedKey.length)
      
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a product matching AI for a grocery price comparison platform. Match user input to products with high accuracy.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent matching
        },
        {
          headers: {
            'Authorization': `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      )
      
      console.log('[DeepSeek] API response status:', response.status)
      console.log('[DeepSeek] Response data:', {
        model: response.data.model,
        usage: response.data.usage,
        choices: response.data.choices?.length || 0,
      })

      const responseTime = Date.now() - startTime
      const inputTokens = response.data.usage?.prompt_tokens || 0
      const outputTokens = response.data.usage?.completion_tokens || 0
      const totalTokens = response.data.usage?.total_tokens || (inputTokens + outputTokens)
      const cost = aiTracker.calculateCost('deepseek-chat', inputTokens, outputTokens)
      
      console.log('[DeepSeek] Token usage:', {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
        cost: cost,
      })

      // Track usage
      await aiTracker.trackUsage({
        model_name: 'deepseek-chat',
        provider: 'DeepSeek',
        use_case: 'product_matching',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTime,
        cost,
        request_payload: { userInput: userInput, context },
        response_payload: response.data,
        success: true,
      })

      // Store training data
      const result = this.parseMatchingResponse(response.data)
      await aiTracker.storeTrainingData({
        input: { userInput, context },
        output: result,
        model_name: 'deepseek-chat',
        use_case: 'product_matching',
      })

      return result
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      console.error('[DeepSeek] API error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      })
      
      // Track failed usage (don't fail if tracking fails)
      try {
        await aiTracker.trackUsage({
          model_name: 'deepseek-chat',
          provider: 'DeepSeek',
          use_case: 'product_matching',
          input_tokens: 0,
          output_tokens: 0,
          response_time_ms: responseTime,
          cost: 0,
          request_payload: { userInput, context },
          success: false,
          error_message: error.message || error.response?.data?.error?.message || 'Unknown error',
        })
      } catch (trackError) {
        console.warn('[DeepSeek] Failed to track usage:', trackError)
      }

      // Provide better error message
      let errorMessage = 'Failed to match products'
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key'
      } else if (error.response?.status === 403) {
        errorMessage = 'API key does not have required permissions'
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  private buildMatchingPrompt(
    userInput: string[],
    context?: {
      dietary?: string[]
      location?: { lat: number; lng: number }
      previousPurchases?: string[]
    }
  ): string {
    let prompt = `Match these grocery items to products:\n\n`
    
    userInput.forEach((item, index) => {
      prompt += `${index + 1}. ${item}\n`
    })

    if (context?.dietary && context.dietary.length > 0) {
      prompt += `\nDietary restrictions: ${context.dietary.join(', ')}\n`
    }

    prompt += `\nReturn JSON array with:\n`
    prompt += `- userInput: original input\n`
    prompt += `- matchedProduct: product name\n`
    prompt += `- brand: brand name (if specified)\n`
    prompt += `- size: size/quantity\n`
    prompt += `- attributes: {organic, glutenFree, etc.}\n`
    prompt += `- confidence: 0.0-1.0\n`

    return prompt
  }

  private parseMatchingResponse(response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }): Array<{
    userInput: string
    matchedProduct: string
    brand?: string
    size?: string
    attributes?: Record<string, unknown>
    confidence: number
  }> {
    // Parse DeepSeek response and return structured matches
    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Invalid response from DeepSeek API')
    }

    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0]
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed
      }
      // If single object, wrap in array
      return [parsed]
    } catch (error) {
      console.error('Failed to parse DeepSeek response:', error)
      throw new Error('Failed to parse product matches')
    }
  }
}

  /**
   * Generic chat method for various use cases (translation, etc.)
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
    const apiKey = await this.getApiKey()
    const trimmedKey = apiKey.trim()

    const startTime = Date.now()

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      const responseTime = Date.now() - startTime
      const inputTokens = response.data.usage?.prompt_tokens || 0
      const outputTokens = response.data.usage?.completion_tokens || 0
      const cost = aiTracker.calculateCost('deepseek-chat', inputTokens, outputTokens)

      // Track usage
      await aiTracker.trackUsage({
        model_name: 'deepseek-chat',
        provider: 'DeepSeek',
        use_case: 'chat',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTime,
        cost,
        success: true,
      })

      const content = response.data.choices?.[0]?.message?.content || ''
      return {
        content,
        usage: { inputTokens, outputTokens },
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      console.error('[DeepSeek Chat] Error:', error.response?.data || error.message)

      await aiTracker.trackUsage({
        model_name: 'deepseek-chat',
        provider: 'DeepSeek',
        use_case: 'chat',
        input_tokens: 0,
        output_tokens: 0,
        response_time_ms: responseTime,
        cost: 0,
        success: false,
        error_message: error.message,
      }).catch(() => {})

      throw new Error(error.response?.data?.error?.message || 'Failed to chat with DeepSeek')
    }
  }
}

export const deepseekClient = new DeepSeekClient()

