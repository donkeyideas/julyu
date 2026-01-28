/**
 * Google Gemini LLM Provider
 * Handles Gemini API interactions with vision support.
 * Free tier: 15 RPM for Gemini 2.0 Flash — ideal for receipt OCR.
 */

import axios from 'axios'
import { getApiKey } from '@/lib/api/config'
import { BaseLLMProvider } from './base'
import type { LLMMessage, LLMOptions, LLMResponse, LLMContentPart } from '@/types/llm'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export class GeminiProvider extends BaseLLMProvider {
  readonly id = 'gemini' as const
  readonly name = 'Google Gemini'
  readonly defaultModel = 'gemini-2.0-flash'

  private cachedApiKey: string | null = null

  private async getApiKey(): Promise<string> {
    if (this.cachedApiKey) return this.cachedApiKey

    const key = await getApiKey('gemini')
    if (!key || key.trim() === '') {
      throw new Error(
        'Google Gemini API key not configured. Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in your environment.'
      )
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

  supportsVision(_model?: string): boolean {
    return true
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse> {
    const apiKey = await this.getApiKey()
    const model = options?.model || this.defaultModel

    // Separate system message from conversation messages
    let systemInstruction: string | undefined
    const conversationMessages: LLMMessage[] = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = typeof msg.content === 'string'
          ? msg.content
          : this.getTextContent(msg.content)
      } else {
        conversationMessages.push(msg)
      }
    }

    // Convert messages to Gemini format
    const contents = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: this.convertContentToParts(msg.content),
    }))

    // Build request body
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1000,
        topP: options?.topP,
        stopSequences: options?.stop,
        ...(options?.responseFormat === 'json' && {
          responseMimeType: 'application/json',
        }),
      },
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
      body,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: options?.timeout ?? 60000,
      }
    )

    const candidate = response.data.candidates?.[0]
    const content = candidate?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || ''

    const inputTokens = response.data.usageMetadata?.promptTokenCount || 0
    const outputTokens = response.data.usageMetadata?.candidatesTokenCount || 0

    const finishReason = candidate?.finishReason === 'STOP' ? 'stop' as const
      : candidate?.finishReason === 'MAX_TOKENS' ? 'length' as const
      : candidate?.finishReason === 'SAFETY' ? 'content_filter' as const
      : 'stop' as const

    return {
      content,
      usage: this.buildUsage(model, inputTokens, outputTokens),
      model,
      provider: this.id,
      finishReason,
    }
  }

  /**
   * Convert LLM message content to Gemini parts format
   */
  private convertContentToParts(
    content: string | LLMContentPart[]
  ): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
    if (typeof content === 'string') {
      return [{ text: content }]
    }

    return content.map(part => {
      if (part.type === 'text') {
        return { text: part.text || '' }
      }

      // Convert image_url to Gemini's inlineData format
      if (part.type === 'image_url' && part.image_url?.url) {
        const url = part.image_url.url
        // Parse data URI: data:image/jpeg;base64,AAAA...
        const match = url.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          }
        }
        // If not a data URI, pass as text (Gemini doesn't support URL-based images in free tier)
        return { text: `[Image URL: ${url}]` }
      }

      return { text: '' }
    })
  }
}

export const geminiProvider = new GeminiProvider()
