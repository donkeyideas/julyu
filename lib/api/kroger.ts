import axios, { AxiosInstance } from 'axios'
import { getKrogerCredentials } from './config'

/**
 * Kroger API Client
 * Free API for grocery data from Kroger family stores
 *
 * Signup: https://developer.kroger.com/
 * Docs: https://developer.kroger.com/reference
 *
 * Supported stores: Kroger, Fred Meyer, Ralphs, King Soopers,
 * Fry's, Smith's, QFC, Mariano's, Pick 'n Save, Metro Market, etc.
 *
 * API keys can be configured via:
 * 1. Admin panel (stored encrypted in database)
 * 2. Environment variables (KROGER_CLIENT_ID, KROGER_CLIENT_SECRET)
 */

const KROGER_API_BASE = 'https://api.kroger.com/v1'
const KROGER_AUTH_URL = 'https://api.kroger.com/v1/connect/oauth2/token'

// Token cache
let tokenCache: {
  accessToken: string
  expiresAt: number
} | null = null

// Credentials cache (to avoid hitting database on every request)
let credentialsCache: {
  clientId: string
  clientSecret: string
  cachedAt: number
} | null = null

const CREDENTIALS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface KrogerProduct {
  productId: string
  upc: string
  aisleLocations: Array<{
    bayNumber: string
    description: string
    number: string
    numberOfFacings: string
    sequenceNumber: string
    side: string
    shelfNumber: string
    shelfPositionInBay: string
  }>
  brand: string
  categories: string[]
  countryOrigin: string
  description: string
  images: Array<{
    perspective: string
    featured: boolean
    sizes: Array<{
      size: string
      url: string
    }>
  }>
  items: Array<{
    itemId: string
    favorite: boolean
    fulfillment: {
      curbside: boolean
      delivery: boolean
      inStore: boolean
      shipToHome: boolean
    }
    price?: {
      regular: number
      promo: number
      regularPerUnitEstimate?: number
      promoPerUnitEstimate?: number
    }
    nationalPrice?: {
      regular: number
      regularPerUnitEstimate?: number
    }
    size: string
    soldBy: string
  }>
  itemInformation: {
    depth: string
    height: string
    width: string
  }
  temperature: {
    indicator: string
    heatSensitive: boolean
  }
}

interface KrogerLocation {
  locationId: string
  chain: string
  name: string
  address: {
    addressLine1: string
    city: string
    state: string
    zipCode: string
    county: string
  }
  geolocation: {
    latitude: number
    longitude: number
    latLng: string
  }
  phone: string
  departments: Array<{
    departmentId: string
    name: string
    phone: string
    hours: {
      open24: boolean
      monday: { open: string; close: string }
      tuesday: { open: string; close: string }
      wednesday: { open: string; close: string }
      thursday: { open: string; close: string }
      friday: { open: string; close: string }
      saturday: { open: string; close: string }
      sunday: { open: string; close: string }
    }
  }>
  hours: {
    open24: boolean
    monday: { open: string; close: string }
    tuesday: { open: string; close: string }
    wednesday: { open: string; close: string }
    thursday: { open: string; close: string }
    friday: { open: string; close: string }
    saturday: { open: string; close: string }
    sunday: { open: string; close: string }
  }
}

export interface NormalizedKrogerProduct {
  id: string
  upc: string
  name: string
  brand: string
  description: string
  categories: string[]
  imageUrl?: string
  size?: string
  price?: {
    regular: number
    sale?: number
    perUnit?: number
  }
  availability: {
    inStore: boolean
    delivery: boolean
    pickup: boolean
  }
}

export interface NormalizedKrogerStore {
  id: string
  name: string
  chain: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  location: {
    lat: number
    lng: number
  }
  hours: Record<string, { open: string; close: string }>
}

/**
 * Kroger API Client
 */
