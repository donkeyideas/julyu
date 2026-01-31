'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Use our custom API that sends branded emails via Resend
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
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
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-400 mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-4 text-sm">
                Check your email! We&apos;ve sent a password reset link to <strong>{email}</strong>
              </div>
              <p className="text-gray-400 text-sm">
                The email will come from <strong>Julyu</strong> (noreply@julyu.com). Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/auth/login"
                className="block w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-center"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-500 text-sm">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-green-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
