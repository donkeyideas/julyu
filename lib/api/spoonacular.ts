import { getApiKey } from './config'

/**
 * Spoonacular API Client
 * https://spoonacular.com/food-api
 *
 * Features:
 * - Grocery product search
 * - Product information by UPC
 * - Nutrition data
 * - Price estimates
 * - Recipe ingredients
 */

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com'

export interface SpoonacularProduct {
  id: number
  title: string
  brand?: string
  brandWithManufacturer?: string
  image?: string
  imageType?: string
  upc?: string
  aisle?: string
  price?: number
  servingSize?: string
  servings?: {
    number: number
    size: number
    unit: string
  }
  nutrition?: {
    nutrients: Array<{
      name: string
      amount: number
      unit: string
      percentOfDailyNeeds?: number
    }>
    caloricBreakdown?: {
      percentProtein: number
      percentFat: number
      percentCarbs: number
    }
  }
  badges?: string[]
  importantBadges?: string[]
  ingredientCount?: number
  ingredientList?: string
  generatedText?: string
  description?: string
}

export interface NormalizedSpoonacularProduct {
  id: string
  name: string
  brand?: string
  upc?: string
  imageUrl?: string
  price?: number
  aisle?: string
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
  }
  badges?: string[]
  source: 'spoonacular'
}

interface SpoonacularSearchResponse {
  products: SpoonacularProduct[]
  totalProducts: number
  type: string
  offset: number
  number: number
}

class SpoonacularClient {
  private apiKey: string | null = null

  /**
   * Check if Spoonacular API is configured
   */
  isConfigured(): boolean {
    return !!(process.env.SPOONACULAR_API_KEY)
  }

  /**
   * Check if configured (async version that checks database)
   */
  async isConfiguredAsync(): Promise<boolean> {
    try {
      const key = await this.getApiKey()
      return !!key
    } catch {
      return false
    }
  }

  /**
   * Get API key from environment or database
   */
  private async getApiKey(): Promise<string> {
    // Check cache first
    if (this.apiKey) {
      return this.apiKey
    }

    // Try environment variable first
    if (process.env.SPOONACULAR_API_KEY) {
      this.apiKey = process.env.SPOONACULAR_API_KEY
      return this.apiKey
    }

    // Try database
    const dbKey = await getApiKey('spoonacular')
    if (dbKey) {
      this.apiKey = dbKey
      return this.apiKey
    }

    throw new Error('Spoonacular API key not configured')
  }

  /**
   * Make authenticated request to Spoonacular API
   */
  private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const apiKey = await this.getApiKey()

