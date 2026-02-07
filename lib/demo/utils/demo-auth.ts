// Demo session management - cookie/localStorage based, no database
// Used to gate access to demo dashboard pages

const DEMO_SESSION_KEY = 'julyu_demo_session'

export interface DemoSession {
  code: string
  demoType: 'user' | 'store' | 'both'
  expiresAt: string
  name: string
}

export function setDemoSession(session: DemoSession): void {
  const value = JSON.stringify(session)
  // Set cookie for middleware access (7 day TTL)
  document.cookie = `${DEMO_SESSION_KEY}=${encodeURIComponent(value)}; path=/demo; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
  // Also store in localStorage for client-side access
  localStorage.setItem(DEMO_SESSION_KEY, value)
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(DEMO_SESSION_KEY)
  if (stored) {
    try {
      const session = JSON.parse(stored) as DemoSession
      if (new Date(session.expiresAt) > new Date()) return session
      clearDemoSession()
    } catch {
      clearDemoSession()
    }
  }
  return null
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return
  document.cookie = `${DEMO_SESSION_KEY}=; path=/demo; max-age=0`
  localStorage.removeItem(DEMO_SESSION_KEY)
}

// Server-side: parse demo session from cookie string
export function parseDemoSessionFromCookie(cookieValue: string): DemoSession | null {
  try {
    const decoded = decodeURIComponent(cookieValue)
    const session = JSON.parse(decoded) as DemoSession
    if (new Date(session.expiresAt) > new Date()) return session
  } catch {
    // Invalid cookie
  }
  return null
}
