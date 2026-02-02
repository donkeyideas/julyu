/**
 * Comparison Training Data Logger
 * Captures search → product match pairs for LLM training
 *
 * Every comparison search generates training data:
 * - User input (e.g., "milk 2%")
 * - Matched product (e.g., "Great Value 2% Reduced Fat Milk")
 * - Source (kroger, walmart, local_catalog)
 * - Confidence score
 * - Price data
 *
 * This data improves the LLM's product matching capabilities over time.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ComparisonTrainingPair {
  userInput: string
  matchedProduct: {
    name: string
    brand?: string
    upc?: string
  }
  source: 'kroger' | 'walmart' | 'local_catalog'
  confidence: number
  price?: number
  storeId?: string
  metadata?: Record<string, unknown>
}

/**
 * Log a single comparison match as training data
 */
export async function logComparisonTrainingPair(
  pair: ComparisonTrainingPair
): Promise<void> {
  try {
    const supabase = createServiceRoleClient() as any

    const productOutput = pair.matchedProduct.brand
      ? `${pair.matchedProduct.name} (${pair.matchedProduct.brand})`
      : pair.matchedProduct.name

    await supabase.from('ai_training_data').insert({
      use_case: 'comparison_matching',
      input_data: {
        user_input: pair.userInput,
        source: pair.source,
      },
      output_data: {
        product_name: pair.matchedProduct.name,
        product_brand: pair.matchedProduct.brand,
        product_upc: pair.matchedProduct.upc,
        price: pair.price,
      },
      // Also store as text for simpler training exports
      input_text: pair.userInput,
      output_text: productOutput,
      accuracy_score: pair.confidence,
      user_feedback: pair.confidence >= 0.9 ? 'positive' : pair.confidence >= 0.7 ? 'neutral' : null,
      metadata: {
        source: pair.source,
        store_id: pair.storeId,
        price: pair.price,
        upc: pair.matchedProduct.upc,
        from_local_catalog: pair.source === 'local_catalog',
        ...pair.metadata,
      },
      validated: pair.source !== 'local_catalog', // API matches are pre-validated
    })
  } catch (error) {
    // Don't fail the main request if training logging fails
    console.error('[ComparisonTraining] Failed to log training pair:', error)
  }
}

/**
 * Log multiple comparison matches as training data (batch)
 */
export async function logComparisonTrainingBatch(
  pairs: ComparisonTrainingPair[]
): Promise<{ logged: number; failed: number }> {
  if (pairs.length === 0) {
    return { logged: 0, failed: 0 }
  }

  try {
    const supabase = createServiceRoleClient() as any

    const rows = pairs.map(pair => {
      const productOutput = pair.matchedProduct.brand
        ? `${pair.matchedProduct.name} (${pair.matchedProduct.brand})`
        : pair.matchedProduct.name

      return {
        use_case: 'comparison_matching',
        input_data: {
          user_input: pair.userInput,
          source: pair.source,
        },
        output_data: {
          product_name: pair.matchedProduct.name,
          product_brand: pair.matchedProduct.brand,
          product_upc: pair.matchedProduct.upc,
          price: pair.price,
        },
        input_text: pair.userInput,
        output_text: productOutput,
        accuracy_score: pair.confidence,
        user_feedback: pair.confidence >= 0.9 ? 'positive' : pair.confidence >= 0.7 ? 'neutral' : null,
        metadata: {
          source: pair.source,
          store_id: pair.storeId,
          price: pair.price,
          upc: pair.matchedProduct.upc,
          from_local_catalog: pair.source === 'local_catalog',
          ...pair.metadata,
        },
        validated: pair.source !== 'local_catalog',
      }
    })

    const { error } = await supabase.from('ai_training_data').insert(rows)

    if (error) {
      console.error('[ComparisonTraining] Batch insert error:', error)
      return { logged: 0, failed: pairs.length }
    }

    console.log(`[ComparisonTraining] Logged ${pairs.length} training pairs`)
    return { logged: pairs.length, failed: 0 }
  } catch (error) {
    console.error('[ComparisonTraining] Failed to log training batch:', error)
    return { logged: 0, failed: pairs.length }
  }
}

/**
 * Log a full comparison session (all items from one search)
 * This captures the full context of what users search together
 */
export async function logComparisonSession(
  session: {
    items: string[]
    locationContext?: string
    storeResults: Array<{
      storeName: string
      retailer: string
      items: Array<{
        userInput: string
        productName?: string
        productBrand?: string
        productUpc?: string
        price?: number
      }>
      total: number
    }>
    bestStore?: string
  }
): Promise<void> {
  try {
    const supabase = createServiceRoleClient() as any

    // Log the session as a "list_building" training example
    // This helps the LLM understand common shopping patterns
    await supabase.from('ai_training_data').insert({
      use_case: 'list_building',
      input_data: {
        items: session.items,
        location: session.locationContext,
      },
      output_data: {
        stores_searched: session.storeResults.map(s => s.retailer),
        best_store: session.bestStore,
        totals: session.storeResults.map(s => ({
          store: s.storeName,
          total: s.total,
        })),
      },
      input_text: session.items.join(', '),
      output_text: session.bestStore || 'no_match',
      accuracy_score: 1.0,
      user_feedback: 'positive',
      metadata: {
        item_count: session.items.length,
        stores_compared: session.storeResults.length,
        location: session.locationContext,
      },
      validated: true,
    })

    // Also log individual product matches from the best store
    const bestStoreResult = session.storeResults.find(
      s => s.storeName === session.bestStore || s.retailer === session.bestStore
    )

    if (bestStoreResult) {
      const pairs: ComparisonTrainingPair[] = []

      for (const item of bestStoreResult.items) {
        if (item.productName) {
          pairs.push({
            userInput: item.userInput,
            matchedProduct: {
              name: item.productName,
              brand: item.productBrand,
              upc: item.productUpc,
            },
            source: bestStoreResult.retailer.toLowerCase().includes('kroger')
              ? 'kroger'
              : bestStoreResult.retailer.toLowerCase().includes('walmart')
              ? 'walmart'
              : 'local_catalog',
            confidence: 1.0, // User selected this store, so matches are validated
            price: item.price,
          })
        }
      }

      if (pairs.length > 0) {
        await logComparisonTrainingBatch(pairs)
      }
    }
  } catch (error) {
    console.error('[ComparisonTraining] Failed to log session:', error)
  }
}
