import axios, { AxiosInstance } from 'axios'
import { logEvent, detectErrorKind } from '@/lib/services/scraper-health'

/**
 * Albertsons Companies Client
 *
 * One API covers the entire Albertsons family (~2,200 stores):
 *   Safeway, Albertsons, Vons, Pavilions, Randalls, Tom Thumb,
 *   Jewel-Osco, Shaw's, Star Market, Acme, Carrs, Haggen.
 *
 * The "xapi" endpoint is what the various banner websites
 * (safeway.com, albertsons.com, etc.) call from the browser. No auth.
 * Prices are store-specific via storeId.
 *
 * Endpoints:
 *   GET https://www.safeway.com/abs/pub/xapi/v2/products/search
 *   GET https://www.safeway.com/abs/pub/xapi/v2/stores/search
 *   GET https://www.safeway.com/abs/pub/xapi/v1/stores
 *
 * The same xapi works at any banner subdomain. We use safeway.com as the
 * canonical host since it's the largest and most stable; results contain
 * all banners.
 *
 * If Albertsons tightens this in the future, fall back to the per-banner
 * subdomain hosts (albertsons.com/abs/pub/xapi/...).
 */

const ALBERTSONS_BASE = 'https://www.safeway.com'
const SEARCH_CACHE_TTL = 6 * 60 * 60 * 1000
const STORE_CACHE_TTL = 24 * 60 * 60 * 1000

interface ABSPrice {
  price?: number
  basePrice?: number
  regularPrice?: number
  promoPrice?: number
  pricePer?: string
  unitOfMeasure?: string
}

interface ABSProduct {
  id?: string
  upc?: string
  name?: string
  description?: string
  brand?: string
  imageUrl?: string
  image?: string
  smallImage?: string
  averageWeight?: string
  unitsOfMeasure?: string
  unitOfMeasure?: string
  unitPrice?: number
  basePrice?: number
  price?: number
  regularPrice?: number
  promoPrice?: number
  priceNumeric?: number
  sellByWeight?: boolean
  department?: string
  aisle?: { name?: string }
  pricePer?: string
  storeId?: string
  // Some responses nest pricing
  pricing?: ABSPrice
}

interface ABSSearchResponse {
  response?: {
    docs?: ABSProduct[]
    numFound?: number
  }
  // Newer format
  products?: ABSProduct[]
  totalProducts?: number
}

interface ABSStore {
  id?: string
  storeId?: string
  name?: string
  storeName?: string
  banner?: string
  bannerName?: string
  address?: {
    address1?: string
    addressLine1?: string
    city?: string
    state?: string
    zipcode?: string
    zip?: string
  }
  latitude?: number
  longitude?: number
  phoneNumber?: string
  phone?: string
}

interface ABSStoresResponse {
  stores?: ABSStore[]
  results?: ABSStore[]
}

export interface NormalizedABSProduct {
  id: string
  upc?: string
  name: string
  brand?: string
  description?: string
  imageUrl?: string
  department?: string
  aisle?: string
  size?: string
  price?: {
    regular?: number
    sale?: number
    perUnit?: string
  }
  source: 'albertsons'
}

export interface NormalizedABSStore {
  id: string
  name: string
  banner: string
  bannerSlug: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  lat?: number
  lng?: number
}

