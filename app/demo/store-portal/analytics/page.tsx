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
  { name: 'Cafe Bustelo Espresso Ground', units: 38, revenue: 208.62 },
  { name: 'Goya Black Beans 15.5oz', units: 94, revenue: 140.06 },
]

const hourlyData = [
  2, 1, 0, 0, 0, 1, 4, 8, 12, 10, 9,
  18, 22, 15, 10, 8, 11, 19, 21, 14,
  9, 6, 4, 3,
]

const statusBreakdown: { status: string; count: number; color: string }[] = [
  { status: 'delivered', count: 187, color: 'bg-green-500' },
  { status: 'pending', count: 5, color: 'bg-yellow-500' },
  { status: 'preparing', count: 4, color: 'bg-blue-500' },
  { status: 'ready', count: 3, color: 'bg-purple-500' },
  { status: 'accepted', count: 3, color: 'bg-cyan-500' },
  { status: 'cancelled', count: 32, color: 'bg-red-500' },
]

const deliveryMethods = [
  { method: 'Pickup', count: 145, percentage: 62 },
  { method: 'Delivery', count: 89, percentage: 38 },
]

const COMMISSION_RATE = 12

export default function DemoAnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const data = revenueData[range]
  const maxDailyRevenue = Math.max(...data.values, 1)
  const maxHourly = Math.max(...hourlyData)

  // Revenue stat cards data driven by selected range
  const todayRevenue = 485.30
  const todayOrders = 12
  const thisWeekData = revenueData['7d']
  const thisMonthData = revenueData['30d']
  const allTimeData = revenueData['90d']

  // Commission calculations based on selected range
  const totalCommission = data.total * (COMMISSION_RATE / 100)
  const netRevenue = data.total - totalCommission

  return (
    <div className="space-y-6">
      {/* 1. Header with date range selector */}
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

      {/* 2. Revenue Stats - 4 cards with icons (live version style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Today</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${todayRevenue.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {todayOrders} orders
              </p>
            </div>
            <div className="bg-green-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>This Week</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${thisWeekData.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {thisWeekData.orders} orders
              </p>
            </div>
            <div className="bg-blue-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>This Month</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${thisMonthData.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgb(34, 197, 94)' }}>
                +12.4% vs last month
              </p>
            </div>
            <div className="bg-purple-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* All Time */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All Time</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${allTimeData.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {allTimeData.orders} total orders
              </p>
            </div>
            <div className="bg-yellow-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Revenue Chart - Horizontal bar chart (live version style) with demo data */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Revenue &mdash; {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
        </h2>
        <div className="space-y-3">
          {data.values.map((val, index) => {
            const ordersPerBar = Math.round(data.orders / data.values.length)
            return (
              <div key={index} className="flex items-center">
                <div className="w-24 text-sm" style={{ color: 'var(--text-muted)' }}>{data.labels[index]}</div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(val / maxDailyRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    ({ordersPerBar})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Order Statistics + Order Status - 2-column grid (live version style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Statistics */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Average Order Value</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${data.avg.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Commission Rate</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{COMMISSION_RATE}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Total Commission</span>
              <span className="font-semibold text-red-500">${totalCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Net Revenue</span>
              <span className="font-bold text-green-500">${netRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Status</h2>
          <div className="space-y-3">
            {statusBreakdown.map(({ status, count, color }) => (
              <div key={status} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${color}`} />
                  <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{status}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Top Selling Products + Delivery Methods - 2-column grid (live version style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts.map((p, index) => (
              <div key={index} className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-green-500/15 text-green-500 text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 ml-3 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.units} sold</p>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ${p.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Delivery Methods</h2>
          <div className="space-y-3">
            {deliveryMethods.map(({ method, count, percentage }) => (
              <div key={method}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{method}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Customer Metrics (from demo version) */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Customer Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.newCustomers}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Order Value</p>
            <p className="text-xl font-bold text-green-500">${data.avg.toFixed(2)}</p>
          </div>
        </div>
        {/* Retention bar */}
        <div className="pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--text-muted)' }}>Retention Rate</span>
            <span className="font-medium text-green-500">45.6%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="h-2 rounded-full" style={{ width: '45.6%', backgroundColor: '#22c55e' }} />
          </div>
        </div>
      </div>

      {/* 7. Hourly Order Traffic (from demo version) */}
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

      {/* 8. Commission Info (from live version) */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>About Your Commission</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your current commission rate is <strong>{COMMISSION_RATE}%</strong>.
              This rate may vary based on your subscription tier and order volume.
              Payouts are processed weekly to your connected Stripe account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
