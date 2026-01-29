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
}

export default function InventoryTable({ items, storeId }: Props) {
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
      router.refresh()
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

      router.refresh()
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
        <div className="m-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Brand
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  {getDisplayImage(item) ? (
                    <img
                      src={getDisplayImage(item)!}
                      alt={getDisplayName(item)}
                      className="h-10 w-10 rounded object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-900">
                    {getDisplayName(item)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {getDisplayBrand(item)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {getDisplaySize(item)}
              </td>
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className={`text-sm font-medium ${
                    item.stock_quantity === 0 ? 'text-red-600' :
                    item.stock_quantity <= 5 ? 'text-yellow-600' :
                    'text-gray-900'
                  }`}>
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
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock</span>
                  </label>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.in_stock && item.stock_quantity > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.in_stock && item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="capitalize">{item.update_method}</span>
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                {editingId === item.id ? (
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      disabled={loading}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setError(null)
                      }}
                      disabled={loading}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
