'use client'

import { useState } from 'react'

export default function SeedAdminPage() {
  const [email, setEmail] = useState('info@donkeyideas.com')
  const [name, setName] = useState('Super Admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: unknown } | null>(null)

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/auth/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password: password || undefined }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: 'Admin account created successfully!',
          data,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create admin account',
        })
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Seed Initial Admin</h1>

        <form onSubmit={handleSeed} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password <span className="text-gray-500">(optional - will generate if empty)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for auto-generated password"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Min 12 chars, uppercase, lowercase, number, special char
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded transition-colors"
          >
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded ${result.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
            <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </p>
            {result.success && result.data && (
              <div className="mt-3 text-sm text-gray-300">
                <p className="font-mono bg-gray-900 p-2 rounded mt-1 break-all">
                  {JSON.stringify(result.data, null, 2)}
                </p>
                <p className="mt-3 text-yellow-400 font-medium">
                  Save your temporary password! You will need to change it on first login.
                </p>
                <a
                  href="/admin-v2/login"
                  className="mt-3 inline-block text-green-400 hover:text-green-300 underline"
                >
                  Go to Login Page →
                </a>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500 text-center">
          This page only works when no admin employees exist in the database.
        </p>
      </div>
    </div>
  )
}
