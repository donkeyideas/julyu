'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string
  items: any[]
  subtotal: number
  tax_amount: number
  delivery_fee: number
  total_amount: number
  status: string
  delivery_method: string
  delivery_address?: string
  ordered_at: string
  commission_rate: number
  store_payout: number
}

interface Props {
  order: Order
}

export default function OrderCard({ order }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showItems, setShowItems] = useState(false)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  const updateOrderStatus = async (newStatus: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/store-portal/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (confirm('Accept this order?')) {
      updateOrderStatus('accepted')
    }
  }

  const handleReject = () => {
    if (confirm('Reject this order? This cannot be undone.')) {
      updateOrderStatus('cancelled')
    }
  }

  const getNextStatus = () => {
    switch (order.status) {
      case 'accepted':
        return { status: 'preparing', label: 'Mark as Preparing' }
      case 'preparing':
        return { status: 'ready', label: 'Mark as Ready' }
      case 'ready':
        return order.delivery_method === 'delivery'
          ? { status: 'out_for_delivery', label: 'Out for Delivery' }
          : { status: 'delivered', label: 'Mark as Picked Up' }
      case 'out_for_delivery':
        return { status: 'delivered', label: 'Mark as Delivered' }
      default:
        return null
    }
  }

  const nextStatus = getNextStatus()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.order_number}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <div><strong>Customer:</strong> {order.customer_name}</div>
            <div><strong>Phone:</strong> {order.customer_phone}</div>
            <div><strong>Email:</strong> {order.customer_email}</div>
            <div className="mt-1">
              <strong>Method:</strong>{' '}
              <span className="capitalize">{order.delivery_method}</span>
              {order.delivery_method === 'delivery' && order.delivery_address && (
                <> • {order.delivery_address}</>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ordered: {new Date(order.ordered_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${order.total_amount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Your payout: ${order.store_payout.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            Commission ({order.commission_rate}%): -${(order.total_amount - order.store_payout - order.delivery_fee).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <button
          onClick={() => setShowItems(!showItems)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {showItems ? 'Hide' : 'Show'} Items ({order.items.length})
          <svg
            className={`w-4 h-4 transition-transform ${showItems ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showItems && (
          <div className="mt-3 bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.brand && <div className="text-sm text-gray-600">{item.brand}</div>}
                    <div className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)} = ${item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-900">${order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="text-gray-900">
                  {order.delivery_fee > 0 ? `$${order.delivery_fee.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === 'pending' && (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept Order
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </>
        )}

        {nextStatus && (
          <button
            onClick={() => updateOrderStatus(nextStatus.status)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextStatus.label}
          </button>
        )}

        {order.status === 'delivered' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Order Completed
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Order Cancelled
          </div>
        )}
      </div>
    </div>
  )
}
