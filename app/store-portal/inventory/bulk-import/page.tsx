'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ParsedItem {
  name: string
  brand?: string
  size?: string
  price: number
  stock_quantity: number
  category?: string
  description?: string
  selected: boolean
  error?: string
}

export default function BulkImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [showReview, setShowReview] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = ['Product Name', 'Brand', 'Size', 'Price', 'Stock Quantity', 'Category', 'Description']
    const exampleRows = [
      ['Coca-Cola', 'Coca-Cola', '12 oz', '1.99', '24', 'Beverages', 'Classic cola drink'],
      ['Doritos Nacho Cheese', 'Doritos', '9.75 oz', '4.49', '15', 'Snacks', 'Nacho cheese flavored tortilla chips'],
      ['Tide Pods', 'Tide', '42 count', '12.99', '8', 'Household', 'Laundry detergent pods'],
    ]

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'julyu_inventory_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): ParsedItem[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row')
    }

    // Parse header to find column indices
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim())

    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('product'))
    const brandIdx = headers.findIndex(h => h.includes('brand'))
    const sizeIdx = headers.findIndex(h => h.includes('size'))
    const priceIdx = headers.findIndex(h => h.includes('price'))
    const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('quantity') || h.includes('qty'))
    const categoryIdx = headers.findIndex(h => h.includes('category'))
    const descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc'))

    if (nameIdx === -1) {
      throw new Error('CSV must have a "Product Name" column')
    }
    if (priceIdx === -1) {
      throw new Error('CSV must have a "Price" column')
    }

    const items: ParsedItem[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0 || values.every(v => !v.trim())) continue

      const name = values[nameIdx]?.trim() || ''
      const priceStr = values[priceIdx]?.trim().replace(/[$,]/g, '') || '0'
      const stockStr = stockIdx !== -1 ? values[stockIdx]?.trim() || '0' : '0'

      const price = parseFloat(priceStr)
      const stock = parseInt(stockStr, 10)

      const item: ParsedItem = {
        name,
        brand: brandIdx !== -1 ? values[brandIdx]?.trim() : undefined,
        size: sizeIdx !== -1 ? values[sizeIdx]?.trim() : undefined,
        price: isNaN(price) ? 0 : price,
        stock_quantity: isNaN(stock) ? 0 : stock,
        category: categoryIdx !== -1 ? values[categoryIdx]?.trim() : undefined,
        description: descIdx !== -1 ? values[descIdx]?.trim() : undefined,
        selected: true,
      }

      // Validate
      if (!item.name) {
        item.error = 'Missing product name'
        item.selected = false
      } else if (item.price <= 0) {
        item.error = 'Invalid price'
        item.selected = false
      }

      items.push(item)
    }

    return items
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)

    return result
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const isCSV = file.name.endsWith('.csv')
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (!isCSV && !isExcel) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    setParsing(true)
    setError(null)
    setSuccess(null)
    setFileName(file.name)

    try {
      if (isCSV) {
        const text = await file.text()
        const items = parseCSV(text)

        if (items.length === 0) {
          throw new Error('No valid items found in the file')
        }

        setParsedItems(items)
        setShowReview(true)
        setSuccess(`Found ${items.length} items in ${file.name}`)
      } else {
        // For Excel files, we need to use the API
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/store-portal/inventory/parse-excel', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse Excel file')
        }

        const items = data.items.map((item: any) => ({
          ...item,
          selected: !item.error,
        }))

        setParsedItems(items)
        setShowReview(true)
        setSuccess(`Found ${items.length} items in ${file.name}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setFileName(null)
    } finally {
      setParsing(false)
    }
  }

  const handleToggleItem = (index: number) => {
    setParsedItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const handleToggleAll = (selected: boolean) => {
    setParsedItems(prev =>
      prev.map(item => ({ ...item, selected: item.error ? false : selected }))
    )
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setParsedItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleImportSelected = async () => {
    const selectedItems = parsedItems.filter(item => item.selected && !item.error)

    if (selectedItems.length === 0) {
      setError('Please select at least one valid item to import')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/inventory/bulk-import', {
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

      setSuccess(`Successfully imported ${data.imported} items to inventory`)

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
    setParsedItems([])
    setShowReview(false)
    setError(null)
    setSuccess(null)
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validCount = parsedItems.filter(item => !item.error).length
  const selectedCount = parsedItems.filter(item => item.selected && !item.error).length
  const errorCount = parsedItems.filter(item => item.error).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/store-portal/inventory"
            className="text-sm text-green-500 hover:text-green-400 flex items-center mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inventory
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Bulk Import</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Upload a CSV or Excel file to import multiple products at once
          </p>
        </div>
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
        <div className="space-y-6">
          {/* Download Template */}
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Step 1: Download Template
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Download our CSV template, fill it out with your products, and upload it below.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV Template
            </button>
          </div>

          {/* Upload File */}
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Step 2: Upload Your File
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Upload your completed CSV or Excel file to import products.
            </p>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              {parsing ? (
                <div className="space-y-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Parsing {fileName}...</p>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-green-500 hover:text-green-400 font-medium">
                      Click to upload
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}> or drag and drop</span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={parsing}
                    />
                  </label>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    CSV, XLSX, or XLS files
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Format Guide */}
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              File Format Guide
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>Column</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>Required</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>Example</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--text-secondary)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Product Name</td>
                    <td className="py-2 px-3"><span className="text-green-500">Yes</span></td>
                    <td className="py-2 px-3">Coca-Cola Classic</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Brand</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Coca-Cola</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Size</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">12 oz</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Price</td>
                    <td className="py-2 px-3"><span className="text-green-500">Yes</span></td>
                    <td className="py-2 px-3">1.99</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Stock Quantity</td>
                    <td className="py-2 px-3">No (defaults to 0)</td>
                    <td className="py-2 px-3">24</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3">Category</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Beverages</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Description</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Classic cola drink</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Review Items ({parsedItems.length} total)
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {validCount} valid, {errorCount} with errors
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="text-sm text-green-500 hover:text-green-400"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="text-sm hover:text-green-400"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Deselect All
                </button>
                <button
                  onClick={handleReset}
                  className="text-sm hover:text-green-400"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Upload Different File
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4 transition"
                  style={{
                    backgroundColor: item.error ? 'rgba(239, 68, 68, 0.1)' : item.selected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: item.error ? '1px solid rgba(239, 68, 68, 0.3)' : item.selected ? '1px solid #22c55e' : '1px solid var(--border-color)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleItem(index)}
                      disabled={!!item.error}
                      className="mt-1 h-4 w-4 accent-green-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.name || '(No name)'}
                          {item.brand && <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>({item.brand})</span>}
                        </div>
                        <div className="text-sm font-medium text-green-500">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.size && <span>Size: {item.size}</span>}
                        <span>Stock: {item.stock_quantity}</span>
                        {item.category && <span>Category: {item.category}</span>}
                      </div>
                      {item.error && (
                        <div className="mt-2 text-sm text-red-500">
                          Error: {item.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedCount} of {validCount} valid items selected
              </div>
              <button
                onClick={handleImportSelected}
                disabled={loading || selectedCount === 0}
                className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : `Import ${selectedCount} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
