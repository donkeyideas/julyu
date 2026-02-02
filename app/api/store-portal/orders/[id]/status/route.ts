import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import { sendOrderStatusUpdateEmail } from '@/lib/services/email'
import { createOrderDelivery } from '@/lib/services/doordash-drive'
import { sendPushToUser } from '@/lib/services/push-notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()

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

    // Get order to verify ownership (include store details for notifications and delivery)
    const { data: order, error: fetchError } = await supabase
      .from('bodega_orders')
      .select(`
        *,
        bodega_store:bodega_stores(
          name,
          address,
          phone,
          store_owner:store_owners(
            business_phone
          )
        )
      `)
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

    // Send status update email to customer
    if (order.customer_email) {
      const storeName = order.bodega_store?.name || 'Store'

      // Format estimated time nicely if available
      let estimatedTime: string | undefined
      if (updated.estimated_delivery_time) {
        const estDate = new Date(updated.estimated_delivery_time)
        estimatedTime = estDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }

      sendOrderStatusUpdateEmail({
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        newStatus: status as 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled',
        storeName,
        estimatedTime,
      }).catch(err => console.error('[Orders] Failed to send status update email:', err))
    }

    // Send push notification to customer
    if (order.customer_id) {
      const storeName = order.bodega_store?.name || 'Store'
      const statusMessages: Record<string, { title: string; body: string }> = {
        accepted: {
          title: 'Order Accepted!',
          body: `${storeName} has accepted your order #${order.order_number} and will start preparing it soon.`,
        },
        preparing: {
          title: 'Order Being Prepared',
          body: `Your order #${order.order_number} is now being prepared at ${storeName}.`,
        },
        ready: {
          title: 'Order Ready for Pickup!',
          body: `Your order #${order.order_number} is ready! Head to ${storeName} to pick it up.`,
        },
        out_for_delivery: {
          title: 'Order On Its Way!',
          body: `Your order #${order.order_number} is out for delivery and will arrive soon.`,
        },
        delivered: {
          title: 'Order Delivered!',
          body: `Your order #${order.order_number} has been delivered. Enjoy!`,
        },
        cancelled: {
          title: 'Order Cancelled',
          body: `Your order #${order.order_number} has been cancelled.`,
        },
      }

      const message = statusMessages[status]
      if (message) {
        sendPushToUser(order.customer_id, {
          title: message.title,
          body: message.body,
          data: {
            type: 'order_status',
            orderNumber: order.order_number,
            orderId: order.id,
            status,
          },
        }).catch(err => console.error('[Orders] Failed to send status push:', err))
      }
    }

    // If status is 'out_for_delivery' and it's a delivery order, trigger DoorDash
    if (status === 'out_for_delivery' && order.delivery_method === 'delivery' && order.delivery_address) {
      const storeAddress = order.bodega_store?.address
      const storePhone = order.bodega_store?.phone || order.bodega_store?.store_owner?.business_phone

      if (storeAddress && storePhone) {
        // Parse order items from the JSONB field
        const orderItems = (order.items as Array<{ name: string; quantity: number }>) || []

        createOrderDelivery({
          orderId: order.id,
          orderNumber: order.order_number,
          items: orderItems,
          totalAmount: order.total_amount,
          pickupAddress: storeAddress,
          pickupBusinessName: order.bodega_store?.name || 'Store',
          pickupPhone: storePhone,
          dropoffAddress: order.delivery_address,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          dropoffInstructions: order.delivery_instructions,
        }).then(async (result) => {
          if (result.success && result.delivery) {
            // Store the DoorDash delivery ID and tracking URL in the order
            await supabase
              .from('bodega_orders')
              .update({
                doordash_delivery_id: result.delivery.delivery_id,
                doordash_tracking_url: result.delivery.tracking_url,
              })
              .eq('id', orderId)

            console.log(`[Orders] DoorDash delivery created: ${result.delivery.delivery_id}`)
          } else {
            console.error('[Orders] DoorDash delivery failed:', result.error)
          }
        }).catch(err => console.error('[Orders] DoorDash delivery error:', err))
      } else {
        console.warn('[Orders] Missing store address or phone for DoorDash delivery')
      }
    }

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
