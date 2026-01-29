/**
 * Square POS Integration Service
 * Handles OAuth, inventory sync, and webhook processing for Square POS
 */

interface SquareConfig {
  applicationId: string
  accessToken: string
  locationId: string
  environment: 'sandbox' | 'production'
}

interface SquareInventoryItem {
  id: string
  name: string
  variations: Array<{
    id: string
    name: string
    priceMoney?: {
      amount: number
      currency: string
    }
    itemVariationData?: {
      sku?: string
    }
  }>
  category?: {
    name: string
  }
}

interface SyncResult {
  success: boolean
  itemsSynced: number
  errors: string[]
}

export class SquarePOSService {
  private config: SquareConfig

  constructor(config: SquareConfig) {
    this.config = config
  }

  /**
   * Get Square OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const baseUrl = 'https://connect.squareup.com/oauth2/authorize'
    const params = new URLSearchParams({
      client_id: process.env.SQUARE_APPLICATION_ID || '',
      scope: 'ITEMS_READ INVENTORY_READ',
      session: 'false',
      state,
      redirect_uri: redirectUri,
    })
    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: string
    merchantId: string
  }> {
    const response = await fetch('https://connect.squareup.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_APPLICATION_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Square OAuth error: ${error.message || 'Failed to exchange code'}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      merchantId: data.merchant_id,
    }
  }

  /**
   * Get all catalog items from Square
   */
  async getCatalogItems(): Promise<SquareInventoryItem[]> {
    const baseUrl = this.config.environment === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2'

    const response = await fetch(`${baseUrl}/catalog/list?types=ITEM`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Square API error: ${error.errors?.[0]?.detail || 'Failed to fetch catalog'}`)
    }

    const data = await response.json()
    return data.objects || []
  }

  /**
   * Get inventory counts for items
   */
  async getInventoryCounts(catalogObjectIds: string[]): Promise<Map<string, number>> {
    const baseUrl = this.config.environment === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2'

    const response = await fetch(`${baseUrl}/inventory/batch-retrieve-counts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        catalog_object_ids: catalogObjectIds,
        location_ids: [this.config.locationId],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Square inventory error: ${error.errors?.[0]?.detail || 'Failed to fetch inventory'}`)
    }

    const data = await response.json()
    const counts = new Map<string, number>()

    data.counts?.forEach((count: any) => {
      counts.set(count.catalog_object_id, parseFloat(count.quantity) || 0)
    })

    return counts
  }

  /**
   * Sync Square inventory to bodega inventory
   */
  async syncInventory(bodegaStoreId: string, supabase: any, userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      itemsSynced: 0,
      errors: [],
    }

    try {
      // Get all items from Square
      const catalogItems = await this.getCatalogItems()

      if (catalogItems.length === 0) {
        result.errors.push('No items found in Square catalog')
        return result
      }

      // Get variation IDs for inventory lookup
      const variationIds = catalogItems.flatMap(item =>
        item.variations.map(v => v.id)
      )

      // Get inventory counts
      const inventoryCounts = await this.getInventoryCounts(variationIds)

      // Prepare items for insertion/update
      const inventoryItems = []

      for (const item of catalogItems) {
        for (const variation of item.variations) {
          const stockQuantity = inventoryCounts.get(variation.id) || 0
          const price = variation.priceMoney
            ? variation.priceMoney.amount / 100 // Square uses cents
            : 0

          inventoryItems.push({
            bodega_store_id: bodegaStoreId,
            product_id: null, // Custom products
            sku: variation.itemVariationData?.sku || variation.id,
            stock_quantity: stockQuantity,
            in_stock: stockQuantity > 0,
            sale_price: price,
            cost_price: price,
            custom_name: `${item.name}${variation.name !== 'Regular' ? ` - ${variation.name}` : ''}`,
            custom_brand: item.category?.name || null,
            custom_size: null,
            custom_image_url: null,
            update_method: 'pos',
            last_updated_by: userId,
          })
        }
      }

      // Upsert inventory items (update if SKU exists, insert if not)
      for (const inventoryItem of inventoryItems) {
        const { data: existing } = await supabase
          .from('bodega_inventory')
          .select('id')
          .eq('bodega_store_id', bodegaStoreId)
          .eq('sku', inventoryItem.sku)
          .single()

        if (existing) {
          // Update existing
          await supabase
            .from('bodega_inventory')
            .update({
              stock_quantity: inventoryItem.stock_quantity,
              in_stock: inventoryItem.in_stock,
              sale_price: inventoryItem.sale_price,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          // Insert new
          await supabase
            .from('bodega_inventory')
            .insert(inventoryItem)
        }

        result.itemsSynced++
      }

      // Log the sync
      await supabase
        .from('inventory_update_log')
        .insert({
          bodega_store_id: bodegaStoreId,
          update_method: 'pos',
          items_updated: result.itemsSynced,
          updated_by: userId,
        })

      result.success = true

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string, webhookSignatureKey: string): boolean {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', webhookSignatureKey)
    hmac.update(body)
    const computedSignature = hmac.digest('base64')
    return computedSignature === signature
  }
}

export default SquarePOSService
