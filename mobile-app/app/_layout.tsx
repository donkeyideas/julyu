import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@/store/authStore'
import { colors } from '@/constants/colors'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth()
      await SplashScreen.hideAsync()
    }

    initializeAuth()
  }, [])

  if (isLoading) {
    return null // Keep splash screen visible
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="compare/[listId]"
          options={{
            title: 'Compare Prices',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="receipt/[id]"
          options={{
            title: 'Receipt Details',
          }}
        />
      </Stack>
    </>
  )
}
