import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import DoorDashDriveService from '@/lib/services/doordash-drive'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('bodega_orders')
      .select(`
        *,
        bodega_stores (
          name,
          address,
          city,
          state,
          zip,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only create delivery if order is ready and delivery method is delivery
    if (order.delivery_method !== 'delivery') {
      return NextResponse.json(
        { error: 'Order is not a delivery order' },
        { status: 400 }
      )
    }

    if (order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Order must be ready before creating delivery' },
        { status: 400 }
      )
    }

    // Check if delivery already exists
    if (order.doordash_delivery_id) {
      return NextResponse.json(
        { error: 'Delivery already created for this order' },
        { status: 400 }
      )
    }

    // Create DoorDash service
    const doorDashService = new DoorDashDriveService({
      apiKey: process.env.DOORDASH_API_KEY || '',
      environment: (process.env.DOORDASH_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    })

    // Format pickup address
    const pickupAddress = DoorDashDriveService.formatAddress({
      street: order.bodega_stores.address,
      city: order.bodega_stores.city,
      state: order.bodega_stores.state,
      zipCode: order.bodega_stores.zip,
    })

    // Prepare delivery request
    const deliveryRequest = {
      external_delivery_id: order.order_number,
      pickup_address: pickupAddress,
      pickup_business_name: order.bodega_stores.name,
      pickup_phone_number: order.bodega_stores.phone,
      dropoff_address: order.delivery_address!,
      dropoff_business_name: order.customer_name,
      dropoff_phone_number: order.customer_phone,
      order_value: Math.round(parseFloat(order.total_amount) * 100), // Convert to cents
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        external_id: item.inventoryId,
      })),
      contactless_dropoff: true,
      action_if_undeliverable: 'return_to_pickup' as const,
    }

    // Create delivery
    const delivery = await doorDashService.createDelivery(deliveryRequest)

    // Save delivery information
    const { error: deliveryError } = await supabase
      .from('delivery_jobs')
      .insert({
        order_id: order.id,
        doordash_delivery_id: delivery.delivery_id,
        pickup_address: pickupAddress,
        dropoff_address: order.delivery_address,
        driver_name: delivery.dasher?.name || null,
        driver_phone: delivery.dasher?.phone_number || null,
        status: delivery.status,
        tracking_url: delivery.tracking_url,
        delivery_fee: delivery.fee / 100, // Convert from cents
      })

    if (deliveryError) {
      console.error('Failed to save delivery job:', deliveryError)
    }

    // Update order with DoorDash delivery ID
    await supabase
      .from('bodega_orders')
      .update({
        doordash_delivery_id: delivery.delivery_id,
        status: 'out_for_delivery',
      })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      message: 'Delivery created successfully',
      data: {
        deliveryId: delivery.delivery_id,
        trackingUrl: delivery.tracking_url,
        estimatedPickupTime: delivery.estimated_pickup_time,
        estimatedDropoffTime: delivery.estimated_dropoff_time,
        fee: delivery.fee / 100,
      },
    })

  } catch (error) {
    console.error('DoorDash create delivery error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery' },
      { status: 500 }
    )
  }
}
