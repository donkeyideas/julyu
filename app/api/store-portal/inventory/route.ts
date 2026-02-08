import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

export const dynamic = 'force-dynamic'

// GET - Get inventory for store owner with pagination
export async function GET(request: NextRequest) {
  try {
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()

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

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const stockFilter = searchParams.get('stock') || '' // 'in_stock', 'low_stock', 'out_of_stock'

    const offset = (page - 1) * limit

    // Build query for inventory items
    let query = supabase
      .from('bodega_inventory')
      .select(`
        *,
        product:products(*)
      `, { count: 'exact' })
      .eq('bodega_store_id', primaryStore.id)

    // Apply search filter
    if (search) {
      query = query.or(`custom_name.ilike.%${search}%,custom_brand.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    // Apply stock filter
    if (stockFilter === 'in_stock') {
      query = query.eq('in_stock', true).gt('stock_quantity', 5)
    } else if (stockFilter === 'low_stock') {
      query = query.gt('stock_quantity', 0).lte('stock_quantity', 5)
    } else if (stockFilter === 'out_of_stock') {
      query = query.or('in_stock.eq.false,stock_quantity.eq.0')
    }

    // Apply pagination and ordering
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: inventory, error: inventoryError, count } = await query

    if (inventoryError) {
      console.error('Fetch inventory error:', inventoryError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      )
    }

    // Get stats in parallel (efficient count queries)
    const [totalResult, inStockResult, lowStockResult, outOfStockResult] = await Promise.all([
      supabase
        .from('bodega_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('bodega_store_id', primaryStore.id),
      supabase
        .from('bodega_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('bodega_store_id', primaryStore.id)
        .eq('in_stock', true)
        .gt('stock_quantity', 5),
      supabase
        .from('bodega_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('bodega_store_id', primaryStore.id)
        .gt('stock_quantity', 0)
        .lte('stock_quantity', 5),
      supabase
        .from('bodega_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('bodega_store_id', primaryStore.id)
        .or('in_stock.eq.false,stock_quantity.eq.0')
    ])

    const stats = {
      total: totalResult.count || 0,
      inStock: inStockResult.count || 0,
      lowStock: lowStockResult.count || 0,
      outOfStock: outOfStockResult.count || 0
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: inventory || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages
      },
      stats,
      storeId: primaryStore.id
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
