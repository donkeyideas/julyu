import { create } from 'zustand'
import { getSavings, getMonthlySavings, SavingsData, MonthlySavings } from '@/services/savings'

interface SavingsState {
  savings: SavingsData | null
  monthlySavings: MonthlySavings[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSavings: () => Promise<void>
  fetchMonthlySavings: () => Promise<void>
  clearError: () => void
}

export const useSavingsStore = create<SavingsState>((set) => ({
  savings: null,
  monthlySavings: [],
  isLoading: false,
  error: null,

  fetchSavings: async () => {
    set({ isLoading: true, error: null })
    try {
      const savings = await getSavings()
      set({ savings, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch savings',
        isLoading: false,
      })
    }
  },

  fetchMonthlySavings: async () => {
    set({ isLoading: true, error: null })
    try {
      const monthlySavings = await getMonthlySavings()
      set({ monthlySavings, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch monthly savings',
        isLoading: false,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
