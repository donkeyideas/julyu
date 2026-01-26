'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExtractedItem {
  name: string
  quantity: number
  price: number
}

interface OcrResult {
  storeName?: string
  storeAddress?: string
  items: ExtractedItem[]
  subtotal?: number
  tax?: number
  total?: number
  purchaseDate?: string
  confidence?: number
}

export default function ScanReceiptPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'failed'>('idle')

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError('')
    setOcrResult(null)
    setStatus('idle')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')
    setStatus('uploading')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt')
      }

      setReceiptId(data.receiptId)
      setStatus('processing')
      setProcessing(true)

      // Poll for status
      pollReceiptStatus(data.receiptId)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload receipt')
      setStatus('failed')
    } finally {
      setUploading(false)
    }
  }

  const pollReceiptStatus = async (id: string) => {
    const maxAttempts = 30 // 30 seconds max
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/receipts/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check status')
        }

        const receipt = data.receipt

        if (receipt.ocr_status === 'complete') {
          setOcrResult(receipt.ocr_result)
          setStatus('complete')
          setProcessing(false)
          return
        }

        if (receipt.ocr_status === 'failed') {
          setError('OCR processing failed. Please try again with a clearer image.')
          setStatus('failed')
          setProcessing(false)
          return
        }

        // Still processing
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000)
        } else {
          setError('Processing is taking longer than expected. Please check back later.')
          setStatus('failed')
          setProcessing(false)
        }
      } catch (err: any) {
        console.error('Status check error:', err)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000)
        } else {
          setError('Failed to check processing status')
          setStatus('failed')
          setProcessing(false)
        }
      }
    }

    checkStatus()
  }

  const handleCreateList = async () => {
    if (!ocrResult || ocrResult.items.length === 0) return

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Receipt from ${ocrResult.storeName || 'Unknown Store'} - ${new Date().toLocaleDateString()}`,
          items: ocrResult.items.map(item => ({
            user_input: item.name,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create list')
      }

      router.push(`/dashboard/compare?listId=${data.list.id}`)
    } catch (err: any) {
      console.error('Create list error:', err)
      setError(err.message || 'Failed to create shopping list')
    }
  }

  const resetForm = () => {
    setPreview(null)
    setSelectedFile(null)
    setReceiptId(null)
    setOcrResult(null)
    setError('')
    setStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/receipts" className="text-green-500 hover:underline flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Receipts
        </Link>
      </div>

      <h1 className="text-4xl font-black mb-2">Scan Receipt</h1>
      <p className="text-gray-400 mb-8">
        Upload a photo of your receipt to automatically extract items and prices using AI
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {!ocrResult && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-green-500/50 transition"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Drop receipt image here or click to upload</p>
              <p className="text-gray-500 text-sm">Supports JPG, PNG, HEIC - Max 10MB</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="max-h-[400px] mx-auto rounded-lg"
                />
                {processing && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-white font-semibold">Analyzing receipt...</p>
                      <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetForm}
                  disabled={uploading || processing}
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || processing}
                  className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Uploading...
                    </>
                  ) : processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Scan Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div className="space-y-6">
          {/* Store Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {ocrResult.storeName || 'Unknown Store'}
                </h2>
                {ocrResult.storeAddress && (
                  <p className="text-gray-500 text-sm">{ocrResult.storeAddress}</p>
                )}
              </div>
              {ocrResult.confidence && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className={`text-lg font-bold ${
                    ocrResult.confidence > 0.8 ? 'text-green-500' :
                    ocrResult.confidence > 0.6 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {Math.round(ocrResult.confidence * 100)}%
                  </div>
                </div>
              )}
            </div>

            {ocrResult.purchaseDate && (
              <p className="text-gray-400 text-sm">
                Purchased: {new Date(ocrResult.purchaseDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Extracted Items</h3>
              <p className="text-gray-500 text-sm">{ocrResult.items.length} items found</p>
            </div>

            <div className="divide-y divide-gray-800">
              {ocrResult.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-8">{item.quantity}x</span>
                    <span className="text-white">{item.name}</span>
                  </div>
                  <span className="text-green-500 font-semibold">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-black/50 p-6 space-y-2">
              {ocrResult.subtotal && (
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>${ocrResult.subtotal.toFixed(2)}</span>
                </div>
              )}
              {ocrResult.tax && (
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span>${ocrResult.tax.toFixed(2)}</span>
                </div>
              )}
              {ocrResult.total && (
                <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-gray-800">
                  <span>Total</span>
                  <span className="text-green-500">${ocrResult.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 px-6 py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition"
            >
              Scan Another Receipt
            </button>
            <button
              onClick={handleCreateList}
              className="flex-1 px-6 py-4 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Create List & Compare Prices
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Tips for Best Results</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use good lighting and avoid shadows on the receipt</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Keep the receipt flat and fully visible in the frame</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Make sure all text is readable and not blurry</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Fresh receipts work better than faded ones</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
