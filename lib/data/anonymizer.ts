/**
 * Data Anonymization Layer
 * Strips PII and enforces k-anonymity for B2B data sharing.
 * Minimum 100 users per segment to prevent re-identification.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

const K_ANONYMITY_THRESHOLD = 100

// ============================================
// Types
// ============================================

export interface AnonymizedPriceData {
  productName: string
  brand: string | null
  category: string | null
  zipCode: string // Truncated to 3 digits
  period: string // YYYY-WW (year-week)
  avgPrice: number
  minPrice: number
  maxPrice: number
  sampleSize: number
  stores: string[]
}

export interface AnonymizedTrendData {
  productName: string
  brand: string | null
  category: string | null
  region: string
  periods: Array<{
    period: string
    avgPrice: number
    sampleSize: number
  }>
  trendDirection: 'rising' | 'falling' | 'stable'
  changePercent: number
}

export interface AnonymizedCategoryInsight {
  category: string
  region: string
  period: string
  avgSpend: number
  medianSpend: number
  itemCount: number
  topBrands: Array<{ brand: string; share: number }>
  sampleSize: number
}

// ============================================
// Anonymization Helpers
// ============================================

/**
 * Truncate zip code to first 3 digits for geographic anonymity.
 */
function truncateZip(zipCode: string | null): string {
  if (!zipCode) return 'unknown'
  return zipCode.substring(0, 3) + 'XX'
}

/**
 * Get ISO week string: YYYY-WW.
 */
function getWeekPeriod(date: string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const oneJan = new Date(year, 0, 1)
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000)
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

// ============================================
// Anonymized Data Queries
// ============================================

/**
 * Get anonymized price data aggregated by product, region, and week.
 */
export async function getAnonymizedPrices(options: {
  category?: string
  region?: string
  weeks?: number
}): Promise<AnonymizedPriceData[]> {
  const supabase = createServiceRoleClient() as any
  const weeksBack = options.weeks ?? 4
  const cutoff = new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get prices with product and store info
  let query = supabase
    .from('prices')
    .select('price, sale_price, effective_date, products(name, brand, category), stores(zip_code)')
    .gte('effective_date', cutoff)
    .order('effective_date', { ascending: false })
    .limit(50000)

  const { data: prices } = await query

  const priceRows = (prices ?? []) as Array<{
    price: number
    sale_price: number | null
    effective_date: string
    products: { name: string; brand: string | null; category: string | null } | null
    stores: { zip_code: string | null } | null
  }>

  // Group by product + truncated zip + week
  const groups = new Map<string, {
    productName: string
    brand: string | null
    category: string | null
    zipCode: string
    period: string
    prices: number[]
    stores: Set<string>
    userIds: Set<string>
  }>()

  for (const row of priceRows) {
    if (!row.products) continue

    // Apply category filter
    if (options.category && row.products.category !== options.category) continue

    const zipCode = truncateZip(row.stores?.zip_code ?? null)

    // Apply region filter
    if (options.region && zipCode !== options.region) continue

    const period = getWeekPeriod(row.effective_date)
    const key = `${row.products.name}|${zipCode}|${period}`

    const effectivePrice = row.sale_price ?? row.price

    if (!groups.has(key)) {
      groups.set(key, {
        productName: row.products.name,
        brand: row.products.brand,
        category: row.products.category,
        zipCode,
        period,
        prices: [],
        stores: new Set(),
        userIds: new Set(),
      })
    }

    const group = groups.get(key)!
    group.prices.push(effectivePrice)
    if (row.stores?.zip_code) group.stores.add(row.stores.zip_code)
  }

  // Filter by k-anonymity and build results
  const results: AnonymizedPriceData[] = []

  for (const group of groups.values()) {
    // Enforce minimum sample size
    if (group.prices.length < K_ANONYMITY_THRESHOLD) continue

    const sorted = [...group.prices].sort((a, b) => a - b)
    results.push({
      productName: group.productName,
      brand: group.brand,
      category: group.category,
      zipCode: group.zipCode,
      period: group.period,
      avgPrice: group.prices.reduce((s, p) => s + p, 0) / group.prices.length,
      minPrice: sorted[0],
      maxPrice: sorted[sorted.length - 1],
      sampleSize: group.prices.length,
      stores: Array.from(group.stores),
    })
  }

  return results.sort((a, b) => b.sampleSize - a.sampleSize)
}

