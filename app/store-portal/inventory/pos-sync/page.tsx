'use client'

import { useState } from 'react'
import Link from 'next/link'

interface POSSystem {
  id: string
  name: string
  description: string
  status: 'available' | 'coming_soon'
  icon: string
}

const posSystems: POSSystem[] = [
  {
    id: 'square',
    name: 'Square',
    description: 'OAuth integration with automatic sync',
    status: 'available',
    icon: '⬜',
  },
  {
    id: 'clover',
    name: 'Clover',
    description: 'OAuth integration with automatic sync',
    status: 'available',
    icon: '🍀',
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Restaurant POS system',
    status: 'coming_soon',
    icon: '🍞',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce POS integration',
    status: 'coming_soon',
    icon: '🛒',
  },
]

export default function POSSyncPage() {
  const [selectedPOS, setSelectedPOS] = useState<string | null>(null)
  const [showSetupModal, setShowSetupModal] = useState(false)

  const handleConnect = (posId: string) => {
    setSelectedPOS(posId)
    setShowSetupModal(true)
  }

  const selectedSystem = posSystems.find(pos => pos.id === selectedPOS)

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

      {/* Status Banner */}
      <div className="rounded-lg p-4 mb-6 bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-500">
            POS integration requires API credentials. Contact us at{' '}
            <a href="mailto:info@donkeyideas.com" className="underline">info@donkeyideas.com</a>
            {' '}to set up your connection.
          </p>
        </div>
      </div>

      {/* POS Systems Grid */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Select Your POS System
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {posSystems.map((pos) => (
            <button
              key={pos.id}
              onClick={() => pos.status === 'available' ? handleConnect(pos.id) : null}
              disabled={pos.status === 'coming_soon'}
              className={`rounded-lg p-4 text-left transition-all ${
                pos.status === 'available'
                  ? 'hover:border-green-500 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{pos.icon}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {pos.name}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {pos.description}
                  </p>
                </div>
                {pos.status === 'available' ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-500">
                    Connect
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/15" style={{ color: 'var(--text-muted)' }}>
                    Soon
                  </span>
                )}
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
              <li>• Automatic inventory updates in real-time</li>
              <li>• No manual data entry required</li>
              <li>• Sync product names, prices, and stock levels</li>
              <li>• Reduce errors and save time</li>
              <li>• Always keep your online store in sync with your physical store</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetupModal && selectedSystem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Connect {selectedSystem.name}
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1 hover:bg-gray-500/20 rounded"
              >
                <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center py-4">
              <span className="text-4xl">{selectedSystem.icon}</span>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              To connect your {selectedSystem.name} account, we need to set up OAuth integration.
              This requires API credentials that our team will help configure for you.
            </p>

            <div className="rounded-lg p-3 mb-4 bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-500">
                <strong>Setup Required:</strong> Contact our team to enable {selectedSystem.name} integration for your store.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={`mailto:info@donkeyideas.com?subject=POS Integration Request - ${selectedSystem.name}&body=Hi,%0A%0AI would like to connect my ${selectedSystem.name} POS system to Julyu.%0A%0AStore Name: [Your Store Name]%0ABusiness Name: [Your Business Name]%0A%0AThank you!`}
                className="block w-full text-center px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
              >
                Request {selectedSystem.name} Setup
              </a>
              <button
                onClick={() => setShowSetupModal(false)}
                className="block w-full text-center px-4 py-2 font-medium rounded-md"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
