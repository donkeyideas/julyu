import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'

// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { storeOwner, user, error: authError } = await getStoreOwner()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    const inventoryId = params.id

    // Get inventory item to verify ownership
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('bodega_inventory')
      .select('*, bodega_stores!inner(store_owner_id)')
      .eq('id', inventoryId)
      .single()

    if (fetchError || !inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (inventoryItem.bodega_stores.store_owner_id !== storeOwner.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your inventory' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { stock_quantity, sale_price, cost_price, in_stock } = body

    // Validate
    if (stock_quantity !== undefined && stock_quantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity cannot be negative' },
        { status: 400 }
      )
    }

    if (sale_price !== undefined && sale_price <= 0) {
      return NextResponse.json(
        { error: 'Sale price must be greater than 0' },
        { status: 400 }
      )
    }

    // Update inventory item
    const updateData: any = {
      last_updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }

    if (stock_quantity !== undefined) {
      updateData.stock_quantity = stock_quantity
      // Auto-update in_stock based on quantity
      if (stock_quantity === 0) {
        updateData.in_stock = false
      }
    }

    if (sale_price !== undefined) {
      updateData.sale_price = parseFloat(sale_price)
    }

    if (cost_price !== undefined) {
      updateData.cost_price = cost_price ? parseFloat(cost_price) : null
    }

    if (in_stock !== undefined) {
      updateData.in_stock = in_stock
    }

    const { data: updated, error: updateError } = await supabase
      .from('bodega_inventory')
      .update(updateData)
      .eq('id', inventoryId)
      .select()
      .single()

    if (updateError) {
      console.error('Update inventory error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update inventory item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updated
    })

  } catch (error) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { storeOwner, error: authError } = await getStoreOwner()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    const inventoryId = params.id

    // Get inventory item to verify ownership
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('bodega_inventory')
      .select('*, bodega_stores!inner(store_owner_id)')
      .eq('id', inventoryId)
      .single()

    if (fetchError || !inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (inventoryItem.bodega_stores.store_owner_id !== storeOwner.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your inventory' },
        { status: 403 }
      )
    }

    // Delete inventory item
    const { error: deleteError } = await supabase
      .from('bodega_inventory')
      .delete()
      .eq('id', inventoryId)

    if (deleteError) {
      console.error('Delete inventory error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete inventory item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })

  } catch (error) {
    console.error('Delete inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
