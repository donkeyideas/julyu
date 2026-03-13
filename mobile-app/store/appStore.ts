import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'julyu_onboarding_complete'

interface AppState {
  hasSeenOnboarding: boolean
  isLoading: boolean

  // Actions
  setOnboardingComplete: () => Promise<void>
  checkOnboarding: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  hasSeenOnboarding: false,
  isLoading: true,

  setOnboardingComplete: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
      set({ hasSeenOnboarding: true })
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }
  },

  checkOnboarding: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY)
      set({
        hasSeenOnboarding: value === 'true',
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to read onboarding state:', error)
      set({ isLoading: false })
    }
  },
}))
