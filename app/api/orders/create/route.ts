import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from '@/lib/services/email'
import { sendPushToUser, sendPushToStoreOwner } from '@/lib/services/push-notifications'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to place an order' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      bodegaStoreId,
      items,
      deliveryMethod,
      deliveryAddress,
      customerName,
      customerPhone,
      customerEmail,
    } = body

    // Validate required fields
    if (!bodegaStoreId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Store and items are required' },
        { status: 400 }
      )
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    // Get bodega store details
    const { data: bodegaStore, error: storeError } = await supabase
      .from('bodega_stores')
      .select(`
        *,
        store_owner:store_owners(*)
      `)
      .eq('id', bodegaStoreId)
      .single()

    if (storeError || !bodegaStore) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    if (!bodegaStore.is_active || !bodegaStore.verified) {
      return NextResponse.json(
        { error: 'Store is not available for orders' },
        { status: 400 }
      )
    }

    if (!bodegaStore.store_owner.accepts_orders) {
      return NextResponse.json(
        { error: 'Store is not accepting orders at this time' },
        { status: 400 }
      )
    }

    // Validate and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const { inventoryId, quantity } = item

      if (!inventoryId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        )
      }

      // Get inventory item
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('bodega_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('id', inventoryId)
        .eq('bodega_store_id', bodegaStoreId)
        .single()

      if (inventoryError || !inventoryItem) {
        return NextResponse.json(
          { error: `Item not found: ${inventoryId}` },
          { status: 404 }
        )
      }

      // Check stock
      if (!inventoryItem.in_stock || inventoryItem.stock_quantity < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${inventoryItem.custom_name || inventoryItem.product?.name}` },
          { status: 400 }
        )
      }

      const itemPrice = parseFloat(inventoryItem.sale_price)
      const itemTotal = itemPrice * quantity

      orderItems.push({
        inventoryId: inventoryItem.id,
        productId: inventoryItem.product_id,
        name: inventoryItem.custom_name || inventoryItem.product?.name,
        brand: inventoryItem.custom_brand || inventoryItem.product?.brand,
        size: inventoryItem.custom_size || inventoryItem.product?.size,
        imageUrl: inventoryItem.custom_image_url || inventoryItem.product?.image_url,
        price: itemPrice,
        quantity,
        total: itemTotal,
      })

      subtotal += itemTotal
    }

    // Calculate tax (8% for NYC)
    const taxRate = 0.08
    const taxAmount = subtotal * taxRate

    // Calculate delivery fee (flat $3.99 for delivery, $0 for pickup)
    const deliveryFee = deliveryMethod === 'delivery' ? 3.99 : 0

    // Calculate total
    const totalAmount = subtotal + taxAmount + deliveryFee

    // Calculate commission
    const commissionRate = bodegaStore.store_owner.commission_rate
    const commissionAmount = subtotal * (commissionRate / 100)
    const storePayoutAmount = subtotal - commissionAmount

    // Generate unique order number
    const orderNumber = `JB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('bodega_orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        bodega_store_id: bodegaStoreId,
        store_owner_id: bodegaStore.store_owner_id,
        items: orderItems,
        subtotal,
        tax_amount: taxAmount,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        store_payout: storePayoutAmount,
        status: 'pending',
        delivery_method: deliveryMethod,
        delivery_address: deliveryAddress || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Update inventory stock quantities
    for (const item of items) {
      const { inventoryId, quantity } = item

      await supabase.rpc('decrement_inventory_stock', {
        p_inventory_id: inventoryId,
        p_quantity: quantity
      })
    }

    // Send notification emails (fire and forget - don't block the response)
    const emailItems = orderItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.total,
    }))

    // Send confirmation email to customer
    sendOrderConfirmationEmail({
      customerEmail,
      customerName,
      orderNumber: order.order_number,
      items: emailItems,
      subtotal,
      tax: taxAmount,
      total: totalAmount,
      storeName: bodegaStore.name,
      storeAddress: bodegaStore.address,
      orderType: deliveryMethod,
      estimatedTime: deliveryMethod === 'pickup' ? '15-20 minutes' : '30-45 minutes',
    }).catch(err => console.error('[Orders] Failed to send customer email:', err))

    // Send alert email to store owner
    if (bodegaStore.store_owner?.business_email) {
      sendNewOrderAlertEmail({
        storeOwnerEmail: bodegaStore.store_owner.business_email,
        storeOwnerName: bodegaStore.store_owner.business_name,
        orderNumber: order.order_number,
        customerName,
        customerPhone,
        items: emailItems,
        total: totalAmount,
        orderType: deliveryMethod,
        deliveryAddress: deliveryAddress || undefined,
      }).catch(err => console.error('[Orders] Failed to send store owner email:', err))
    }

    // Send push notifications (fire and forget)
    // Customer confirmation push
    sendPushToUser(user.id, {
      title: 'Order Confirmed!',
      body: `Your order #${order.order_number} from ${bodegaStore.name} has been placed. Total: $${totalAmount.toFixed(2)}`,
      data: {
        type: 'order_confirmation',
        orderNumber: order.order_number,
        orderId: order.id,
      },
    }).catch(err => console.error('[Orders] Failed to send customer push:', err))

    // Store owner new order push
    if (bodegaStore.store_owner_id) {
      sendPushToStoreOwner(bodegaStore.store_owner_id, {
        title: 'New Order Received!',
        body: `Order #${order.order_number} from ${customerName} - $${totalAmount.toFixed(2)}`,
        data: {
          type: 'new_order',
          orderNumber: order.order_number,
          orderId: order.id,
        },
        sound: 'order_alert.wav',
      }).catch(err => console.error('[Orders] Failed to send store owner push:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
        estimatedTime: deliveryMethod === 'pickup' ? '15-20 minutes' : '30-45 minutes',
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
