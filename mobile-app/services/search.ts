import { apiClient } from './api'

export interface ProductResult {
  id: string
  name: string
  image_url?: string
  price_range: { min: number; max: number }
  stores: string[]
}

export interface NearbyStore {
  id: string
  name: string
  address: string
  distance: number
}

export async function searchProducts(query: string): Promise<ProductResult[]> {
  return apiClient<ProductResult[]>(
    `/spoonacular/products?query=${encodeURIComponent(query)}`
  )
}

export async function getNearbyStores(zipCode?: string): Promise<NearbyStore[]> {
  const params = zipCode ? `?zip=${zipCode}` : ''
  return apiClient<NearbyStore[]>(`/bodegas/nearby${params}`)
}
