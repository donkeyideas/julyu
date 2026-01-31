import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'

/**
 * Price Extraction Service
 * Processes receipt OCR data and updates the price database
 */

interface ReceiptOCRResult {
  // Support both old and new format
  store?: {
    name: string
    address?: string
  }
  // New format from OpenAI client
  storeName?: string
  storeAddress?: string
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  subtotal?: number
  total: number
  tax?: number
  purchaseDate?: string
  confidence: number
}

interface ExtractedPrice {
  productId: string
  storeId: string
  price: number
  source: 'receipt'
  confidence: number
}

interface ExtractionResult {
  success: boolean
  storeId?: string
  storeName?: string
  productsProcessed: number
  pricesUpdated: number
  newProductsCreated: number
  errors: string[]
}

/**
 * Process receipt OCR data and update the price database
 */
export async function extractPricesFromReceipt(
  userId: string,
  ocrResult: ReceiptOCRResult
): Promise<ExtractionResult> {
  const supabase = await createServerClient()
  const errors: string[] = []
  let pricesUpdated = 0
  let newProductsCreated = 0

  // Normalize store data to support both old and new format
  const storeData = ocrResult.store || {
    name: ocrResult.storeName || 'Unknown Store',
    address: ocrResult.storeAddress
  }

  // Step 1: Find or create the store
  const storeResult = await findOrCreateStore(supabase, storeData)
  if (!storeResult.success) {
    errors.push(`Store processing failed: ${storeResult.error}`)
  }

  // Step 2: Match items to products using DeepSeek
  const itemNames = ocrResult.items.map(item => item.name)
  let matchedProducts: Array<{
    userInput: string
    matchedProduct: string
    brand?: string
    size?: string
    confidence: number
  }> = []

  try {
    if (itemNames.length > 0) {
      matchedProducts = await deepseekClient.matchProducts(itemNames)
    }
  } catch (matchError: any) {
    console.error('[PriceExtractor] Product matching failed:', matchError)
    errors.push(`Product matching failed: ${matchError.message}`)
    // Continue with basic matching
  }

  // Step 3: Process each item
  for (const item of ocrResult.items) {
    try {
      // Find matched product info
      const matchInfo = matchedProducts.find(
        m => m.userInput.toLowerCase() === item.name.toLowerCase()
      ) || {
        userInput: item.name,
        matchedProduct: item.name,
        confidence: 0.5
      }

      // Find or create product
      const productResult = await findOrCreateProduct(
        supabase,
        item.name,
        matchInfo.matchedProduct,
        matchInfo.brand,
        matchInfo.size
      )

      if (!productResult.success || !productResult.productId) {
        errors.push(`Failed to process product: ${item.name}`)
        continue
      }

      if (productResult.created) {
        newProductsCreated++
      }

      // Step 4: Add price to database
      if (storeResult.storeId) {
        const priceResult = await addPrice(
          supabase,
          productResult.productId,
          storeResult.storeId,
          item.price,
          ocrResult.confidence * (matchInfo.confidence || 0.5),
          ocrResult.purchaseDate
        )

        if (priceResult.success) {
          pricesUpdated++
        } else {
          errors.push(`Failed to add price for: ${item.name}`)
        }
      }
    } catch (itemError: any) {
      console.error(`[PriceExtractor] Error processing item ${item.name}:`, itemError)
      errors.push(`Error processing ${item.name}: ${itemError.message}`)
    }
  }

  return {
    success: errors.length === 0,
    storeId: storeResult.storeId,
    storeName: storeResult.storeName,
    productsProcessed: ocrResult.items.length,
    pricesUpdated,
    newProductsCreated,
    errors,
  }
}

/**
 * Find existing store or create new one
 */
