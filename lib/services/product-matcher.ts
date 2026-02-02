/**
 * Product Matcher Service
 * Matches user input to local product catalog using fuzzy matching
 *
 * Architecture: Reduce API calls by matching common items locally
 * - Check local products table with fuzzy matching
 * - "milk 2%" → matches "Great Value 2% Milk" (confidence score)
 * - Use cached prices from local DB (0 API calls)
 * - Only items with no good match go to external APIs
 *
 * Confidence threshold: 70% (0.70)
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching product names
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create distance matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity score between two strings (0-1)
 * Higher = more similar
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1.0

  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1.0

  const distance = levenshteinDistance(s1, s2)
  return 1 - distance / maxLen
}

/**
 * Calculate a smart match score using multiple signals
 */
function calculateMatchScore(
  userInput: string,
  productName: string,
  productBrand?: string | null
): number {
  const input = userInput.toLowerCase().trim()
  const name = productName.toLowerCase().trim()
  const brand = productBrand?.toLowerCase().trim() || ''
  const fullName = brand ? `${brand} ${name}` : name

  // Split into words for token matching
  const inputWords = input.split(/\s+/)
  const nameWords = name.split(/\s+/)
  const fullNameWords = fullName.split(/\s+/)

  // Score 1: Direct substring match (boosted)
  if (name.includes(input) || input.includes(name)) {
    return 0.95
  }

  // Score 2: All input words found in product name (high confidence)
  const allWordsMatch = inputWords.every(word =>
    fullNameWords.some(nw => nw.includes(word) || word.includes(nw))
  )
  if (allWordsMatch) {
    return 0.85
  }

  // Score 3: Most input words found (partial match)
  const matchedWords = inputWords.filter(word =>
    fullNameWords.some(nw => nw.includes(word) || word.includes(nw))
  )
  const wordMatchRatio = matchedWords.length / inputWords.length
  if (wordMatchRatio >= 0.7) {
    return 0.75 * wordMatchRatio
  }

  // Score 4: Levenshtein similarity
  const nameSimilarity = calculateSimilarity(input, name)
  const fullNameSimilarity = calculateSimilarity(input, fullName)

  return Math.max(nameSimilarity, fullNameSimilarity)
}

export interface LocalProductMatch {
  userInput: string
  product: {
    id: string
    name: string
    brand: string | null
    upc: string | null
    size: string | null
    imageUrl: string | null
  }
  price: number | null
  salePrice: number | null
  storeId: string | null
  storeName: string | null
  confidence: number
}

export interface ProductMatchResult {
  matched: LocalProductMatch[]
  unmatched: string[]
  stats: {
    totalItems: number
    matchedCount: number
    unmatchedCount: number
    avgConfidence: number
  }
}

const MATCH_CONFIDENCE_THRESHOLD = 0.70

/**
 * Find local product matches for user input items
 * Returns matched items (from local DB) and unmatched items (need API calls)
 */
