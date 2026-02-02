import { getSession } from '@/lib/supabase'

const API_BASE_URL = 'https://julyu.com/api'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { session } = await getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Add user ID for auth
  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id
    headers['x-user-email'] = session.user.email || ''
    headers['x-user-name'] = session.user.user_metadata?.full_name || ''
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

export async function uploadFile<T>(
  endpoint: string,
  file: { uri: string; type: string; name: string }
): Promise<T> {
  const { session } = await getSession()

  const formData = new FormData()
  formData.append('image', file as any)

  const headers: Record<string, string> = {}

  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id
    headers['x-user-email'] = session.user.email || ''
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Upload failed')
  }

  return response.json()
}
