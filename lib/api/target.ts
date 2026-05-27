import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { logEvent, detectErrorKind } from '@/lib/services/scraper-health'
import { applyProxy, isBotBlockSignal, estimateProxyCostUsd, getProxyUrl } from '@/lib/services/proxy-pool'

/**
 * Target RedSky Client
 *
 * RedSky is the public-facing aggregation API that target.com itself uses.
 * The "API key" is shipped in Target's own JS bundle and rotates rarely —
 * it's the same one anyone visiting target.com uses. Considered public.
 *
 * Endpoints we use:
 *   - GET /redsky_aggregations/v1/web/plp_search_v2     (product list / search)
 *   - GET /redsky_aggregations/v1/web/pdp_client_v1     (product detail page)
 *   - GET /redsky_aggregations/v1/web/nearby_stores_v1  (store locator by ZIP)
 *
 * Prices vary by store_id (zone-based). Pass a store_id to get the actual
 * shelf price for that location; omit it for the "default" online price.
 *
 * No auth/signup needed. Be respectful — randomize delays, cache hard.
 *
 * Public-key fallback is updated when Target rotates theirs. If RedSky starts
 * returning 401, the env var TARGET_API_KEY can override.
 */

const REDSKY_BASE = 'https://redsky.target.com'
const TARGET_PUBLIC_KEY = '9f36aeafbe60771e321a7cc95a78140772ab3e96'
const TARGET_VISITOR_ID = '0192C9E0F4C70207A06F40C73D2EAEDB' // any 32-char hex works

const SEARCH_CACHE_TTL = 6 * 60 * 60 * 1000 // 6h
const STORE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

interface RedSkyPrice {
  current_retail?: number
  current_retail_min?: number
  current_retail_max?: number
  reg_retail?: number
  formatted_current_price?: string
  formatted_comparison_price?: string
  is_current_price_range?: boolean
}

interface RedSkyProduct {
  tcin: string
  item?: {
    product_classification?: {
      product_type_name?: string
    }
    primary_brand?: {
      name: string
    }
    product_description?: {
      title: string
      downstream_description?: string
    }
    enrichment?: {
      images?: {
        primary_image_url?: string
      }
    }
    merchandise_classification?: {
      department_name?: string
      class_name?: string
    }
    package_dimensions?: {
      weight?: string
      weight_unit_of_measure?: string
    }
    eligibility_rules?: Record<string, unknown>
  }
  price?: RedSkyPrice
  promotions?: Array<{
    promotion_id?: string
    short_message?: string
    threshold_value?: number
    legal_text?: string
  }>
}

interface RedSkySearchResponse {
  data?: {
    search?: {
      products?: RedSkyProduct[]
      search_response?: {
        items?: {
          Item?: RedSkyProduct[]
        }
        total_results?: number
      }
    }
  }
}

interface RedSkyStore {
  store_id: string
  location_name?: string
  store_status?: string
  mailing_address?: {
    address_line1?: string
    city?: string
    state?: string
    postal_code?: string
  }
  geographic_specifications?: {
    latitude?: number
    longitude?: number
  }
  rolling_operating_hours?: unknown
}

interface RedSkyStoresResponse {
  data?: {
    nearby_stores?: {
      stores?: RedSkyStore[]
    }
  }
}

export interface NormalizedTargetProduct {
  id: string // TCIN
  name: string
  brand?: string
  description?: string
  imageUrl?: string
  category?: string
  subcategory?: string
  price?: {
    regular?: number
    sale?: number
    formatted?: string
  }
  promotions: Array<{
    id?: string
    message?: string
  }>
  source: 'target'
}

export interface NormalizedTargetStore {
  id: string // store_id (the zone identifier needed for accurate prices)
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  lat?: number
  lng?: number
}

/**
 * Wrap an axios GET so the call tries the direct datacenter IP first, then
 * retries through the configured residential proxy IF the direct call hit a
 * bot-block signal (captcha JSON, 403, 429). Returns whether the successful
 * response came via proxy so the caller can log that fact separately.
 *
 * Cost note: only the retry consumes proxy bandwidth — on healthy direct
 * calls, proxy cost is zero. This is the whole point of the fallback pattern.
 */
