'use client'

import { useState } from 'react'

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type OrderType = 'pickup' | 'delivery'

interface OrderItem {
  name: string
  qty: number
  price: number
}

interface Order {
  id: string
  customer: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  type: OrderType
  time: string
  address?: string
  notes?: string
}

const initialOrders: Order[] = [
  // Pending orders (5)
  { id: 'ORD-1271', customer: 'Maria Santos', items: [{ name: 'Bodega Special Sandwich', qty: 2, price: 6.99 }, { name: 'Arizona Iced Tea', qty: 2, price: 1.29 }], total: 16.56, status: 'pending', type: 'pickup', time: '2 min ago' },
  { id: 'ORD-1270', customer: 'Terrence Johnson', items: [{ name: 'Chopped Cheese Sandwich', qty: 1, price: 7.49 }, { name: 'Tropical Fantasy Soda', qty: 1, price: 1.00 }, { name: 'Takis Fuego', qty: 1, price: 3.49 }], total: 11.98, status: 'pending', type: 'delivery', time: '5 min ago', address: '423 Nostrand Ave, Apt 3B', notes: 'Extra napkins please' },
  { id: 'ORD-1269', customer: 'Lisa Park', items: [{ name: 'Bacon Egg & Cheese on Roll', qty: 3, price: 5.49 }, { name: 'Café Bustelo Espresso', qty: 1, price: 5.49 }], total: 21.96, status: 'pending', type: 'pickup', time: '8 min ago' },
  { id: 'ORD-1268', customer: 'Omar Hassan', items: [{ name: 'Turkey & Swiss on Hero', qty: 1, price: 8.49 }, { name: 'Red Bull Energy', qty: 2, price: 3.99 }], total: 16.47, status: 'pending', type: 'delivery', time: '12 min ago', address: '78 Fulton St, Unit 5' },
  { id: 'ORD-1267', customer: 'Priya Sharma', items: [{ name: 'Goya Black Beans', qty: 4, price: 1.49 }, { name: 'Goya Adobo Seasoning', qty: 2, price: 2.99 }, { name: 'Yellow Onions 3lb', qty: 1, price: 2.99 }], total: 14.93, status: 'pending', type: 'pickup', time: '15 min ago', notes: 'Will pick up in 30 minutes' },

  // Accepted orders (3)
  { id: 'ORD-1266', customer: 'James Wilson', items: [{ name: 'Bodega Special Sandwich', qty: 1, price: 6.99 }, { name: 'Doritos Nacho Cheese', qty: 1, price: 2.49 }], total: 9.48, status: 'accepted', type: 'pickup', time: '20 min ago' },
  { id: 'ORD-1265', customer: 'Keisha Brown', items: [{ name: 'Chopped Cheese Sandwich', qty: 2, price: 7.49 }, { name: 'Jarritos Mandarin Soda', qty: 2, price: 1.79 }, { name: 'Takis Fuego', qty: 1, price: 3.49 }], total: 22.05, status: 'accepted', type: 'delivery', time: '25 min ago', address: '195 Dekalb Ave, Apt 7C' },
  { id: 'ORD-1264', customer: 'Roberto Diaz', items: [{ name: 'Modelo Especial 6pk', qty: 2, price: 11.99 }, { name: 'Limes', qty: 6, price: 0.50 }], total: 26.98, status: 'accepted', type: 'pickup', time: '28 min ago' },

  // Preparing orders (4)
  { id: 'ORD-1263', customer: 'Angela Thompson', items: [{ name: 'Bacon Egg & Cheese on Roll', qty: 4, price: 5.49 }, { name: 'Café Bustelo Espresso', qty: 2, price: 5.49 }], total: 32.94, status: 'preparing', type: 'delivery', time: '35 min ago', address: '342 Atlantic Ave, 2nd Fl', notes: 'Office order - leave with front desk' },
  { id: 'ORD-1262', customer: 'David Chen', items: [{ name: 'Turkey & Swiss on Hero', qty: 1, price: 8.49 }, { name: 'Lay\'s Classic Chips', qty: 1, price: 2.49 }], total: 10.98, status: 'preparing', type: 'pickup', time: '38 min ago' },
  { id: 'ORD-1261', customer: 'Fatima Nasser', items: [{ name: 'Goya Sofrito', qty: 3, price: 2.49 }, { name: 'Goya Black Beans', qty: 6, price: 1.49 }, { name: 'Avocados', qty: 4, price: 1.99 }], total: 24.37, status: 'preparing', type: 'pickup', time: '40 min ago' },
  { id: 'ORD-1260', customer: 'Marcus Green', items: [{ name: 'Chopped Cheese Sandwich', qty: 1, price: 7.49 }, { name: 'Red Bull Energy', qty: 1, price: 3.99 }], total: 11.48, status: 'preparing', type: 'delivery', time: '42 min ago', address: '567 Bedford Ave' },

  // Ready orders (3)
  { id: 'ORD-1259', customer: 'Sarah Kim', items: [{ name: 'Bodega Special Sandwich', qty: 2, price: 6.99 }, { name: 'Arizona Iced Tea', qty: 2, price: 1.29 }], total: 16.56, status: 'ready', type: 'pickup', time: '50 min ago' },
  { id: 'ORD-1258', customer: 'Miguel Torres', items: [{ name: 'El Monterey Burritos 8pk', qty: 1, price: 5.99 }, { name: 'Jarritos Mandarin Soda', qty: 3, price: 1.79 }], total: 11.36, status: 'ready', type: 'delivery', time: '55 min ago', address: '89 Myrtle Ave, Apt 12' },
  { id: 'ORD-1257', customer: 'Nina Patel', items: [{ name: 'Hot Pockets Pepperoni Pizza', qty: 2, price: 3.29 }, { name: 'Nesquik Chocolate Milk', qty: 1, price: 2.99 }], total: 9.57, status: 'ready', type: 'pickup', time: '58 min ago' },

  // Delivered orders (17)
  { id: 'ORD-1256', customer: 'Andre Williams', items: [{ name: 'Bacon Egg & Cheese on Roll', qty: 2, price: 5.49 }, { name: 'Tropical Fantasy Soda', qty: 2, price: 1.00 }], total: 12.98, status: 'delivered', type: 'pickup', time: '1 hr ago' },
  { id: 'ORD-1255', customer: 'Jessica Liu', items: [{ name: 'Organic Bananas', qty: 2, price: 1.49 }, { name: 'Dutch Farms Whole Milk', qty: 1, price: 4.99 }, { name: 'Philadelphia Cream Cheese', qty: 1, price: 3.99 }], total: 11.96, status: 'delivered', type: 'delivery', time: '1.5 hrs ago', address: '205 Park Ave, Apt 4A' },
  { id: 'ORD-1254', customer: 'Carlos Mendez', items: [{ name: 'Modelo Especial 6pk', qty: 1, price: 11.99 }, { name: 'Doritos Nacho Cheese', qty: 2, price: 2.49 }], total: 16.97, status: 'delivered', type: 'pickup', time: '2 hrs ago' },
  { id: 'ORD-1253', customer: 'Aisha Mohammed', items: [{ name: 'Goya Black Beans', qty: 8, price: 1.49 }, { name: 'Goya Adobo Seasoning', qty: 3, price: 2.99 }], total: 20.89, status: 'delivered', type: 'pickup', time: '2.5 hrs ago' },
  { id: 'ORD-1252', customer: 'Brian O\'Malley', items: [{ name: 'Bodega Special Sandwich', qty: 1, price: 6.99 }, { name: 'Lay\'s Classic Chips', qty: 1, price: 2.49 }, { name: 'Arizona Iced Tea', qty: 1, price: 1.29 }], total: 10.77, status: 'delivered', type: 'pickup', time: '3 hrs ago' },
  { id: 'ORD-1251', customer: 'Tanisha Davis', items: [{ name: 'Tide Pods 16ct', qty: 1, price: 9.99 }, { name: 'Clorox Wipes 35ct', qty: 2, price: 4.49 }, { name: 'Bounty Paper Towels 2pk', qty: 1, price: 6.99 }], total: 25.96, status: 'delivered', type: 'delivery', time: '3.5 hrs ago', address: '412 Fulton St, Unit 9' },
  { id: 'ORD-1250', customer: 'Wei Zhang', items: [{ name: 'Red Bull Energy', qty: 4, price: 3.99 }], total: 15.96, status: 'delivered', type: 'pickup', time: '4 hrs ago' },
  { id: 'ORD-1249', customer: 'Elena Petrov', items: [{ name: 'Turkey & Swiss on Hero', qty: 2, price: 8.49 }, { name: 'Café Bustelo Espresso', qty: 1, price: 5.49 }], total: 22.47, status: 'delivered', type: 'delivery', time: '5 hrs ago', address: '738 Dean St' },
  { id: 'ORD-1248', customer: 'Jamal Richardson', items: [{ name: 'Chopped Cheese Sandwich', qty: 1, price: 7.49 }, { name: 'Takis Fuego', qty: 2, price: 3.49 }], total: 14.47, status: 'delivered', type: 'pickup', time: '6 hrs ago' },
  { id: 'ORD-1247', customer: 'Sophia Reyes', items: [{ name: 'Eggo Waffles 10ct', qty: 2, price: 4.49 }, { name: 'Nesquik Chocolate Milk', qty: 2, price: 2.99 }], total: 14.96, status: 'delivered', type: 'pickup', time: '1 day ago' },
  { id: 'ORD-1246', customer: 'Kwame Asante', items: [{ name: 'Goya Sofrito', qty: 2, price: 2.49 }, { name: 'Avocados', qty: 3, price: 1.99 }, { name: 'Yellow Onions 3lb', qty: 1, price: 2.99 }], total: 13.94, status: 'delivered', type: 'delivery', time: '1 day ago', address: '55 Flatbush Ave, 3rd Fl' },
  { id: 'ORD-1245', customer: 'Linda Nguyen', items: [{ name: 'Bounty Paper Towels 2pk', qty: 2, price: 6.99 }, { name: 'Clorox Wipes 35ct', qty: 1, price: 4.49 }], total: 18.47, status: 'delivered', type: 'pickup', time: '2 days ago' },
  { id: 'ORD-1244', customer: 'Darnell Jackson', items: [{ name: 'El Monterey Burritos 8pk', qty: 2, price: 5.99 }, { name: 'Hot Pockets Pepperoni Pizza', qty: 1, price: 3.29 }], total: 15.27, status: 'delivered', type: 'pickup', time: '2 days ago' },
  { id: 'ORD-1243', customer: 'Rachel Goldstein', items: [{ name: 'Organic Bananas', qty: 3, price: 1.49 }, { name: 'Avocados', qty: 4, price: 1.99 }, { name: 'Limes', qty: 8, price: 0.50 }], total: 16.43, status: 'delivered', type: 'delivery', time: '3 days ago', address: '1001 Bergen St, Apt 2' },
  { id: 'ORD-1242', customer: 'Tyrese Campbell', items: [{ name: 'Modelo Especial 6pk', qty: 3, price: 11.99 }, { name: 'Doritos Nacho Cheese', qty: 1, price: 2.49 }], total: 38.46, status: 'delivered', type: 'pickup', time: '4 days ago' },
  { id: 'ORD-1241', customer: 'Hannah Lee', items: [{ name: 'Bodega Special Sandwich', qty: 1, price: 6.99 }, { name: 'Arizona Iced Tea', qty: 1, price: 1.29 }], total: 8.28, status: 'delivered', type: 'pickup', time: '5 days ago' },
  { id: 'ORD-1240', customer: 'Ivan Petrov', items: [{ name: 'Café Bustelo Espresso', qty: 2, price: 5.49 }, { name: 'Dutch Farms Whole Milk', qty: 1, price: 4.99 }], total: 15.97, status: 'delivered', type: 'delivery', time: '6 days ago', address: '870 Lafayette Ave' },

  // Cancelled orders (3)
  { id: 'ORD-1239', customer: 'Destiny Brown', items: [{ name: 'Hostess Honey Bun', qty: 3, price: 1.79 }, { name: 'Tropical Fantasy Soda', qty: 3, price: 1.00 }], total: 8.37, status: 'cancelled', type: 'pickup', time: '1 day ago' },
  { id: 'ORD-1238', customer: 'Patrick Murphy', items: [{ name: 'Turkey & Swiss on Hero', qty: 2, price: 8.49 }], total: 16.98, status: 'cancelled', type: 'delivery', time: '2 days ago', address: '315 Court St' },
  { id: 'ORD-1237', customer: 'Yuki Tanaka', items: [{ name: 'Red Bull Energy', qty: 6, price: 3.99 }, { name: 'Takis Fuego', qty: 2, price: 3.49 }], total: 30.92, status: 'cancelled', type: 'pickup', time: '4 days ago' },
]

