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
    const { storeOwner, user, error: authError } = await getStoreOwnerAnyStatus()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    const primaryStore = stores[0]

    if (!primaryStore) {
      return NextResponse.json(
        { error: 'No store found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { items } = body as { items: ImportItem[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    // Validate items
    const validItems = items.filter(item => item.name && item.price > 0)

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to import' },
        { status: 400 }
      )
    }

    // Prepare inventory records
    const inventoryRecords = validItems.map(item => ({
      bodega_store_id: primaryStore.id,
      product_id: null, // Custom products don't link to global products
      stock_quantity: item.stock_quantity || 0,
      in_stock: (item.stock_quantity || 0) > 0,
      sale_price: item.price,
      custom_name: item.name,
      custom_brand: item.brand || null,
      custom_size: item.size || null,
      custom_category: item.category || null,
      custom_description: item.description || null,
      update_method: 'bulk_import',
      last_updated_by: user?.id,
    }))

    // Insert all inventory items
    const { data: insertedItems, error: insertError } = await supabase
      .from('bodega_inventory')
      .insert(inventoryRecords)
      .select()

    if (insertError) {
      console.error('Bulk insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to import items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedItems?.length || 0} items`,
      imported: insertedItems?.length || 0,
      data: insertedItems
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
