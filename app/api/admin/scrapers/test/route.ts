import { NextRequest, NextResponse } from 'next/server'
import { flippClient } from '@/lib/api/flipp'
import { targetClient } from '@/lib/api/target'
import { albertsonsClient } from '@/lib/api/albertsons'

export const dynamic = 'force-dynamic'

/**
 * Live-test endpoint for the cross-chain scrapers.
 *
 * Examples:
 *   /api/admin/scrapers/test?source=flipp&q=milk&zip=10001
 *   /api/admin/scrapers/test?source=target&q=eggs&zip=10001
 *   /api/admin/scrapers/test?source=albertsons&q=bread&zip=90210
 *   /api/admin/scrapers/test?source=all&q=cheerios&zip=10001
 *
 * Read-only — does not write to the products/stores/prices tables.
 * Use the searchAndImport* helpers in each client for that.
 */

type Source = 'flipp' | 'target' | 'albertsons' | 'all'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const source = (url.searchParams.get('source') || 'all') as Source
  const query = url.searchParams.get('q') || 'milk'
  const zip = url.searchParams.get('zip') || '10001'
  const debug = url.searchParams.get('debug') === '1'

  if (debug && (source === 'albertsons' || source === 'all')) {
    const probes = await albertsonsClient.diagnoseStoreEndpoints(zip)
    return NextResponse.json({ debug: true, zip, albertsons_endpoint_probe: probes })
  }

  const started = Date.now()
  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  const runFlipp = async () => {
    try {
      const items = await flippClient.searchItems(query, { postalCode: zip, limit: 20 })
      results.flipp = {
        count: items.length,
        retailers: Array.from(new Set(items.map((i) => i.retailer))),
        sample: items.slice(0, 5).map((i) => ({
          name: i.name,
          retailer: i.retailer,
          price: i.price,
          priceText: i.salePriceText,
          validTo: i.validTo,
        })),
      }
    } catch (e: any) {
      errors.flipp = e.message || String(e)
    }
  }

  const runTarget = async () => {
    try {
      const stores = await targetClient.searchStores(zip, 1)
      const products = await targetClient.searchProducts(query, {
        storeId: stores[0]?.id,
        zip,
        limit: 10,
      })
      results.target = {
        store: stores[0]
          ? {
              id: stores[0].id,
              name: stores[0].name,
              city: stores[0].city,
              state: stores[0].state,
            }
          : null,
        count: products.length,
        sample: products.slice(0, 5).map((p) => ({
          name: p.name,
          brand: p.brand,
          regular: p.price?.regular,
          sale: p.price?.sale,
          formatted: p.price?.formatted,
        })),
      }
    } catch (e: any) {
      errors.target = e.message || String(e)
    }
  }

  const runAlbertsons = async () => {
    try {
      const stores = await albertsonsClient.searchStores(zip)
      const products = await albertsonsClient.searchProducts(query, {
        storeId: stores[0]?.id,
        limit: 10,
      })
      results.albertsons = {
        store: stores[0]
          ? {
              id: stores[0].id,
              name: stores[0].name,
              banner: stores[0].banner,
              city: stores[0].city,
              state: stores[0].state,
            }
          : null,
        count: products.length,
        sample: products.slice(0, 5).map((p) => ({
          name: p.name,
          brand: p.brand,
          regular: p.price?.regular,
          sale: p.price?.sale,
          size: p.size,
        })),
      }
    } catch (e: any) {
      errors.albertsons = e.message || String(e)
    }
  }

  if (source === 'flipp' || source === 'all') await runFlipp()
  if (source === 'target' || source === 'all') await runTarget()
  if (source === 'albertsons' || source === 'all') await runAlbertsons()

  return NextResponse.json({
    query,
    zip,
    source,
    elapsedMs: Date.now() - started,
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  })
}