async function getWithProxyFallback<T>(
  ax: AxiosInstance,
  url: string,
  config: AxiosRequestConfig,
): Promise<{ response: AxiosResponse<T>; viaProxy: boolean; proxyBytes: number }> {
  let directResp: AxiosResponse<T> | undefined
  let directErr: any

  // Direct attempt — validateStatus to capture 4xx as data, not throw
  try {
    directResp = await ax.get<T>(url, {
      ...config,
      validateStatus: () => true,
    })
  } catch (e) {
    directErr = e
  }

  const directStatus = directResp?.status
  const directBody = directResp?.data
  const looksBlocked =
    directErr || isBotBlockSignal({ status: directStatus, body: directBody })

  // Direct call succeeded — return it
  if (!looksBlocked && directResp && directStatus && directStatus >= 200 && directStatus < 300) {
    return { response: directResp, viaProxy: false, proxyBytes: 0 }
  }

  // Direct call failed in a non-bot-block way (5xx, network error)
  // — bubble up without trying proxy (proxy won't help a real server outage)
  if (directErr && !directResp) throw directErr
  if (!looksBlocked && directResp) {
    // Genuine 4xx that isn't bot-detection — return as-is so the caller handles
    return { response: directResp, viaProxy: false, proxyBytes: 0 }
  }

  // Bot-blocked. Try via proxy if one is configured.
  const proxyConfig = applyProxy('target', config)
  if (!proxyConfig) {
    // No proxy configured; return the direct response so the caller logs the block
    if (directResp) return { response: directResp, viaProxy: false, proxyBytes: 0 }
    throw directErr || new Error('Bot-blocked and no proxy configured')
  }

  const proxyResp = await ax.get<T>(url, {
    ...proxyConfig,
    validateStatus: () => true,
  })
  const bytes = Number(proxyResp.headers?.['content-length'] || 0) ||
    (typeof proxyResp.data === 'string' ? proxyResp.data.length : JSON.stringify(proxyResp.data || {}).length)
  return { response: proxyResp, viaProxy: true, proxyBytes: bytes }
}

