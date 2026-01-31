'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Get token and email from URL
    const urlToken = searchParams.get('token')
    const urlEmail = searchParams.get('email')

    if (!urlToken || !urlEmail) {
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setToken(urlToken)
      setEmail(urlEmail)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword: password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black text-green-500 mb-8 block text-center">
          Julyu
        </Link>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
          <p className="text-gray-400 mb-6">
            Enter your new password below.
          </p>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-4 text-sm">
                Password updated successfully! Redirecting to login...
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-center"
              >
                Go to Login Now
              </Link>
            </div>
          ) : !token || !email ? (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm">
                {error || 'Invalid reset link'}
              </div>
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-center"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm">
                  {error}
                  {error.includes('expired') && (
                    <Link href="/auth/forgot-password" className="block mt-2 text-green-500 hover:underline">
                      Request a new reset link
                    </Link>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500"
                  placeholder="Re-enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-500 text-sm">
            <Link href="/auth/login" className="text-green-500 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin border-gray-600 border-t-green-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
