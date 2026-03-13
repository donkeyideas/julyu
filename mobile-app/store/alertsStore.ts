import { create } from 'zustand'
import { getAlerts, createAlert, deleteAlert, Alert } from '@/services/alerts'

interface AlertsState {
  alerts: Alert[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchAlerts: () => Promise<void>
  createNewAlert: (data: { product_name: string; target_price: number }) => Promise<{ error?: string; alert?: Alert }>
  removeAlert: (id: string) => Promise<{ error?: string }>
  clearError: () => void
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null })
    try {
      const alerts = await getAlerts()
      set({ alerts, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
        isLoading: false,
      })
    }
  },

  createNewAlert: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const alert = await createAlert(data)
      set((state) => ({
        alerts: [...state.alerts, alert],
        isLoading: false,
      }))
      return { alert }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create alert'
      set({ error: errorMessage, isLoading: false })
      return { error: errorMessage }
    }
  },

  removeAlert: async (id: string) => {
    const previousAlerts = get().alerts

    // Optimistic update: remove from list immediately
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
      error: null,
    }))

    try {
      await deleteAlert(id)
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete alert'
      // Revert on failure
      set({ alerts: previousAlerts, error: errorMessage })
      return { error: errorMessage }
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
