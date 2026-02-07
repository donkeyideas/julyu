'use client'

import { useState } from 'react'

type DateRange = '7d' | '30d' | '90d'

const revenueData: Record<DateRange, { labels: string[]; values: number[]; total: number; orders: number; avg: number; newCustomers: number }> = {
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [485.30, 612.45, 378.90, 529.70, 780.20, 695.50, 285.75],
    total: 3767.80,
    orders: 89,
    avg: 42.33,
    newCustomers: 12,
  },
  '30d': {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [3420.50, 3890.20, 3610.80, 3646.30],
    total: 14567.80,
    orders: 234,
    avg: 62.26,
    newCustomers: 28,
  },
  '90d': {
    labels: ['Month 1', 'Month 2', 'Month 3'],
    values: [12450.60, 14120.30, 14567.80],
    total: 41138.70,
    orders: 687,
    avg: 59.88,
    newCustomers: 76,
  },
}

const topProducts = [
  { name: 'Bodega Special Sandwich', units: 89, revenue: 623.11 },
  { name: 'Chopped Cheese Sandwich', units: 76, revenue: 569.24 },
  { name: 'Bacon Egg & Cheese on Roll', units: 68, revenue: 373.32 },
  { name: 'Arizona Iced Tea - Green Tea', units: 142, revenue: 183.18 },
  { name: 'Modelo Especial 6pk', units: 45, revenue: 539.55 },
  { name: 'Red Bull Energy 8.4oz', units: 53, revenue: 211.47 },
  { name: 'Turkey & Swiss on Hero', units: 34, revenue: 288.66 },
  { name: 'Takis Fuego Hot Chili Pepper', units: 67, revenue: 233.83 },
  { name: 'Café Bustelo Espresso Ground', units: 38, revenue: 208.62 },
  { name: 'Goya Black Beans 15.5oz', units: 94, revenue: 140.06 },
]

const hourlyData = [
  2, 1, 0, 0, 0, 1, 4, 8, 12, 10, 9,
  18, 22, 15, 10, 8, 11, 19, 21, 14,
  9, 6, 4, 3,
]

export default function DemoAnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const data = revenueData[range]
  const maxRevenue = Math.max(...data.values)
  const maxHourly = Math.max(...hourlyData)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {([
            { key: '7d' as DateRange, label: 'Last 7 Days' },
            { key: '30d' as DateRange, label: 'Last 30 Days' },
            { key: '90d' as DateRange, label: 'Last 90 Days' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className="px-4 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: range === opt.key ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
                color: range === opt.key ? '#22c55e' : 'var(--text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Revenue</p>
          <p className="text-2xl font-bold text-green-500">${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Orders</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.orders.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Avg Order Value</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${data.avg.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>New Customers</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.newCustomers}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Revenue</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: '200px' }}>
          {data.values.map((val, i) => {
            const heightPct = maxRevenue > 0 ? (val / maxRevenue) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </span>
                <div className="w-full flex justify-center" style={{ height: '160px' }}>
                  <div
                    className="w-full max-w-12 rounded-t-md transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: '#22c55e',
                      opacity: 0.8,
                      alignSelf: 'flex-end',
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{data.labels[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Products + Customer Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Product</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Units Sold</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider pb-3" style={{ color: 'var(--text-muted)' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2.5 pr-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.units}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-sm font-medium text-green-500">${p.revenue.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Customer Metrics</h2>
          <div className="space-y-5">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Customers</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>342</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Returning Customers</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                156 <span className="text-sm font-normal text-green-500">(45.6%)</span>
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>New This Month</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>28</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Order Value</p>
              <p className="text-xl font-bold text-green-500">$23.45</p>
            </div>
            {/* Mini retention bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-muted)' }}>Retention Rate</span>
                <span className="font-medium text-green-500">45.6%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="h-2 rounded-full" style={{ width: '45.6%', backgroundColor: '#22c55e' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Traffic */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hourly Order Traffic</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Average orders per hour over selected period</p>
        <div className="flex items-end gap-1" style={{ height: '120px' }}>
          {hourlyData.map((val, i) => {
            const heightPct = maxHourly > 0 ? (val / maxHourly) * 100 : 0
            const isPeak = val >= 18
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${Math.max(heightPct, 2)}%`,
                      backgroundColor: isPeak ? '#22c55e' : 'rgba(34, 197, 94, 0.3)',
                      alignSelf: 'flex-end',
                    }}
                  />
                </div>
                {i % 3 === 0 && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`}
                  </span>
                )}
                {i % 3 !== 0 && <span className="text-[10px]">&nbsp;</span>}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
            <span>Peak hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)' }} />
            <span>Regular hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
