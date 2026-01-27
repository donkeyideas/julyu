/**
 * Anthropic (Claude) LLM Provider — STUB
 * Future integration point for Claude models.
 * Implements the full interface but throws "not configured" until API key is added.
 */

import { BaseLLMProvider } from './base'
import type { LLMMessage, LLMOptions, LLMResponse } from '@/types/llm'

export class AnthropicProvider extends BaseLLMProvider {
  readonly id = 'anthropic' as const
  readonly name = 'Anthropic'
  readonly defaultModel = 'claude-sonnet-4-20250514'

  async isAvailable(): Promise<boolean> {
    // Stub — not yet configured
    const key = process.env.ANTHROPIC_API_KEY
    return !!key && key.trim() !== ''
  }

  supportsVision(model?: string): boolean {
    // Claude models support vision
    return true
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable to enable Claude.'
      )
    }

    // TODO: Implement Anthropic Messages API when ready
    // https://docs.anthropic.com/en/api/messages
    //
    // Key differences from OpenAI format:
    // - System prompt is a top-level parameter, not a message
    // - Uses `max_tokens` (required)
    // - Response format: { content: [{ type: "text", text: "..." }] }
    // - Image content: { type: "image", source: { type: "base64", media_type, data } }
    //
    // const response = await axios.post('https://api.anthropic.com/v1/messages', {
    //   model: options?.model || this.defaultModel,
    //   system: systemMessage?.content,
    //   messages: nonSystemMessages,
    //   max_tokens: options?.maxTokens ?? 1000,
    //   temperature: options?.temperature ?? 0.7,
    // }, {
    //   headers: {
    //     'x-api-key': apiKey,
    //     'anthropic-version': '2023-06-01',
    //     'Content-Type': 'application/json',
    //   },
    // })

    throw new Error('Anthropic provider not yet implemented. Coming soon.')
  }
}

export const anthropicProvider = new AnthropicProvider()
