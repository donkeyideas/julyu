'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Retailer {
  id: string
  retailer_name: string
  revenue_share_percent: number
  is_active: boolean
  created_at: string
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRetailers()
  }, [])

  const loadRetailers = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('partner_retailers')
        .select('*')
        .order('created_at', { ascending: false })
      
      setRetailers((data || []) as Retailer[])
    } catch (error) {
      console.error('Error loading retailers:', error)
      setRetailers([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading retailers...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Retailer Partnerships</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage retailer partnerships and revenue sharing</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Retailer</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Partnership Tier</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Revenue Share</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Revenue (QTD)</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {retailers.length > 0 ? (
              retailers.map((retailer) => (
                <tr key={retailer.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>{retailer.retailer_name || 'Unknown'}</td>
                  <td className="p-4" style={{ color: 'var(--text-primary)' }}>
                    {retailer.revenue_share_percent >= 10 ? 'Premium' :
                     retailer.revenue_share_percent >= 5 ? 'Standard' : 'Basic'}
                  </td>
                  <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>{retailer.revenue_share_percent || 0}%</td>
                  <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>$0.00</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      retailer.is_active
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      {retailer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  No retailer partnerships yet. Set up partnerships to start earning affiliate revenue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


