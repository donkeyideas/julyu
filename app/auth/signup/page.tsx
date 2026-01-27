'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/firebase/auth'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      // Only show error if it's not a configuration issue
      if (err.message?.includes('Supabase') || err.message?.includes('URL')) {
        // Silently use test auth - don't show error
        // Try signup with test auth
        try {
          const supabase = createClient()
          const { error: testError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          })
          if (!testError) {
            router.push('/dashboard')
            router.refresh()
            return
          }
        } catch {
          // Fall through to show error
        }
      }
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()

      if (!result) {
        // User closed the popup
        setGoogleLoading(false)
        return
      }

      const { user } = result

      // Bridge to Supabase - create or update user
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to authenticate')
      }

      const data = await response.json()

      // Store user info in localStorage for the session
      localStorage.setItem('julyu_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        avatar_url: data.user.avatar_url,
        auth_provider: 'google',
        subscription_tier: data.user.subscription_tier || 'free'
      }))

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Google sign-in error:', err)
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black text-green-500 mb-8 block text-center">
          Julyu
        </Link>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-6">Create Account</h1>

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Signing up...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="John Doe"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Get Started'}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
