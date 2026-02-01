import { createServiceRoleClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

export const metadata = {
  title: 'Analytics - Store Portal - Julyu',
  description: 'View your store analytics and sales reports',
}

// Force dynamic rendering - required for auth cookies
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  // Get auth - layout handles redirects for unauthenticated users
  const { storeOwner, user, error } = await getStoreOwnerAnyStatus()

  // If no auth, show a refresh message (layout should have redirected, but just in case)
  if (!storeOwner || !user) {
    return (
      <div className="p-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Session loading... If this persists, please refresh the page.</p>
      </div>
    )
  }

  // Use service role client to bypass RLS
  const supabase = createServiceRoleClient()

  // Get store owner's stores
  const { stores } = await getStoreOwnerStores(storeOwner.id)
  const primaryStore = stores[0]

  // Get all orders for this store owner
  const { data: orders } = await supabase
    .from('bodega_orders')
    .select('id, status, total_amount, ordered_at, delivery_method')
    .eq('store_owner_id', storeOwner.id)
    .order('ordered_at', { ascending: false })

  const allOrders = orders || []

  // Get order items for top products analysis
  const { data: orderItems } = await supabase
    .from('bodega_order_items')
    .select(`
      quantity,
      product_name,
      unit_price,
      bodega_order_id
    `)
    .in('bodega_order_id', allOrders.map((o: any) => o.id))

  const allOrderItems = orderItems || []

  // Calculate time-based metrics
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Filter orders by time period
  const todayOrders = allOrders.filter((o: any) => new Date(o.ordered_at) >= today)
  const thisWeekOrders = allOrders.filter((o: any) => new Date(o.ordered_at) >= thisWeekStart)
  const thisMonthOrders = allOrders.filter((o: any) => new Date(o.ordered_at) >= thisMonthStart)
  const lastMonthOrders = allOrders.filter((o: any) => {
    const orderDate = new Date(o.ordered_at)
    return orderDate >= lastMonthStart && orderDate <= lastMonthEnd
  })

  // Calculate revenue metrics
  const calculateRevenue = (orderList: any[]) =>
    orderList.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

  const totalRevenue = calculateRevenue(allOrders)
  const todayRevenue = calculateRevenue(todayOrders)
  const thisWeekRevenue = calculateRevenue(thisWeekOrders)
  const thisMonthRevenue = calculateRevenue(thisMonthOrders)
  const lastMonthRevenue = calculateRevenue(lastMonthOrders)

  // Calculate average order value
  const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0

  // Calculate order status breakdown
  const statusCounts = allOrders.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  // Calculate delivery method breakdown
  const deliveryMethodCounts = allOrders.reduce((acc: Record<string, number>, o: any) => {
    const method = o.delivery_method || 'unknown'
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {})

  // Calculate top products
  const productSales = allOrderItems.reduce((acc: Record<string, { quantity: number, revenue: number }>, item: any) => {
    const name = item.product_name || 'Unknown Product'
    if (!acc[name]) {
      acc[name] = { quantity: 0, revenue: 0 }
    }
    acc[name].quantity += item.quantity || 0
    acc[name].revenue += (item.quantity || 0) * parseFloat(item.unit_price || 0)
    return acc
  }, {})

  const topProducts = Object.entries(productSales as Record<string, { quantity: number, revenue: number }>)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  // Calculate commission
  const commissionRate = storeOwner.commission_rate || 15
  const totalCommission = totalRevenue * (commissionRate / 100)
  const netRevenue = totalRevenue - totalCommission

  // Month over month growth
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
    : 0

  // Recent 7 days for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    return date
  })

  const dailyRevenue = last7Days.map(date => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    const dayOrders = allOrders.filter((o: any) => {
      const orderDate = new Date(o.ordered_at)
      return orderDate >= date && orderDate < nextDay
    })
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: calculateRevenue(dayOrders),
      orders: dayOrders.length
    }
  })

  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          View sales reports and performance metrics for {primaryStore?.name || 'your store'}
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Today</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${todayRevenue.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {todayOrders.length} orders
              </p>
            </div>
            <div className="bg-green-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>This Week</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${thisWeekRevenue.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {thisWeekOrders.length} orders
              </p>
            </div>
            <div className="bg-blue-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>This Month</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${thisMonthRevenue.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: revenueGrowth >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs last month
              </p>
            </div>
            <div className="bg-purple-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All Time</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {allOrders.length} total orders
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

      {/* Revenue Chart */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Last 7 Days</h2>
        <div className="space-y-3">
          {dailyRevenue.map((day, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm" style={{ color: 'var(--text-muted)' }}>{day.date}</div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(day.revenue / maxDailyRevenue) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-24 text-right">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${day.revenue.toFixed(2)}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                  ({day.orders})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Stats */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Average Order Value</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Commission Rate</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{commissionRate}%</span>
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
            {Object.entries(statusCounts as Record<string, number>).length > 0 ? (
              Object.entries(statusCounts as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'delivered' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'cancelled' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{status}</span>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                </div>
              ))
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Selling Products</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map(([name, data], index) => (
                <div key={name} className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-green-500/15 text-green-500 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 ml-3 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.quantity} sold</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${data.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No product sales data yet
            </p>
          )}
        </div>

        {/* Delivery Methods */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Delivery Methods</h2>
          {Object.entries(deliveryMethodCounts as Record<string, number>).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(deliveryMethodCounts as Record<string, number>).map(([method, count]) => {
                const percentage = allOrders.length > 0 ? (count / allOrders.length * 100) : 0
                return (
                  <div key={method}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="capitalize text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {method.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No delivery data yet
            </p>
          )}
        </div>
      </div>

      {/* Commission Info */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>About Your Commission</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your current commission rate is <strong>{commissionRate}%</strong>.
              This rate may vary based on your subscription tier and order volume.
              Payouts are processed weekly to your connected Stripe account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
