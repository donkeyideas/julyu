'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface POSSystem {
  id: string
  name: string
  description: string
}

const posSystems: POSSystem[] = [
  {
    id: 'square',
    name: 'Square',
    description: 'Sync inventory from Square POS',
  },
  {
    id: 'clover',
    name: 'Clover',
    description: 'Sync inventory from Clover POS',
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Sync inventory from Toast POS',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync inventory from Shopify',
  },
]

export default function POSSyncPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (posId: string) => {
    setConnecting(posId)
    setError(null)

    try {
      // Redirect to OAuth initiation route
      router.push(`/api/pos/${posId}/connect`)
    } catch (err) {
      setError('Failed to initiate connection')
      setConnecting(null)
    }
  }

  // SVG icons for each POS system
  const POSIcon = ({ id }: { id: string }) => {
    switch (id) {
      case 'square':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        )
      case 'clover':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-primary)' }}>
            <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="2"/>
            <circle cx="15" cy="9" r="4" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="15" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'toast':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-primary)' }}>
            <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'shopify':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-primary)' }}>
            <path d="M15.5 4L18 6.5V20H6V4H15.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M15 4V7H18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M9 12H15M9 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/store-portal/inventory"
          className="text-sm text-green-500 hover:text-green-400 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>POS Integration</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Connect your Point of Sale system to automatically sync inventory
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-4 mb-6 bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* POS Systems Grid */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Select Your POS System
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {posSystems.map((pos) => (
            <button
              key={pos.id}
              onClick={() => handleConnect(pos.id)}
              disabled={connecting === pos.id}
              className="rounded-lg p-4 text-left transition-all hover:border-green-500"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3">
                    <POSIcon id={pos.id} />
                  </div>
                  <div>
                    <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      {pos.name}
                    </span>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {pos.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-500">
                  {connecting === pos.id ? 'Connecting...' : 'Connect'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-center space-x-3">
        <Link
          href="/store-portal/inventory/add"
          className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
        >
          Add Products Manually
        </Link>
        <Link
          href="/store-portal/inventory"
          className="px-4 py-2 font-medium rounded-md"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          View Inventory
        </Link>
      </div>

      {/* Benefits */}
      <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Benefits of POS Integration</h3>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>Automatic inventory updates in real-time</li>
              <li>No manual data entry required</li>
              <li>Sync product names, prices, and stock levels</li>
              <li>Reduce errors and save time</li>
              <li>Always keep your online store in sync with your physical store</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
