/**
 * Data Quality Control Agent
 * Runs automated quality checks on product data, prices, and OCR results.
 * Detects: price outliers, stale data, missing fields, duplicate products, low OCR confidence.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface QualityIssue {
  type: 'price_outlier' | 'stale_data' | 'missing_fields' | 'duplicate' | 'low_confidence' | 'orphan_record'
  severity: 'critical' | 'warning' | 'info'
  table: string
  recordId: string
  description: string
  details: Record<string, unknown>
  suggestedFix?: string
}

export interface QualityReport {
  runAt: string
  totalIssues: number
  critical: number
  warnings: number
  info: number
  issues: QualityIssue[]
  summary: {
    productsChecked: number
    pricesChecked: number
    receiptsChecked: number
    storesChecked: number
  }
}

/**
 * Run all data quality checks and return a report.
 */
export async function runDataQualityChecks(): Promise<QualityReport> {
  const issues: QualityIssue[] = []

  const [
    priceIssues,
    staleIssues,
    missingFieldIssues,
    duplicateIssues,
    ocrIssues,
  ] = await Promise.all([
    checkPriceOutliers(),
    checkStaleData(),
    checkMissingFields(),
    checkDuplicateProducts(),
    checkLowOCRConfidence(),
  ])

  issues.push(...priceIssues, ...staleIssues, ...missingFieldIssues, ...duplicateIssues, ...ocrIssues)

  const supabase = createServiceRoleClient()
  const [products, prices, receipts, stores] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('prices').select('id', { count: 'exact', head: true }),
    supabase.from('receipts').select('id', { count: 'exact', head: true }),
    supabase.from('stores').select('id', { count: 'exact', head: true }),
  ])

  return {
    runAt: new Date().toISOString(),
    totalIssues: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
    issues: issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }),
    summary: {
      productsChecked: products.count ?? 0,
      pricesChecked: prices.count ?? 0,
      receiptsChecked: receipts.count ?? 0,
      storesChecked: stores.count ?? 0,
    },
  }
}

/**
 * Check for price outliers (>3 standard deviations from mean per product).
 */
async function checkPriceOutliers(): Promise<QualityIssue[]> {
  const supabase = createServiceRoleClient()
  const issues: QualityIssue[] = []

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .limit(100)

  if (!products) return issues

  for (const product of products as Array<{ id: string; name: string }>) {
    const { data: prices } = await supabase
      .from('prices')
      .select('id, price, sale_price, effective_date')
      .eq('product_id', product.id)
      .order('effective_date', { ascending: false })
      .limit(50)

    const priceRows = (prices ?? []) as Array<{
      id: string; price: number; sale_price: number | null; effective_date: string
    }>

    if (priceRows.length < 5) continue

    const values = priceRows.map(p => p.sale_price ?? p.price)
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    for (const row of priceRows) {
      const effectivePrice = row.sale_price ?? row.price
      const zScore = Math.abs((effectivePrice - mean) / stdDev)
      if (zScore > 3) {
        issues.push({
          type: 'price_outlier',
          severity: 'warning',
          table: 'prices',
          recordId: row.id,
          description: `Price outlier for "${product.name}": $${effectivePrice.toFixed(2)} is ${zScore.toFixed(1)} standard deviations from mean ($${mean.toFixed(2)})`,
          details: { productId: product.id, price: effectivePrice, mean, stdDev, zScore },
          suggestedFix: `Review and possibly remove this price entry. Expected range: $${(mean - 3 * stdDev).toFixed(2)} - $${(mean + 3 * stdDev).toFixed(2)}`,
        })
      }
    }
  }

  return issues
}

/**
 * Check for stale data (products not updated in 7+ days).
 */
async function checkStaleData(): Promise<QualityIssue[]> {
  const supabase = createServiceRoleClient()
  const issues: QualityIssue[] = []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleProducts } = await supabase
    .from('products')
    .select('id, name, updated_at')
    .lt('updated_at', sevenDaysAgo)
    .limit(50)

  for (const product of (staleProducts ?? []) as Array<{ id: string; name: string; updated_at: string }>) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(product.updated_at).getTime()) / (24 * 60 * 60 * 1000)
    )
    issues.push({
      type: 'stale_data',
      severity: daysSinceUpdate > 30 ? 'warning' : 'info',
      table: 'products',
      recordId: product.id,
      description: `"${product.name}" not updated in ${daysSinceUpdate} days`,
      details: { lastUpdated: product.updated_at, daysSinceUpdate },
      suggestedFix: 'Refresh pricing data for this product or mark as discontinued.',
    })
  }

  return issues
}

/**
 * Check for products with missing critical fields.
 */
