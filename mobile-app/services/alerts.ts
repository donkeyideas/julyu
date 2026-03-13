import { apiClient } from './api'

export interface Alert {
  id: string
  product_name: string
  target_price: number
  current_price?: number
  store_name?: string
  is_triggered: boolean
  created_at: string
}

export async function getAlerts(): Promise<Alert[]> {
  const response = await apiClient<{ alerts: Alert[] }>('/alerts')
  return response.alerts
}

export async function createAlert(data: { product_name: string; target_price: number }): Promise<Alert> {
  return apiClient<Alert>('/alerts', { method: 'POST', body: data })
}

export async function deleteAlert(id: string): Promise<void> {
  await apiClient(`/alerts/${id}`, { method: 'DELETE' })
}
