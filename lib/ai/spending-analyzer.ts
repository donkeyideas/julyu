/**
 * Spending Analyzer
 * Analyzes user spending patterns from receipts and generates insights.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

interface SpendingByStore {
  store: string
  total: number
  trips: number
  avgPerTrip: number
}

interface SpendingByMonth {
  month: string
  total: number
  trips: number
  avgPerTrip: number
}

interface SpendingByCategory {
  category: string
  total: number
  itemCount: number
  avgPrice: number
}

export interface SpendingAnalysis {
  summary: {
    totalSpent: number
    totalTrips: number
    avgPerTrip: number
    dateRange: { from: string; to: string }
  }
  byStore: SpendingByStore[]
  byMonth: SpendingByMonth[]
  byCategory: SpendingByCategory[]
  insights: string[]
  recommendations: string[]
}

/**
 * Analyze spending patterns for a user.
 */
export async function analyzeSpending(
  userId: string,
  days: number = 90
): Promise<SpendingAnalysis> {
  const supabase = createServiceRoleClient()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Get receipts with store info
  const { data: receipts } = await supabase
    .from('receipts')
    .select('total_amount, purchase_date, ocr_result, stores(name, retailer)')
    .eq('user_id', userId)
    .eq('ocr_status', 'complete')
    .gte('purchase_date', cutoff)
    .order('purchase_date', { ascending: true })

  const receiptRows = (receipts ?? []) as Array<{
    total_amount: number | null
    purchase_date: string | null
    ocr_result: unknown
    stores: { name: string | null; retailer: string } | null
  }>

  if (receiptRows.length === 0) {
    return {
      summary: { totalSpent: 0, totalTrips: 0, avgPerTrip: 0, dateRange: { from: cutoff, to: new Date().toISOString() } },
      byStore: [],
      byMonth: [],
      byCategory: [],
      insights: ['Start scanning receipts to see your spending analysis.'],
      recommendations: ['Upload your first receipt to get started with spending insights.'],
    }
  }

  // Summary
  const totalSpent = receiptRows.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const totalTrips = receiptRows.length
  const avgPerTrip = totalSpent / totalTrips
  const dates = receiptRows.map(r => r.purchase_date).filter(Boolean) as string[]

  // By store
  const storeMap = new Map<string, { total: number; trips: number }>()
  for (const r of receiptRows) {
    const store = r.stores?.name || r.stores?.retailer || 'Unknown'
    const existing = storeMap.get(store) || { total: 0, trips: 0 }
    existing.total += r.total_amount || 0
    existing.trips += 1
    storeMap.set(store, existing)
  }
  const byStore: SpendingByStore[] = Array.from(storeMap.entries())
    .map(([store, data]) => ({
      store,
      total: data.total,
      trips: data.trips,
      avgPerTrip: data.total / data.trips,
    }))
    .sort((a, b) => b.total - a.total)

  // By month
  const monthMap = new Map<string, { total: number; trips: number }>()
  for (const r of receiptRows) {
    if (!r.purchase_date) continue
    const month = r.purchase_date.substring(0, 7) // YYYY-MM
    const existing = monthMap.get(month) || { total: 0, trips: 0 }
    existing.total += r.total_amount || 0
    existing.trips += 1
    monthMap.set(month, existing)
  }
  const byMonth: SpendingByMonth[] = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      total: data.total,
      trips: data.trips,
      avgPerTrip: data.total / data.trips,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // By category (from OCR results)
  const categoryMap = new Map<string, { total: number; count: number }>()
  for (const r of receiptRows) {
    const ocrResult = r.ocr_result as { items?: Array<{ category?: string; total?: number; price?: number }> } | null
    if (ocrResult?.items) {
      for (const item of ocrResult.items) {
        const category = item.category || 'Other'
        const price = item.total || item.price || 0
        const existing = categoryMap.get(category) || { total: 0, count: 0 }
        existing.total += price
        existing.count += 1
        categoryMap.set(category, existing)
      }
    }
  }
  const byCategory: SpendingByCategory[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      itemCount: data.count,
      avgPrice: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Generate AI insights
  const { insights, recommendations } = await generateSpendingInsights(userId, {
    totalSpent,
    totalTrips,
    avgPerTrip,
    topStore: byStore[0],
    monthlyTrend: byMonth,
    topCategories: byCategory.slice(0, 5),
  })

  return {
    summary: {
      totalSpent,
      totalTrips,
      avgPerTrip,
      dateRange: {
        from: dates[0] || cutoff,
        to: dates[dates.length - 1] || new Date().toISOString(),
      },
    },
    byStore,
    byMonth,
    byCategory,
    insights,
    recommendations,
  }
}

async function generateSpendingInsights(
  userId: string,
  data: {
    totalSpent: number
    totalTrips: number
    avgPerTrip: number
    topStore: SpendingByStore | undefined
    monthlyTrend: SpendingByMonth[]
    topCategories: SpendingByCategory[]
  }
): Promise<{ insights: string[]; recommendations: string[] }> {
  const summaryText = `Spending analysis data:
- Total spent: $${data.totalSpent.toFixed(2)} over ${data.totalTrips} trips
- Average per trip: $${data.avgPerTrip.toFixed(2)}
- Most visited store: ${data.topStore ? `${data.topStore.store} (${data.topStore.trips} visits, $${data.topStore.total.toFixed(2)})` : 'N/A'}
- Monthly spending: ${data.monthlyTrend.map(m => `${m.month}: $${m.total.toFixed(2)}`).join(', ')}
- Top categories: ${data.topCategories.map(c => `${c.category}: $${c.total.toFixed(2)} (${c.itemCount} items)`).join(', ')}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a grocery spending analyst. Given spending data, generate concise insights and actionable recommendations. Return JSON with "insights" (array of 2-4 observation strings) and "recommendations" (array of 2-3 actionable tip strings). Focus on savings opportunities.`,
    },
    { role: 'user', content: summaryText },
  ]

  try {
    const response = await llmOrchestrator.chat(messages, {
      taskType: 'spending_analysis',
      userId,
      maxTokens: 500,
      temperature: 0.4,
    })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)?.[0]
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch)
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
      }
    }
  } catch (error) {
    console.error('[SpendingAnalyzer] AI insights generation failed:', error)
  }

  // Fallback insights
  return {
    insights: [
      `You've spent $${data.totalSpent.toFixed(2)} across ${data.totalTrips} shopping trips.`,
      `Your average trip costs $${data.avgPerTrip.toFixed(2)}.`,
    ],
    recommendations: [
      'Consider creating a shopping list before each trip to reduce impulse buys.',
      'Compare prices across stores for your most frequently purchased items.',
    ],
  }
}
