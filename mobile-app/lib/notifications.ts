import { Platform } from 'react-native'
import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'

let Notifications: typeof import('expo-notifications') | null = null
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications')
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
  } catch {
    /* expo-notifications not available */
  }
}

// Import supabase client for direct token storage
import { supabase } from '@/lib/supabase'

/**
 * Register for push notifications and store token directly in Supabase.
 * Uses getDevicePushTokenAsync() for native FCM/APNs tokens (not Expo push tokens).
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Notifications) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }

  // Get native FCM/APNs token (NOT Expo push token — that hangs on Android)
  const tokenData = await Notifications.getDevicePushTokenAsync()
  const pushToken = tokenData.data as string
  const platform = Platform.OS === 'ios' ? 'ios' : 'android'

  // Store directly via Supabase (avoids API URL redirect issues)
  const { error } = await supabase
    .from('user_device_tokens')
    .upsert(
      {
        user_id: userId,
        device_token: pushToken,
        platform,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'device_token' }
    )

  if (error) {
    console.log('Push token save failed:', error.message)
  }

  return pushToken
}

/**
 * Deactivate a push token (call on sign-out).
 */
export async function unregisterPushToken(token: string): Promise<void> {
  await supabase
    .from('user_device_tokens')
    .update({ is_active: false })
    .eq('device_token', token)
}

/**
 * Add a listener for when user taps a notification.
 */
export function addNotificationResponseListener(
  callback: (response: import('expo-notifications').NotificationResponse) => void
) {
  if (!Notifications) return () => {}
  const subscription = Notifications.addNotificationResponseReceivedListener(callback)
  return () => subscription.remove()
}

/**
 * Add a listener for notifications received while app is open.
 */
export function addNotificationReceivedListener(
  callback: (notification: import('expo-notifications').Notification) => void
) {
  if (!Notifications) return () => {}
  const subscription = Notifications.addNotificationReceivedListener(callback)
  return () => subscription.remove()
}