export class KrogerClient {
  private axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: KROGER_API_BASE,
      timeout: 15000,
    })
  }

  /**
   * Get credentials (from database or environment)
   */
  private async getCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
    // Return cached credentials if still valid
    if (credentialsCache && Date.now() - credentialsCache.cachedAt < CREDENTIALS_CACHE_TTL) {
      return {
        clientId: credentialsCache.clientId,
        clientSecret: credentialsCache.clientSecret,
      }
    }

    // Try to get from database or environment
    const creds = await getKrogerCredentials()

    if (creds) {
      // Cache the credentials
      credentialsCache = {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        cachedAt: Date.now(),
      }
      return creds
    }

    return null
  }

  /**
   * Check if Kroger API is configured
   */
  isConfigured(): boolean {
    // Quick check for environment variables (sync check)
    const envConfigured = !!(process.env.KROGER_CLIENT_ID && process.env.KROGER_CLIENT_SECRET)
    if (envConfigured) return true

    // Check cache
    if (credentialsCache && Date.now() - credentialsCache.cachedAt < CREDENTIALS_CACHE_TTL) {
      return true
    }

    return false
  }

  /**
   * Async check if Kroger API is configured (checks database)
   */
  async isConfiguredAsync(): Promise<boolean> {
    const creds = await this.getCredentials()
    return !!creds
  }

  /**
   * Get OAuth access token (cached)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (tokenCache && tokenCache.expiresAt > Date.now() + 300000) {
      return tokenCache.accessToken
    }

    const creds = await this.getCredentials()
    if (!creds) {
      throw new Error('Kroger API credentials not configured. Add them in Admin → API Settings.')
    }

    console.log('[Kroger] Attempting OAuth with client ID:', creds.clientId.substring(0, 8) + '...')

    try {
      const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')

      const response = await axios.post(
        KROGER_AUTH_URL,
        'grant_type=client_credentials&scope=product.compact',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      )

      const { access_token, expires_in } = response.data

      // Cache the token
      tokenCache = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in * 1000),
      }

      console.log('[Kroger] OAuth token obtained successfully')
      return access_token
    } catch (error: any) {
      // Clear credentials cache on auth failure (may be invalid keys)
      if (error.response?.status === 401 || error.response?.status === 403) {
        credentialsCache = null
        tokenCache = null
      }
      console.error('[Kroger] OAuth error status:', error.response?.status)
      console.error('[Kroger] OAuth error data:', JSON.stringify(error.response?.data))
      console.error('[Kroger] OAuth error message:', error.message)

      // Provide more specific error messages
      const status = error.response?.status
      const errorData = error.response?.data
      let errorMsg = 'Failed to authenticate with Kroger API'

      if (status === 401) {
        errorMsg = 'Invalid Kroger credentials. Check your Client ID and Secret.'
      } else if (status === 403) {
        errorMsg = 'Kroger API access denied. Your app may need to be approved or moved to Production mode.'
      } else if (errorData?.error_description) {
        errorMsg = `Kroger API: ${errorData.error_description}`
      }

      throw new Error(errorMsg)
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const token = await this.getAccessToken()

    try {
      const response = await this.axios.request<T>({
        method,
        url: endpoint,
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      return response.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, clear cache and retry once
        tokenCache = null
        const newToken = await this.getAccessToken()

        const response = await this.axios.request<T>({
          method,
          url: endpoint,
          params: method === 'GET' ? params : undefined,
          data: method === 'POST' ? params : undefined,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Accept': 'application/json',
          },
        })

        return response.data
      }

      console.error(`[Kroger] API error on ${endpoint}:`, error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Search for products
   */
  async searchProducts(
    query: string,
    options?: {
      locationId?: string
      limit?: number
      start?: number
    }
  ): Promise<NormalizedKrogerProduct[]> {
    const params: Record<string, any> = {
      'filter.term': query,
      'filter.limit': options?.limit || 20,
      'filter.start': options?.start || 1,
    }

    if (options?.locationId) {
      params['filter.locationId'] = options.locationId
    }

    const response = await this.request<{ data: KrogerProduct[] }>('GET', '/products', params)

    return response.data.map(product => this.normalizeProduct(product))
  }

  /**
   * Get product by ID
   */
  async getProduct(
    productId: string,
    locationId?: string
  ): Promise<NormalizedKrogerProduct | null> {
    const params: Record<string, any> = {}

    if (locationId) {
      params['filter.locationId'] = locationId
    }

    try {
      const response = await this.request<{ data: KrogerProduct[] }>(
        'GET',
        `/products/${productId}`,
        params
      )

      if (response.data.length > 0) {
        return this.normalizeProduct(response.data[0])
      }
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Get products by UPC codes
   */
  async getProductsByUPC(
    upcs: string[],
    locationId?: string
  ): Promise<NormalizedKrogerProduct[]> {
    const params: Record<string, any> = {
      'filter.productId': upcs.join(','),
    }

    if (locationId) {
      params['filter.locationId'] = locationId
    }

    const response = await this.request<{ data: KrogerProduct[] }>('GET', '/products', params)

    return response.data.map(product => this.normalizeProduct(product))
  }

  /**
   * Search for nearby stores
   */
  async searchLocations(
    options: {
      zipCode?: string
      lat?: number
      lng?: number
      radiusMiles?: number
      limit?: number
      chain?: string
    }
  ): Promise<NormalizedKrogerStore[]> {
    const params: Record<string, any> = {
      'filter.limit': options.limit || 10,
    }

    if (options.zipCode) {
      params['filter.zipCode.near'] = options.zipCode
    } else if (options.lat && options.lng) {
      params['filter.lat.near'] = options.lat
      params['filter.lon.near'] = options.lng
    }

    if (options.radiusMiles) {
      params['filter.radiusInMiles'] = options.radiusMiles
    }

    if (options.chain) {
      params['filter.chain'] = options.chain
    }

    const response = await this.request<{ data: KrogerLocation[] }>('GET', '/locations', params)

    return response.data.map(location => this.normalizeLocation(location))
  }

  /**
   * Get store by ID
   */
  async getLocation(locationId: string): Promise<NormalizedKrogerStore | null> {
    try {
      const response = await this.request<{ data: KrogerLocation }>(
        'GET',
        `/locations/${locationId}`
      )

      return this.normalizeLocation(response.data)
    } catch (error) {
      return null
    }
  }

  /**
   * Normalize Kroger product to our format
   */
  private normalizeProduct(product: KrogerProduct): NormalizedKrogerProduct {
    const item = product.items?.[0]
    const image = product.images?.find(img => img.perspective === 'front')
    const imageUrl = image?.sizes?.find(s => s.size === 'medium' || s.size === 'large')?.url

    return {
      id: product.productId,
      upc: product.upc,
      name: product.description,
      brand: product.brand,
      description: product.description,
      categories: product.categories || [],
      imageUrl,
      size: item?.size,
      price: item?.price ? {
        regular: item.price.regular,
        sale: item.price.promo !== item.price.regular ? item.price.promo : undefined,
        perUnit: item.price.regularPerUnitEstimate,
      } : undefined,
      availability: {
        inStore: item?.fulfillment?.inStore || false,
        delivery: item?.fulfillment?.delivery || false,
        pickup: item?.fulfillment?.curbside || false,
      },
    }
  }

  /**
   * Normalize Kroger location to our format
   */
  private normalizeLocation(location: KrogerLocation): NormalizedKrogerStore {
    return {
      id: location.locationId,
      name: location.name,
      chain: location.chain,
      address: location.address.addressLine1,
      city: location.address.city,
      state: location.address.state,
      zip: location.address.zipCode,
      phone: location.phone,
      location: {
        lat: location.geolocation.latitude,
        lng: location.geolocation.longitude,
      },
      hours: {
        monday: location.hours?.monday || { open: '', close: '' },
        tuesday: location.hours?.tuesday || { open: '', close: '' },
        wednesday: location.hours?.wednesday || { open: '', close: '' },
        thursday: location.hours?.thursday || { open: '', close: '' },
        friday: location.hours?.friday || { open: '', close: '' },
        saturday: location.hours?.saturday || { open: '', close: '' },
        sunday: location.hours?.sunday || { open: '', close: '' },
      },
    }
  }
}

export const krogerClient = new KrogerClient()

/**
 * Helper function to search Kroger and add products to database
 */
export async function searchAndImportKrogerProducts(
  supabase: any,
  query: string,
  locationId?: string
): Promise<{ imported: number; products: NormalizedKrogerProduct[] }> {
  if (!krogerClient.isConfigured()) {
    console.warn('[Kroger] API not configured, skipping import')
    return { imported: 0, products: [] }
  }

  try {
    const products = await krogerClient.searchProducts(query, { locationId, limit: 10 })
    let imported = 0

    for (const product of products) {
      // Check if product exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('upc', product.upc)
        .single()

      if (!existing) {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand,
            upc: product.upc,
            size: product.size,
            category: product.categories?.[0],
            image_url: product.imageUrl,
            attributes: {
              kroger_id: product.id,
              availability: product.availability,
            },
          })

        if (!error) {
          imported++
        }
      }

      // Add price if available
      if (product.price && locationId) {
        // Find or create store
        let storeId: string | null = null

        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('store_number', locationId)
          .single()

        if (existingStore) {
          storeId = existingStore.id
        } else {
          // Get store details from Kroger
          const storeDetails = await krogerClient.getLocation(locationId)
          if (storeDetails) {
            const { data: newStore } = await supabase
              .from('stores')
              .insert({
                retailer: storeDetails.chain.toLowerCase(),
                store_number: storeDetails.id,
                name: storeDetails.name,
                address: storeDetails.address,
                city: storeDetails.city,
                state: storeDetails.state,
                zip: storeDetails.zip,
                phone: storeDetails.phone,
              })
              .select('id')
              .single()

            storeId = newStore?.id
          }
        }

        if (storeId) {
          // Find product in our database
          const { data: dbProduct } = await supabase
            .from('products')
            .select('id')
            .eq('upc', product.upc)
            .single()

          if (dbProduct) {
            // Add price
            await supabase
              .from('prices')
              .insert({
                product_id: dbProduct.id,
                store_id: storeId,
                price: product.price.regular,
                sale_price: product.price.sale,
                source: 'kroger_api',
                confidence: 1.0,
              })
          }
        }
      }
    }

    return { imported, products }
  } catch (error) {
    console.error('[Kroger] Import error:', error)
    return { imported: 0, products: [] }
  }
}