const statusConfig: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Pending' },
  accepted: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Accepted' },
  preparing: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Preparing' },
  ready: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Ready' },
  delivered: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', label: 'Delivered' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Cancelled' },
}

const typeConfig: Record<OrderType, { bg: string; text: string }> = {
  pickup: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  delivery: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
}

const statusTabs: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function DemoOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')

  const filteredOrders = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab)

  const counts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  function updateStatus(orderId: string, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  function renderActions(order: Order) {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => updateStatus(order.id, 'accepted')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: '#22c55e', color: '#000' }}
            >
              Accept
            </button>
            <button
              onClick={() => updateStatus(order.id, 'cancelled')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              Reject
            </button>
          </div>
        )
      case 'accepted':
        return (
          <div className="mt-3">
            <button
              onClick={() => updateStatus(order.id, 'preparing')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
            >
              Start Preparing
            </button>
          </div>
        )
      case 'preparing':
        return (
          <div className="mt-3">
            <button
              onClick={() => updateStatus(order.id, 'ready')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}
            >
              Mark Ready
            </button>
          </div>
        )
      case 'ready':
        return (
          <div className="mt-3">
            <button
              onClick={() => updateStatus(order.id, 'delivered')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' }}
            >
              {order.type === 'delivery' ? 'Out for Delivery' : 'Mark Delivered'}
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage and fulfill customer orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending</div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">
            {counts.pending}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Active</div>
          <div className="text-2xl font-bold text-blue-500 mt-1">
            {counts.accepted + counts.preparing + counts.ready}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Completed</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {counts.delivered}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Orders</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {counts.all}
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: activeTab === tab.key ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
              color: activeTab === tab.key ? '#22c55e' : 'var(--text-secondary)',
              border: activeTab === tab.key ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
            }}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const sc = statusConfig[order.status]
          const tc = typeConfig[order.type]
          return (
            <div
              key={order.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{order.id}</span>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {sc.label}
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                    style={{ backgroundColor: tc.bg, color: tc.text }}
                  >
                    {order.type}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.time}</span>
              </div>

              {/* Customer */}
              <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span> {order.customer}
              </p>

              {/* Address for delivery */}
              {order.type === 'delivery' && order.address && (
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deliver to:</span> {order.address}
                </p>
              )}

              {/* Items */}
              <div className="mt-2 mb-3 space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.qty}x {item.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>${(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <p className="text-xs italic mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  Note: {order.notes}
                </p>
              )}

              {/* Total + Actions */}
              <div className="flex items-end justify-between pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total: <span className="text-green-500">${order.total.toFixed(2)}</span>
                </p>
                {renderActions(order)}
              </div>
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No orders with this status.</p>
          </div>
        )}
      </div>
    </div>
  )
}
