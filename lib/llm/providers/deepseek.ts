/**
 * DeepSeek LLM Provider
 * Handles all DeepSeek API interactions through the unified provider interface.
 */

import axios from 'axios'
import { getApiKey } from '@/lib/api/config'
import { BaseLLMProvider } from './base'
import type { LLMMessage, LLMOptions, LLMResponse } from '@/types/llm'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

export class DeepSeekProvider extends BaseLLMProvider {
  readonly id = 'deepseek' as const
  readonly name = 'DeepSeek'
  readonly defaultModel = 'deepseek-chat'

  private cachedApiKey: string | null = null

  private async getApiKey(): Promise<string> {
    if (this.cachedApiKey) return this.cachedApiKey

    const key = await getApiKey('deepseek-chat')
    if (!key || key.trim() === '') {
      throw new Error('DeepSeek API key not configured. Please configure it in Admin → AI Models.')
    }

    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-') || trimmed.length < 20) {
      throw new Error('Invalid DeepSeek API key format')
    }

    this.cachedApiKey = trimmed
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

  async chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse> {
    const apiKey = await this.getApiKey()
    const model = options?.model || this.defaultModel

    // Convert messages to DeepSeek format (text-only, no vision)
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string'
        ? msg.content
        : this.getTextContent(msg.content),
    }))

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/v1/chat/completions`,
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
        timeout: options?.timeout ?? 30000,
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

export const deepseekProvider = new DeepSeekProvider()
