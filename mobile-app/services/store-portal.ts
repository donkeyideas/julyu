import { apiClient } from './api'

export interface DashboardStats {
  revenue_today: number
  revenue_this_month: number
  orders_today: number
  total_products: number
  low_stock_count: number
}

export interface InventoryItem {
  id: string
  name: string
  price: number
  stock: number
  category: string
  image_url?: string
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  total: number
  items_count: number
  items?: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  notes?: string
  created_at: string
  updated_at?: string
}

export interface StoreApplication {
  store_name: string
  owner_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  store_type: string
  description: string
}

export const storePortalApi = {
  getDashboard: () => apiClient<DashboardStats>('/store-portal/dashboard'),
  getInventory: () => apiClient<{ items: InventoryItem[] }>('/store-portal/inventory'),
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) =>
    apiClient<InventoryItem>(`/store-portal/inventory/${id}`, { method: 'PUT', body: updates }),
  addInventoryItem: (item: Partial<InventoryItem>) =>
    apiClient<InventoryItem>('/store-portal/inventory', { method: 'POST', body: item }),
  deleteInventoryItem: (id: string) =>
    apiClient(`/store-portal/inventory/${id}`, { method: 'DELETE' }),
  getOrders: () => apiClient<{ orders: Order[] }>('/store-portal/orders'),
  getOrder: (id: string) => apiClient<Order>(`/store-portal/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient(`/store-portal/orders/${id}/status`, { method: 'PUT', body: { status } }),
  getInventoryItem: (id: string) => apiClient<InventoryItem>(`/store-portal/inventory/${id}`),
  submitApplication: (data: StoreApplication) =>
    apiClient<{ success: boolean }>('/store-portal/apply', { method: 'POST', body: data }),
}
