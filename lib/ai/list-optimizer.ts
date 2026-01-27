/**
 * Smart Shopping List Optimizer
 * Takes AI-generated ingredient lists and optimizes them by:
 * 1. Matching to real products in the database
 * 2. Finding best prices across stores
 * 3. Suggesting the optimal store combination
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

interface OptimizedItem {
  name: string
  quantity: number
  unit: string | null
  matchedProduct: {
    id: string
    name: string
    brand: string | null
    category: string | null
  } | null
  bestPrice: {
    price: number
    salePrice: number | null
    store: string
    storeId: string
  } | null
  alternatives: Array<{
    price: number
    store: string
    storeId: string
  }>
}

interface StoreTotal {
  storeId: string
  storeName: string
  total: number
  itemsAvailable: number
  itemsMissing: number
}

export interface OptimizedList {
  items: OptimizedItem[]
  storeTotals: StoreTotal[]
  bestStore: StoreTotal | null
  estimatedTotal: number
  potentialSavings: number
}

interface RawIngredient {
  name: string
  quantity?: number
  unit?: string
}

/**
 * Optimize a list of ingredients by matching to products and finding best prices.
 */
export async function optimizeShoppingList(
  ingredients: RawIngredient[],
  userId: string
): Promise<OptimizedList> {
  const supabase = createServiceRoleClient()
  const optimizedItems: OptimizedItem[] = []
  const storeMap = new Map<string, { name: string; total: number; available: number }>()

  for (const ingredient of ingredients) {
    // Search for matching products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, brand, category')
      .ilike('name', `%${ingredient.name}%`)
      .limit(5)

    const matchedProducts = (products ?? []) as Array<{
      id: string
      name: string
      brand: string | null
      category: string | null
    }>

    let matchedProduct = null
    let bestPrice = null
    const alternatives: Array<{ price: number; store: string; storeId: string }> = []

    if (matchedProducts.length > 0) {
      matchedProduct = matchedProducts[0]

      // Get prices for the best match
      const { data: prices } = await supabase
        .from('prices')
        .select('price, sale_price, stores(id, name, retailer)')
        .eq('product_id', matchedProduct.id)
        .order('price', { ascending: true })
        .limit(10)

      const priceRows = (prices ?? []) as Array<{
        price: number
        sale_price: number | null
        stores: { id: string; name: string | null; retailer: string } | null
      }>

      for (let i = 0; i < priceRows.length; i++) {
        const row = priceRows[i]
        const storeId = row.stores?.id || 'unknown'
        const storeName = row.stores?.name || row.stores?.retailer || 'Unknown Store'
        const effectivePrice = row.sale_price ?? row.price

        if (i === 0) {
          bestPrice = {
            price: row.price,
            salePrice: row.sale_price,
            store: storeName,
            storeId,
          }
        } else {
          alternatives.push({
            price: effectivePrice,
            store: storeName,
            storeId,
          })
        }

        // Track store totals
        const existing = storeMap.get(storeId)
        if (existing) {
          existing.total += effectivePrice * (ingredient.quantity || 1)
          existing.available += 1
        } else {
          storeMap.set(storeId, {
            name: storeName,
            total: effectivePrice * (ingredient.quantity || 1),
            available: 1,
          })
        }
      }
    }

    optimizedItems.push({
      name: ingredient.name,
      quantity: ingredient.quantity || 1,
      unit: ingredient.unit || null,
      matchedProduct,
      bestPrice,
      alternatives: alternatives.slice(0, 3),
    })
  }

  // Calculate store totals
  const storeTotals: StoreTotal[] = Array.from(storeMap.entries())
    .map(([storeId, data]) => ({
      storeId,
      storeName: data.name,
      total: data.total,
      itemsAvailable: data.available,
      itemsMissing: ingredients.length - data.available,
    }))
    .sort((a, b) => {
      // Sort by items available (desc), then by total (asc)
      if (b.itemsAvailable !== a.itemsAvailable) return b.itemsAvailable - a.itemsAvailable
      return a.total - b.total
    })

  // Best store = most items available, lowest total
  const bestStore = storeTotals.length > 0 ? storeTotals[0] : null

  // Estimated total = sum of best prices
  const estimatedTotal = optimizedItems.reduce((sum, item) => {
    if (item.bestPrice) {
      const price = item.bestPrice.salePrice ?? item.bestPrice.price
      return sum + price * item.quantity
    }
    return sum
  }, 0)

  // Potential savings = worst store total minus best store total
  const worstTotal = storeTotals.length > 1 ? storeTotals[storeTotals.length - 1].total : estimatedTotal
  const potentialSavings = Math.max(0, worstTotal - estimatedTotal)

  return {
    items: optimizedItems,
    storeTotals: storeTotals.slice(0, 5),
    bestStore,
    estimatedTotal,
    potentialSavings,
  }
}

/**
 * Save an optimized list as a shopping list in the database.
 */
export async function saveOptimizedList(
  userId: string,
  listName: string,
  items: OptimizedItem[]
): Promise<{ listId: string | null; error: string | null }> {
  const supabase = createServiceRoleClient()

  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: userId,
      name: listName,
    })
    .select('id')
    .single()

  if (listError || !list) {
    return { listId: null, error: listError?.message || 'Failed to create list' }
  }

  // Insert items
  const listItems = items.map(item => ({
    list_id: list.id,
    user_input: `${item.quantity > 1 ? `${item.quantity} ` : ''}${item.unit ? `${item.unit} ` : ''}${item.name}`,
    matched_product_id: item.matchedProduct?.id || null,
    quantity: item.quantity,
    unit: item.unit,
    match_confidence: item.matchedProduct ? 0.8 : null,
  }))

  await supabase.from('list_items').insert(listItems)

  return { listId: list.id, error: null }
}
