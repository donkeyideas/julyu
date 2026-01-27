/**
 * B2B Report Generator
 * Generates markdown reports from aggregated, anonymized data.
 */

import { getAnonymizedPrices, getAnonymizedTrends, getAnonymizedCategoryInsights } from '@/lib/data/anonymizer'

export interface ReportConfig {
  title: string
  categories?: string[]
  region?: string
  weeks?: number
  includePrices?: boolean
  includeTrends?: boolean
  includeCategories?: boolean
}

export interface GeneratedReport {
  title: string
  format: 'markdown'
  content: string
  generatedAt: string
  dataSummary: {
    priceDataPoints: number
    trendProducts: number
    categoriesAnalyzed: number
  }
}

/**
 * Generate a comprehensive market report.
 */
export async function generateReport(config: ReportConfig): Promise<GeneratedReport> {
  const weeks = config.weeks ?? 4
  const sections: string[] = []
  let priceDataPoints = 0
  let trendProducts = 0
  let categoriesAnalyzed = 0

  // Header
  sections.push(`# ${config.title}`)
  sections.push('')
  sections.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
  sections.push(`**Period:** Last ${weeks} weeks`)
  if (config.region) sections.push(`**Region:** ${config.region}`)
  sections.push('')
  sections.push('---')
  sections.push('')

  // Price Intelligence Section
  if (config.includePrices !== false) {
    sections.push('## Price Intelligence')
    sections.push('')

    const categories = config.categories ?? [undefined as unknown as string]

    for (const category of categories) {
      const prices = await getAnonymizedPrices({
        category: category || undefined,
        region: config.region,
        weeks,
      })

      priceDataPoints += prices.length

      if (prices.length === 0) continue

      if (category) {
        sections.push(`### ${category}`)
        sections.push('')
      }

      sections.push('| Product | Brand | Avg Price | Min | Max | Samples |')
      sections.push('|---------|-------|-----------|-----|-----|---------|')

      for (const price of prices.slice(0, 20)) {
        sections.push(
          `| ${price.productName} | ${price.brand || '-'} | $${price.avgPrice.toFixed(2)} | $${price.minPrice.toFixed(2)} | $${price.maxPrice.toFixed(2)} | ${price.sampleSize} |`
        )
      }
      sections.push('')
    }
  }

  // Trend Analysis Section
  if (config.includeTrends !== false && config.categories?.length) {
    sections.push('## Price Trends')
    sections.push('')

    for (const category of config.categories) {
      const trends = await getAnonymizedTrends({
        category,
        region: config.region,
        weeks: weeks > 4 ? weeks : 12,
      })

      trendProducts += trends.length

      if (trends.length === 0) continue

      sections.push(`### ${category}`)
      sections.push('')

      const rising = trends.filter(t => t.trendDirection === 'rising')
      const falling = trends.filter(t => t.trendDirection === 'falling')
      const stable = trends.filter(t => t.trendDirection === 'stable')

      if (rising.length > 0) {
        sections.push(`**Rising prices (${rising.length} products):**`)
        for (const t of rising.slice(0, 5)) {
          sections.push(`- ${t.productName}: +${t.changePercent.toFixed(1)}%`)
        }
        sections.push('')
      }

      if (falling.length > 0) {
        sections.push(`**Falling prices (${falling.length} products):**`)
        for (const t of falling.slice(0, 5)) {
          sections.push(`- ${t.productName}: ${t.changePercent.toFixed(1)}%`)
        }
        sections.push('')
      }

      sections.push(`**Stable:** ${stable.length} products`)
      sections.push('')
    }
  }

  // Category Insights Section
  if (config.includeCategories !== false) {
    sections.push('## Category Insights')
    sections.push('')

    const insights = await getAnonymizedCategoryInsights({
      region: config.region,
      weeks,
    })

    categoriesAnalyzed = insights.length

    if (insights.length > 0) {
      sections.push('| Category | Avg Spend | Median Spend | Items | Top Brand |')
      sections.push('|----------|-----------|--------------|-------|-----------|')

      for (const insight of insights) {
        const topBrand = insight.topBrands[0]?.brand || '-'
        sections.push(
          `| ${insight.category} | $${insight.avgSpend.toFixed(2)} | $${insight.medianSpend.toFixed(2)} | ${insight.itemCount} | ${topBrand} |`
        )
      }
      sections.push('')
    }
  }

  // Footer
  sections.push('---')
  sections.push('')
  sections.push(`*This report contains anonymized, aggregated data. All data points meet the minimum threshold of ${100} samples to ensure privacy.*`)

  return {
    title: config.title,
    format: 'markdown',
    content: sections.join('\n'),
    generatedAt: new Date().toISOString(),
    dataSummary: {
      priceDataPoints,
      trendProducts,
      categoriesAnalyzed,
    },
  }
}