export class AlbertsonsClient {
  private axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: ALBERTSONS_BASE,
      timeout: 20000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Referer: 'https://www.safeway.com/',
        Origin: 'https://www.safeway.com',
        'ocp-apim-subscription-key': process.env.ALBERTSONS_SUBSCRIPTION_KEY || '',
      },
    })
  }

  isConfigured(): boolean {
    return true // Public xapi
  }

  private normalizeQuery(q: string): string {
    return q.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  private async getCached<T>(
    apiName: string,
    query: string,
    locationId: string | null,
  ): Promise<T | null> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any

      let qb = supabase
        .from('api_search_cache')
        .select('results, id, hit_count')
        .eq('api_name', apiName)
        .eq('search_query_normalized', this.normalizeQuery(query))
        .gt('expires_at', new Date().toISOString())

      qb = locationId ? qb.eq('location_id', locationId) : qb.is('location_id', null)
      const { data, error } = await qb.single()
      if (error || !data) return null

      supabase
        .from('api_search_cache')
        .update({
          hit_count: (data.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .then(() => {})
        .catch(() => {})

      return data.results as T
    } catch {
      return null
    }
  }

  private async saveCache(
    apiName: string,
    query: string,
    locationId: string | null,
    results: unknown,
    ttlMs: number,
  ): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any

      await supabase.from('api_search_cache').upsert(
        {
          api_name: apiName,
          search_query: query,
          search_query_normalized: this.normalizeQuery(query),
          location_id: locationId,
          results,
          result_count: Array.isArray(results) ? results.length : 0,
          expires_at: new Date(Date.now() + ttlMs).toISOString(),
          hit_count: 0,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'api_name,search_query_normalized,location_id' },
      )
    } catch (e) {
      console.error('[Albertsons] Cache save error:', e)
    }
  }

  /**
   * Search products. storeId controls which store's prices come back.
   * Use searchStores() first to get a real storeId for the user's ZIP.
   */
  async searchProducts(
    query: string,
    options?: {
      storeId?: string
      limit?: number
      page?: number
      skipCache?: boolean
    },
  ): Promise<NormalizedABSProduct[]> {
    const limit = options?.limit || 30
    const storeId = options?.storeId || '2939' // Safeway default fallback
    const cacheKey = `${query}|${storeId}`

    if (!options?.skipCache && !options?.page) {
      const cached = await this.getCached<NormalizedABSProduct[]>(
        'albertsons',
        cacheKey,
        storeId,
      )
      if (cached) {
        console.log(`[Albertsons] Cache HIT for "${query}" @ store ${storeId}`)
        return cached.slice(0, limit)
      }
    }

    try {
      console.log(`[Albertsons] API CALL "${query}" @ store ${storeId}`)
      const response = await this.axios.get<ABSSearchResponse>(
        '/abs/pub/xapi/v2/products/search',
        {
          params: {
            request_origin: 'gsmweb',
            'rows': limit,
            'start': (options?.page || 0) * limit,
            'search-type': 'keyword',
            'q': query,
            'storeid': storeId,
            'fulfillment': 'instore',
            'banner': 'safeway',
          },
        },
      )

      const products = response.data.products || response.data.response?.docs || []
      const normalized = products
        .map((p) => this.normalizeProduct(p))
        .filter((p): p is NormalizedABSProduct => p !== null)

      if (normalized.length > 0) {
        await this.saveCache('albertsons', cacheKey, storeId, normalized, SEARCH_CACHE_TTL)
      }
      return normalized
    } catch (e: any) {
      console.error(
        '[Albertsons] Search error:',
        e.response?.status,
        e.response?.data || e.message,
      )
      return []
    }
  }

  /**
   * Diagnostic: try a list of known endpoint variants for store lookup
   * and return raw HTTP details. Use when searchStores returns nothing
   * to figure out which shape Albertsons currently expects.
   */
  async diagnoseStoreEndpoints(zip: string): Promise<Array<{
    url: string
    status: number | null
    bodyPreview: string
    bodyKeys?: string[]
  }>> {
    const variants: Array<{ url: string; params?: Record<string, unknown> }> = [
      {
        url: '/abs/pub/xapi/v2/stores/search',
        params: { request_origin: 'gsmweb', zipcode: zip, radius: 50, banner: 'all' },
      },
      {
        url: '/abs/pub/xapi/v1/stores/search',
        params: { request_origin: 'gsmweb', zipcode: zip, radius: 50 },
      },
      {
        url: `/abs/pub/xapi/v1/stores/locator/byzipcode/${zip}`,
        params: { banner: 'safeway' },
      },
      {
        url: `/abs/pub/xapi/storefront/programs/sf/v1/stores/byzipcode/${zip}`,
      },
      {
        url: '/abs/pub/xapi/v1/stores',
        params: { zipcode: zip, banner: 'safeway' },
      },
    ]

    const results: Array<{
      url: string
      status: number | null
      bodyPreview: string
      bodyKeys?: string[]
    }> = []

    for (const v of variants) {
      const startedAt = Date.now()
      try {
        const resp = await this.axios.get(v.url, { params: v.params, validateStatus: () => true })
        const bodyStr =
          typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data || {})
        const bodyKeys =
          resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)
            ? Object.keys(resp.data)
            : undefined

        const isJsonOk =
          resp.status >= 200 &&
          resp.status < 300 &&
          resp.data &&
          typeof resp.data === 'object'

        results.push({
          url: v.url,
          status: resp.status,
          bodyPreview: bodyStr.slice(0, 400),
          bodyKeys,
        })

        // Log each probe variant separately so the dashboard shows which
        // endpoint shapes are dead vs alive. If Albertsons ever reopens
        // the namespace, the success row here is the early-warning signal.
        logEvent({
          source: 'albertsons',
          operation: `probe ${v.url}`,
          success: isJsonOk,
          httpStatus: resp.status,
          latencyMs: Date.now() - startedAt,
          zip,
          errorKind: isJsonOk
            ? undefined
            : detectErrorKind({ status: resp.status, bodyPreview: bodyStr.slice(0, 200) }),
          errorMessage: isJsonOk ? undefined : bodyStr.slice(0, 200),
        })
      } catch (e: any) {
        results.push({
          url: v.url,
          status: e.response?.status ?? null,
          bodyPreview: e.message?.slice(0, 400) || 'network error',
        })
        const status = e.response?.status
        const bodyPreview =
          typeof e.response?.data === 'string'
            ? e.response.data.slice(0, 200)
            : JSON.stringify(e.response?.data || {}).slice(0, 200)
        logEvent({
          source: 'albertsons',
          operation: `probe ${v.url}`,
          success: false,
          httpStatus: status,
          latencyMs: Date.now() - startedAt,
          zip,
          errorMessage: e.message,
          errorKind: detectErrorKind({ status, bodyPreview, message: e.message }),
        })
      }
    }
    return results
  }

  /**
   * Find nearby stores. Banner filter narrows to one chain
   * (e.g. "albertsons", "vons", "jewelosco").
   */
  async searchStores(zip: string, banner?: string): Promise<NormalizedABSStore[]> {
    const cacheKey = banner ? `${zip}|${banner}` : zip
    const cached = await this.getCached<NormalizedABSStore[]>(
      'albertsons-stores',
      cacheKey,
      zip,
    )
    if (cached) return cached

    try {
      console.log(`[Albertsons] API CALL stores @ ${zip}${banner ? ` (${banner})` : ''}`)
      const response = await this.axios.get<ABSStoresResponse>(
        '/abs/pub/xapi/v2/stores/search',
        {
          params: {
            request_origin: 'gsmweb',
            zipcode: zip,
            radius: 50,
            banner: banner || 'all',
          },
        },
      )

      const stores = (response.data.stores || response.data.results || [])
        .map((s) => this.normalizeStore(s))
        .filter((s): s is NormalizedABSStore => s !== null)

      if (stores.length > 0) {
        await this.saveCache('albertsons-stores', cacheKey, zip, stores, STORE_CACHE_TTL)
      }
      return stores
    } catch (e: any) {
      console.error(
        '[Albertsons] Stores error:',
        e.response?.status,
        e.response?.data || e.message,
      )
      return []
    }
  }

  private normalizeProduct(p: ABSProduct): NormalizedABSProduct | null {
    const id = p.id || p.upc
    const name = p.name || p.description
    if (!id || !name) return null

    const pricing = p.pricing || {}
    const regular = p.regularPrice ?? p.basePrice ?? pricing.regularPrice ?? pricing.basePrice
    const promo = p.promoPrice ?? pricing.promoPrice
    const flat = p.price ?? p.priceNumeric ?? pricing.price

    const finalRegular = regular ?? flat
    const finalSale = promo !== undefined && promo !== finalRegular ? promo : undefined

    return {
      id: String(id),
      upc: p.upc,
      name,
      brand: p.brand,
      description: p.description,
      imageUrl: p.imageUrl || p.image || p.smallImage,
      department: p.department,
      aisle: p.aisle?.name,
      size: p.averageWeight || p.unitsOfMeasure || p.unitOfMeasure,
      price:
        finalRegular !== undefined || finalSale !== undefined
          ? {
              regular: finalRegular,
              sale: finalSale,
              perUnit: p.pricePer || pricing.pricePer,
            }
          : undefined,
      source: 'albertsons',
    }
  }

  private normalizeStore(s: ABSStore): NormalizedABSStore | null {
    const id = s.id || s.storeId
    if (!id) return null

    const banner = s.banner || s.bannerName || 'safeway'
    const bannerSlug = banner.toLowerCase().replace(/[^a-z0-9]/g, '-')

    return {
      id: String(id),
      name: s.name || s.storeName || `${banner} #${id}`,
      banner,
      bannerSlug,
      address: s.address?.address1 || s.address?.addressLine1,
      city: s.address?.city,
      state: s.address?.state,
      zip: s.address?.zipcode || s.address?.zip,
      phone: s.phoneNumber || s.phone,
      lat: s.latitude,
      lng: s.longitude,
    }
  }
}

