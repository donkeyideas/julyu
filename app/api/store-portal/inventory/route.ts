import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

// GET - Get all inventory for store owner
export async function GET(request: NextRequest) {
  try {
    const { storeOwner, error: authError } = await getStoreOwner()

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

    // Get inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('bodega_inventory')
      .select(`
        *,
        product:products(*)
      `)
      .eq('bodega_store_id', primaryStore.id)
      .order('updated_at', { ascending: false })

    if (inventoryError) {
      console.error('Fetch inventory error:', inventoryError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventory || []
    })

  } catch (error) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const { storeOwner, user, error: authError } = await getStoreOwner()

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
    const {
      productId,
      sku,
      stockQuantity,
      salePrice,
      costPrice,
      customName,
      customBrand,
      customSize,
      customImageUrl,
    } = body

    // Validate required fields
    if (!salePrice || salePrice <= 0) {
      return NextResponse.json(
        { error: 'Sale price is required' },
        { status: 400 }
      )
    }

    if (!productId && !customName) {
      return NextResponse.json(
        { error: 'Product ID or custom name is required' },
        { status: 400 }
      )
    }

    // Check if product already exists in inventory
    if (productId) {
      const { data: existing } = await supabase
        .from('bodega_inventory')
        .select('id')
        .eq('bodega_store_id', primaryStore.id)
        .eq('product_id', productId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Product already exists in inventory' },
          { status: 400 }
        )
      }
    }

    // Insert inventory item
    const { data: inventoryItem, error: insertError } = await supabase
      .from('bodega_inventory')
      .insert({
        bodega_store_id: primaryStore.id,
        product_id: productId || null,
        sku: sku || null,
        stock_quantity: stockQuantity || 0,
        in_stock: (stockQuantity || 0) > 0,
        sale_price: parseFloat(salePrice),
        cost_price: costPrice ? parseFloat(costPrice) : null,
        custom_name: customName || null,
        custom_brand: customBrand || null,
        custom_size: customSize || null,
        custom_image_url: customImageUrl || null,
        update_method: 'manual',
        last_updated_by: user?.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert inventory error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add inventory item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventoryItem
    }, { status: 201 })

  } catch (error) {
    console.error('Add inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
