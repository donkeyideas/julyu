'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { setDemoSession, getDemoSession } from '@/lib/demo/utils/demo-auth'

export default function DemoEnterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DemoEnterContent />
    </Suspense>
  )
}

function DemoEnterContent() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If a code is provided in the URL, always use it (don't reuse old session)
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode)
      return
    }

    // No code in URL — check if already has a valid session
    const existing = getDemoSession()
    if (existing) {
      redirectToDemo(existing.demoType)
      return
    }
  }, [searchParams])

  function redirectToDemo(demoType: string) {
    if (demoType === 'store') {
      router.push('/demo/store-portal')
    } else {
      router.push('/demo/dashboard')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setError(data.error || 'Invalid demo code. Please check and try again.')
        setLoading(false)
        return
      }

      // Set demo session
      setDemoSession({
        code: code.trim().toUpperCase(),
        demoType: data.demoType,
        expiresAt: data.expiresAt,
        name: data.name || 'Demo User',
      })

      redirectToDemo(data.demoType)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black text-green-500 inline-block mb-4">
            Julyu
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Enter Demo Code
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter the demo access code you received via email to explore the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Demo Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., JULYU-A3K9"
              className="w-full px-4 py-3 rounded-lg text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              maxLength={10}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validating...' : 'Access Demo'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have a code?{' '}
            <Link href="/#request-demo" className="text-green-500 hover:text-green-400 font-medium">
              Request demo access
            </Link>
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:text-green-500 transition">
              &larr; Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
