'use client'

import { useState } from 'react'

export default function InstacartAPIPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement save to database
    setTimeout(() => {
      setSaving(false)
      setTestResult({ success: true, message: 'API credentials saved (placeholder)' })
    }, 1000)
  }

  const handleTestConnection = async () => {
    setTestResult(null)
    // TODO: Implement actual API test
    setTimeout(() => {
      setTestResult({
        success: false,
        message: 'Instacart API integration pending. Apply for API access at developers.instacart.com',
      })
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instacart API Integration</h1>
        <p className="text-gray-400">
          Connect to Instacart for real-time pricing across 50+ retailers
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🚧</div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Integration Pending</h3>
            <p className="text-gray-300 mb-4">
              Instacart API access requires a partnership agreement. Once approved, you can configure
              your credentials here to enable real-time price comparison across all Instacart-connected retailers.
            </p>
            <a
              href="https://www.instacart.com/company/partnerships"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
            >
              Apply for Instacart Partnership
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">API Credentials</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Instacart Client ID"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your Instacart Client Secret"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              testResult.success
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {testResult.message}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || !clientId || !clientSecret}
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Credentials'}
          </button>
          <button
            onClick={handleTestConnection}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">What You Get with Instacart API</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl mb-2">🏪</div>
            <h4 className="font-semibold text-white mb-1">50+ Retailers</h4>
            <p className="text-sm text-gray-400">
              Access pricing from Kroger, Costco, Safeway, Publix, and many more
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-white mb-1">Real-Time Prices</h4>
            <p className="text-sm text-gray-400">
              Get up-to-the-minute pricing and availability data
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl mb-2">📍</div>
            <h4 className="font-semibold text-white mb-1">Location-Based</h4>
            <p className="text-sm text-gray-400">
              Prices specific to user location and nearby stores
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl mb-2">🔗</div>
            <h4 className="font-semibold text-white mb-1">Direct Ordering</h4>
            <p className="text-sm text-gray-400">
              Enable users to order directly through Instacart
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Data Sources */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Current Data Sources</h3>
        <p className="text-gray-400 mb-4">
          While waiting for Instacart API access, Julyu uses these data sources:
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">Kroger API</span>
            </div>
            <span className="text-green-400 text-sm">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">Spoonacular API</span>
            </div>
            <span className="text-green-400 text-sm">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">Receipt OCR (User Submitted)</span>
            </div>
            <span className="text-green-400 text-sm">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-white">Instacart API</span>
            </div>
            <span className="text-yellow-400 text-sm">Pending</span>
          </div>
        </div>
      </div>
    </div>
  )
}
