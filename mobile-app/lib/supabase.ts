import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Custom storage adapter using SecureStore for sensitive data
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Google sign-in using Supabase OAuth (same flow as website)
export const signInWithGoogle = async () => {
  // Use the Supabase project URL as the redirect target
  // openAuthSessionAsync will intercept it before the page loads
  const redirectTo = `${supabaseUrl}/auth/v1/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    return { data: null, error: error || new Error('No OAuth URL returned') }
  }

  // Open browser for Google sign-in
  // The browser will close automatically when redirect is detected
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type !== 'success' || !('url' in result)) {
    return { data: null, error: new Error('Google sign-in was cancelled') }
  }

  // Extract tokens from the redirect URL
  const url = new URL(result.url)
  // Tokens can be in hash fragment or query params
  const params = new URLSearchParams(
    url.hash ? url.hash.replace('#', '') : url.search.replace('?', '')
  )
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken) {
    return { data: null, error: new Error('No access token received') }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || '',
  })

  return { data: sessionData, error: sessionError }
}
