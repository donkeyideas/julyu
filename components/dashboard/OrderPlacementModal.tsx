'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BodegaResult {
  store: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    distance: number
  }
  product: {
    inventoryId: string
    name: string
    brand?: string | null
    size?: string | null
    imageUrl?: string | null
    price: number
    stockQuantity: number
  }
}

interface Props {
  isOpen: boolean
  bodega: BodegaResult | null
  userAddress?: string
  onClose: () => void
}

export default function OrderPlacementModal({ isOpen, bodega, userAddress, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState(userAddress || '')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  if (!isOpen || !bodega) return null

  const { store, product } = bodega

  const subtotal = product.price * quantity
  const taxRate = 0.08
  const taxAmount = subtotal * taxRate
  const deliveryFee = deliveryMethod === 'delivery' ? 3.99 : 0
  const total = subtotal + taxAmount + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate
      if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
        throw new Error('Please fill in all contact information')
      }

      if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
        throw new Error('Please enter a delivery address')
      }

      if (quantity > product.stockQuantity) {
        throw new Error(`Only ${product.stockQuantity} available in stock`)
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodegaStoreId: store.id,
          items: [
            {
              inventoryId: product.inventoryId,
              quantity,
            },
          ],
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
          customerName,
          customerPhone,
          customerEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order')
      }

      // Success - redirect to orders page or show success message
      alert(`Order placed successfully! Order #${data.data.orderNumber}\n\nThe store will prepare your order and you'll receive updates via email.`)
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Place Order
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Store Info */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {store.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {store.address}, {store.city}, {store.state} {store.zip}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {store.phone} • {store.distance.toFixed(1)} mi away
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Order Items
            </h3>
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-start gap-4">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded" />
                ) : (
                  <div className="w-20 h-20 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {product.name}
                  </h4>
                  {(product.brand || product.size) && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {product.brand} {product.size && `• ${product.size}`}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={product.stockQuantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 rounded-lg text-center"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        Price
                      </div>
                      <div className="text-xl font-bold mt-1" style={{ color: 'var(--accent-primary)' }}>
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {product.stockQuantity} available in stock
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Delivery Method
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className="p-4 rounded-lg text-left transition"
                style={{
                  backgroundColor: deliveryMethod === 'pickup' ? 'var(--accent-primary-10)' : 'var(--bg-secondary)',
                  border: deliveryMethod === 'pickup' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                }}
              >
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Pickup
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  15-20 minutes • Free
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className="p-4 rounded-lg text-left transition"
                style={{
                  backgroundColor: deliveryMethod === 'delivery' ? 'var(--accent-primary-10)' : 'var(--bg-secondary)',
                  border: deliveryMethod === 'delivery' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                }}
              >
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Delivery
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  30-45 minutes • $3.99
                </div>
              </button>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="mt-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, New York, NY 10001"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Tax (8%)</span>
                <span style={{ color: 'var(--text-primary)' }}>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