    const url = new URL(`${SPOONACULAR_BASE_URL}${endpoint}`)
    url.searchParams.set('apiKey', apiKey)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }

    console.log(`[Spoonacular] Request: ${endpoint}`)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Spoonacular] API Error ${response.status}:`, errorText)

      if (response.status === 401) {
        this.apiKey = null // Clear cached key
        throw new Error('Invalid Spoonacular API key')
      }
      if (response.status === 402) {
        throw new Error('Spoonacular API quota exceeded')
      }

      throw new Error(`Spoonacular API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Search for grocery products
   */
  async searchGroceryProducts(
    query: string,
    options: {
      minCalories?: number
      maxCalories?: number
      minCarbs?: number
      maxCarbs?: number
      minProtein?: number
      maxProtein?: number
      minFat?: number
      maxFat?: number
      addProductInformation?: boolean
      offset?: number
      number?: number
    } = {}
  ): Promise<NormalizedSpoonacularProduct[]> {
    const params: Record<string, string | number> = {
      query,
      number: options.number || 10,
      offset: options.offset || 0,
    }

    if (options.addProductInformation !== false) {
      params.addProductInformation = 'true'
    }

    if (options.minCalories) params.minCalories = options.minCalories
    if (options.maxCalories) params.maxCalories = options.maxCalories
    if (options.minCarbs) params.minCarbs = options.minCarbs
    if (options.maxCarbs) params.maxCarbs = options.maxCarbs
    if (options.minProtein) params.minProtein = options.minProtein
    if (options.maxProtein) params.maxProtein = options.maxProtein
    if (options.minFat) params.minFat = options.minFat
    if (options.maxFat) params.maxFat = options.maxFat

    const response = await this.request<SpoonacularSearchResponse>(
      '/food/products/search',
      params
    )

    return response.products.map(p => this.normalizeProduct(p))
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<NormalizedSpoonacularProduct | null> {
    try {
      const product = await this.request<SpoonacularProduct>(
        `/food/products/${id}`
      )
      return this.normalizeProduct(product)
    } catch (error) {
      console.error(`[Spoonacular] Failed to get product ${id}:`, error)
      return null
    }
  }

  /**
   * Get product by UPC barcode
   */
  async getProductByUPC(upc: string): Promise<NormalizedSpoonacularProduct | null> {
    try {
      const product = await this.request<SpoonacularProduct>(
        `/food/products/upc/${upc}`
      )
      return this.normalizeProduct(product)
    } catch (error) {
      console.error(`[Spoonacular] Failed to get product by UPC ${upc}:`, error)
      return null
    }
  }

  /**
   * Search products by UPC (batch)
   */
  async searchByUPCs(upcs: string[]): Promise<NormalizedSpoonacularProduct[]> {
    const results: NormalizedSpoonacularProduct[] = []

    for (const upc of upcs) {
      const product = await this.getProductByUPC(upc)
      if (product) {
        results.push(product)
      }
    }

    return results
  }

  /**
   * Get comparable products (similar items)
   */
  async getComparableProducts(upc: string): Promise<NormalizedSpoonacularProduct[]> {
    try {
      const response = await this.request<{ comparableProducts: { [key: string]: SpoonacularProduct[] } }>(
        `/food/products/upc/${upc}/comparable`
      )

      const products: NormalizedSpoonacularProduct[] = []
      for (const category of Object.values(response.comparableProducts)) {
        for (const product of category) {
          products.push(this.normalizeProduct(product))
        }
      }

      return products
    } catch (error) {
      console.error(`[Spoonacular] Failed to get comparable products for ${upc}:`, error)
      return []
    }
  }

  /**
   * Autocomplete product search (for search suggestions)
   */
  async autocompleteProductSearch(
    query: string,
    number: number = 5
  ): Promise<Array<{ id: number; title: string }>> {
    try {
      const results = await this.request<Array<{ id: number; title: string }>>(
        '/food/products/suggest',
        { query, number }
      )
      return results
    } catch (error) {
      console.error(`[Spoonacular] Autocomplete failed:`, error)
      return []
    }
  }

  /**
   * Classify grocery product into aisle
   */
  async classifyGroceryProduct(
    title: string,
    upc?: string
  ): Promise<{ cleanTitle: string; category: string; breadcrumbs: string[] } | null> {
    try {
      const params: Record<string, string | number> = {}

      // This endpoint uses POST
      const apiKey = await this.getApiKey()
      const url = new URL(`${SPOONACULAR_BASE_URL}/food/products/classify`)
      url.searchParams.set('apiKey', apiKey)

      const formData = new URLSearchParams()
      formData.set('title', title)
      if (upc) formData.set('upc', upc)
      formData.set('pluCode', '')

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`[Spoonacular] Classification failed:`, error)
      return null
    }
  }

  /**
   * Normalize Spoonacular product to common format
   */
  private normalizeProduct(product: SpoonacularProduct): NormalizedSpoonacularProduct {
    // Extract nutrition values
    let nutrition: NormalizedSpoonacularProduct['nutrition'] | undefined

    if (product.nutrition?.nutrients) {
      const nutrients = product.nutrition.nutrients
      const findNutrient = (name: string) =>
        nutrients.find(n => n.name.toLowerCase() === name.toLowerCase())?.amount

      nutrition = {
        calories: findNutrient('Calories'),
        protein: findNutrient('Protein'),
        carbs: findNutrient('Carbohydrates'),
        fat: findNutrient('Fat'),
        fiber: findNutrient('Fiber'),
        sugar: findNutrient('Sugar'),
      }
    }

    return {
      id: String(product.id),
      name: product.title,
      brand: product.brand || product.brandWithManufacturer,
      upc: product.upc,
      imageUrl: product.image,
      price: product.price,
      aisle: product.aisle,
      nutrition,
      badges: product.importantBadges || product.badges,
      source: 'spoonacular',
    }
  }

  /**
   * Clear cached API key (useful when key is updated)
   */
  clearCache(): void {
    this.apiKey = null
  }
}

// Export singleton instance
export const spoonacularClient = new SpoonacularClient()
