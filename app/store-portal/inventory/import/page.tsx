'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ExtractedItem {
  name: string
  brand?: string
  size?: string
  price: number
  quantity: number
  selected: boolean
}

export default function ImportInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [showReview, setShowReview] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload and process
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/store-portal/inventory/import-receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process receipt')
      }

      // Set extracted items for review
      setExtractedItems(
        data.items.map((item: any) => ({
          ...item,
          selected: true, // Pre-select all items
        }))
      )
      setShowReview(true)
      setSuccess(`Successfully extracted ${data.items.length} items from receipt`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process receipt')
      setUploadedImage(null)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItem = (index: number) => {
    setExtractedItems(prev =>
      prev.map((item: any, i: number) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setExtractedItems(prev =>
      prev.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleImportSelected = async () => {
    const selectedItems = extractedItems.filter((item: any) => item.selected)

    if (selectedItems.length === 0) {
      setError('Please select at least one item to import')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/inventory/import-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: selectedItems }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import items')
      }

      setSuccess(`Successfully imported ${selectedItems.length} items to inventory`)

      // Redirect to inventory page after 2 seconds
      setTimeout(() => {
        router.push('/store-portal/inventory')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setExtractedItems([])
    setShowReview(false)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Import from Receipt</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Upload a supplier receipt to automatically extract product information
          </p>
        </div>
        <Link
          href="/store-portal/inventory"
          className="px-4 py-2 text-sm font-medium rounded-md"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Back to Inventory
        </Link>
      </div>

      {error && (
        <div className="rounded-md p-4 bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md p-4 bg-green-500/10 border border-green-500/30">
          <p className="text-sm text-green-500">{success}</p>
        </div>
      )}

      {!showReview ? (
        <div className="rounded-lg p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Upload Supplier Receipt
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We&apos;ll automatically extract product names, prices, and quantities from your receipt
              </p>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded receipt"
                    className="max-h-64 mx-auto rounded-lg shadow-sm"
                  />
                  {loading && (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Processing receipt...</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <span className="text-green-500 hover:text-green-400 font-medium">
                      Click to upload
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}> or drag and drop</span>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    PNG, JPG, or JPEG up to 10MB
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 rounded-lg p-4 bg-green-500/10 border border-green-500/30">
              <h3 className="text-sm font-semibold text-green-500 mb-2">Tips for best results:</h3>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• Make sure the receipt is well-lit and in focus</li>
                <li>• Include the entire receipt in the photo</li>
                <li>• Avoid shadows or glare on the receipt</li>
                <li>• Lay the receipt flat for clearer text</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Review Extracted Items</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Select items to import and adjust details as needed
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-green-500 hover:text-green-400"
              >
                Upload Different Receipt
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {extractedItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg p-4 transition"
                  style={{
                    backgroundColor: item.selected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: item.selected ? '1px solid var(--green-500, #22c55e)' : '1px solid var(--border-color)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleItem(index)}
                      className="mt-1 h-4 w-4 accent-green-500 rounded"
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                          disabled={!item.selected}
                          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Brand (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.brand || ''}
                          onChange={(e) => handleUpdateItem(index, 'brand', e.target.value)}
                          disabled={!item.selected}
                          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Size (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.size || ''}
                          onChange={(e) => handleUpdateItem(index, 'size', e.target.value)}
                          disabled={!item.selected}
                          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))}
                            disabled={!item.selected}
                            className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value))}
                            disabled={!item.selected}
                            className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {extractedItems.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No items extracted from receipt
              </div>
            )}
          </div>

          <div className="p-6" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {extractedItems.filter((item: any) => item.selected).length} of {extractedItems.length} items selected
              </div>
              <button
                onClick={handleImportSelected}
                disabled={loading || extractedItems.filter(item => item.selected).length === 0}
                className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Selected Items'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
