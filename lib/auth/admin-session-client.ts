// Client-side session helpers for admin auth
// This file can be imported in client components

const SESSION_STORAGE_KEY = 'julyu_admin_session_token'

export function setAdminSessionToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, token)
  }
}

export function getAdminSessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_STORAGE_KEY)
  }
  return null
}

export function clearAdminSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
