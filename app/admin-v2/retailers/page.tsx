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
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading retailers...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Retailer Partnerships</h1>
        <p className="text-gray-500 mt-2">Manage retailer partnerships and revenue sharing</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Retailer</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Partnership Tier</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Revenue Share</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Revenue (QTD)</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {retailers.length > 0 ? (
              retailers.map((retailer) => (
                <tr key={retailer.id} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4 font-bold">{retailer.retailer_name || 'Unknown'}</td>
                  <td className="p-4">
                    {retailer.revenue_share_percent >= 10 ? 'Premium' : 
                     retailer.revenue_share_percent >= 5 ? 'Standard' : 'Basic'}
                  </td>
                  <td className="p-4 font-bold">{retailer.revenue_share_percent || 0}%</td>
                  <td className="p-4 font-bold">$0.00</td>
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
                <td colSpan={5} className="p-8 text-center text-gray-500">
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


