import axios from 'axios'
import { aiTracker } from './tracker'
import { getApiKey } from '../api/config'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AssistantContext {
  user_id: string
  preferences?: {
    dietary_restrictions?: string[]
    budget_monthly?: number
    favorite_stores?: string[]
  }
  recent_lists?: string[]
  recent_receipts?: Array<{
    store: string
    total: number
    date: string
  }>
}

export class AIAssistant {
  private baseURL: string
  private apiKey: string | null = null

  constructor() {
    this.baseURL = DEEPSEEK_BASE_URL
  }

  private async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey

    const key = await getApiKey('deepseek-chat')
    if (!key || key.trim() === '') {
      throw new Error('DeepSeek API key not configured')
    }

    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-') || trimmed.length < 20) {
      throw new Error('Invalid DeepSeek API key format')
    }

    this.apiKey = trimmed
    return this.apiKey
  }

  private buildSystemPrompt(context?: AssistantContext): string {
    let prompt = `You are Julyu AI, a helpful shopping assistant for a grocery price comparison app. You help users:
- Find the best deals and prices on groceries
- Create and optimize shopping lists
- Suggest recipes based on budget and preferences
- Plan meals for the week
- Find product alternatives and substitutions
- Answer questions about grocery shopping

Be concise, friendly, and helpful. Focus on actionable advice that saves money.
When suggesting products or stores, be specific.
If asked about prices, note that prices may vary by location and change frequently.
`

    if (context?.preferences) {
      const { dietary_restrictions, budget_monthly, favorite_stores } = context.preferences

      if (dietary_restrictions && dietary_restrictions.length > 0) {
        prompt += `\nUser dietary restrictions: ${dietary_restrictions.join(', ')}`
      }
      if (budget_monthly) {
        prompt += `\nUser monthly grocery budget: $${budget_monthly}`
      }
      if (favorite_stores && favorite_stores.length > 0) {
        prompt += `\nUser's preferred stores: ${favorite_stores.join(', ')}`
      }
    }

    if (context?.recent_lists && context.recent_lists.length > 0) {
      prompt += `\nRecent shopping lists include items like: ${context.recent_lists.slice(0, 10).join(', ')}`
    }

    if (context?.recent_receipts && context.recent_receipts.length > 0) {
      const receiptsInfo = context.recent_receipts.slice(0, 3).map(r =>
        `${r.store} ($${r.total.toFixed(2)} on ${new Date(r.date).toLocaleDateString()})`
      ).join(', ')
      prompt += `\nRecent shopping: ${receiptsInfo}`
    }

    return prompt
  }

  async chat(
    messages: Message[],
    context?: AssistantContext
  ): Promise<{ response: string; tokens: { input: number; output: number } }> {
    const apiKey = await this.getApiKey()
    const systemPrompt = this.buildSystemPrompt(context)

    const startTime = Date.now()

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
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
        use_case: 'ai_assistant',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTime,
        cost,
        user_id: context?.user_id,
        success: true,
      })

      // Store training data
      await aiTracker.storeTrainingData({
        input: { messages: messages.slice(-3), context },
        output: { response: response.data.choices?.[0]?.message?.content },
        model_name: 'deepseek-chat',
        use_case: 'ai_assistant',
      })

      const assistantResponse = response.data.choices?.[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response. Please try again."

      return {
        response: assistantResponse,
        tokens: { input: inputTokens, output: outputTokens }
      }
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime
      const err = error as { message?: string; response?: { status?: number; data?: { error?: { message?: string } } } }

      // Track failed usage
      try {
        await aiTracker.trackUsage({
          model_name: 'deepseek-chat',
          provider: 'DeepSeek',
          use_case: 'ai_assistant',
          input_tokens: 0,
          output_tokens: 0,
          response_time_ms: responseTime,
          cost: 0,
          user_id: context?.user_id,
          success: false,
          error_message: err.message || 'Unknown error',
        })
      } catch {
        // Ignore tracking errors
      }

      let errorMessage = 'Failed to get response from AI assistant'
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message
      } else if (err.response?.status === 401) {
        errorMessage = 'AI service authentication failed'
      } else if (err.response?.status === 429) {
        errorMessage = 'AI service rate limit exceeded. Please try again later.'
      }

      throw new Error(errorMessage)
    }
  }

  async generateTitle(messages: Message[]): Promise<string> {
    const apiKey = await this.getApiKey()

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'Generate a very short title (max 5 words) for this conversation. Return only the title, nothing else.'
            },
            {
              role: 'user',
              content: `Conversation:\nUser: ${messages[0]?.content || 'Hello'}\n\nGenerate a short title:`
            }
          ],
          temperature: 0.5,
          max_tokens: 20,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      return response.data.choices?.[0]?.message?.content?.trim() || 'New Chat'
    } catch {
      return 'New Chat'
    }
  }
}

export const aiAssistant = new AIAssistant()
