/**
 * Price Analysis Prompt Template
 * LLM explains price trends and predictions in natural language.
 */

import type { PromptTemplate } from '@/types/llm'

export interface PriceAnalysisInput {
  productName: string
  currentPrice: number
  priceHistory: Array<{ date: string; price: number; store: string }>
  averagePrice: number
  minPrice: number
  maxPrice: number
  prediction?: { predictedPrice: number; confidence: number; daysAhead: number }
  promotionalPatterns?: string[]
}

export function buildPriceAnalysisPrompt(input: PriceAnalysisInput): string {
  let prompt = `Analyze the price data for "${input.productName}" and provide a concise, actionable recommendation.\n\n`

  prompt += `Current price: $${input.currentPrice.toFixed(2)}\n`
  prompt += `Average price (6 months): $${input.averagePrice.toFixed(2)}\n`
  prompt += `Price range: $${input.minPrice.toFixed(2)} - $${input.maxPrice.toFixed(2)}\n\n`

  if (input.priceHistory.length > 0) {
    prompt += `Recent price history:\n`
    input.priceHistory.slice(-10).forEach(h => {
      prompt += `  ${h.date}: $${h.price.toFixed(2)} at ${h.store}\n`
    })
    prompt += '\n'
  }

  if (input.prediction) {
    prompt += `Price prediction: $${input.prediction.predictedPrice.toFixed(2)} in ${input.prediction.daysAhead} days (${(input.prediction.confidence * 100).toFixed(0)}% confidence)\n\n`
  }

  if (input.promotionalPatterns && input.promotionalPatterns.length > 0) {
    prompt += `Known promotional patterns:\n`
    input.promotionalPatterns.forEach(p => {
      prompt += `  - ${p}\n`
    })
    prompt += '\n'
  }

  prompt += `Provide your analysis in this format:
1. Current value assessment (is it a good price right now?)
2. Buy/wait recommendation with reasoning
3. Best time/store to buy
4. Savings tip (one specific actionable tip)

Keep the response under 150 words. Be direct and specific.`

  return prompt
}

export const priceAnalysisTemplate: PromptTemplate = {
  id: 'price-analysis',
  taskType: 'price_analysis',
  systemPrompt: 'You are a grocery price analyst. Provide concise, data-driven buying recommendations based on price trends. Be specific about timing and store recommendations.',
  buildUserPrompt: (params) => buildPriceAnalysisPrompt(params as unknown as PriceAnalysisInput),
  defaultOptions: {
    temperature: 0.4,
    maxTokens: 500,
    timeout: 30000,
  },
}
