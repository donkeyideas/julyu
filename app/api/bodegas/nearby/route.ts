import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Find nearby bodegas that have a specific product in stock
 * Query params:
 * - productName: Product to search for
 * - latitude: User's latitude
 * - longitude: User's longitude
 * - radius: Search radius in miles (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productName = searchParams.get('productName')
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = parseFloat(searchParams.get('radius') || '5')

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      )
    }

    const userLat = parseFloat(latitude)
    const userLon = parseFloat(longitude)

    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Find active, verified bodega stores within radius
    const { data: stores, error: storesError } = await supabase
      .from('bodega_stores')
      .select(`
        *,
        store_owner:store_owners(*)
      `)
      .eq('is_active', true)
      .eq('verified', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (storesError) {
      console.error('Fetch stores error:', storesError)
      return NextResponse.json(
        { error: 'Failed to fetch stores' },
        { status: 500 }
      )
    }

    if (!stores || stores.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Calculate distances and filter by radius
    const storesWithDistance = stores
      .map((store: any) => {
        if (!store.latitude || !store.longitude) return null

        // Haversine formula to calculate distance
        const R = 3959 // Earth's radius in miles
        const dLat = (store.latitude - userLat) * Math.PI / 180
        const dLon = (store.longitude - userLon) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(store.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return {
          ...store,
          distance: parseFloat(distance.toFixed(2))
        }
      })
      .filter((store: any) => store !== null && store.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance)

    if (storesWithDistance.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get inventory for these stores that matches the product name
    const storeIds = storesWithDistance.map((s: any) => s.id)

    const { data: inventory, error: inventoryError } = await supabase
      .from('bodega_inventory')
      .select(`
        *,
        product:products(*)
      `)
      .in('bodega_store_id', storeIds)
      .eq('in_stock', true)
      .gt('stock_quantity', 0)

    if (inventoryError) {
      console.error('Fetch inventory error:', inventoryError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      )
    }

    // Filter inventory by product name match
    const searchTerms = productName.toLowerCase().split(' ')
    const matchingInventory = inventory?.filter((item: any) => {
      const itemName = (item.custom_name || item.product?.name || '').toLowerCase()
      const itemBrand = (item.custom_brand || item.product?.brand || '').toLowerCase()
      const searchText = `${itemName} ${itemBrand}`

      // Check if all search terms are present
      return searchTerms.every((term: string) => searchText.includes(term))
    }) || []

    // Group inventory by store and find best match per store
    const storeInventoryMap = new Map()

    matchingInventory.forEach((item: any) => {
      if (!storeInventoryMap.has(item.bodega_store_id)) {
        storeInventoryMap.set(item.bodega_store_id, [])
      }
      storeInventoryMap.get(item.bodega_store_id).push(item)
    })

    // Build results with store info and inventory
    const results = storesWithDistance
      .filter((store: any) => storeInventoryMap.has(store.id))
      .map((store: any) => {
        const storeInventory = storeInventoryMap.get(store.id)

        // Sort by best match (exact name match first, then alphabetically)
        const sortedInventory = storeInventory.sort((a: any, b: any) => {
          const aName = (a.custom_name || a.product?.name || '').toLowerCase()
          const bName = (b.custom_name || b.product?.name || '').toLowerCase()
          const searchLower = productName.toLowerCase()

          const aExact = aName === searchLower ? 1 : 0
          const bExact = bName === searchLower ? 1 : 0

          if (aExact !== bExact) return bExact - aExact
          return aName.localeCompare(bName)
        })

        const bestMatch = sortedInventory[0]

        return {
          store: {
            id: store.id,
            name: store.name,
            address: store.address,
            city: store.city,
            state: store.state,
            zip: store.zip,
            phone: store.phone,
            distance: store.distance,
            storeOwnerId: store.store_owner_id,
            storefrontImage: store.storefront_image_url,
          },
          product: {
            inventoryId: bestMatch.id,
            productId: bestMatch.product_id,
            name: bestMatch.custom_name || bestMatch.product?.name || 'Unknown Product',
            brand: bestMatch.custom_brand || bestMatch.product?.brand || null,
            size: bestMatch.custom_size || bestMatch.product?.size || null,
            imageUrl: bestMatch.custom_image_url || bestMatch.product?.image_url || null,
            price: parseFloat(bestMatch.sale_price),
            stockQuantity: bestMatch.stock_quantity,
            sku: bestMatch.sku,
          },
          matchCount: sortedInventory.length, // How many matching products this store has
        }
      })

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        searchRadius: radius,
        storesFound: results.length,
        userLocation: {
          latitude: userLat,
          longitude: userLon
        }
      }
    })

  } catch (error) {
    console.error('Nearby bodegas search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
