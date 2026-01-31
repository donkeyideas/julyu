'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customName: '',
    customBrand: '',
    customSize: '',
    sku: '',
    stockQuantity: 0,
    salePrice: '',
    costPrice: '',
    customImageUrl: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add product')
      }

      // Reset form and redirect
      router.push('/store-portal/inventory')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/store-portal/inventory"
          className="text-sm text-green-500 hover:text-green-400 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>Add Product</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manually add a product to your inventory
        </p>
      </div>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {error && (
          <div className="mb-6 rounded-md p-4 bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Product Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="customName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  id="customName"
                  name="customName"
                  required
                  value={formData.customName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Coca-Cola Classic"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customBrand" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    id="customBrand"
                    name="customBrand"
                    value={formData.customBrand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="Coca-Cola"
                  />
                </div>

                <div>
                  <label htmlFor="customSize" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Size
                  </label>
                  <input
                    type="text"
                    id="customSize"
                    name="customSize"
                    value={formData.customSize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="12 oz"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="SKU-12345"
                />
              </div>

              <div>
                <label htmlFor="customImageUrl" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="customImageUrl"
                  name="customImageUrl"
                  value={formData.customImageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Pricing & Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  name="stockQuantity"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Sale Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    id="salePrice"
                    name="salePrice"
                    required
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className="w-full pl-7 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="costPrice" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Cost Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={handleChange}
                    className="w-full pl-7 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <Link
                href="/store-portal/inventory"
                className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 rounded-md p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> You can also import products from a receipt or connect your POS system for automatic syncing.
          </p>
          <div className="mt-2 flex space-x-3">
            <Link
              href="/store-portal/inventory/import"
              className="text-sm text-green-500 hover:text-green-400"
            >
              Import from Receipt →
            </Link>
            <Link
              href="/store-portal/inventory/pos-sync"
              className="text-sm text-green-500 hover:text-green-400"
            >
              Connect POS System →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
