'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import { useDemo } from '@/lib/demo/providers/DemoProvider'

export default function DemoSidebar() {
  const pathname = usePathname()
  const { session } = useDemo()
  const showStorePortal = session?.demoType === 'both' || session?.demoType === 'store'

  const navItems = [
    { href: '/demo/dashboard', label: 'Dashboard', icon: '' },
    { href: '/demo/dashboard/compare', label: 'Compare Prices', icon: '' },
    { href: '/demo/dashboard/savings', label: 'Savings & Activity', icon: '' },
    { href: '/demo/dashboard/lists', label: 'My Lists', icon: '' },
    { href: '/demo/dashboard/alerts', label: 'Price Alerts', icon: '' },
    { href: '/demo/dashboard/assistant', label: 'Jules', icon: '' },
    { href: '/demo/dashboard/chat', label: 'Chat', icon: '' },
    { href: '/demo/dashboard/insights', label: 'Smart Insights', icon: '' },
    { href: '/demo/dashboard/budget', label: 'Budget Optimizer', icon: '' },
    { href: '/demo/dashboard/settings', label: 'Settings', icon: '' },
  ]

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[280px] p-8 overflow-y-auto transition-colors"
      style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
    >
      <Link href="/demo/dashboard" className="text-3xl font-black mb-4 block" style={{ color: 'var(--accent-primary)' }}>
        Julyu
      </Link>

      {/* Demo badge */}
      <div className="mb-8 inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
        Demo Mode
      </div>

      {/* Mock user info */}
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
          Sarah Johnson
        </div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          sarah.johnson@email.com
        </div>
        <div className="text-sm text-green-500 mt-1">
          Premium Member
        </div>
      </div>

      {/* Store Portal Demo Link - only show if demo type includes store */}
      {showStorePortal && (
        <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link
            href="/demo/store-portal"
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition hover:bg-green-500/15"
            style={{ color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Store Portal Demo</span>
          </Link>
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
                isActive ? 'font-semibold' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent'
              }}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Theme</div>
        <ThemeToggle />
      </div>

      <Link
        href="/"
        className="mt-8 block w-full px-4 py-3 text-left hover:bg-green-500/10 hover:text-green-500 rounded-lg transition"
        style={{ color: 'var(--text-muted)' }}
      >
        Exit Demo
      </Link>
    </aside>
  )
}