export class TargetClient {
  private axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: REDSKY_BASE,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://www.target.com/',
        'Origin': 'https://www.target.com',
      },
    })
  }

  isConfigured(): boolean {
    return true // Public key, no auth needed
  }

  private getApiKey(): string {
    return process.env.TARGET_API_KEY || TARGET_PUBLIC_KEY
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
      console.error('[Target] Cache save error:', e)
    }
  }

  async searchProducts(
    query: string,
    options?: {
      storeId?: string
      zip?: string
      limit?: number
      offset?: number
      skipCache?: boolean
    },
  ): Promise<NormalizedTargetProduct[]> {
    const limit = options?.limit || 24
    const storeId = options?.storeId || '1357' // Default zone — Manhattan/NYC

    const cacheKey = `${query}|${storeId}`
    if (!options?.skipCache && !options?.offset) {
      const cached = await this.getCached<NormalizedTargetProduct[]>('target', cacheKey, storeId)
      if (cached) {
        console.log(`[Target] Cache HIT for "${query}" @ store ${storeId}`)
        return cached.slice(0, limit)
      }
    }

    const startedAt = Date.now()
    try {
      console.log(`[Target] API CALL "${query}" @ store ${storeId}`)
      const { response, viaProxy, proxyBytes } = await getWithProxyFallback<RedSkySearchResponse>(
        this.axios,
        '/redsky_aggregations/v1/web/plp_search_v2',
        {
          params: {
            key: this.getApiKey(),
            keyword: query,
            count: limit,
            offset: options?.offset || 0,
            page: `/s/${encodeURIComponent(query)}`,
            channel: 'WEB',
            default_purchasability_filter: 'true',
            include_sponsored: 'true',
            new_search: 'false',
            platform: 'desktop',
            pricing_store_id: storeId,
            store_ids: storeId,
            scheduled_delivery_store_id: storeId,
            visitor_id: TARGET_VISITOR_ID,
            zip: options?.zip || '10001',
            useragent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      )

      // If we ended up with a non-2xx after retry, surface it as a bot-block failure.
      // Cast to unknown first because RedSkySearchResponse narrowing rules out
      // the string case at compile time even though the server can return HTML.
      if (response.status < 200 || response.status >= 300) {
        const raw = response.data as unknown
        const bodyPreview = typeof raw === 'string'
          ? raw.slice(0, 200)
          : JSON.stringify(raw || {}).slice(0, 200)
        logEvent({
          source: 'target',
          operation: viaProxy ? 'search_products_via_proxy' : 'search_products',
          success: false,
          latencyMs: Date.now() - startedAt,
          httpStatus: response.status,
          errorMessage: bodyPreview,
          errorKind: detectErrorKind({ status: response.status, bodyPreview }),
          query,
          zip: options?.zip,
          costUsd: viaProxy ? estimateProxyCostUsd(proxyBytes) : undefined,
        })
        return []
      }

      const products =
        response.data.data?.search?.products ||
        response.data.data?.search?.search_response?.items?.Item ||
        []

      const normalized = products
        .map((p) => this.normalizeProduct(p))
        .filter((p): p is NormalizedTargetProduct => p !== null)

      if (normalized.length > 0) {
        await this.saveCache('target', cacheKey, storeId, normalized, SEARCH_CACHE_TTL)
      }

      logEvent({
        source: 'target',
        // Separate operation name so admins can see at a glance how many calls
        // needed the proxy fallback (and what they cost).
        operation: viaProxy ? 'search_products_via_proxy' : 'search_products',
        success: true,
        latencyMs: Date.now() - startedAt,
        query,
        zip: options?.zip,
        resultCount: normalized.length,
        errorKind: normalized.length === 0 ? 'no_results' : undefined,
        costUsd: viaProxy ? estimateProxyCostUsd(proxyBytes) : undefined,
      })
      return normalized
    } catch (e: any) {
      console.error('[Target] Search error:', e.response?.status, e.response?.data || e.message)
      const status = e.response?.status
      const bodyPreview =
        typeof e.response?.data === 'string'
          ? e.response.data
          : JSON.stringify(e.response?.data || {}).substring(0, 200)
      logEvent({
        source: 'target',
        operation: 'search_products',
        success: false,
        latencyMs: Date.now() - startedAt,
        httpStatus: status,
        errorMessage: e.message,
        errorKind: detectErrorKind({ status, bodyPreview, message: e.message }),
        query,
        zip: options?.zip,
      })
      return []
    }
  }

  async getProduct(
    tcin: string,
    storeId = '1357',
    zip = '10001',
  ): Promise<NormalizedTargetProduct | null> {
    try {
      const response = await this.axios.get<{ data?: { product?: RedSkyProduct } }>(
        '/redsky_aggregations/v1/web/pdp_client_v1',
        {
          params: {
            key: this.getApiKey(),
            tcin,
            store_id: storeId,
            pricing_store_id: storeId,
            has_pricing_store_id: 'true',
            scheduled_delivery_store_id: storeId,
            has_financing_options: 'true',
            visitor_id: TARGET_VISITOR_ID,
            zip,
            channel: 'WEB',
            page: `/p/A-${tcin}`,
          },
        },
      )

      const product = response.data.data?.product
      if (!product) return null
      return this.normalizeProduct(product)
    } catch (e: any) {
      console.error('[Target] Product fetch error:', e.response?.status, e.message)
      return null
    }
  }

  /**
   * Find nearby Target stores. The returned store_id is the value you pass
   * as pricing_store_id to get accurate shelf prices.
   */
  async searchStores(zip: string, limit = 10): Promise<NormalizedTargetStore[]> {
    const cached = await this.getCached<NormalizedTargetStore[]>('target-stores', zip, zip)
    if (cached) return cached.slice(0, limit)

    const startedAt = Date.now()
    try {
      console.log(`[Target] API CALL stores @ ${zip}`)
      const { response, viaProxy, proxyBytes } = await getWithProxyFallback<RedSkyStoresResponse>(
        this.axios,
        '/redsky_aggregations/v1/web/nearby_stores_v1',
        {
          params: {
            key: this.getApiKey(),
            limit,
            within: 100,
            place: zip,
            visitor_id: TARGET_VISITOR_ID,
            channel: 'WEB',
            page: '/sl/',
          },
        },
      )

      if (response.status < 200 || response.status >= 300) {
        const raw = response.data as unknown
        const bodyPreview = typeof raw === 'string'
          ? raw.slice(0, 200)
          : JSON.stringify(raw || {}).slice(0, 200)
        logEvent({
          source: 'target',
          operation: viaProxy ? 'search_stores_via_proxy' : 'search_stores',
          success: false,
          latencyMs: Date.now() - startedAt,
          httpStatus: response.status,
          errorKind: detectErrorKind({ status: response.status, bodyPreview }),
          errorMessage: bodyPreview,
          zip,
          costUsd: viaProxy ? estimateProxyCostUsd(proxyBytes) : undefined,
        })
        return []
      }

      const stores = (response.data.data?.nearby_stores?.stores || [])
        .map((s) => this.normalizeStore(s))
        .filter((s): s is NormalizedTargetStore => s !== null)

      if (stores.length > 0) {
        await this.saveCache('target-stores', zip, zip, stores, STORE_CACHE_TTL)
      }
      logEvent({
        source: 'target',
        operation: viaProxy ? 'search_stores_via_proxy' : 'search_stores',
        success: true,
        latencyMs: Date.now() - startedAt,
        zip,
        resultCount: stores.length,
        errorKind: stores.length === 0 ? 'no_results' : undefined,
        costUsd: viaProxy ? estimateProxyCostUsd(proxyBytes) : undefined,
      })
      return stores
    } catch (e: any) {
      console.error('[Target] Stores error:', e.response?.status, e.message)
      const status = e.response?.status
      const bodyPreview =
        typeof e.response?.data === 'string'
          ? e.response.data
          : JSON.stringify(e.response?.data || {}).substring(0, 200)
      logEvent({
        source: 'target',
        operation: 'search_stores',
        success: false,
        latencyMs: Date.now() - startedAt,
        httpStatus: status,
        errorMessage: e.message,
        errorKind: detectErrorKind({ status, bodyPreview, message: e.message }),
        zip,
      })
      return []
    }
  }

  private normalizeProduct(p: RedSkyProduct): NormalizedTargetProduct | null {
    if (!p?.tcin) return null
    const item = p.item

    const regular = p.price?.reg_retail
    const current = p.price?.current_retail
    const onSale = regular !== undefined && current !== undefined && current < regular

    return {
      id: p.tcin,
      name: item?.product_description?.title || 'Unknown',
      brand: item?.primary_brand?.name,
      description: item?.product_description?.downstream_description,
      imageUrl: item?.enrichment?.images?.primary_image_url,
      category: item?.merchandise_classification?.department_name,
      subcategory: item?.merchandise_classification?.class_name,
      price: p.price
        ? {
            regular: regular,
            sale: onSale ? current : undefined,
            formatted: p.price.formatted_current_price,
          }
        : undefined,
      promotions: (p.promotions || []).map((promo) => ({
        id: promo.promotion_id,
        message: promo.short_message,
      })),
      source: 'target',
    }
  }

  private normalizeStore(s: RedSkyStore): NormalizedTargetStore | null {
    if (!s?.store_id) return null
    return {
      id: s.store_id,
      name: s.location_name || `Target #${s.store_id}`,
      address: s.mailing_address?.address_line1,
      city: s.mailing_address?.city,
      state: s.mailing_address?.state,
      zip: s.mailing_address?.postal_code,
      lat: s.geographic_specifications?.latitude,
      lng: s.geographic_specifications?.longitude,
    }
  }
}

export const targetClient = new TargetClient()

export async function searchAndImportTargetProducts(
  supabase: any,
  query: string,
  zip = '10001',
): Promise<{ imported: number; products: NormalizedTargetProduct[] }> {
  try {
    // Pick the closest store as the pricing zone
    const stores = await targetClient.searchStores(zip, 1)
    const storeId = stores[0]?.id

    const products = await targetClient.searchProducts(query, {
      storeId,
      zip,
      limit: 25,
    })

    let imported = 0
    let dbStoreId: string | null = null

    if (storeId) {
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('store_number', storeId)
        .eq('retailer', 'target')
        .maybeSingle()

      if (existingStore) {
        dbStoreId = existingStore.id
      } else if (stores[0]) {
        const { data: newStore } = await supabase
          .from('stores')
          .insert({
            retailer: 'target',
            store_number: stores[0].id,
            name: stores[0].name,
            address: stores[0].address,
            city: stores[0].city,
            state: stores[0].state,
            zip: stores[0].zip,
          })
          .select('id')
          .single()
        dbStoreId = newStore?.id || null
      }
    }

    for (const product of products) {
      if (!product.price?.regular && !product.price?.sale) continue

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .ilike('name', product.name)
        .eq('brand', product.brand || 'Unknown')
        .maybeSingle()

      let productId = existingProduct?.id
      if (!productId) {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand || 'Unknown',
            category: product.category,
            subcategory: product.subcategory,
            image_url: product.imageUrl,
            attributes: {
              target_tcin: product.id,
              source: 'target',
            },
          })
          .select('id')
          .single()
        productId = newProduct?.id
      }

      if (!productId || !dbStoreId) continue

      await supabase.from('prices').insert({
        product_id: productId,
        store_id: dbStoreId,
        price: product.price.regular || product.price.sale,
        sale_price: product.price.sale,
        source: 'target_redsky',
        confidence: 0.95,
      })
      imported++
    }

    return { imported, products }
  } catch (e) {
    console.error('[Target] Import error:', e)
    return { imported: 0, products: [] }
  }
}
