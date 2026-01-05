'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ScanReceiptPage() {
  const [uploading, setUploading] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/receipts" className="text-green-500 hover:underline">← Back to Receipts</Link>
        </div>

        <h1 className="text-4xl font-black mb-6">Scan Receipt</h1>
        <p className="text-gray-400 mb-8">Upload a photo of your receipt to automatically extract items and prices</p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">Upload receipt image</p>
            <button
              disabled={uploading}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Choose File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