async function checkMissingFields(): Promise<QualityIssue[]> {
  const supabase = createServiceRoleClient()
  const issues: QualityIssue[] = []

  // Products missing brand
  const { data: noBrand } = await supabase
    .from('products')
    .select('id, name')
    .is('brand', null)
    .limit(30)

  for (const p of (noBrand ?? []) as Array<{ id: string; name: string }>) {
    issues.push({
      type: 'missing_fields',
      severity: 'info',
      table: 'products',
      recordId: p.id,
      description: `"${p.name}" is missing brand information`,
      details: { missingField: 'brand' },
      suggestedFix: 'Add brand information to improve product matching accuracy.',
    })
  }

  // Products missing category
  const { data: noCategory } = await supabase
    .from('products')
    .select('id, name')
    .is('category', null)
    .limit(30)

  for (const p of (noCategory ?? []) as Array<{ id: string; name: string }>) {
    issues.push({
      type: 'missing_fields',
      severity: 'info',
      table: 'products',
      recordId: p.id,
      description: `"${p.name}" is missing category`,
      details: { missingField: 'category' },
      suggestedFix: 'Assign a category for better search and filtering.',
    })
  }

  // Products missing UPC
  const { data: noUpc } = await supabase
    .from('products')
    .select('id, name')
    .is('upc', null)
    .limit(30)

  for (const p of (noUpc ?? []) as Array<{ id: string; name: string }>) {
    issues.push({
      type: 'missing_fields',
      severity: 'info',
      table: 'products',
      recordId: p.id,
      description: `"${p.name}" is missing UPC code`,
      details: { missingField: 'upc' },
      suggestedFix: 'Add UPC for precise product identification and deduplication.',
    })
  }

  return issues
}

/**
 * Check for duplicate products (same name + brand).
 */
async function checkDuplicateProducts(): Promise<QualityIssue[]> {
  const supabase = createServiceRoleClient()
  const issues: QualityIssue[] = []

  // Get all products and check for name similarities
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, upc')
    .order('name', { ascending: true })
    .limit(500)

  const productRows = (products ?? []) as Array<{
    id: string; name: string; brand: string | null; upc: string | null
  }>

  // Check for exact name+brand duplicates
  const seen = new Map<string, string>()
  for (const p of productRows) {
    const key = `${p.name.toLowerCase().trim()}|${(p.brand || '').toLowerCase().trim()}`
    if (seen.has(key)) {
      issues.push({
        type: 'duplicate',
        severity: 'warning',
        table: 'products',
        recordId: p.id,
        description: `Possible duplicate: "${p.name}" (${p.brand || 'no brand'}) — matches product ${seen.get(key)}`,
        details: { duplicateOf: seen.get(key), name: p.name, brand: p.brand },
        suggestedFix: 'Merge these products and consolidate price history.',
      })
    } else {
      seen.set(key, p.id)
    }
  }

  // Check for duplicate UPCs
  const upcSeen = new Map<string, string>()
  for (const p of productRows) {
    if (!p.upc) continue
    if (upcSeen.has(p.upc)) {
      issues.push({
        type: 'duplicate',
        severity: 'critical',
        table: 'products',
        recordId: p.id,
        description: `Duplicate UPC "${p.upc}": "${p.name}" and product ${upcSeen.get(p.upc)}`,
        details: { duplicateOf: upcSeen.get(p.upc), upc: p.upc },
        suggestedFix: 'UPCs must be unique. Merge these products immediately.',
      })
    } else {
      upcSeen.set(p.upc, p.id)
    }
  }

  return issues
}

/**
 * Check for receipts with low OCR confidence.
 */
async function checkLowOCRConfidence(): Promise<QualityIssue[]> {
  const supabase = createServiceRoleClient()
  const issues: QualityIssue[] = []

  const { data: lowConfidence } = await supabase
    .from('receipts')
    .select('id, ocr_confidence, user_id, created_at')
    .eq('ocr_status', 'complete')
    .lt('ocr_confidence', 0.7)
    .order('created_at', { ascending: false })
    .limit(30)

  for (const r of (lowConfidence ?? []) as Array<{
    id: string; ocr_confidence: number | null; user_id: string; created_at: string
  }>) {
    issues.push({
      type: 'low_confidence',
      severity: r.ocr_confidence && r.ocr_confidence < 0.5 ? 'warning' : 'info',
      table: 'receipts',
      recordId: r.id,
      description: `Receipt has low OCR confidence: ${((r.ocr_confidence || 0) * 100).toFixed(0)}%`,
      details: { confidence: r.ocr_confidence, userId: r.user_id },
      suggestedFix: 'Flag for manual review or re-process with higher quality settings.',
    })
  }

  return issues
}