export const albertsonsClient = new AlbertsonsClient()

export async function searchAndImportAlbertsonsProducts(
  supabase: any,
  query: string,
  zip = '90210',
): Promise<{ imported: number; products: NormalizedABSProduct[] }> {
  try {
    const stores = await albertsonsClient.searchStores(zip)
    const store = stores[0]
    if (!store) return { imported: 0, products: [] }

    const products = await albertsonsClient.searchProducts(query, {
      storeId: store.id,
      limit: 30,
    })

    let dbStoreId: string | null = null
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('store_number', store.id)
      .eq('retailer', store.bannerSlug)
      .maybeSingle()

    if (existingStore) {
      dbStoreId = existingStore.id
    } else {
      const { data: newStore } = await supabase
        .from('stores')
        .insert({
          retailer: store.bannerSlug,
          store_number: store.id,
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          zip: store.zip,
          phone: store.phone,
        })
        .select('id')
        .single()
      dbStoreId = newStore?.id || null
    }

    if (!dbStoreId) return { imported: 0, products }

    let imported = 0
    for (const product of products) {
      if (!product.price?.regular && !product.price?.sale) continue

      let productId: string | undefined
      if (product.upc) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('upc', product.upc)
          .maybeSingle()
        productId = existing?.id
      }

      if (!productId) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .ilike('name', product.name)
          .eq('brand', product.brand || 'Unknown')
          .maybeSingle()
        productId = existing?.id
      }

      if (!productId) {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand || 'Unknown',
            upc: product.upc,
            size: product.size,
            category: product.department,
            image_url: product.imageUrl,
            attributes: {
              albertsons_id: product.id,
              source: 'albertsons',
            },
          })
          .select('id')
          .single()
        productId = newProduct?.id
      }

      if (!productId) continue

      await supabase.from('prices').insert({
        product_id: productId,
        store_id: dbStoreId,
        price: product.price.regular || product.price.sale,
        sale_price: product.price.sale,
        source: 'albertsons_xapi',
        confidence: 0.95,
      })
      imported++
    }

    return { imported, products }
  } catch (e) {
    console.error('[Albertsons] Import error:', e)
    return { imported: 0, products: [] }
  }
}
