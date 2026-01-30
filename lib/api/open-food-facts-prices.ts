/**
 * Open Food Facts Prices API Client
 *
 * Free crowdsourced grocery price database
 * API Docs: https://prices.openfoodfacts.org/api/docs
 * No authentication required for read operations
 */

const BASE_URL = 'https://prices.openfoodfacts.org/api/v1'

export interface OpenFoodFactsPrice {
  id: number
  product_code?: string
  product_name?: string
  price: number
  price_per?: string
  currency: string
  location_id?: number
  location_osm_id?: number
  location_osm_type?: string
  date: string
  proof_id?: number
  owner?: string
  created?: string
}

export interface OpenFoodFactsProduct {
  id: number
  code: string
  product_name?: string
  brands?: string
  categories?: string
  image_url?: string
  product_quantity?: number
  product_quantity_unit?: string
}

export interface OpenFoodFactsLocation {
  id: number
  osm_id?: number
  osm_type?: string
  osm_name?: string
  price_count?: number
  city?: string
  country?: string
}

export interface PriceSearchParams {
  product_code?: string
  product_name?: string
  location_id?: number
  location_osm_id?: number
  date__gte?: string // Date greater than or equal (YYYY-MM-DD)
  date__lte?: string // Date less than or equal (YYYY-MM-DD)
  currency?: string
  price__gte?: number
  price__lte?: number
  page?: number
  size?: number
}

export interface ApiResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * Search for prices in the Open Food Facts database
 */
export async function searchPrices(params: PriceSearchParams = {}): Promise<ApiResponse<OpenFoodFactsPrice>> {
  try {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const url = `${BASE_URL}/prices?${queryParams.toString()}`
    console.log('[Open Food Facts] Fetching prices:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Julyu-PriceComparison/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[Open Food Facts] Found', data.total, 'prices')

    return data
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching prices:', error)
    throw new Error(`Failed to fetch prices: ${error.message}`)
  }
}

/**
 * Get a specific price by ID
 */
export async function getPriceById(priceId: number): Promise<OpenFoodFactsPrice> {
  try {
    const url = `${BASE_URL}/prices/${priceId}`
    console.log('[Open Food Facts] Fetching price:', priceId)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Julyu-PriceComparison/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching price:', error)
    throw new Error(`Failed to fetch price: ${error.message}`)
  }
}

/**
 * Search for products
 */
export async function searchProducts(params: {
  code?: string
  product_name?: string
  page?: number
  size?: number
} = {}): Promise<ApiResponse<OpenFoodFactsProduct>> {
  try {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const url = `${BASE_URL}/products?${queryParams.toString()}`
    console.log('[Open Food Facts] Fetching products:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Julyu-PriceComparison/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[Open Food Facts] Found', data.total, 'products')

    return data
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching products:', error)
    throw new Error(`Failed to fetch products: ${error.message}`)
  }
}

/**
 * Search for locations (stores)
 */
export async function searchLocations(params: {
  osm_name?: string
  city?: string
  country?: string
  page?: number
  size?: number
} = {}): Promise<ApiResponse<OpenFoodFactsLocation>> {
  try {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const url = `${BASE_URL}/locations?${queryParams.toString()}`
    console.log('[Open Food Facts] Fetching locations:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Julyu-PriceComparison/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[Open Food Facts] Found', data.total, 'locations')

    return data
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching locations:', error)
    throw new Error(`Failed to fetch locations: ${error.message}`)
  }
}

/**
 * Get prices for a specific product by barcode/code
 */
export async function getPricesByProductCode(productCode: string, limit: number = 50): Promise<OpenFoodFactsPrice[]> {
  try {
    const response = await searchPrices({
      product_code: productCode,
      size: limit,
    })

    return response.items
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching prices for product:', productCode, error)
    return []
  }
}

/**
 * Get recent prices (last N days)
 */
export async function getRecentPrices(days: number = 7, limit: number = 100): Promise<OpenFoodFactsPrice[]> {
  try {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days)

    const response = await searchPrices({
      date__gte: startDate.toISOString().split('T')[0],
      date__lte: today.toISOString().split('T')[0],
      size: limit,
    })

    return response.items
  } catch (error: any) {
    console.error('[Open Food Facts] Error fetching recent prices:', error)
    return []
  }
}
