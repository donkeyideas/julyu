/**
 * LLM Provider Base Interface
 * All LLM providers must implement this interface for model-agnostic routing.
 */

import type {
  LLMMessage,
  LLMOptions,
  LLMResponse,
  LLMTokenUsage,
  LLMProviderId,
  MODEL_PRICING,
} from '@/types/llm'

export interface LLMProvider {
  /** Unique provider identifier */
  readonly id: LLMProviderId

  /** Display name */
  readonly name: string

  /** Default model ID for this provider */
  readonly defaultModel: string

  /** Whether this provider is currently available */
  isAvailable(): Promise<boolean>

  /**
   * Send a chat completion request
   */
  chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse>

  /**
   * Calculate cost for given token counts
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number

  /**
   * Check if a model supports vision (image input)
   */
  supportsVision(model?: string): boolean
}

/**
 * Base class with shared utility methods for all providers.
 * Providers extend this and implement the abstract methods.
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly id: LLMProviderId
  abstract readonly name: string
  abstract readonly defaultModel: string

  abstract isAvailable(): Promise<boolean>
  abstract chat(
    messages: LLMMessage[],
    options?: LLMOptions & { model?: string }
  ): Promise<LLMResponse>

  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Import pricing from types at runtime to avoid circular deps
    const pricing: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
      'deepseek-chat': { inputPerMillion: 0.14, outputPerMillion: 0.28 },
      'deepseek-reasoner': { inputPerMillion: 0.55, outputPerMillion: 2.19 },
      'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
      'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
      'claude-sonnet-4-20250514': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
      'claude-haiku-3.5': { inputPerMillion: 0.80, outputPerMillion: 4.00 },
      'gemini-2.0-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
      'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
      'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
    }

    const prices = pricing[model] || { inputPerMillion: 0, outputPerMillion: 0 }
    const inputCost = (inputTokens / 1_000_000) * prices.inputPerMillion
    const outputCost = (outputTokens / 1_000_000) * prices.outputPerMillion
    return inputCost + outputCost
  }

  supportsVision(_model?: string): boolean {
    return false
  }

  /** Helper to build token usage object */
  protected buildUsage(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): LLMTokenUsage {
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: this.calculateCost(model, inputTokens, outputTokens),
    }
  }

  /** Helper to extract text content from message content */
  protected getTextContent(content: string | Array<{ type: string; text?: string }>): string {
    if (typeof content === 'string') return content
    const textPart = content.find(p => p.type === 'text')
    return textPart?.text || ''
  }
}
