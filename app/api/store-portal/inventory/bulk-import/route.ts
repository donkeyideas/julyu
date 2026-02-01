import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

interface ImportItem {
  name: string
  brand?: string
  size?: string
  price: number
  stock_quantity: number
  category?: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[BulkImport] Starting bulk import...')

    const { storeOwner, user, error: authError } = await getStoreOwnerAnyStatus()

    if (authError || !storeOwner) {
      console.log('[BulkImport] Auth error:', authError)
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[BulkImport] Authenticated as store owner:', storeOwner.id)

    const supabase = await createServerClient()

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    console.log('[BulkImport] Found stores:', stores?.length || 0)

    const primaryStore = stores[0]

    if (!primaryStore) {
      console.log('[BulkImport] No store found')
      return NextResponse.json(
        { error: 'No store found' },
        { status: 404 }
      )
    }

    console.log('[BulkImport] Using store:', primaryStore.id)

    // Parse request body
    const body = await request.json()
    const { items } = body as { items: ImportItem[] }

    console.log('[BulkImport] Received items:', items?.length || 0)

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    // Validate items
    const validItems = items.filter(item => item.name && item.price > 0)

    console.log('[BulkImport] Valid items:', validItems.length)

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to import' },
        { status: 400 }
      )
    }

    // Prepare inventory records (only use columns that exist in bodega_inventory table)
    const inventoryRecords = validItems.map(item => ({
      bodega_store_id: primaryStore.id,
      product_id: null,
      stock_quantity: item.stock_quantity || 0,
      in_stock: (item.stock_quantity || 0) > 0,
      sale_price: parseFloat(String(item.price)),
      custom_name: item.name,
      custom_brand: item.brand || null,
      custom_size: item.size || null,
      update_method: 'manual', // Use 'manual' like the regular add endpoint
      last_updated_by: user?.id || null,
    }))

    console.log('[BulkImport] Inserting records:', JSON.stringify(inventoryRecords[0]))

    // Insert all inventory items
    const { data: insertedItems, error: insertError } = await supabase
      .from('bodega_inventory')
      .insert(inventoryRecords)
      .select()

    if (insertError) {
      console.error('[BulkImport] Insert error:', JSON.stringify(insertError))
      return NextResponse.json(
        { error: `Failed to import items: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('[BulkImport] Successfully inserted:', insertedItems?.length || 0)

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedItems?.length || 0} items`,
      imported: insertedItems?.length || 0,
      data: insertedItems
    }, { status: 201 })

  } catch (error) {
    console.error('[BulkImport] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
