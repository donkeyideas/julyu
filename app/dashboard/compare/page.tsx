'use client'

import { useState } from 'react'

export default function ComparePage() {
  const [list, setList] = useState('milk 2%\neggs organic\nbread whole wheat\napples gala\nchicken breast\npasta penne')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const itemCount = list.split('\n').filter(item => item.trim() !== '').length

  const handleCompare = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/lists/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: list.split('\n').filter(item => item.trim()),
        }),
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Comparison error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Compare Prices</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Enter Your Grocery List</h2>
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <textarea
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder="Enter items (one per line)..."
            className="w-full min-h-[200px] bg-transparent text-white resize-y outline-none font-mono"
          />
          <div className="mt-4 text-sm text-gray-500">
            <span id="itemCount">{itemCount}</span> items
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || itemCount === 0}
          className="mt-6 w-full py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
        >
          {loading ? 'Analyzing prices...' : 'Compare Prices Across Stores'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Analyzing prices across 50+ retailers using DeepSeek AI...</div>
        </div>
      )}

      {results && (
        <div>
          <h2 className="text-3xl font-bold mb-6">Comparison Results</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Store</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Distance</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Items Available</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Total</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Savings</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.bestOption && (
                  <tr className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4">
                      <strong className="text-green-500">{results.bestOption.store?.name || 'Best Store'}</strong>
                    </td>
                    <td className="p-4">{results.bestOption.store?.distance || '-'} mi</td>
                    <td className="p-4">{itemCount}/{itemCount}</td>
                    <td className="p-4 font-bold text-green-500">${results.bestOption.total?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-green-500 font-bold">${results.bestOption.savings?.toFixed(2) || '0.00'}</td>
                    <td className="p-4">
                      <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500">
                        Shop Here
                      </button>
                    </td>
                  </tr>
                )}
                {results.alternatives?.map((alt: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4"><strong>{alt.store?.name || 'Store'}</strong></td>
                    <td className="p-4">{alt.store?.distance || '-'} mi</td>
                    <td className="p-4">{itemCount}/{itemCount}</td>
                    <td className="p-4 font-bold">${alt.total?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-gray-500">—</td>
                    <td className="p-4">
                      <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


