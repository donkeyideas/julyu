/**
 * OpenAI LLM Provider
 * Handles all OpenAI API interactions (GPT-4o, GPT-4o-mini, Vision).
 */

import axios from 'axios'
import { getApiKey } from '@/lib/api/config'
import { BaseLLMProvider } from './base'
import type { LLMMessage, LLMOptions, LLMResponse, LLMContentPart } from '@/types/llm'

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export class OpenAIProvider extends BaseLLMProvider {
  readonly id = 'openai' as const
  readonly name = 'OpenAI'
  readonly defaultModel = 'gpt-4o'

  private cachedApiKey: string | null = null

  private async getApiKey(): Promise<string> {
    if (this.cachedApiKey) return this.cachedApiKey

    const key = await getApiKey('gpt-4-vision')
    if (!key || key.trim() === '') {
      throw new Error('OpenAI API key not configured. Please configure it in Admin → AI Models.')
    }

    this.cachedApiKey = key.trim()
    return this.cachedApiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getApiKey()
      return true
    } catch {
      return false
    }
  }

  supportsVision(model?: string): boolean {
    const m = model || this.defaultModel
    return m.includes('gpt-4o') || m.includes('gpt-4-vision')
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse> {
    const apiKey = await this.getApiKey()
    const model = options?.model || this.defaultModel

    // Convert messages — preserve multimodal content for vision-capable models
    const formattedMessages = messages.map(msg => {
      if (typeof msg.content === 'string') {
        return { role: msg.role, content: msg.content }
      }

      // Multimodal content (text + images)
      if (this.supportsVision(model)) {
        return {
          role: msg.role,
          content: (msg.content as LLMContentPart[]).map(part => {
            if (part.type === 'text') {
              return { type: 'text' as const, text: part.text || '' }
            }
            return {
              type: 'image_url' as const,
              image_url: part.image_url!,
            }
          }),
        }
      }

      // Non-vision model — extract text only
      return {
        role: msg.role,
        content: this.getTextContent(msg.content),
      }
    })

    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP,
        stop: options?.stop,
        ...(options?.responseFormat === 'json' && {
          response_format: { type: 'json_object' },
        }),
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: options?.timeout ?? 60000,
      }
    )

    const inputTokens = response.data.usage?.prompt_tokens || 0
    const outputTokens = response.data.usage?.completion_tokens || 0
    const content = response.data.choices?.[0]?.message?.content || ''

    return {
      content,
      usage: this.buildUsage(model, inputTokens, outputTokens),
      model,
      provider: this.id,
      finishReason: response.data.choices?.[0]?.finish_reason === 'stop' ? 'stop' : 'length',
    }
  }
}

export const openaiProvider = new OpenAIProvider()
