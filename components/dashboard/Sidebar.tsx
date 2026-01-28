'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface UserInfo {
  email: string
  full_name: string | null
  subscription_tier: 'free' | 'premium' | 'enterprise'
}

// Helper to get auth headers for API calls (supports Firebase/Google users)
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('julyu_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.id) {
          headers['x-user-id'] = user.id
        }
        if (user.email) {
          headers['x-user-email'] = user.email
        }
        if (user.full_name) {
          headers['x-user-name'] = user.full_name
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [friendRequestCount, setFriendRequestCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (user) {
        setUser(user)
      }
    }).catch(() => {
      // Handle test auth - check localStorage
      if (typeof window !== 'undefined') {
        const testUser = localStorage.getItem('test_user')
        if (testUser) {
          try {
            setUser(JSON.parse(testUser) as User)
          } catch {
            // Invalid JSON, ignore
          }
        }
        // Also check for Firebase user
        const firebaseUser = localStorage.getItem('julyu_user')
        if (firebaseUser) {
          try {
            const parsed = JSON.parse(firebaseUser)
            setUser({ id: parsed.id, email: parsed.email, user_metadata: { full_name: parsed.full_name } })
          } catch {
            // Invalid JSON, ignore
          }
        }
      }
    })

    // Fetch user info including subscription tier
    fetch('/api/settings', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUserInfo(data.user)
        }
      })
      .catch(() => {
        // Ignore errors
      })

    // Fetch friend request count
    const fetchFriendRequests = () => {
      fetch('/api/chat/friend-requests', { headers: getAuthHeaders() })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.requests) {
            setFriendRequestCount(data.requests.length)
          }
        })
        .catch(() => {
          // Ignore errors
        })
    }

    fetchFriendRequests()
    // Poll for new friend requests every 30 seconds
    const interval = setInterval(fetchFriendRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear Firebase user data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('julyu_user')
      localStorage.removeItem('pendingFriends')
    }
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '' },
    { href: '/dashboard/compare', label: 'Compare Prices', icon: '' },
    { href: '/dashboard/lists', label: 'My Lists', icon: '' },
    { href: '/dashboard/alerts', label: 'Price Alerts', icon: '' },
    // AI Features
    { href: '/dashboard/assistant', label: 'AI Assistant', icon: '' },
    { href: '/dashboard/chat', label: 'Chat', icon: '' },
    { href: '/dashboard/insights', label: 'Smart Insights', icon: '' },
    { href: '/dashboard/budget', label: 'Budget Optimizer', icon: '' },
    { href: '/dashboard/settings', label: 'Settings', icon: '' },
  ]

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[280px] p-8 overflow-y-auto transition-colors"
      style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
    >
      <Link href="/dashboard" className="text-3xl font-black mb-12 block" style={{ color: 'var(--accent-primary)' }}>
        Julyu
      </Link>

      {user && (
        <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            {userInfo?.full_name || user.user_metadata?.full_name || user.email}
          </div>
          <div className={`text-sm ${
            userInfo?.subscription_tier === 'premium' ? 'text-green-500' :
            userInfo?.subscription_tier === 'enterprise' ? 'text-purple-500' :
            ''
          }`} style={{ color: userInfo?.subscription_tier === 'premium' || userInfo?.subscription_tier === 'enterprise' ? undefined : 'var(--text-muted)' }}>
            {userInfo?.subscription_tier === 'premium' ? 'Premium Member' :
             userInfo?.subscription_tier === 'enterprise' ? 'Enterprise Member' :
             'Free Plan'}
          </div>
          {userInfo?.subscription_tier === 'free' && (
            <Link
              href="/pricing"
              className="mt-2 inline-block text-xs text-green-500 hover:text-green-400 font-semibold"
            >
              Upgrade Plan →
            </Link>
          )}
        </div>
      )}

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const showBadge = item.href === '/dashboard/chat' && friendRequestCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'font-semibold'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent'
              }}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {friendRequestCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Theme</div>
        <ThemeToggle />
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 w-full px-4 py-3 text-left hover:bg-red-500/10 hover:text-red-500 rounded-lg transition"
        style={{ color: 'var(--text-muted)' }}
      >
        Sign Out
      </button>
    </aside>
  )
}


