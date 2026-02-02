/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 * Handles push notifications to mobile devices and web browsers
 *
 * Setup Requirements:
 * 1. Create a Firebase project at console.firebase.google.com
 * 2. Go to Project Settings > Service Accounts
 * 3. Generate a new private key (downloads JSON file)
 * 4. Set environment variables:
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY (the private_key field from JSON, with \n preserved)
 */

import * as admin from 'firebase-admin'

// ============================================
// Firebase Admin Initialization
// ============================================

let firebaseApp: admin.app.App | null = null

function getFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[PushNotifications] Firebase credentials not configured')
    return null
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
    console.log('[PushNotifications] Firebase Admin initialized')
    return firebaseApp
  } catch (error) {
    // App may already be initialized
    if ((error as Error).message?.includes('already exists')) {
      firebaseApp = admin.app()
      return firebaseApp
    }
    console.error('[PushNotifications] Failed to initialize Firebase:', error)
    return null
  }
}

// ============================================
// Types
// ============================================

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  badge?: number
  sound?: string
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================
// Core Notification Functions
// ============================================

/**
 * Send a push notification to a single device
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushNotificationPayload
): Promise<NotificationResult> {
  const app = getFirebaseAdmin()

  if (!app) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    const message: admin.messaging.Message = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: payload.sound || 'default',
          channelId: 'orders',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: payload.sound || 'default',
            badge: payload.badge,
          },
        },
      },
    }

    const response = await admin.messaging().send(message)
    console.log(`[PushNotifications] Sent to ${deviceToken.substring(0, 10)}...: ${response}`)

    return { success: true, messageId: response }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PushNotifications] Failed to send:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send a push notification to multiple devices
 */
export async function sendPushNotificationToMany(
  deviceTokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number }> {
  const app = getFirebaseAdmin()

  if (!app) {
    return { successCount: 0, failureCount: deviceTokens.length }
  }

  if (deviceTokens.length === 0) {
    return { successCount: 0, failureCount: 0 }
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: payload.sound || 'default',
          channelId: 'orders',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: payload.sound || 'default',
            badge: payload.badge,
          },
        },
      },
    }

    const response = await admin.messaging().sendEachForMulticast(message)
    console.log(`[PushNotifications] Multicast: ${response.successCount} success, ${response.failureCount} failed`)

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error('[PushNotifications] Multicast failed:', error)
    return { successCount: 0, failureCount: deviceTokens.length }
  }
}

// ============================================
// Order Notification Helpers
// ============================================

/**
 * Send order confirmation push notification to customer
 */
export async function sendOrderConfirmationPush(
  deviceToken: string,
  orderNumber: string,
  storeName: string,
  totalAmount: number
): Promise<NotificationResult> {
  return sendPushNotification(deviceToken, {
    title: 'Order Confirmed!',
    body: `Your order #${orderNumber} from ${storeName} has been placed. Total: $${totalAmount.toFixed(2)}`,
    data: {
      type: 'order_confirmation',
      orderNumber,
      screen: 'OrderDetails',
    },
  })
}

/**
 * Send new order alert push notification to store owner
 */
export async function sendNewOrderAlertPush(
  deviceToken: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number
): Promise<NotificationResult> {
  return sendPushNotification(deviceToken, {
    title: 'New Order Received!',
    body: `Order #${orderNumber} from ${customerName} - $${totalAmount.toFixed(2)}`,
    data: {
      type: 'new_order',
      orderNumber,
      screen: 'StoreOrders',
    },
    sound: 'order_alert.wav',
  })
}

/**
 * Send order status update push notification to customer
 */
