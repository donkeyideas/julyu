'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function NewListPage() {
  const [name, setName] = useState('')

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/lists" className="text-green-500 hover:underline">← Back to Lists</Link>
        </div>

        <h1 className="text-4xl font-black mb-6">New Shopping List</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">List Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Shopping List"
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <button
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600"
          >
            Create List
          </button>
        </div>
      </div>
    </div>
  )
}

