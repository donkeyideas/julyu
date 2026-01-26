'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

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
      }
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '' },
    { href: '/dashboard/compare', label: 'Compare Prices', icon: '' },
    { href: '/dashboard/lists', label: 'My Lists', icon: '' },
    { href: '/dashboard/receipts', label: 'Receipt History', icon: '' },
    { href: '/dashboard/savings', label: 'Savings Tracker', icon: '' },
    { href: '/dashboard/alerts', label: 'Price Alerts', icon: '' },
    // AI Features
    { href: '/dashboard/assistant', label: 'AI Assistant', icon: '' },
    { href: '/dashboard/insights', label: 'Smart Insights', icon: '' },
    { href: '/dashboard/budget', label: 'Budget Optimizer', icon: '' },
    { href: '/dashboard/settings', label: 'Settings', icon: '' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-gray-900 border-r border-gray-800 p-8 overflow-y-auto">
      <Link href="/dashboard" className="text-3xl font-black text-green-500 mb-12 block">
        Julyu
      </Link>

      {user && (
        <div className="mb-8 pb-8 border-b border-gray-800">
          <div className="font-bold text-lg mb-1">{user.user_metadata?.full_name || user.email}</div>
          <div className="text-sm text-gray-500">Premium Member</div>
        </div>
      )}

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-green-500/15 text-green-500 border-l-4 border-green-500 font-semibold'
                  : 'text-gray-400 hover:bg-green-500/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-8 w-full px-4 py-3 text-left text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition"
      >
        Sign Out
      </button>
    </aside>
  )
}


