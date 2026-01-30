/**
 * Tesco Product API Client (via RapidAPI)
 *
 * Provides real-time product data from Tesco (UK's largest supermarket)
 * API: https://rapidapi.com/DataMenu/api/tesco-product-api
 */

import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const RAPIDAPI_HOST = 'tesco-product-api.p.rapidapi.com'
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
      console.warn('[Tesco API] No RapidAPI key configured')
      return null
    }

    // Check if Tesco API is enabled
    if (!data.config?.tescoEnabled) {
      console.warn('[Tesco API] Tesco API is not enabled in config')
      return null
    }

    const apiKey = decrypt(data.api_key_encrypted)
    return apiKey || null
  } catch (error: any) {
    console.error('[Tesco API] Error getting API key:', error)
    return null
  }
}

export interface TescoProduct {
  id?: string
  title: string
  brand?: string
  image?: string
  price: number
  price_per_quantity?: number
  price_per_quantity_unit?: string
  unit_measure?: string
  unit_price?: string
  rating?: number
  review_count?: number
  availability?: string
  tpnb?: string
  gtin?: string
  department?: string
  superDepartment?: string
}

export interface TescoSearchResponse {
  uk: {
    ghs: {
      products: {
        results: TescoProduct[]
        pageInformation?: {
          page: number
          totalResults: number
        }
      }
    }
  }
}

/**
 * Search for products on Tesco
 */
export async function searchTescoProducts(query: string, page: number = 1, limit: number = 20): Promise<{
  success: boolean
  products: TescoProduct[]
  total: number
  error?: string
  rateLimitInfo?: any
}> {
  try {
    // Check rate limit first
    const { canMakeApiCall, trackApiCall } = await import('@/lib/services/rate-limiter')
    const rateLimitCheck = await canMakeApiCall('tesco')

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
        error: 'RapidAPI key not configured or Tesco API not enabled',
      }
    }

    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    console.log('[Tesco API] Searching:', query, 'page:', page)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      throw new Error(`Tesco API request failed: ${response.status} ${response.statusText}`)
    }

    const data: TescoSearchResponse = await response.json()
    const products = data?.uk?.ghs?.products?.results || []
    const total = data?.uk?.ghs?.products?.pageInformation?.totalResults || products.length

    console.log('[Tesco API] Found', products.length, 'products, total:', total)

    // Track successful API call
    const { trackApiCall } = await import('@/lib/services/rate-limiter')
    await trackApiCall('tesco', true)

    return {
      success: true,
      products,
      total,
      rateLimitInfo: rateLimitCheck.usage,
    }
  } catch (error: any) {
    console.error('[Tesco API] Error:', error)

    // Track failed API call
    try {
      const { trackApiCall } = await import('@/lib/services/rate-limiter')
      await trackApiCall('tesco', false)
    } catch (trackError) {
      console.error('[Tesco API] Failed to track API call:', trackError)
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
 * Get product details by TPNB (Tesco Product Number)
 */
export async function getTescoProduct(tpnb: string): Promise<{
  success: boolean
  product?: TescoProduct
  error?: string
  rateLimitInfo?: any
}> {
  try {
    // Check rate limit
    const { canMakeApiCall, trackApiCall } = await import('@/lib/services/rate-limiter')
    const rateLimitCheck = await canMakeApiCall('tesco')

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.reason || 'Rate limit exceeded',
        rateLimitInfo: rateLimitCheck.usage,
      }
    }

    const apiKey = await getRapidAPIKey()

    if (!apiKey) {
      return {
        success: false,
        error: 'RapidAPI key not configured or Tesco API not enabled',
      }
    }

    const url = `${BASE_URL}/product/${tpnb}`
    console.log('[Tesco API] Getting product:', tpnb)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      throw new Error(`Tesco API request failed: ${response.status} ${response.statusText}`)
    }

    const product: TescoProduct = await response.json()

    // Track successful API call
    await trackApiCall('tesco', true)

    return {
      success: true,
      product,
      rateLimitInfo: rateLimitCheck.usage,
    }
  } catch (error: any) {
    console.error('[Tesco API] Error:', error)

    // Track failed API call
    try {
      const { trackApiCall } = await import('@/lib/services/rate-limiter')
      await trackApiCall('tesco', false)
    } catch (trackError) {
      console.error('[Tesco API] Failed to track API call:', trackError)
    }

    return {
      success: false,
      error: error.message,
    }
  }
}