async function findOrCreateStore(
  supabase: any,
  storeInfo: { name: string; address?: string }
): Promise<{
  success: boolean
  storeId?: string
  storeName?: string
  error?: string
}> {
  try {
    // Normalize store name for matching
    const normalizedName = normalizeStoreName(storeInfo.name)

    // Try to find existing store by name
    const { data: existingStores, error: searchError } = await supabase
      .from('stores')
      .select('id, name, retailer')
      .ilike('name', `%${normalizedName}%`)
      .limit(1)

    if (searchError) {
      console.error('[PriceExtractor] Store search error:', searchError)
    }

    if (existingStores && existingStores.length > 0) {
      return {
        success: true,
        storeId: existingStores[0].id,
        storeName: existingStores[0].name,
      }
    }

    // Create new store
    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert({
        name: storeInfo.name,
        retailer: normalizedName,
        address: storeInfo.address || '',
      })
      .select('id, name')
      .single()

    if (createError) {
      console.error('[PriceExtractor] Store creation error:', createError)
      return {
        success: false,
        error: createError.message,
      }
    }

    return {
      success: true,
      storeId: newStore.id,
      storeName: newStore.name,
    }
  } catch (error: any) {
    console.error('[PriceExtractor] Store processing failed:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Find existing product or create new one
 */
async function findOrCreateProduct(
  supabase: any,
  originalName: string,
  matchedName: string,
  brand?: string,
  size?: string
): Promise<{
  success: boolean
  productId?: string
  created?: boolean
  error?: string
}> {
  try {
    // Try to find by matched name first
    const { data: existingProducts, error: searchError } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', `%${matchedName}%`)
      .limit(1)

    if (searchError) {
      console.error('[PriceExtractor] Product search error:', searchError)
    }

    if (existingProducts && existingProducts.length > 0) {
      return {
        success: true,
        productId: existingProducts[0].id,
        created: false,
      }
    }

    // Create new product
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert({
        name: matchedName,
        brand: brand || null,
        size: size || null,
        attributes: {},
      })
      .select('id')
      .single()

    if (createError) {
      console.error('[PriceExtractor] Product creation error:', createError)
      return {
        success: false,
        error: createError.message,
      }
    }

    return {
      success: true,
      productId: newProduct.id,
      created: true,
    }
  } catch (error: any) {
    console.error('[PriceExtractor] Product processing failed:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Add or update price in database
 */
async function addPrice(
  supabase: any,
  productId: string,
  storeId: string,
  price: number,
  confidence: number,
  purchaseDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert new price record
    const { error: insertError } = await supabase
      .from('prices')
      .insert({
        product_id: productId,
        store_id: storeId,
        price: price,
        source: 'receipt',
        confidence: Math.min(confidence, 1.0),
        effective_date: purchaseDate || new Date().toISOString(),
      })

    if (insertError) {
      console.error('[PriceExtractor] Price insert error:', insertError)
      return {
        success: false,
        error: insertError.message,
      }
    }

    // Also add to price history
    await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        store_id: storeId,
        price: price,
        source: 'receipt',
        recorded_at: purchaseDate || new Date().toISOString(),
      })

    return { success: true }
  } catch (error: any) {
    console.error('[PriceExtractor] Price processing failed:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Normalize store name for matching
 * E.g., "Walmart Supercenter #1234" -> "walmart"
 */
function normalizeStoreName(name: string): string {
  // Known retailer mappings
  const retailers: Record<string, string[]> = {
    'walmart': ['walmart', 'wal-mart', 'wal mart'],
    'target': ['target'],
    'kroger': ['kroger', 'fred meyer', 'ralphs', 'smiths', 'king soopers', 'fry\'s'],
    'costco': ['costco'],
    'safeway': ['safeway', 'albertsons', 'vons', 'jewel-osco'],
    'publix': ['publix'],
    'aldi': ['aldi'],
    'lidl': ['lidl'],
    'trader_joes': ['trader joe', 'trader joes', 'trader joe\'s'],
    'whole_foods': ['whole foods'],
    'heb': ['h-e-b', 'heb', 'h e b'],
    'wegmans': ['wegmans'],
    'meijer': ['meijer'],
    'winco': ['winco'],
    'food_lion': ['food lion'],
    'stop_shop': ['stop & shop', 'stop and shop'],
  }

  const lowerName = name.toLowerCase()

  for (const [retailer, variants] of Object.entries(retailers)) {
    if (variants.some(v => lowerName.includes(v))) {
      return retailer
    }
  }

  // Return cleaned version of original name
  return lowerName
    .replace(/[#\d]+/g, '') // Remove numbers
    .replace(/\s+/g, ' ')   // Normalize spaces
    .trim()
}
