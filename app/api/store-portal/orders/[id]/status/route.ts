import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'

export async function PUT(
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
    const orderId = params.id

    // Parse request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Valid statuses
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get order to verify ownership
    const { data: order, error: fetchError } = await supabase
      .from('bodega_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (order.store_owner_id !== storeOwner.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your order' },
        { status: 403 }
      )
    }

    // Update order status
    const updateData: any = {
      status,
    }

    // Set timestamps based on status
    if (status === 'accepted' && !order.accepted_at) {
      updateData.accepted_at = new Date().toISOString()
    }

    if (status === 'delivered' && !order.completed_at) {
      updateData.completed_at = new Date().toISOString()
      updateData.actual_delivery_time = new Date().toISOString()
    }

    // If accepting order, set estimated delivery time
    if (status === 'accepted' && !order.estimated_delivery_time) {
      const now = new Date()
      const estimatedMinutes = order.delivery_method === 'pickup' ? 20 : 45
      const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60000)
      updateData.estimated_delivery_time = estimatedTime.toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('bodega_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Update order status error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // TODO: Send notification to customer (email, SMS, push)
    // TODO: If status is 'out_for_delivery', trigger DoorDash delivery

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: updated
    })

  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