export async function sendOrderStatusPush(
  deviceToken: string,
  orderNumber: string,
  status: string,
  storeName: string
): Promise<NotificationResult> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    accepted: {
      title: 'Order Accepted!',
      body: `${storeName} has accepted your order #${orderNumber} and will start preparing it soon.`,
    },
    preparing: {
      title: 'Order Being Prepared',
      body: `Your order #${orderNumber} is now being prepared at ${storeName}.`,
    },
    ready: {
      title: 'Order Ready for Pickup!',
      body: `Your order #${orderNumber} is ready! Head to ${storeName} to pick it up.`,
    },
    out_for_delivery: {
      title: 'Order On Its Way!',
      body: `Your order #${orderNumber} is out for delivery and will arrive soon.`,
    },
    delivered: {
      title: 'Order Delivered!',
      body: `Your order #${orderNumber} has been delivered. Enjoy!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      body: `Your order #${orderNumber} has been cancelled.`,
    },
  }

  const message = statusMessages[status] || {
    title: 'Order Update',
    body: `Your order #${orderNumber} status has been updated.`,
  }

  return sendPushNotification(deviceToken, {
    title: message.title,
    body: message.body,
    data: {
      type: 'order_status',
      orderNumber,
      status,
      screen: 'OrderDetails',
    },
  })
}

/**
 * Send price alert push notification
 */
export async function sendPriceAlertPush(
  deviceToken: string,
  productName: string,
  currentPrice: number,
  targetPrice: number,
  storeName: string
): Promise<NotificationResult> {
  return sendPushNotification(deviceToken, {
    title: 'Price Drop Alert!',
    body: `${productName} is now $${currentPrice.toFixed(2)} at ${storeName} (your target: $${targetPrice.toFixed(2)})`,
    data: {
      type: 'price_alert',
      productName,
      screen: 'PriceAlerts',
    },
  })
}

// ============================================
// Device Token Management
// ============================================

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Register a device token for a user
 */
export async function registerDeviceToken(
  userId: string,
  deviceToken: string,
  platform: 'ios' | 'android' | 'web'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient() as any

    // Upsert the device token
    const { error } = await supabase
      .from('user_device_tokens')
      .upsert({
        user_id: userId,
        device_token: deviceToken,
        platform,
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'device_token',
      })

    if (error) {
      console.error('[PushNotifications] Failed to register token:', error)
      return { success: false, error: error.message }
    }

    console.log(`[PushNotifications] Registered token for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('[PushNotifications] Registration error:', error)
    return { success: false, error: 'Failed to register device token' }
  }
}

/**
 * Unregister a device token
 */
export async function unregisterDeviceToken(
  deviceToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient() as any

    const { error } = await supabase
      .from('user_device_tokens')
      .update({ is_active: false })
      .eq('device_token', deviceToken)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to unregister device token' }
  }
}

/**
 * Get all active device tokens for a user
 */
export async function getUserDeviceTokens(
  userId: string
): Promise<string[]> {
  try {
    const supabase = createServiceRoleClient() as any

    const { data, error } = await supabase
      .from('user_device_tokens')
      .select('device_token')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error || !data) {
      return []
    }

    return data.map((row: { device_token: string }) => row.device_token)
  } catch {
    return []
  }
}

/**
 * Send push notification to all of a user's devices
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number }> {
  const tokens = await getUserDeviceTokens(userId)

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 }
  }

  return sendPushNotificationToMany(tokens, payload)
}

/**
 * Get all active device tokens for a store owner
 */
export async function getStoreOwnerDeviceTokens(
  storeOwnerId: string
): Promise<string[]> {
  try {
    const supabase = createServiceRoleClient() as any

    const { data, error } = await supabase
      .from('store_owner_device_tokens')
      .select('device_token')
      .eq('store_owner_id', storeOwnerId)
      .eq('is_active', true)

    if (error || !data) {
      return []
    }

    return data.map((row: { device_token: string }) => row.device_token)
  } catch {
    return []
  }
}

/**
 * Send push notification to all of a store owner's devices
 */
export async function sendPushToStoreOwner(
  storeOwnerId: string,
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number }> {
  const tokens = await getStoreOwnerDeviceTokens(storeOwnerId)

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 }
  }

  return sendPushNotificationToMany(tokens, payload)
}
