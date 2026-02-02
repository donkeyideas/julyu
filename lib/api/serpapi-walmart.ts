import axios from 'axios'
import { getSerpApiKey } from './config'
import { canMakeApiCall, trackApiCall } from '@/lib/services/rate-limiter'

/**
 * SerpApi Walmart Client
 * Fetches Walmart product and price data via SerpApi
 *
 * Signup: https://serpapi.com/
 * Docs: https://serpapi.com/walmart-search-api
 *
 * Free tier: 100 searches/month
 * Developer: $75/month for 5,000 searches
 *
 * CACHING: Results are cached for 24 hours to dramatically reduce API calls
 * E.g., 1000 users searching "milk 2%" = 1 API call per day instead of 1000
 */

const SERPAPI_BASE = 'https://serpapi.com/search'

// Cache TTL: 24 hours (in milliseconds)
const SEARCH_CACHE_TTL = 24 * 60 * 60 * 1000

// API key cache
let apiKeyCache: {
  key: string
  cachedAt: number
} | null = null

const API_KEY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// SerpApi Walmart Search Response
interface SerpApiWalmartSearchResult {
  us_item_id: string
  product_id: string
  title: string
  thumbnail: string
  rating?: number
  reviews?: number
  seller_id?: string
  seller_name?: string
  primary_offer?: {
    offer_price: number
    offer_id: string
    min_price?: number
    max_price?: number
    was_price?: number
  }
  two_day_shipping?: boolean
  product_page_url: string
  upc?: string
}

interface SerpApiWalmartSearchResponse {
  search_metadata: {
    status: string
    total_time_taken: number
  }
  search_information?: {
    total_results?: number
  }
  organic_results?: SerpApiWalmartSearchResult[]
  error?: string
}

// SerpApi Walmart Product Response
interface SerpApiWalmartProductResponse {
  search_metadata: {
    status: string
  }
  product_result?: {
    us_item_id: string
    product_id: string
    upc?: string
    title: string
    description?: string
    main_image?: string
    images?: string[]
    rating?: number
    review_count?: number
    price_map?: {
      price: number
      was_price?: number
      unit_price?: string
    }
    seller_id?: string
    seller_name?: string
    fulfillment?: {
      pickup_today?: boolean
      free_shipping?: boolean
      shipping?: boolean
    }
    product_page_url?: string
  }
  error?: string
}

export interface NormalizedWalmartProduct {
  id: string
  upc?: string
  name: string
  brand?: string
  description?: string
  imageUrl?: string
  price?: {
    regular: number
    sale?: number
  }
  rating?: number
  reviewCount?: number
  productUrl: string
  sellerId?: string
  sellerName?: string
  availability: {
    inStore: boolean
    delivery: boolean
    pickup: boolean
  }
}

/**
 * SerpApi Walmart Client
 */
export class SerpApiWalmartClient {
  /**
   * Get API key (from database or environment)
   */
  private async getApiKey(): Promise<string | null> {
    // Return cached key if still valid
    if (apiKeyCache && Date.now() - apiKeyCache.cachedAt < API_KEY_CACHE_TTL) {
      return apiKeyCache.key
    }

    const key = await getSerpApiKey()
    if (key) {
      apiKeyCache = {
        key,
        cachedAt: Date.now(),
      }
    }

    return key
  }

  /**
   * Check if SerpApi is configured
   */
  isConfigured(): boolean {
    // Quick check for environment variable (sync check)
    if (process.env.SERPAPI_API_KEY) return true

    // Check cache
    if (apiKeyCache && Date.now() - apiKeyCache.cachedAt < API_KEY_CACHE_TTL) {
      return true
    }

    return false
  }

  /**
   * Async check if SerpApi is configured
   */
  async isConfiguredAsync(): Promise<boolean> {
    const key = await this.getApiKey()
    return !!key
  }

  /**
   * Normalize search query for cache key
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  /**
   * Check cache for existing search results
   */
  private async getCachedResults(query: string): Promise<NormalizedWalmartProduct[] | null> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any
      const normalizedQuery = this.normalizeQuery(query)

