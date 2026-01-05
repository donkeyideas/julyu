'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '' },
    { href: '/admin/ai-models', label: 'AI Models', icon: '' },
    { href: '/admin/ai-models-3', label: 'AI Models v3', icon: '' },
    { href: '/admin/ai-performance', label: 'AI Performance', icon: '' },
    { href: '/admin/ai-costs', label: 'AI Costs', icon: '' },
    { href: '/admin/retailers', label: 'Retailers', icon: '' },
    { href: '/admin/users', label: 'Users', icon: '' },
    { href: '/admin/prices', label: 'Price Database', icon: '' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-gray-900 border-r border-gray-800 p-8 overflow-y-auto">
      <Link href="/admin" className="text-3xl font-black text-green-500 mb-12 block">
        Julyu Admin
      </Link>

      <div className="mb-8 pb-8 border-b border-gray-800">
        <div className="text-xs text-gray-500 uppercase font-semibold mb-4">Overview</div>
      </div>

      <div className="mb-8 pb-8 border-b border-gray-800">
        <div className="text-xs text-gray-500 uppercase font-semibold mb-4">AI/LLM Systems</div>
        <nav className="space-y-2">
          {navItems.slice(1, 5).map((item) => {
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
      </div>

      <div className="mb-8 pb-8 border-b border-gray-800">
        <div className="text-xs text-gray-500 uppercase font-semibold mb-4">Partnerships</div>
        <nav className="space-y-2">
          {navItems.slice(4, 5).map((item) => {
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
      </div>

      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold mb-4">Operations</div>
        <nav className="space-y-2">
          {navItems.slice(5).map((item) => {
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
      </div>

      <Link
        href="/dashboard"
        className="mt-8 block w-full px-4 py-3 text-left text-gray-400 hover:bg-green-500/10 hover:text-green-500 rounded-lg transition"
      >
        ← Back to Dashboard
      </Link>
    </aside>
  )
}

