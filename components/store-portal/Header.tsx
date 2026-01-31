'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface StorePortalHeaderProps {
  businessName?: string
  userEmail?: string
  isApproved: boolean
}

export default function StorePortalHeader({ businessName, userEmail, isApproved }: StorePortalHeaderProps) {
  return (
    <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-2xl font-bold text-green-500">
                Julyu
              </Link>
              <span style={{ color: 'var(--text-secondary)' }}>|</span>
              <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Store Portal</span>
            </div>

            {isApproved && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/store-portal"
                  className="text-sm font-medium hover:text-green-500 transition"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/store-portal/inventory"
                  className="text-sm font-medium hover:text-green-500 transition"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Inventory
                </Link>
                <Link
                  href="/store-portal/orders"
                  className="text-sm font-medium hover:text-green-500 transition"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Orders
                </Link>
                <Link
                  href="/store-portal/analytics"
                  className="text-sm font-medium hover:text-green-500 transition"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Analytics
                </Link>
                <Link
                  href="/store-portal/settings"
                  className="text-sm font-medium hover:text-green-500 transition"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Settings
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Dashboard Switcher */}
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-500/10 transition"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>User Dashboard</span>
            </Link>
            <ThemeToggle />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isApproved ? businessName : userEmail}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm hover:text-green-500 transition"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
