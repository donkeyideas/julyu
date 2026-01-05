'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
  section: string
}

export default function AdminSidebar() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: '/admin-v2', label: 'Dashboard', icon: '', section: 'Overview' },
    { href: '/admin-v2/ai-models', label: 'AI Models', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/ai-performance', label: 'AI Performance', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/usage', label: 'Usage & Costs', icon: '', section: 'AI/LLM Systems' },
    { href: '/admin-v2/partnerships-costs', label: 'Partnerships AI Costs', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/retailers', label: 'Retailer Partnerships', icon: '', section: 'Partnerships' },
    { href: '/admin-v2/users', label: 'Users', icon: '', section: 'Operations' },
    { href: '/admin-v2/prices', label: 'Price Database', icon: '', section: 'Operations' },
  ]

  const sections = [
    { name: 'Overview', items: navItems.filter(item => item.section === 'Overview') },
    { name: 'AI/LLM Systems', items: navItems.filter(item => item.section === 'AI/LLM Systems') },
    { name: 'Partnerships', items: navItems.filter(item => item.section === 'Partnerships') },
    { name: 'Operations', items: navItems.filter(item => item.section === 'Operations') },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-gray-900 border-r border-gray-800 p-8 overflow-y-auto">
      <Link href="/admin-v2" className="text-3xl font-black text-green-500 mb-12 block">
        Julyu Admin v2
      </Link>

      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.name}>
            <div className="text-xs text-gray-500 uppercase font-semibold mb-3 px-4">
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
                        : 'text-gray-400 hover:bg-green-500/10 hover:text-white'
                    }`}
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

      <Link
        href="/dashboard"
        className="mt-8 block w-full px-4 py-3 text-left text-gray-400 hover:bg-green-500/10 hover:text-green-500 rounded-lg transition"
      >
        ← Back to Dashboard
      </Link>
    </aside>
  )
}

