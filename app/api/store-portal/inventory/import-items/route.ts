import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'

export async function POST(request: NextRequest) {
  try {
    const { storeOwner, user, error: authError } = await getStoreOwner()

    if (authError || !storeOwner || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items to import' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get store owner's bodega stores
    const { data: stores, error: storesError } = await supabase
      .from('bodega_stores')
      .select('id')
      .eq('store_owner_id', storeOwner.id)
      .limit(1)
      .single()

    if (storesError || !stores) {
      return NextResponse.json(
        { error: 'No store found for this owner' },
        { status: 404 }
      )
    }

    const bodegaStoreId = stores.id

    // Prepare items for insertion
    const inventoryItems = items.map((item: any) => ({
      bodega_store_id: bodegaStoreId,
      product_id: null, // Custom products (not matched to products table)
      sku: null,
      stock_quantity: item.quantity || 0,
      in_stock: (item.quantity || 0) > 0,
      sale_price: item.price || 0,
      cost_price: item.price || 0, // Assume cost = sale price for imported items
      custom_name: item.name,
      custom_brand: item.brand || null,
      custom_size: item.size || null,
      custom_image_url: null,
      update_method: 'receipt',
      last_updated_by: user.id,
    }))

    // Insert items into bodega_inventory
    const { data: inserted, error: insertError } = await supabase
      .from('bodega_inventory')
      .insert(inventoryItems)
      .select()

    if (insertError) {
      console.error('Insert inventory error:', insertError)
      return NextResponse.json(
        { error: 'Failed to import items to inventory' },
        { status: 500 }
      )
    }

    // Log the import
    await supabase
      .from('inventory_update_log')
      .insert({
        bodega_store_id: bodegaStoreId,
        update_method: 'receipt',
        items_updated: items.length,
        updated_by: user.id,
      })
      .catch((err: any) => console.error('Failed to log inventory update:', err))

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${items.length} items to inventory`,
      data: inserted,
    })

  } catch (error) {
    console.error('Import items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