export async function findLocalProductMatches(
  userItems: string[],
  options?: {
    storeId?: string
    minConfidence?: number
  }
): Promise<ProductMatchResult> {
  const minConfidence = options?.minConfidence ?? MATCH_CONFIDENCE_THRESHOLD
  const matched: LocalProductMatch[] = []
  const unmatched: string[] = []

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient() as any

    // Get all products with their latest prices
    // Limit to products that have been seen/priced before (not just empty catalog entries)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        upc,
        size,
        image_url,
        prices (
          price,
          sale_price,
          store_id,
          stores (
            name,
            retailer
          )
        )
      `)
      .not('name', 'is', null)
      .order('name')
      .limit(1000)

    if (productsError) {
      console.error('[ProductMatcher] Error fetching products:', productsError)
      return {
        matched: [],
        unmatched: userItems,
        stats: { totalItems: userItems.length, matchedCount: 0, unmatchedCount: userItems.length, avgConfidence: 0 }
      }
    }

    if (!products || products.length === 0) {
      console.log('[ProductMatcher] No products in local catalog')
      return {
        matched: [],
        unmatched: userItems,
        stats: { totalItems: userItems.length, matchedCount: 0, unmatchedCount: userItems.length, avgConfidence: 0 }
      }
    }

    console.log(`[ProductMatcher] Searching ${products.length} local products for ${userItems.length} items`)

    // For each user item, find the best matching product
    for (const userInput of userItems) {
      let bestMatch: {
        product: any
        price: any
        confidence: number
      } | null = null

      for (const product of products) {
        const confidence = calculateMatchScore(userInput, product.name, product.brand)

        if (confidence >= minConfidence) {
          if (!bestMatch || confidence > bestMatch.confidence) {
            // Get the best (most recent) price for this product
            const prices = product.prices || []
            const bestPrice = prices.length > 0 ? prices[0] : null

            bestMatch = {
              product,
              price: bestPrice,
              confidence
            }
          }
        }
      }

      if (bestMatch) {
        const priceInfo = bestMatch.price
        matched.push({
          userInput,
          product: {
            id: bestMatch.product.id,
            name: bestMatch.product.name,
            brand: bestMatch.product.brand,
            upc: bestMatch.product.upc,
            size: bestMatch.product.size,
            imageUrl: bestMatch.product.image_url,
          },
          price: priceInfo?.price || null,
          salePrice: priceInfo?.sale_price || null,
          storeId: priceInfo?.store_id || null,
          storeName: priceInfo?.stores?.name || null,
          confidence: bestMatch.confidence,
        })
        console.log(`[ProductMatcher] MATCH: "${userInput}" → "${bestMatch.product.name}" (${(bestMatch.confidence * 100).toFixed(0)}% confidence)`)
      } else {
        unmatched.push(userInput)
        console.log(`[ProductMatcher] NO MATCH: "${userInput}" (best below ${(minConfidence * 100).toFixed(0)}% threshold)`)
      }
    }

    const avgConfidence = matched.length > 0
      ? matched.reduce((sum, m) => sum + m.confidence, 0) / matched.length
      : 0

    console.log(`[ProductMatcher] Results: ${matched.length} matched, ${unmatched.length} need API`)

    return {
      matched,
      unmatched,
      stats: {
        totalItems: userItems.length,
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
      }
    }
  } catch (error) {
    console.error('[ProductMatcher] Error:', error)
    return {
      matched: [],
      unmatched: userItems,
      stats: { totalItems: userItems.length, matchedCount: 0, unmatchedCount: userItems.length, avgConfidence: 0 }
    }
  }
}

/**
 * Save new products discovered from API calls to local catalog
 * This builds up the local product catalog over time
 */
export async function saveProductsToCatalog(
  products: Array<{
    name: string
    brand?: string
    upc?: string
    size?: string
    imageUrl?: string
    price?: number
    salePrice?: number
    storeId?: string
    source: 'kroger' | 'walmart' | 'serpapi'
  }>
): Promise<number> {
  if (products.length === 0) return 0

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient() as any

    let savedCount = 0

    for (const product of products) {
      // Check if product already exists (by UPC or name match)
      let existingProduct: any = null

      if (product.upc) {
        const { data } = await supabase
          .from('products')
          .select('id')
          .eq('upc', product.upc)
          .single()
        existingProduct = data
      }

      if (!existingProduct) {
        // Try name match
        const { data } = await supabase
          .from('products')
          .select('id')
          .ilike('name', product.name)
          .single()
        existingProduct = data
      }

      let productId: string

      if (existingProduct) {
        productId = existingProduct.id
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand || null,
            upc: product.upc || null,
            size: product.size || null,
            image_url: product.imageUrl || null,
            attributes: {
              source: product.source,
              imported_at: new Date().toISOString(),
            },
          })
          .select('id')
          .single()

        if (error || !newProduct) {
          console.error('[ProductMatcher] Failed to save product:', error)
          continue
        }

        productId = newProduct.id
        savedCount++
      }

      // Save price if we have one
      if (product.price && product.storeId) {
        await supabase
          .from('prices')
          .upsert({
            product_id: productId,
            store_id: product.storeId,
            price: product.price,
            sale_price: product.salePrice || null,
            source: product.source,
            effective_date: new Date().toISOString(),
          }, {
            onConflict: 'product_id,store_id',
          })
      }
    }

    if (savedCount > 0) {
      console.log(`[ProductMatcher] Saved ${savedCount} new products to catalog`)
    }

    return savedCount
  } catch (error) {
    console.error('[ProductMatcher] Error saving products:', error)
    return 0
  }
}
