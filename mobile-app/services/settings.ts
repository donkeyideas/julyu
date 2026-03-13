import { apiClient } from './api'

export interface UserSettings {
  notifications: {
    price_alerts: boolean
    weekly_summary: boolean
    new_features: boolean
  }
  preferred_stores: string[]
  zip_code: string
}

export async function getSettings(): Promise<UserSettings> {
  return apiClient<UserSettings>('/settings')
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  return apiClient<UserSettings>('/settings', { method: 'PUT', body: settings })
}
