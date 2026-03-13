import { useEffect, useState } from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { colors } from '@/constants/colors'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useSharedValue(0.3)
  const logoOpacity = useSharedValue(0)
  const textOpacity = useSharedValue(0)
  const loaderOpacity = useSharedValue(0)

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    logoOpacity.value = withTiming(1, { duration: 600 })
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
    loaderOpacity.value = withDelay(800, withTiming(1, { duration: 400 }))

    const timer = setTimeout(onFinish, 2200)
    return () => clearTimeout(timer)
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }))

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }))

  return (
    <View style={splashStyles.container}>
      <StatusBar style="light" />
      <View style={splashStyles.center}>
        <Animated.View style={[splashStyles.logoWrap, logoStyle]}>
          <Image
            source={require('@/assets/julyu_j.png')}
            style={splashStyles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text style={[splashStyles.title, textStyle]}>Julyu</Animated.Text>
        <Animated.Text style={[splashStyles.tagline, textStyle]}>
          Save smart. Shop better.
        </Animated.Text>
      </View>
      <Animated.View style={[splashStyles.loaderWrap, loaderStyle]}>
        <View style={splashStyles.loader} />
      </Animated.View>
    </View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: 20,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  loaderWrap: {
    position: 'absolute',
    bottom: 80,
  },
  loader: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderTopColor: colors.primary,
  },
})

export default function RootLayout() {
  const { checkAuth, isLoading: authLoading, isAuthenticated } = useAuthStore()
  const { checkOnboarding, hasSeenOnboarding, isLoading: onboardingLoading } = useAppStore()
  const [showSplash, setShowSplash] = useState(true)
  const [hasNavigated, setHasNavigated] = useState(false)

  useEffect(() => {
    const init = async () => {
      await Promise.all([checkAuth(), checkOnboarding()])
      await SplashScreen.hideAsync()
    }
    init()
  }, [])

  // Navigate after splash finishes and data is loaded
  useEffect(() => {
    if (showSplash || authLoading || onboardingLoading || hasNavigated) return

    setHasNavigated(true)

    if (!hasSeenOnboarding) {
      router.replace('/onboarding')
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login')
    } else {
      router.replace('/(tabs)')
    }
  }, [showSplash, authLoading, onboardingLoading, hasNavigated, hasSeenOnboarding, isAuthenticated])

  if (authLoading || onboardingLoading || showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />
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
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
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
        <Stack.Screen
          name="lists/[id]"
          options={{
            title: 'List Details',
          }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{
            title: 'Edit Profile',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search',
          }}
        />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
        <Stack.Screen name="alerts" options={{ headerShown: false }} />
        <Stack.Screen name="assistant" options={{ title: 'Jules - AI Assistant' }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="(store-portal)" options={{ headerShown: false }} />
        <Stack.Screen
          name="store-apply"
          options={{
            title: 'Become a Store Partner',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  )
}
