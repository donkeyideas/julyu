import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'
import { sendStoreSuspensionEmail, sendOrderStatusUpdateEmail } from '@/lib/services/email'
import { cancelOrderDelivery } from '@/lib/services/doordash-drive'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: adminError || 'Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { id: storeOwnerId } = await params

    // Parse request body for suspension reason
    let reason = 'Policy violation'
    try {
      const body = await request.json()
      if (body.reason) {
        reason = body.reason
      }
    } catch {
      // No body provided, use default reason
    }

    // Get store owner with store name
    const { data: storeOwner, error: fetchError } = await supabase
      .from('store_owners')
      .select(`
        *,
        bodega_stores(name)
      `)
      .eq('id', storeOwnerId)
      .single()

    if (fetchError || !storeOwner) {
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Can only suspend approved stores
    if (storeOwner.application_status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only suspend approved stores' },
        { status: 400 }
      )
    }

    // Update store owner status to suspended
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        application_status: 'suspended',
        reviewed_by: user?.id,
        accepts_orders: false,
      })
      .eq('id', storeOwnerId)

    if (updateError) {
      console.error('Update store owner error:', updateError)
      return NextResponse.json(
        { error: 'Failed to suspend store' },
        { status: 500 }
      )
    }

    // Deactivate the associated bodega store
    const { error: storeUpdateError } = await supabase
      .from('bodega_stores')
      .update({
        is_active: false,
      })
      .eq('store_owner_id', storeOwnerId)

    if (storeUpdateError) {
      console.error('Update bodega store error:', storeUpdateError)
      // Continue anyway - store owner is suspended
    }

    // Send suspension notification email to store owner
    if (storeOwner.business_email) {
      const storeName = storeOwner.bodega_stores?.[0]?.name || storeOwner.business_name

      sendStoreSuspensionEmail({
        storeOwnerEmail: storeOwner.business_email,
        storeOwnerName: storeOwner.business_name,
        storeName,
        reason,
      }).catch(err => console.error('[Admin] Failed to send suspension email:', err))
    }

    // Handle any active orders - cancel them and notify customers
    const activeStatuses = ['pending', 'accepted', 'preparing', 'ready']
    const { data: activeOrders, error: ordersError } = await supabase
      .from('bodega_orders')
      .select(`
        id,
        order_number,
        status,
        customer_email,
        customer_name,
        doordash_delivery_id,
        bodega_store:bodega_stores(name)
      `)
      .eq('store_owner_id', storeOwnerId)
      .in('status', activeStatuses)

    if (!ordersError && activeOrders && activeOrders.length > 0) {
      console.log(`[Admin] Cancelling ${activeOrders.length} active orders for suspended store`)

      for (const order of activeOrders) {
        // Cancel the order
        await supabase
          .from('bodega_orders')
          .update({
            status: 'cancelled',
            cancellation_reason: 'Store suspended by platform',
          })
          .eq('id', order.id)

        // Cancel any active DoorDash delivery
        if (order.doordash_delivery_id) {
          cancelOrderDelivery(order.doordash_delivery_id)
            .catch(err => console.error(`[Admin] Failed to cancel DoorDash delivery ${order.doordash_delivery_id}:`, err))
        }

        // Notify the customer
        if (order.customer_email) {
          sendOrderStatusUpdateEmail({
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            orderNumber: order.order_number,
            newStatus: 'cancelled',
            storeName: order.bodega_store?.name || 'Store',
          }).catch(err => console.error(`[Admin] Failed to send cancellation email for order ${order.order_number}:`, err))
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Store suspended successfully',
      cancelledOrders: activeOrders?.length || 0,
    })

  } catch (error) {
    console.error('Suspend store error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
