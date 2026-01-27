/**
 * Price Predictor
 * Statistical price analysis using moving averages and basic trend detection.
 * NOT LLM-based — uses traditional math for predictions.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

interface PricePoint {
  date: string
  price: number
  salePrice: number | null
  store: string
}

interface PriceTrendResult {
  productId: string
  productName: string
  brand: string | null
  currentPrice: number | null
  priceHistory: PricePoint[]
  stats: {
    average: number
    median: number
    min: number
    max: number
    stdDev: number
    dataPoints: number
  }
  trend: {
    direction: 'rising' | 'falling' | 'stable'
    changePercent: number
    movingAverage7d: number | null
    movingAverage30d: number | null
  }
  prediction: {
    nextWeek: number
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }
  seasonality: {
    bestMonth: string | null
    worstMonth: string | null
    pattern: string | null
  }
}

/**
 * Analyze price trends for a product.
 */
export async function analyzePriceTrend(
  productId: string,
  days: number = 90
): Promise<PriceTrendResult | null> {
  const supabase = createServiceRoleClient()

  // Get product info
  const { data: product } = await supabase
    .from('products')
    .select('id, name, brand')
    .eq('id', productId)
    .single()

  if (!product) return null

  const productRow = product as { id: string; name: string; brand: string | null }

  // Get price history
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data: prices } = await supabase
    .from('prices')
    .select('price, sale_price, effective_date, stores(name, retailer)')
    .eq('product_id', productId)
    .gte('effective_date', cutoff)
    .order('effective_date', { ascending: true })

  const priceRows = (prices ?? []) as Array<{
    price: number
    sale_price: number | null
    effective_date: string
    stores: { name: string | null; retailer: string } | null
  }>

  if (priceRows.length === 0) return null

  const priceHistory: PricePoint[] = priceRows.map(r => ({
    date: r.effective_date,
    price: r.price,
    salePrice: r.sale_price,
    store: r.stores?.name || r.stores?.retailer || 'Unknown',
  }))

  const effectivePrices = priceRows.map(r => r.sale_price ?? r.price)

  // Basic statistics
  const avg = effectivePrices.reduce((s, p) => s + p, 0) / effectivePrices.length
  const sorted = [...effectivePrices].sort((a, b) => a - b)
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const variance = effectivePrices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / effectivePrices.length
  const stdDev = Math.sqrt(variance)

  // Moving averages
  const ma7d = calculateMovingAverage(effectivePrices, 7)
  const ma30d = calculateMovingAverage(effectivePrices, 30)

  // Trend detection (compare first third vs last third)
  const thirdLen = Math.max(1, Math.floor(effectivePrices.length / 3))
  const firstThird = effectivePrices.slice(0, thirdLen)
  const lastThird = effectivePrices.slice(-thirdLen)
  const firstAvg = firstThird.reduce((s, p) => s + p, 0) / firstThird.length
  const lastAvg = lastThird.reduce((s, p) => s + p, 0) / lastThird.length
  const changePercent = ((lastAvg - firstAvg) / firstAvg) * 100

  let direction: 'rising' | 'falling' | 'stable' = 'stable'
  if (changePercent > 3) direction = 'rising'
  else if (changePercent < -3) direction = 'falling'

  // Simple prediction (weighted recent average + trend)
  const recentPrices = effectivePrices.slice(-7)
  const recentAvg = recentPrices.reduce((s, p) => s + p, 0) / recentPrices.length
  const weeklyChange = (changePercent / (days / 7)) / 100
  const nextWeekPrediction = recentAvg * (1 + weeklyChange)

  const confidence = effectivePrices.length >= 20 ? 'high'
    : effectivePrices.length >= 7 ? 'medium'
    : 'low'

  let reasoning = ''
  if (direction === 'rising') {
    reasoning = `Prices have been trending up ${Math.abs(changePercent).toFixed(1)}% over the past ${days} days.`
  } else if (direction === 'falling') {
    reasoning = `Prices have been dropping ${Math.abs(changePercent).toFixed(1)}% over the past ${days} days.`
  } else {
    reasoning = `Prices have been relatively stable over the past ${days} days.`
  }

  // Seasonality (by month)
  const monthlyPrices = new Map<number, number[]>()
  for (const row of priceRows) {
    const month = new Date(row.effective_date).getMonth()
    const existing = monthlyPrices.get(month) || []
    existing.push(row.sale_price ?? row.price)
    monthlyPrices.set(month, existing)
  }

  let bestMonth: string | null = null
  let worstMonth: string | null = null
  let pattern: string | null = null

  if (monthlyPrices.size >= 3) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let lowestAvg = Infinity
    let highestAvg = -Infinity
    let bestIdx = 0
    let worstIdx = 0

    for (const [month, monthPrices] of monthlyPrices) {
      const monthAvg = monthPrices.reduce((s, p) => s + p, 0) / monthPrices.length
      if (monthAvg < lowestAvg) { lowestAvg = monthAvg; bestIdx = month }
      if (monthAvg > highestAvg) { highestAvg = monthAvg; worstIdx = month }
    }

    bestMonth = monthNames[bestIdx]
    worstMonth = monthNames[worstIdx]
    const savingsPercent = ((highestAvg - lowestAvg) / highestAvg * 100).toFixed(0)
    pattern = `Cheapest in ${bestMonth}, most expensive in ${worstMonth} (${savingsPercent}% difference)`
  }

  const currentPrice = effectivePrices.length > 0 ? effectivePrices[effectivePrices.length - 1] : null

  return {
    productId: productRow.id,
    productName: productRow.name,
    brand: productRow.brand,
    currentPrice,
    priceHistory,
    stats: {
      average: avg,
      median,
      min,
      max,
      stdDev,
      dataPoints: effectivePrices.length,
    },
    trend: {
      direction,
      changePercent,
      movingAverage7d: ma7d,
      movingAverage30d: ma30d,
    },
    prediction: {
      nextWeek: nextWeekPrediction,
      confidence,
      reasoning,
    },
    seasonality: {
      bestMonth,
      worstMonth,
      pattern,
    },
  }
}

/**
 * Calculate moving average of the last N values.
 */
function calculateMovingAverage(values: number[], window: number): number | null {
  if (values.length < window) return null
  const recent = values.slice(-window)
  return recent.reduce((s, v) => s + v, 0) / recent.length
}

/**
 * Get price trends for multiple products (batch).
 */
export async function batchAnalyzePriceTrends(
  productIds: string[],
  days: number = 90
): Promise<PriceTrendResult[]> {
  const results: PriceTrendResult[] = []
  for (const productId of productIds.slice(0, 10)) {
    const result = await analyzePriceTrend(productId, days)
    if (result) results.push(result)
  }
  return results
}
