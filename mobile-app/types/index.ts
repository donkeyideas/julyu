// User types
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  zip_code?: string
  created_at: string
}

// Receipt types
export interface Receipt {
  id: string
  user_id: string
  store_name: string
  store_location?: string
  total_amount: number
  items_count: number
  image_url?: string
  scanned_at: string
  created_at: string
}

export interface ReceiptItem {
  id: string
  receipt_id: string
  name: string
  price: number
  quantity: number
  unit?: string
  category?: string
}

// Shopping list types
export interface ShoppingList {
  id: string
  user_id: string
  name: string
  items_count: number
  estimated_total: number
  created_at: string
  updated_at: string
}

export interface ShoppingListItem {
  id: string
  list_id: string
  name: string
  quantity: number
  unit?: string
  best_price?: number
  best_store?: string
  is_checked: boolean
}

// Price comparison types
export interface Store {
  id: string
  name: string
  address: string
  distance: number
  total_price: number
  savings: number
  is_best: boolean
}

export interface PriceComparison {
  list_id: string
  items: ShoppingListItem[]
  stores: Store[]
  best_store: Store
  potential_savings: number
}

// Price alert types
export interface PriceAlert {
  id: string
  user_id: string
  product_name: string
  target_price: number
  current_price?: number
  is_triggered: boolean
  created_at: string
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined
  '(auth)': undefined
  'compare/[listId]': { listId: string }
  'receipt/[id]': { id: string }
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Savings types
export interface SavingsSummary {
  total_saved: number
  this_month: number
  last_month: number
  percent_change: number
  receipts_count: number
  lists_count: number
}
