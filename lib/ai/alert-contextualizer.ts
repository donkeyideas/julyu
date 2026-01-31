/**
 * Alert Contextualizer
 * Adds AI-powered context to price alerts:
 * - Historical price context (how good is this deal?)
 * - Stockpiling recommendation
 * - Urgency score
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

interface AlertContext {
  alertId: string
  productName: string
  targetPrice: number
  currentPrice: number | null
  context: {
    dealQuality: 'excellent' | 'good' | 'average' | 'below_average'
    dealScore: number // 0-100
    historicalLow: number | null
    historicalAvg: number | null
    savingsVsAverage: number | null
    savingsPercent: number | null
    recommendation: string
    urgency: 'high' | 'medium' | 'low'
    stockpileRecommended: boolean
    stockpileReason: string | null
  }
}

interface AlertRow {
  id: string
  target_price: number
  current_price: number | null
  product_id: string | null
  products: { id: string; name: string; brand: string | null } | null
}

/**
 * Add context to a single price alert.
 */
export async function contextualizeAlert(
  alert: AlertRow
): Promise<AlertContext> {
  const supabase = createServiceRoleClient() as any
  const productName = alert.products?.name || 'Unknown Product'

  const defaultContext: AlertContext = {
    alertId: alert.id,
    productName,
    targetPrice: alert.target_price,
    currentPrice: alert.current_price,
    context: {
      dealQuality: 'average',
      dealScore: 50,
      historicalLow: null,
      historicalAvg: null,
      savingsVsAverage: null,
      savingsPercent: null,
      recommendation: 'No price history available to evaluate this deal.',
      urgency: 'low',
      stockpileRecommended: false,
      stockpileReason: null,
    },
  }

  if (!alert.product_id || !alert.current_price) return defaultContext

  // Get price history for this product (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: prices } = await supabase
    .from('prices')
    .select('price, sale_price, effective_date')
    .eq('product_id', alert.product_id)
    .gte('effective_date', cutoff)
    .order('effective_date', { ascending: true })

  const priceRows = (prices ?? []) as Array<{
    price: number
    sale_price: number | null
    effective_date: string
  }>

  if (priceRows.length === 0) return defaultContext

  const effectivePrices = priceRows.map(r => r.sale_price ?? r.price)
  const historicalLow = Math.min(...effectivePrices)
  const historicalAvg = effectivePrices.reduce((s, p) => s + p, 0) / effectivePrices.length
  const currentPrice = alert.current_price

  const savingsVsAverage = historicalAvg - currentPrice
  const savingsPercent = (savingsVsAverage / historicalAvg) * 100

  // Deal quality scoring
  const priceRange = Math.max(...effectivePrices) - historicalLow
  const positionInRange = priceRange > 0
    ? ((Math.max(...effectivePrices) - currentPrice) / priceRange) * 100
    : 50
  const dealScore = Math.round(Math.max(0, Math.min(100, positionInRange)))

  let dealQuality: 'excellent' | 'good' | 'average' | 'below_average'
  if (dealScore >= 80) dealQuality = 'excellent'
  else if (dealScore >= 60) dealQuality = 'good'
  else if (dealScore >= 40) dealQuality = 'average'
  else dealQuality = 'below_average'

  // Urgency based on recent trend
  const recentPrices = effectivePrices.slice(-5)
  const recentAvg = recentPrices.reduce((s, p) => s + p, 0) / recentPrices.length
  const trending = recentAvg > historicalAvg ? 'up' : 'down'

  let urgency: 'high' | 'medium' | 'low' = 'low'
  if (currentPrice <= historicalLow * 1.05) urgency = 'high'
  else if (trending === 'up' && dealScore >= 60) urgency = 'medium'

  // Stockpiling recommendation
  const stockpileRecommended = dealScore >= 75 && currentPrice <= historicalLow * 1.1
  const stockpileReason = stockpileRecommended
    ? `This price is near the 90-day low of $${historicalLow.toFixed(2)}. Consider buying extra if this is a non-perishable item.`
    : null

  // Generate recommendation
  let recommendation: string
  if (dealQuality === 'excellent') {
    recommendation = `This is an excellent deal — the price is near the 90-day low of $${historicalLow.toFixed(2)}. Buy now!`
  } else if (dealQuality === 'good') {
    recommendation = `A good price — you're saving $${savingsVsAverage.toFixed(2)} (${Math.abs(savingsPercent).toFixed(0)}%) compared to the average.`
  } else if (dealQuality === 'average') {
    recommendation = `This is about average pricing. The best price in the last 90 days was $${historicalLow.toFixed(2)}.`
  } else {
    recommendation = `This price is above average. Consider waiting — prices have been as low as $${historicalLow.toFixed(2)} recently.`
  }

  return {
    alertId: alert.id,
    productName,
    targetPrice: alert.target_price,
    currentPrice,
    context: {
      dealQuality,
      dealScore,
      historicalLow,
      historicalAvg,
      savingsVsAverage,
      savingsPercent,
      recommendation,
      urgency,
      stockpileRecommended,
      stockpileReason,
    },
  }
}

/**
 * Contextualize all active triggered alerts for a user.
 */
export async function contextualizeTriggeredAlerts(
  userId: string
): Promise<AlertContext[]> {
  const supabase = createServiceRoleClient() as any

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('id, target_price, current_price, product_id, products(id, name, brand)')
    .eq('user_id', userId)
    .eq('is_active', true)

  const alertRows = (alerts ?? []) as AlertRow[]

  // Only contextualize triggered alerts
  const triggered = alertRows.filter(a =>
    a.current_price !== null && a.current_price <= a.target_price
  )

  const contexts: AlertContext[] = []
  for (const alert of triggered) {
    const context = await contextualizeAlert(alert)
    contexts.push(context)
  }

  // Sort by deal score (best deals first)
  contexts.sort((a, b) => b.context.dealScore - a.context.dealScore)

  return contexts
}
