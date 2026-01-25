import axios from 'axios'

/**
 * Open Food Facts API Client
 * Free, open-source food product database
 * Documentation: https://world.openfoodfacts.org/data
 */

const BASE_URL = 'https://world.openfoodfacts.org/api/v2'
const USER_AGENT = 'Julyu/1.0 (grocery-comparison-platform)'

interface OpenFoodFactsProduct {
  code: string
  product_name?: string
  brands?: string
  categories?: string
  quantity?: string
  serving_size?: string
  nutriscore_grade?: string
  nova_group?: number
  image_url?: string
  image_front_url?: string
  ingredients_text?: string
  allergens?: string
  nutriments?: {
    energy_kcal_100g?: number
    fat_100g?: number
    carbohydrates_100g?: number
    proteins_100g?: number
    salt_100g?: number
    sugars_100g?: number
    fiber_100g?: number
  }
}

interface ProductSearchResult {
  count: number
  page: number
  page_count: number
  page_size: number
  products: OpenFoodFactsProduct[]
}

export interface NormalizedProduct {
  upc: string
  name: string
  brand?: string
  category?: string
  size?: string
  imageUrl?: string
  nutrition?: {
    calories?: number
    fat?: number
    carbs?: number
    protein?: number
    sugar?: number
    fiber?: number
    sodium?: number
  }
  attributes?: {
    nutriScore?: string
    novaGroup?: number
    allergens?: string[]
    ingredients?: string
  }
}

/**
 * Open Food Facts API Client
 */
export class OpenFoodFactsClient {
  private axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'User-Agent': USER_AGENT,
    },
  })

  /**
   * Get product by barcode/UPC
   */
  async getProductByUPC(upc: string): Promise<NormalizedProduct | null> {
    try {
      // Clean UPC - remove leading zeros and non-numeric characters
      const cleanUPC = upc.replace(/\D/g, '')

      const response = await this.axiosInstance.get(`/product/${cleanUPC}.json`)

      if (response.data.status !== 1 || !response.data.product) {
        console.log(`[OpenFoodFacts] Product not found: ${upc}`)
        return null
      }

      return this.normalizeProduct(response.data.product)
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error(`[OpenFoodFacts] Error fetching product ${upc}:`, error.message)
      throw error
    }
  }

  /**
   * Search for products by name
   */
  async searchProducts(
    query: string,
    options?: {
      page?: number
      pageSize?: number
      categories?: string
      brands?: string
    }
  ): Promise<{ products: NormalizedProduct[]; totalCount: number }> {
    try {
      const params: Record<string, any> = {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        page: options?.page || 1,
        page_size: options?.pageSize || 20,
        fields: 'code,product_name,brands,categories,quantity,image_url,nutriscore_grade,nova_group,nutriments',
      }

      if (options?.categories) {
        params.tagtype_0 = 'categories'
        params.tag_contains_0 = 'contains'
        params.tag_0 = options.categories
      }

      if (options?.brands) {
        params.tagtype_1 = 'brands'
        params.tag_contains_1 = 'contains'
        params.tag_1 = options.brands
      }

      const response = await this.axiosInstance.get('/search', { params })

      const result: ProductSearchResult = response.data

      return {
        products: result.products.map(p => this.normalizeProduct(p)),
        totalCount: result.count,
      }
    } catch (error: any) {
      console.error(`[OpenFoodFacts] Search error for "${query}":`, error.message)
      throw error
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<{ products: NormalizedProduct[]; totalCount: number }> {
    try {
      const params = {
        action: 'process',
        tagtype_0: 'categories',
        tag_contains_0: 'contains',
        tag_0: category,
        json: 1,
        page: options?.page || 1,
        page_size: options?.pageSize || 20,
        fields: 'code,product_name,brands,categories,quantity,image_url,nutriscore_grade',
      }

      const response = await this.axiosInstance.get('/search', { params })

      const result: ProductSearchResult = response.data

      return {
        products: result.products.map(p => this.normalizeProduct(p)),
        totalCount: result.count,
      }
    } catch (error: any) {
      console.error(`[OpenFoodFacts] Category search error for "${category}":`, error.message)
      throw error
    }
  }

  /**
   * Normalize Open Food Facts product to our format
   */
  private normalizeProduct(product: OpenFoodFactsProduct): NormalizedProduct {
    return {
      upc: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands?.split(',')[0]?.trim(),
      category: product.categories?.split(',')[0]?.trim(),
      size: product.quantity,
      imageUrl: product.image_front_url || product.image_url,
      nutrition: product.nutriments ? {
        calories: product.nutriments.energy_kcal_100g,
        fat: product.nutriments.fat_100g,
        carbs: product.nutriments.carbohydrates_100g,
        protein: product.nutriments.proteins_100g,
        sugar: product.nutriments.sugars_100g,
        fiber: product.nutriments.fiber_100g,
        sodium: product.nutriments.salt_100g ? product.nutriments.salt_100g * 400 : undefined, // Convert salt to sodium
      } : undefined,
      attributes: {
        nutriScore: product.nutriscore_grade,
        novaGroup: product.nova_group,
        allergens: product.allergens?.split(',').map(a => a.trim()).filter(Boolean),
        ingredients: product.ingredients_text,
      },
    }
  }
}

export const openFoodFactsClient = new OpenFoodFactsClient()

/**
 * Helper function to populate product table from Open Food Facts
 */
export async function populateProductFromUPC(
  supabase: any,
  upc: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('upc', upc)
      .single()

    if (existing) {
      return { success: true, productId: existing.id }
    }

    // Fetch from Open Food Facts
    const product = await openFoodFactsClient.getProductByUPC(upc)

    if (!product) {
      return { success: false, error: 'Product not found in Open Food Facts' }
    }

    // Insert into database
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        brand: product.brand,
        category: product.category,
        upc: product.upc,
        size: product.size,
        image_url: product.imageUrl,
        attributes: {
          nutrition: product.nutrition,
          nutriScore: product.attributes?.nutriScore,
          novaGroup: product.attributes?.novaGroup,
          allergens: product.attributes?.allergens,
        },
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, productId: newProduct.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
