import { create } from 'zustand'
import { getReceipts, getReceipt, scanReceipt, Receipt } from '@/services/receipts'

interface ReceiptsState {
  receipts: Receipt[]
  currentReceipt: Receipt | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchReceipts: () => Promise<void>
  fetchReceipt: (id: string) => Promise<void>
  scanNewReceipt: (imageUri: string) => Promise<{ error?: string; receiptId?: string }>
  clearError: () => void
}

export const useReceiptsStore = create<ReceiptsState>((set) => ({
  receipts: [],
  currentReceipt: null,
  isLoading: false,
  error: null,

  fetchReceipts: async () => {
    set({ isLoading: true, error: null })
    try {
      const receipts = await getReceipts()
      set({ receipts, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch receipts',
        isLoading: false,
      })
    }
  },

  fetchReceipt: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const receipt = await getReceipt(id)
      set({ currentReceipt: receipt, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch receipt',
        isLoading: false,
      })
    }
  },

  scanNewReceipt: async (imageUri: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await scanReceipt(imageUri)
      set({ isLoading: false })
      return { receiptId: result.receiptId }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan receipt'
      set({ error: errorMessage, isLoading: false })
      return { error: errorMessage }
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
