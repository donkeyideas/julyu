import { create } from 'zustand'
import {
  storePortalApi,
  DashboardStats,
  InventoryItem,
  Order,
} from '@/services/store-portal'

interface StorePortalState {
  dashboardStats: DashboardStats | null
  inventory: InventoryItem[]
  orders: Order[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchDashboard: () => Promise<void>
  fetchInventory: () => Promise<void>
  fetchOrders: () => Promise<void>
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  addInventoryItem: (item: Partial<InventoryItem>) => Promise<void>
  deleteInventoryItem: (id: string) => Promise<void>
  updateOrderStatus: (id: string, status: string) => Promise<void>
  clearError: () => void
}

export const useStorePortalStore = create<StorePortalState>((set, get) => ({
  dashboardStats: null,
  inventory: [],
  orders: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null })
    try {
      const stats = await storePortalApi.getDashboard()
      set({ dashboardStats: stats, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
        isLoading: false,
      })
    }
  },

  fetchInventory: async () => {
    set({ isLoading: true, error: null })
    try {
      const { items } = await storePortalApi.getInventory()
      set({ inventory: items, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
        isLoading: false,
      })
    }
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const { orders } = await storePortalApi.getOrders()
      set({ orders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      })
    }
  },

  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await storePortalApi.updateInventoryItem(id, updates)
      set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === id ? { ...item, ...updated } : item
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update item',
        isLoading: false,
      })
    }
  },

  addInventoryItem: async (item: Partial<InventoryItem>) => {
    set({ isLoading: true, error: null })
    try {
      const newItem = await storePortalApi.addInventoryItem(item)
      set((state) => ({
        inventory: [newItem, ...state.inventory],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add item',
        isLoading: false,
      })
    }
  },

  deleteInventoryItem: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await storePortalApi.deleteInventoryItem(id)
      set((state) => ({
        inventory: state.inventory.filter((item) => item.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete item',
        isLoading: false,
      })
    }
  },

  updateOrderStatus: async (id: string, status: string) => {
    set({ isLoading: true, error: null })
    try {
      await storePortalApi.updateOrderStatus(id, status)
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status: status as Order['status'] } : order
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update order status',
        isLoading: false,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
