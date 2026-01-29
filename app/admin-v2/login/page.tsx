'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateAdminLogin, setAdminSession } from '@/lib/auth/admin-auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate admin credentials
    const result = validateAdminLogin(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed')
      setLoading(false)
      return
    }

    // Set admin session
    setAdminSession(email)

    // Redirect to admin dashboard
    router.push('/admin-v2')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black text-green-500 mb-2 block text-center">
          Julyu
        </Link>
        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Admin Portal</p>

        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Admin Login</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Link
              href="/"
              className="block text-center hover:text-green-500 transition text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
