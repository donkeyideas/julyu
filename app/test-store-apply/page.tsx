'use client'

import { useState } from 'react'

export default function TestStoreApply() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testData = {
    businessName: "Joe's Test Bodega " + Date.now(), // Unique name
    businessType: "bodega",
    businessAddress: "456 Broadway, New York, NY 10013",
    businessPhone: "(212) 555-1234",
    businessEmail: `test.bodega.${Date.now()}@example.com`, // Unique email
    taxId: "12-3456789",
    businessLicense: "BL-12345",
    storeName: "Joe's Bodega NYC",
    storeAddress: "456 Broadway",
    storeCity: "New York",
    storeState: "NY",
    storeZip: "10013",
    storePhone: "(212) 555-1234",
    hasPosSystem: false,
    posSystemName: ""
  }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Sending request with data:', testData)

      const response = await fetch('/api/store-portal/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })

    } catch (error: any) {
      console.error('Error:', error)
      setResult({
        status: 'error',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8">🧪 Store Signup Test Page</h1>

        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-black mb-4">Test Data</h2>
          <pre className="bg-black p-4 rounded text-xs overflow-auto">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="px-8 py-4 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? 'Testing...' : 'Run Test Signup'}
        </button>

        {result && (
          <div className="mt-8 bg-gray-900 rounded-xl p-6">
            <h2 className="text-xl font-black mb-4">
              {result.ok ? '✅ Success' : '❌ Error'}
            </h2>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">HTTP Status:</div>
                <div className={`text-lg font-mono ${result.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {result.status}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Response:</div>
                <pre className="bg-black p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {result.ok && result.data?.data?.storeOwnerId && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                  <div className="text-green-500 font-black mb-2">✅ Store Created Successfully!</div>
                  <div className="text-sm space-y-1">
                    <div>Store Owner ID: <span className="font-mono">{result.data.data.storeOwnerId}</span></div>
                    <div>Store ID: <span className="font-mono">{result.data.data.storeId}</span></div>
                    <div>Status: <span className="font-mono">{result.data.data.status}</span></div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="font-semibold">Next Steps:</div>
                    <div>1. Go to <a href="/admin/stores/applications" className="text-green-400 underline">/admin/stores/applications</a></div>
                    <div>2. Find the store and click Approve</div>
                    <div>3. Check <a href="/admin/stores" className="text-green-400 underline">/admin/stores</a> to see it listed</div>
                  </div>
                </div>
              )}

              {!result.ok && result.data?.details && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <div className="text-red-500 font-black mb-2">Error Details:</div>
                  <div className="text-sm space-y-1">
                    <div>Message: {result.data.details}</div>
                    {result.data.code && <div>Code: {result.data.code}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-300">
            <div className="font-black mb-2">📝 Instructions:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>This page sends a test store application to the API</li>
              <li>Each test uses a unique email (timestamp-based)</li>
              <li>Check the browser console (F12) for detailed logs</li>
              <li>Check your terminal where `npm run dev` is running for server logs</li>
              <li>If successful, the store will appear in Admin → Store Applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
