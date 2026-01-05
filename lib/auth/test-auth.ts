/**
 * Simple Test Authentication (No Supabase Required)
 * For testing purposes only
 */

interface TestUser {
  id: string
  email: string
  full_name?: string
  subscription_tier: 'free' | 'premium' | 'enterprise'
}

class TestAuth {
  private users: Map<string, TestUser> = new Map()
  private sessions: Map<string, string> = new Map() // sessionId -> userId
  private currentSessionId: string | null = null

  constructor() {
    // Create a default test user
    const defaultUser: TestUser = {
      id: 'test-user-1',
      email: 'test@julyu.com',
      full_name: 'Test User',
      subscription_tier: 'enterprise', // Admin access
    }
    this.users.set(defaultUser.id, defaultUser)
  }

  // Sign up
  async signUp(email: string, password: string, metadata?: any): Promise<{ data: { user: TestUser | null }, error: any }> {
    const user: TestUser = {
      id: `user-${Date.now()}`,
      email,
      full_name: metadata?.full_name,
      subscription_tier: 'free', // Default to free
    }
    this.users.set(user.id, user)
    
    // Auto-login after signup
    const sessionId = `session-${Date.now()}`
    this.sessions.set(sessionId, user.id)
    this.currentSessionId = sessionId
    
    // Store in localStorage (client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_session', sessionId)
      localStorage.setItem('test_user', JSON.stringify(user))
    }
    
    return { data: { user }, error: null }
  }

  // Sign in
  async signIn(email: string, password: string): Promise<{ data: { user: TestUser | null }, error: any }> {
    const user = Array.from(this.users.values()).find(u => u.email === email)
    
    if (!user) {
      return { data: { user: null }, error: { message: 'Invalid credentials' } }
    }

    const sessionId = `session-${Date.now()}`
    this.sessions.set(sessionId, user.id)
    this.currentSessionId = sessionId
    
    // Store in localStorage (client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_session', sessionId)
      localStorage.setItem('test_user', JSON.stringify(user))
    }
    
    return { data: { user }, error: null }
  }

  // Sign out
  async signOut(): Promise<{ error: any }> {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId)
    }
    this.currentSessionId = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_session')
      localStorage.removeItem('test_user')
    }
    
    return { error: null }
  }

  // Get current user
  async getUser(): Promise<{ data: { user: TestUser | null }, error: any }> {
    // Try to get from localStorage first (client-side)
    if (typeof window !== 'undefined') {
      const sessionId = localStorage.getItem('test_session')
      const userJson = localStorage.getItem('test_user')
      
      if (sessionId && userJson) {
        try {
          const user = JSON.parse(userJson)
          this.currentSessionId = sessionId
          this.sessions.set(sessionId, user.id)
          if (!this.users.has(user.id)) {
            this.users.set(user.id, user)
          }
          return { data: { user }, error: null }
        } catch {
          // Invalid JSON, continue
        }
      }
    }

    // Server-side or no localStorage
    if (this.currentSessionId) {
      const userId = this.sessions.get(this.currentSessionId)
      if (userId) {
        const user = this.users.get(userId)
        return { data: { user: user || null }, error: null }
      }
    }

    return { data: { user: null }, error: null }
  }

  // Get session
  async getSession(): Promise<{ data: { session: { user: TestUser } | null }, error: any }> {
    const { data: { user } } = await this.getUser()
    return {
      data: {
        session: user ? { user } : null,
      },
      error: null,
    }
  }

  // Make user admin (for testing)
  makeAdmin(userId: string) {
    const user = this.users.get(userId)
    if (user) {
      user.subscription_tier = 'enterprise'
      this.users.set(userId, user)
      
      // Update localStorage if exists
      if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('test_user')
        if (userJson) {
          const userData = JSON.parse(userJson)
          if (userData.id === userId) {
            userData.subscription_tier = 'enterprise'
            localStorage.setItem('test_user', JSON.stringify(userData))
          }
        }
      }
    }
  }
}

// Singleton instance
let testAuthInstance: TestAuth | null = null

export function getTestAuth(): TestAuth {
  if (!testAuthInstance) {
    testAuthInstance = new TestAuth()
  }
  return testAuthInstance
}


