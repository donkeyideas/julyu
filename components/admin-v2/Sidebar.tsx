'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAdminSession, getAdminSession } from '@/lib/auth/admin-auth'
import ThemeToggle from '@/components/ThemeToggle'

interface NavItem {
  href: string
  label: string
  icon: string
  section: string
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const session = typeof window !== 'undefined' ? getAdminSession() : null

  const handleLogout = () => {
    clearAdminSession()
    router.push('/admin-v2/login')
  }

  const navItems: NavItem[] = [
    { href: '/admin-v2', label: 'Dashboard', icon: '', section: 'Overview' },
    { href: '/admin-v2/content/home', label: 'Home Page', icon: '', section: 'Content' },
    { href: '/admin-v2/content/features', label: 'Features Page', icon: '', section: 'Content' },
    { href: '/admin-v2/content/for-stores', label: 'For Stores Page', icon: '', section: 'Content' },
    { href: '/admin-v2/content/contact', label: 'Contact Page', icon: '', section: 'Content' },
    { href: '/admin-v2/content/testimonials', label: 'Testimonials', icon: '', section: 'Content' },
    { href: '/admin-v2/content/store-ticker', label: 'Store Ticker', icon: '', section: 'Content' },
    { href: '/admin-v2/content/global', label: 'Global Settings', icon: '', section: 'Content' },
    { href: '/admin-v2/ai-models', label: 'AI Models', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/rate-limits', label: 'Rate Limits', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/ai-performance', label: 'AI Performance', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/usage', label: 'Usage & Costs', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/ai-training', label: 'Training Data', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/features', label: 'Feature Flags', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin/stores/applications', label: 'Store Applications', icon: '', section: 'Bodega System' },
    { href: '/admin/stores', label: 'All Stores', icon: '', section: 'Bodega System' },
    { href: '/admin/orders', label: 'All Orders', icon: '', section: 'Bodega System' },
    { href: '/admin/commission-tiers', label: 'Commission Tiers', icon: '', section: 'Bodega System' },
    { href: '/admin/payouts', label: 'Payouts', icon: '', section: 'Bodega System' },
    { href: '/admin/analytics/bodega', label: 'Analytics', icon: '', section: 'Bodega System' },
    { href: '/admin-v2/delivery-partners', label: 'Delivery Partners', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/delivery-partners/analytics', label: 'Partner Analytics', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/partnerships-costs', label: 'Partnerships AI Costs', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/retailers', label: 'Retailer Partnerships', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/instacart', label: 'Instacart API', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/users', label: 'Users', icon: '', section: 'Operations' },
    { href: '/admin-v2/prices', label: 'Price Database', icon: '', section: 'Operations' },
    { href: '/admin-v2/subscriptions', label: 'Subscriptions', icon: '', section: 'Operations' },
  ]

  const sections = [
    { name: 'Overview', items: navItems.filter(item => item.section === 'Overview') },
    { name: 'Content', items: navItems.filter(item => item.section === 'Content') },
    { name: 'AI/LLM Systems', items: navItems.filter(item => item.section === 'AI/LLM Systems') },
    { name: 'Bodega System', items: navItems.filter(item => item.section === 'Bodega System') },
    { name: 'Partnerships', items: navItems.filter(item => item.section === 'Partnerships') },
    { name: 'Operations', items: navItems.filter(item => item.section === 'Operations') },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] p-8 overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
      <Link href="/admin-v2" className="text-3xl font-black text-green-500 mb-12 block">
        Julyu Admin
      </Link>

      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.name}>
            <div className="text-xs uppercase font-semibold mb-3 px-4" style={{ color: 'var(--text-secondary)' }}>
              {section.name}
            </div>
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-green-500/15 text-green-500 border-l-4 border-green-500 font-semibold'
                        : 'hover:bg-green-500/10 hover:text-green-500'
                    }`}
                    style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="px-4 mb-4">
          <p className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Theme</p>
          <ThemeToggle />
        </div>

        <Link
          href="/"
          className="block w-full px-4 py-3 text-left hover:bg-green-500/10 hover:text-green-500 rounded-lg transition"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Back to Site
        </Link>

        {session && (
          <div className="mt-4 px-4">
            <p className="text-xs truncate mb-2" style={{ color: 'var(--text-secondary)' }}>{session.email}</p>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition text-left"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

