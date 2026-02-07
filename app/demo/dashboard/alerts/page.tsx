'use client'

import { useState } from 'react'
import { getChainByName } from '@/lib/demo/data/grocery-chains'

function StoreLogo({ name, size = 32 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const chain = getChainByName(name)
  const domain = chain?.domain
  const color = chain?.color || '#22c55e'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (failed || !domain) {
    return (
      <div className="rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color, width: size, height: size }}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg object-contain flex-shrink-0"
      style={{ backgroundColor: '#fff', width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

// Inline mock data for price alerts
function hoursAgoStr(hours: number): string {
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

interface PriceAlert {
  id: string
  product: string
  targetPrice: number
  currentPrice: number
  store: string
  status: 'triggered' | 'watching'
  timeAgo: string
}

const ALERTS: PriceAlert[] = [
  {
    id: '1',
    product: 'Chicken Breast (1 lb)',
    targetPrice: 3.99,
    currentPrice: 3.49,
    store: 'ALDI',
    status: 'triggered',
    timeAgo: hoursAgoStr(2),
  },
  {
    id: '2',
    product: 'Large Eggs (dozen)',
    targetPrice: 2.99,
    currentPrice: 2.78,
    store: 'Walmart',
    status: 'triggered',
    timeAgo: hoursAgoStr(6),
  },
  {
    id: '3',
    product: 'Whole Milk (1 gal)',
    targetPrice: 3.00,
    currentPrice: 3.29,
    store: 'Kroger',
    status: 'watching',
    timeAgo: hoursAgoStr(48),
  },
  {
    id: '4',
    product: 'Salmon Fillet (1 lb)',
    targetPrice: 7.99,
    currentPrice: 9.49,
    store: 'Publix',
    status: 'watching',
    timeAgo: hoursAgoStr(72),
  },
  {
    id: '5',
    product: 'Avocados (each)',
    targetPrice: 0.79,
    currentPrice: 0.99,
    store: 'Target',
    status: 'watching',
    timeAgo: hoursAgoStr(96),
  },
  {
    id: '6',
    product: 'Greek Yogurt (32 oz)',
    targetPrice: 4.50,
    currentPrice: 5.29,
    store: 'Kroger',
    status: 'watching',
    timeAgo: hoursAgoStr(120),
  },
]

export default function DemoAlertsPage() {
  const triggered = ALERTS.filter(a => a.status === 'triggered')
  const watching = ALERTS.filter(a => a.status === 'watching')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Price Alerts</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Get notified when prices drop to your target
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition hover:opacity-90"
          style={{ backgroundColor: '#22c55e' }}
        >
          + Create Alert
        </button>
      </div>

      {/* Triggered Alerts */}
      {triggered.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#22c55e' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Triggered - Price Dropped!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {triggered.map(alert => (
              <div
                key={alert.id}
                className="rounded-xl p-6"
                style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '2px solid #22c55e' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StoreLogo name={alert.store} size={36} />
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{alert.product}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>at {alert.store}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold uppercase flex-shrink-0"
                    style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}
                  >
                    Triggered
                  </span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Price</div>
                    <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                      ${alert.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Target</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      ${alert.targetPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                    {alert.timeAgo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watching */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Watching ({watching.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watching.map(alert => {
            const pctToTarget = Math.round(((alert.currentPrice - alert.targetPrice) / alert.targetPrice) * 100)
            return (
              <div
                key={alert.id}
                className="rounded-xl p-6"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StoreLogo name={alert.store} size={36} />
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{alert.product}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>at {alert.store}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold uppercase flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}
                  >
                    Watching
                  </span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Price</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      ${alert.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Target</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      ${alert.targetPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{pctToTarget}% above target</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{alert.timeAgo}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
