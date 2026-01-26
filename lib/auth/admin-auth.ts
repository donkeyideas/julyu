/**
 * Admin Authentication
 * Simple admin auth with hardcoded admin email
 */

const ADMIN_EMAIL = 'info@donkeyideas.com'
const ADMIN_SESSION_KEY = 'julyu_admin_session'

export interface AdminUser {
  email: string
  isAdmin: boolean
  loginTime: number
}

export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function setAdminSession(email: string): void {
  if (typeof window === 'undefined') return

  const session: AdminUser = {
    email,
    isAdmin: true,
    loginTime: Date.now()
  }
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null

  try {
    const sessionJson = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!sessionJson) return null

    const session = JSON.parse(sessionJson) as AdminUser

    // Session expires after 24 hours
    const ONE_DAY = 24 * 60 * 60 * 1000
    if (Date.now() - session.loginTime > ONE_DAY) {
      clearAdminSession()
      return null
    }

    return session
  } catch {
    return null
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function validateAdminLogin(email: string, password: string): { success: boolean; error?: string } {
  // Check if email is admin email
  if (!isAdminEmail(email)) {
    return { success: false, error: 'Access denied. Admin privileges required.' }
  }

  // For security, require a password (can be any password for now,
  // but in production this should be properly validated via Supabase)
  if (!password || password.length < 6) {
    return { success: false, error: 'Invalid password' }
  }

  return { success: true }
}
