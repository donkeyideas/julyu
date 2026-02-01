'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InventoryItem {
  id: string
  bodega_store_id: string
  product_id?: string
  sku?: string
  stock_quantity: number
  in_stock: boolean
  sale_price: string
  cost_price?: string
  custom_name?: string
  custom_brand?: string
  custom_size?: string
  custom_image_url?: string
  update_method: string
  updated_at: string
  product?: {
    name: string
    brand?: string
    size?: string
    image_url?: string
  }
}

interface Props {
  items: InventoryItem[]
  storeId: string
  onRefresh?: () => void
}

export default function InventoryTable({ items, storeId, onRefresh }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    stock_quantity: number
    sale_price: string
    in_stock: boolean
  }>({ stock_quantity: 0, sale_price: '', in_stock: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditForm({
      stock_quantity: item.stock_quantity,
      sale_price: item.sale_price,
      in_stock: item.in_stock,
    })
    setError(null)
  }

  const handleSave = async (itemId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/store-portal/inventory/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update inventory')
      }

      setEditingId(null)
      if (onRefresh) {
        onRefresh()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this product from your inventory?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/store-portal/inventory/${itemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete inventory item')
      }

      if (onRefresh) {
        onRefresh()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (item: InventoryItem) => {
    return item.custom_name || item.product?.name || 'Unknown Product'
  }

  const getDisplayBrand = (item: InventoryItem) => {
    return item.custom_brand || item.product?.brand || '-'
  }

  const getDisplaySize = (item: InventoryItem) => {
    return item.custom_size || item.product?.size || '-'
  }

  const getDisplayImage = (item: InventoryItem) => {
    return item.custom_image_url || item.product?.image_url || null
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="m-4 rounded-md p-3 bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <table className="w-full">
        <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Brand
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Source
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: 'var(--bg-card)' }}>
          {items.map((item, index) => (
            <tr key={item.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  {getDisplayImage(item) ? (
                    <img
                      src={getDisplayImage(item)!}
                      alt={getDisplayName(item)}
                      className="h-10 w-10 rounded object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <svg className="h-6 w-6" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {getDisplayName(item)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {getDisplayBrand(item)}
              </td>
              <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {getDisplaySize(item)}
              </td>
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                ) : (
                  <span className={`text-sm font-medium ${
                    item.stock_quantity === 0 ? 'text-red-500' :
                    item.stock_quantity <= 5 ? 'text-yellow-500' :
                    ''
                  }`} style={item.stock_quantity > 5 ? { color: 'var(--text-primary)' } : {}}>
                    {item.stock_quantity}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.sale_price}
                    onChange={(e) => setEditForm({ ...editForm, sale_price: e.target.value })}
                    className="w-24 px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                ) : (
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    ${parseFloat(item.sale_price).toFixed(2)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.in_stock}
                      onChange={(e) => setEditForm({ ...editForm, in_stock: e.target.checked })}
                      className="h-4 w-4 text-green-500 focus:ring-green-500 rounded"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                    <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>In Stock</span>
                  </label>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.in_stock && item.stock_quantity > 0
                      ? 'bg-green-500/15 text-green-500'
                      : 'bg-red-500/15 text-red-500'
                  }`}>
                    {item.in_stock && item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="capitalize">{item.update_method}</span>
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                {editingId === item.id ? (
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      disabled={loading}
                      className="text-green-500 hover:text-green-400 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setError(null)
                      }}
                      disabled={loading}
                      className="hover:opacity-80 disabled:opacity-50"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-green-500 hover:text-green-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-400 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
