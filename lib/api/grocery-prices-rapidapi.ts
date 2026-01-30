/**
 * API to Find Grocery Prices Client (via RapidAPI)
 *
 * Provides real-time grocery prices from Amazon and Walmart
 * API: https://rapidapi.com/mahmudulhasandev/api/api-to-find-grocery-prices
 */

import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const RAPIDAPI_HOST = 'api-to-find-grocery-prices.p.rapidapi.com'
const BASE_URL = `https://${RAPIDAPI_HOST}`

// Encryption functions (same as in save-api-keys)
const getEncryptionKey = (): string => {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return key.substring(0, 32).padEnd(32, '0')
}

function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') return ''
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return ''

    const iv = Buffer.from(parts[0], 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv)
    let decrypted = decipher.update(parts[1], 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error: any) {
    console.error('[Decrypt] Error:', error.message)
    return ''
  }
}

/**
 * Get RapidAPI key from database
 */
async function getRapidAPIKey(): Promise<string | null> {
  try {
    // Check environment variable first
    if (process.env.RAPIDAPI_KEY) {
      return process.env.RAPIDAPI_KEY
    }

    // Check database
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted, config')
      .eq('model_name', 'rapidapi')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.warn('[Grocery Prices API] No RapidAPI key configured')
      return null
    }

    // Check if Grocery Prices API is enabled
    if (!data.config?.groceryPricesEnabled) {
      console.warn('[Grocery Prices API] Grocery Prices API is not enabled in config')
      return null
    }

    const apiKey = decrypt(data.api_key_encrypted)
    return apiKey || null
  } catch (error: any) {
    console.error('[Grocery Prices API] Error getting API key:', error)
    return null
  }
}

export interface GroceryProduct {
  product_id?: string
  title: string
  brand?: string
  image?: string
  price: number
  original_price?: number
  discount?: number
  discount_percentage?: number
  currency?: string
  rating?: number
  review_count?: number
  availability?: string
  store: 'Amazon' | 'Walmart' | string
  url?: string
  delivery_options?: {
    standard?: string
    express?: string
    pickup?: boolean
  }
  shipping_cost?: number
  prime_eligible?: boolean
  in_stock?: boolean
}

export interface GrocerySearchResponse {
  products: GroceryProduct[]
  total: number
  page: number
}

/**
 * Search for grocery products on Amazon and Walmart
 */
export async function searchGroceryPrices(
  query: string,
  params: {
    store?: 'amazon' | 'walmart' | 'all'
    page?: number
    limit?: number
    min_price?: number
    max_price?: number
  } = {}
): Promise<{
  success: boolean
  products: GroceryProduct[]
  total: number
  error?: string
  rateLimitInfo?: any
}> {
  try {
    // Check rate limit first
    const { canMakeApiCall, trackApiCall } = await import('@/lib/services/rate-limiter')
    const rateLimitCheck = await canMakeApiCall('grocery-prices')

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        products: [],
        total: 0,
        error: rateLimitCheck.reason || 'Rate limit exceeded',
        rateLimitInfo: rateLimitCheck.usage,
      }
    }

    const apiKey = await getRapidAPIKey()

    if (!apiKey) {
      return {
        success: false,
        products: [],
        total: 0,
        error: 'RapidAPI key not configured or Grocery Prices API not enabled',
      }
    }

    const { store = 'all', page = 1, limit = 20, min_price, max_price } = params

    const queryParams = new URLSearchParams({
      query,
      page: String(page),
      limit: String(limit),
    })

    if (store !== 'all') {
      queryParams.append('store', store)
    }
    if (min_price !== undefined) {
      queryParams.append('min_price', String(min_price))
    }
    if (max_price !== undefined) {
      queryParams.append('max_price', String(max_price))
    }

    const url = `${BASE_URL}/search?${queryParams.toString()}`
    console.log('[Grocery Prices API] Searching:', query, 'store:', store, 'page:', page)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      throw new Error(`Grocery Prices API request failed: ${response.status} ${response.statusText}`)
    }

    const data: GrocerySearchResponse = await response.json()
    const products = data?.products || []
    const total = data?.total || products.length

    console.log('[Grocery Prices API] Found', products.length, 'products, total:', total)

    // Track successful API call
    await trackApiCall('grocery-prices', true)

    return {
      success: true,
      products,
      total,
      rateLimitInfo: rateLimitCheck.usage,
    }
  } catch (error: any) {
    console.error('[Grocery Prices API] Error:', error)

    // Track failed API call
    try {
      await trackApiCall('grocery-prices', false)
    } catch (trackError) {
      console.error('[Grocery Prices API] Failed to track API call:', trackError)
    }

    return {
      success: false,
      products: [],
      total: 0,
      error: error.message,
    }
  }
}

/**
 * Get product details by product ID
 */
export async function getGroceryProduct(productId: string, store: 'amazon' | 'walmart'): Promise<{
  success: boolean
  product?: GroceryProduct
  error?: string
}> {
  try {
    const apiKey = await getRapidAPIKey()

    if (!apiKey) {
      return {
        success: false,
        error: 'RapidAPI key not configured or Grocery Prices API not enabled',
      }
    }

    const url = `${BASE_URL}/product/${store}/${productId}`
    console.log('[Grocery Prices API] Getting product:', productId, 'from', store)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      throw new Error(`Grocery Prices API request failed: ${response.status} ${response.statusText}`)
    }

    const product: GroceryProduct = await response.json()

    return {
      success: true,
      product,
    }
  } catch (error: any) {
    console.error('[Grocery Prices API] Error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Compare prices across Amazon and Walmart for a specific query
 */
export async function comparePrices(query: string, limit: number = 10): Promise<{
  success: boolean
  amazon: GroceryProduct[]
  walmart: GroceryProduct[]
  cheapest?: {
    product: GroceryProduct
    store: string
  }
  error?: string
}> {
  try {
    const [amazonResults, walmartResults] = await Promise.all([
      searchGroceryPrices(query, { store: 'amazon', limit }),
      searchGroceryPrices(query, { store: 'walmart', limit }),
    ])

    if (!amazonResults.success && !walmartResults.success) {
      return {
        success: false,
        amazon: [],
        walmart: [],
        error: amazonResults.error || walmartResults.error,
      }
    }

    // Find cheapest option across both stores
    const allProducts = [
      ...amazonResults.products.map(p => ({ product: p, store: 'Amazon' })),
      ...walmartResults.products.map(p => ({ product: p, store: 'Walmart' })),
    ]

    const cheapest = allProducts.reduce((min, current) => {
      return current.product.price < min.product.price ? current : min
    }, allProducts[0])

    return {
      success: true,
      amazon: amazonResults.products,
      walmart: walmartResults.products,
      cheapest,
    }
  } catch (error: any) {
    console.error('[Grocery Prices API] Error comparing prices:', error)
    return {
      success: false,
      amazon: [],
      walmart: [],
      error: error.message,
    }
  }
}