      const { data, error } = await supabase
        .from('api_search_cache')
        .select('results, id, hit_count')
        .eq('api_name', 'serpapi-walmart')
        .eq('search_query_normalized', normalizedQuery)
        .is('location_id', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return null
      }

      // Update hit count asynchronously
      supabase
        .from('api_search_cache')
        .update({
          hit_count: (data.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .then(() => {})
        .catch(() => {})

      console.log(`[SerpApi] Cache HIT for "${query}" (normalized: "${normalizedQuery}")`)
      return data.results as NormalizedWalmartProduct[]
    } catch (error) {
      console.error('[SerpApi] Cache lookup error:', error)
      return null
    }
  }

  /**
   * Save search results to cache
   */
  private async cacheResults(query: string, results: NormalizedWalmartProduct[]): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any
      const normalizedQuery = this.normalizeQuery(query)
      const expiresAt = new Date(Date.now() + SEARCH_CACHE_TTL).toISOString()

      const { error } = await supabase
        .from('api_search_cache')
        .upsert({
          api_name: 'serpapi-walmart',
          search_query: query,
          search_query_normalized: normalizedQuery,
          location_id: null,
          results,
          result_count: results.length,
          expires_at: expiresAt,
          hit_count: 0,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'api_name,search_query_normalized,location_id',
        })

      if (error) {
        console.error('[SerpApi] Cache save error:', error)
      } else {
        console.log(`[SerpApi] Cached results for "${query}" (expires: ${expiresAt})`)
      }
    } catch (error) {
      console.error('[SerpApi] Cache save error:', error)
    }
  }

  /**
   * Search for Walmart products
   */
  async searchProducts(
    query: string,
    options?: {
      limit?: number
      page?: number
      sort?: 'best_match' | 'price_low' | 'price_high' | 'best_seller' | 'rating_high'
      minPrice?: number
      maxPrice?: number
      storeId?: string
      skipCache?: boolean // Force fresh API call
    }
  ): Promise<NormalizedWalmartProduct[]> {
    const limit = options?.limit || 10

    // Check cache first (unless explicitly skipped or using advanced options)
    const useCache = !options?.skipCache && !options?.page && !options?.sort &&
                     !options?.minPrice && !options?.maxPrice && !options?.storeId

    if (useCache) {
      const cachedResults = await this.getCachedResults(query)
      if (cachedResults && cachedResults.length > 0) {
        // Return cached results (no API call needed!)
        return cachedResults.slice(0, limit)
      }
    }

    // Check rate limit before making API call
    const { allowed, reason } = await canMakeApiCall('serpapi')
    if (!allowed) {
      console.warn('[SerpApi] Rate limited:', reason)
      return []
    }

    const apiKey = await this.getApiKey()
    if (!apiKey) {
      console.warn('[SerpApi] API key not configured')
      return []
    }

    try {
      const params: Record<string, any> = {
        engine: 'walmart',
        query,
        api_key: apiKey,
      }

      if (options?.sort) {
        params.sort = options.sort
      }
      if (options?.page) {
        params.page = options.page
      }
      if (options?.minPrice) {
        params.min_price = options.minPrice
      }
      if (options?.maxPrice) {
        params.max_price = options.maxPrice
      }
      if (options?.storeId) {
        params.store_id = options.storeId
      }

      console.log('[SerpApi] API CALL for:', query)

      const response = await axios.get<SerpApiWalmartSearchResponse>(SERPAPI_BASE, {
        params,
        timeout: 30000,
      })

      // Track the API call
      await trackApiCall('serpapi', true)

      if (response.data.error) {
        console.error('[SerpApi] API error:', response.data.error)
        return []
      }

      const results = response.data.organic_results || []
      console.log(`[SerpApi] Found ${results.length} Walmart products`)

      const normalizedResults = results.map(product => this.normalizeSearchResult(product))

      // Cache the results for future searches (cache more than we return)
      if (useCache && normalizedResults.length > 0) {
        await this.cacheResults(query, normalizedResults)
      }

      return normalizedResults.slice(0, limit)
    } catch (error: any) {
      // Track failed call
      await trackApiCall('serpapi', false)

      console.error('[SerpApi] Search error:', error.response?.data || error.message)
      return []
    }
  }

  /**
   * Get product details by ID
   */
  async getProduct(productId: string): Promise<NormalizedWalmartProduct | null> {
    // Check rate limit before making call
    const { allowed, reason } = await canMakeApiCall('serpapi')
    if (!allowed) {
      console.warn('[SerpApi] Rate limited:', reason)
      return null
    }

    const apiKey = await this.getApiKey()
    if (!apiKey) {
      console.warn('[SerpApi] API key not configured')
      return null
    }

    try {
      const params = {
        engine: 'walmart_product',
        product_id: productId,
        api_key: apiKey,
      }

      console.log('[SerpApi] Fetching Walmart product:', productId)

      const response = await axios.get<SerpApiWalmartProductResponse>(SERPAPI_BASE, {
        params,
        timeout: 30000,
      })

      // Track the API call
      await trackApiCall('serpapi', true)

      if (response.data.error) {
        console.error('[SerpApi] API error:', response.data.error)
        return null
      }

      const product = response.data.product_result
      if (!product) {
        return null
      }

      return this.normalizeProductResult(product)
    } catch (error: any) {
      // Track failed call
      await trackApiCall('serpapi', false)

      console.error('[SerpApi] Product fetch error:', error.response?.data || error.message)
      return null
    }
  }

  /**
   * Normalize search result to standard format
   */
  private normalizeSearchResult(product: SerpApiWalmartSearchResult): NormalizedWalmartProduct {
    return {
      id: product.us_item_id || product.product_id,
      name: product.title,
      imageUrl: product.thumbnail,
      price: product.primary_offer ? {
        regular: product.primary_offer.was_price || product.primary_offer.offer_price,
        sale: product.primary_offer.was_price ? product.primary_offer.offer_price : undefined,
      } : undefined,
      rating: product.rating,
      reviewCount: product.reviews,
      productUrl: product.product_page_url,
      sellerId: product.seller_id,
      sellerName: product.seller_name,
      upc: product.upc,
      availability: {
        inStore: true, // Walmart generally has in-store availability
        delivery: product.two_day_shipping || false,
        pickup: true,
      },
    }
  }

  /**
   * Normalize product detail result to standard format
   */
  private normalizeProductResult(product: SerpApiWalmartProductResponse['product_result']): NormalizedWalmartProduct {
    if (!product) {
      throw new Error('Product is undefined')
    }

    return {
      id: product.us_item_id || product.product_id,
      upc: product.upc,
      name: product.title,
      description: product.description,
      imageUrl: product.main_image,
      price: product.price_map ? {
        regular: product.price_map.was_price || product.price_map.price,
        sale: product.price_map.was_price ? product.price_map.price : undefined,
      } : undefined,
      rating: product.rating,
      reviewCount: product.review_count,
      productUrl: product.product_page_url || `https://www.walmart.com/ip/${product.us_item_id}`,
      sellerId: product.seller_id,
      sellerName: product.seller_name,
      availability: {
        inStore: true,
        delivery: product.fulfillment?.shipping || product.fulfillment?.free_shipping || false,
        pickup: product.fulfillment?.pickup_today || false,
      },
    }
  }
}

export const serpApiWalmartClient = new SerpApiWalmartClient()

/**
 * Helper function to search Walmart and add products to database
 */
export async function searchAndImportWalmartProducts(
  supabase: any,
  query: string
): Promise<{ imported: number; products: NormalizedWalmartProduct[] }> {
  if (!serpApiWalmartClient.isConfigured()) {
    console.warn('[SerpApi] API not configured, skipping Walmart import')
    return { imported: 0, products: [] }
  }

  try {
    const products = await serpApiWalmartClient.searchProducts(query, { limit: 10 })
    let imported = 0

    for (const product of products) {
      // Check if product exists (by name since UPC may not always be available)
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .ilike('name', product.name)
        .single()

      if (!existing && product.price) {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand || 'Unknown',
            upc: product.upc,
            image_url: product.imageUrl,
            attributes: {
              walmart_id: product.id,
              walmart_url: product.productUrl,
              availability: product.availability,
            },
          })

        if (!error) {
          imported++
        }
      }
    }

    return { imported, products }
  } catch (error) {
    console.error('[SerpApi] Import error:', error)
    return { imported: 0, products: [] }
  }
}