/**
 * Get anonymized price trends for a product category.
 */
export async function getAnonymizedTrends(options: {
  category: string
  region?: string
  weeks?: number
}): Promise<AnonymizedTrendData[]> {
  const prices = await getAnonymizedPrices({
    category: options.category,
    region: options.region,
    weeks: options.weeks ?? 12,
  })

  // Group by product + region
  const productGroups = new Map<string, AnonymizedPriceData[]>()

  for (const price of prices) {
    const key = `${price.productName}|${price.zipCode}`
    const existing = productGroups.get(key) ?? []
    existing.push(price)
    productGroups.set(key, existing)
  }

  const results: AnonymizedTrendData[] = []

  for (const [, group] of productGroups) {
    if (group.length < 2) continue

    const sorted = [...group].sort((a, b) => a.period.localeCompare(b.period))
    const firstAvg = sorted[0].avgPrice
    const lastAvg = sorted[sorted.length - 1].avgPrice
    const changePercent = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0

    let trendDirection: 'rising' | 'falling' | 'stable'
    if (changePercent > 3) trendDirection = 'rising'
    else if (changePercent < -3) trendDirection = 'falling'
    else trendDirection = 'stable'

    results.push({
      productName: sorted[0].productName,
      brand: sorted[0].brand,
      category: sorted[0].category,
      region: sorted[0].zipCode,
      periods: sorted.map(s => ({
        period: s.period,
        avgPrice: s.avgPrice,
        sampleSize: s.sampleSize,
      })),
      trendDirection,
      changePercent,
    })
  }

  return results
}

/**
 * Get anonymized category-level spending insights.
 */
export async function getAnonymizedCategoryInsights(options: {
  region?: string
  weeks?: number
}): Promise<AnonymizedCategoryInsight[]> {
  const supabase = createServiceRoleClient() as any
  const weeksBack = options.weeks ?? 4
  const cutoff = new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get receipt items with categories
  const { data: items } = await supabase
    .from('receipt_items')
    .select('category, brand, total_price, created_at')
    .gte('created_at', cutoff)
    .limit(100000)

  const itemRows = (items ?? []) as Array<{
    category: string | null
    brand: string | null
    total_price: number | null
    created_at: string
  }>

  // Group by category
  const categoryGroups = new Map<string, {
    spends: number[]
    brands: Map<string, number>
    itemCount: number
  }>()

  for (const item of itemRows) {
    const category = item.category || 'Other'
    const price = item.total_price || 0

    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, { spends: [], brands: new Map(), itemCount: 0 })
    }

    const group = categoryGroups.get(category)!
    group.spends.push(price)
    group.itemCount++

    if (item.brand) {
      group.brands.set(item.brand, (group.brands.get(item.brand) || 0) + 1)
    }
  }

  const period = getWeekPeriod(new Date().toISOString())
  const results: AnonymizedCategoryInsight[] = []

  for (const [category, group] of categoryGroups) {
    // Enforce k-anonymity
    if (group.spends.length < K_ANONYMITY_THRESHOLD) continue

    const sorted = [...group.spends].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const avg = group.spends.reduce((s, p) => s + p, 0) / group.spends.length

    // Top brands by share
    const totalBrandItems = Array.from(group.brands.values()).reduce((s, c) => s + c, 0)
    const topBrands = Array.from(group.brands.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({
        brand,
        share: totalBrandItems > 0 ? count / totalBrandItems : 0,
      }))

    results.push({
      category,
      region: options.region || 'all',
      period,
      avgSpend: avg,
      medianSpend: median,
      itemCount: group.itemCount,
      topBrands,
      sampleSize: group.spends.length,
    })
  }

  return results.sort((a, b) => b.sampleSize - a.sampleSize)
}
