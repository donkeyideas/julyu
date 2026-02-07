'use client'

import Link from 'next/link'

const recentOrders = [
  { id: 'ORD-1247', customer: 'Maria Santos', items: 4, total: 23.47, status: 'pending', time: '3 min ago' },
  { id: 'ORD-1246', customer: 'James Wilson', items: 2, total: 11.98, status: 'preparing', time: '12 min ago' },
  { id: 'ORD-1245', customer: 'Keisha Brown', items: 6, total: 34.21, status: 'ready', time: '25 min ago' },
  { id: 'ORD-1244', customer: 'David Chen', items: 3, total: 18.75, status: 'delivered', time: '1 hr ago' },
  { id: 'ORD-1243', customer: 'Ana Rodriguez', items: 5, total: 29.99, status: 'delivered', time: '2 hrs ago' },
]

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  preparing: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  ready: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  delivered: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' },
}

export default function DemoStorePortalDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, Martinez Corner Market
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Martinez Corner Market &mdash; Brooklyn, NY
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Products</span>
            <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>847</p>
          <Link href="/demo/store-portal/inventory" className="text-sm text-green-500 hover:text-green-400 mt-2 inline-block">
            Manage Inventory &rarr;
          </Link>
        </div>

        {/* Pending Orders */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pending Orders</span>
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-amber-500">23</p>
          <Link href="/demo/store-portal/orders" className="text-sm text-amber-500 hover:text-amber-400 mt-2 inline-block">
            View Orders &rarr;
          </Link>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Orders</span>
            <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>1,234</p>
          <Link href="/demo/store-portal/analytics" className="text-sm text-green-500 hover:text-green-400 mt-2 inline-block">
            View Analytics &rarr;
          </Link>
        </div>

        {/* Today's Revenue */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Today&apos;s Revenue</span>
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-500">$2,341.50</p>
          <Link href="/demo/store-portal/analytics" className="text-sm text-green-500 hover:text-green-400 mt-2 inline-block">
            View Payouts &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/demo/store-portal/inventory"
            className="rounded-xl p-6 flex items-center space-x-4 hover:ring-2 hover:ring-green-500/50 transition"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-12 h-12 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add Products</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add new items to inventory</p>
            </div>
          </Link>

          <div
            className="rounded-xl p-6 flex items-center space-x-4 cursor-pointer hover:ring-2 hover:ring-green-500/50 transition"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-12 h-12 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Import Receipt</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Scan a receipt to add items</p>
            </div>
          </div>

          <div
            className="rounded-xl p-6 flex items-center space-x-4 cursor-pointer hover:ring-2 hover:ring-green-500/50 transition"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sync POS</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sync with point-of-sale system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
          <Link href="/demo/store-portal/orders" className="text-sm text-green-500 hover:text-green-400">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Order</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Customer</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Items</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Total</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider pb-3" style={{ color: 'var(--text-muted)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{order.id}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{order.customer}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.items} items</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${order.total.toFixed(2)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: statusColors[order.status].bg,
                        color: statusColors[order.status].text,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{order.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Status */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Store Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Commission Rate</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>12%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Accepting Orders</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              Yes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
