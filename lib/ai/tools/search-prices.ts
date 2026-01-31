/**
 * Search Prices Tool
 * Lets the AI search the price database for products.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ActionResult, ActionTool } from './types'

interface PriceRow {
  price: number
  sale_price: number | null
  effective_date: string
  products: { name: string; brand: string | null; category: string | null } | null
  stores: { name: string | null; retailer: string; city: string | null } | null
}

async function execute(
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const supabase = createServiceRoleClient() as any

  const query = params.query as string
  const category = params.category as string | undefined
  const maxResults = (params.maxResults as number) ?? 10

  if (!query) {
    return { success: false, action: 'SEARCH_PRICES', message: 'No search query provided.' }
  }

  // Search products by name
  let productQuery = supabase
    .from('products')
    .select('id, name, brand, category')
    .ilike('name', `%${query}%`)

  if (category) {
    productQuery = productQuery.eq('category', category)
  }

  const { data: products } = await productQuery.limit(maxResults)

  if (!products || products.length === 0) {
    return {
      success: true,
      action: 'SEARCH_PRICES',
      message: `No products found matching "${query}".`,
      data: { results: [] },
    }
  }

  // Get prices for found products
  const productIds = (products as Array<{ id: string }>).map(p => p.id)
  const { data: prices } = await supabase
    .from('prices')
    .select('price, sale_price, effective_date, products(name, brand, category), stores(name, retailer, city)')
    .in('product_id', productIds)
    .order('effective_date', { ascending: false })
    .limit(maxResults * 3)

  const priceRows: PriceRow[] = (prices ?? []) as PriceRow[]

  // Group by product and find best prices
  const results: Array<{
    product: string
    brand: string | null
    bestPrice: number
    bestStore: string
    prices: Array<{ store: string; price: number; salePrice: number | null; date: string }>
  }> = []

  const grouped = new Map<string, PriceRow[]>()
  for (const row of priceRows) {
    const key = row.products?.name || 'Unknown'
    const existing = grouped.get(key) || []
    existing.push(row)
    grouped.set(key, existing)
  }

  for (const [productName, rows] of grouped) {
    const sorted = rows.sort((a, b) => {
      const aPrice = a.sale_price ?? a.price
      const bPrice = b.sale_price ?? b.price
      return aPrice - bPrice
    })

    const best = sorted[0]
    results.push({
      product: productName,
      brand: best.products?.brand ?? null,
      bestPrice: best.sale_price ?? best.price,
      bestStore: best.stores?.name || best.stores?.retailer || 'Unknown',
      prices: sorted.slice(0, 5).map(r => ({
        store: r.stores?.name || r.stores?.retailer || 'Unknown',
        price: r.price,
        salePrice: r.sale_price,
        date: r.effective_date,
      })),
    })
  }

  // Build message
  let message = `Found ${results.length} product(s) matching "${query}":\n`
  for (const r of results) {
    message += `\n• ${r.product}${r.brand ? ` (${r.brand})` : ''}`
    message += ` — Best: $${r.bestPrice.toFixed(2)} at ${r.bestStore}`
    if (r.prices.length > 1) {
      message += ` (${r.prices.length} stores compared)`
    }
  }

  return {
    success: true,
    action: 'SEARCH_PRICES',
    message,
    data: { results },
  }
}

export const searchPricesTool: ActionTool = {
  action: 'SEARCH_PRICES',
  description: 'Search the price database for products and compare prices across stores',
  execute,
}
