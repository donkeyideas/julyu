'use client'

import { useState } from 'react'

// Inline mock data - fully self-contained demo
const STATS = [
  { label: 'Total Savings This Month', value: '$847.32', icon: '💰' },
  { label: 'Comparisons Run', value: '156', icon: '📊' },
  { label: 'Receipts Scanned', value: '89', icon: '🧾' },
  { label: 'Avg Savings Per Trip', value: '$5.43', icon: '🛒' },
]

const QUICK_ACTIONS = [
  { label: 'New Comparison', description: 'Compare prices across stores', href: '/demo/dashboard/compare', icon: '🔍' },
  { label: 'Export Data', description: 'Download your savings report', href: '#', icon: '📥' },
  { label: 'Settings', description: 'Manage your preferences', href: '/demo/dashboard/settings', icon: '⚙️' },
]

function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COMPARISONS = [
  { id: 1, date: daysAgoStr(0), items: 12, bestStore: 'ALDI', total: '$47.23', savings: '$8.47' },
  { id: 2, date: daysAgoStr(1), items: 8, bestStore: 'Walmart', total: '$34.56', savings: '$5.23' },
  { id: 3, date: daysAgoStr(3), items: 15, bestStore: 'Kroger', total: '$62.89', savings: '$12.80' },
  { id: 4, date: daysAgoStr(5), items: 6, bestStore: 'Target', total: '$21.34', savings: '$3.15' },
  { id: 5, date: daysAgoStr(7), items: 20, bestStore: 'ALDI', total: '$78.45', savings: '$15.62' },
]

const STORES = ['All Stores', 'ALDI', 'Walmart', 'Kroger', 'Target', 'Publix']

export default function DemoDashboardPage() {
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('All Stores')

  const filtered = COMPARISONS.filter(c => {
    const matchSearch = search === '' || c.bestStore.toLowerCase().includes(search.toLowerCase())
    const matchStore = storeFilter === 'All Stores' || c.bestStore === storeFilter
    return matchSearch && matchStore
  })

  const now = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>My Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last updated: {now}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {QUICK_ACTIONS.map(action => (
          <a
            key={action.label}
            href={action.href}
            className="rounded-xl p-6 transition hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{action.label}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{action.description}</div>
          </a>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(stat => (
          <div
            key={stat.label}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Comparisons */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent Comparisons</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <select
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {STORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['DATE', 'ITEMS', 'BEST STORE', 'TOTAL', 'SAVINGS', 'ACTIONS'].map(h => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-wider pb-3 px-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="py-4 px-2 text-sm" style={{ color: 'var(--text-primary)' }}>{row.date}</td>
                  <td className="py-4 px-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.items} items</td>
                  <td className="py-4 px-2 text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{row.bestStore}</td>
                  <td className="py-4 px-2 text-sm" style={{ color: 'var(--text-primary)' }}>{row.total}</td>
                  <td className="py-4 px-2 text-sm font-semibold" style={{ color: '#22c55e' }}>{row.savings}</td>
                  <td className="py-4 px-2">
                    <button
                      className="text-xs px-3 py-1 rounded-lg transition hover:opacity-80"
                      style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--accent-primary)' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No comparisons found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Showing {filtered.length} of {COMPARISONS.length} comparisons</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  )
}
