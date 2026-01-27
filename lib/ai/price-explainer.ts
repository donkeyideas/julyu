/**
 * Price Explainer
 * Uses LLM to generate human-readable explanations of price trends.
 */

import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

interface TrendData {
  productName: string
  brand: string | null
  currentPrice: number | null
  stats: {
    average: number
    min: number
    max: number
    dataPoints: number
  }
  trend: {
    direction: 'rising' | 'falling' | 'stable'
    changePercent: number
  }
  prediction: {
    nextWeek: number
    confidence: 'high' | 'medium' | 'low'
  }
  seasonality: {
    bestMonth: string | null
    worstMonth: string | null
    pattern: string | null
  }
}

/**
 * Generate a natural language explanation of price trends.
 */
export async function explainPriceTrend(
  trendData: TrendData,
  userId: string
): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a price analysis assistant for a grocery shopping app. Explain price trends in a helpful, concise way. Focus on actionable insights — should the user buy now, wait, or stock up? Keep responses to 2-3 sentences.`,
    },
    {
      role: 'user',
      content: `Explain this price trend for "${trendData.productName}"${trendData.brand ? ` (${trendData.brand})` : ''}:
- Current price: ${trendData.currentPrice ? `$${trendData.currentPrice.toFixed(2)}` : 'unknown'}
- Average price: $${trendData.stats.average.toFixed(2)}
- Price range: $${trendData.stats.min.toFixed(2)} - $${trendData.stats.max.toFixed(2)}
- Trend: ${trendData.trend.direction} (${trendData.trend.changePercent.toFixed(1)}%)
- Prediction next week: $${trendData.prediction.nextWeek.toFixed(2)} (${trendData.prediction.confidence} confidence)
${trendData.seasonality.pattern ? `- Seasonal pattern: ${trendData.seasonality.pattern}` : ''}
- Data points: ${trendData.stats.dataPoints}`,
    },
  ]

  try {
    const response = await llmOrchestrator.chat(messages, {
      taskType: 'price_analysis',
      userId,
      maxTokens: 200,
      temperature: 0.4,
    })
    return response.content.trim()
  } catch (error) {
    console.error('[PriceExplainer] Failed to generate explanation:', error)
    // Fallback to template-based explanation
    return generateFallbackExplanation(trendData)
  }
}

function generateFallbackExplanation(data: TrendData): string {
  const { productName, currentPrice, stats, trend, prediction } = data
  let explanation = ''

  if (currentPrice && currentPrice <= stats.min * 1.05) {
    explanation = `${productName} is near its lowest price at $${currentPrice.toFixed(2)}. This is a good time to buy or stock up.`
  } else if (currentPrice && currentPrice >= stats.max * 0.95) {
    explanation = `${productName} is near its highest price at $${currentPrice.toFixed(2)}. Consider waiting for a price drop.`
  } else if (trend.direction === 'falling') {
    explanation = `${productName} prices are dropping (${Math.abs(trend.changePercent).toFixed(0)}% decrease). Prices may continue to fall.`
  } else if (trend.direction === 'rising') {
    explanation = `${productName} prices have been rising (${trend.changePercent.toFixed(0)}% increase). Consider buying soon before prices go higher.`
  } else {
    explanation = `${productName} prices have been stable around $${stats.average.toFixed(2)}.`
  }

  if (data.seasonality.bestMonth) {
    explanation += ` Best deals are typically in ${data.seasonality.bestMonth}.`
  }

  return explanation
}
