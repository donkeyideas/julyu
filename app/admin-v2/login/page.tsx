'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TotpInput from '@/components/admin-v2/TotpInput'
import QrCodeDisplay from '@/components/admin-v2/QrCodeDisplay'
import RecoveryCodesModal from '@/components/admin-v2/RecoveryCodesModal'
import { setAdminSessionToken, getAdminSessionToken } from '@/lib/auth/admin-session-client'

type LoginStep = 'credentials' | 'verify-2fa' | 'setup-2fa'

interface SetupData {
  qrCodeUrl: string
  secret: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [employeeName, setEmployeeName] = useState('')

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAdminSessionToken()
      if (token) {
        const response = await fetch('/api/admin/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (data.valid && !data.requires2FA && !data.requiresPasswordChange) {
          router.push('/admin-v2')
        }
      }
    }
    checkSession()
  }, [router])

  // Step 1: Handle email/password login
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      setSessionToken(data.sessionToken)
      setEmployeeName(data.employee?.name || '')

      if (data.requires2FA) {
        // User has 2FA enabled - go to verification
        setStep('verify-2fa')
      } else if (data.needsSetup2FA) {
        // User needs to set up 2FA
        await loadSetupData(data.sessionToken)
        setStep('setup-2fa')
      } else {
        // No 2FA required (shouldn't happen with mandatory 2FA)
        setAdminSessionToken(data.sessionToken)
        router.push('/admin-v2')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load 2FA setup data (QR code)
  const loadSetupData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/auth/setup-2fa', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.success) {
        setSetupData({
          qrCodeUrl: data.qrCodeUrl,
          secret: data.secret,
        })
      }
    } catch (err) {
      setError('Failed to load 2FA setup')
    }
  }

  // Step 2a: Verify existing 2FA
  const handleVerify2FA = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ code, isRecoveryCode: useRecoveryCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid code')
        setLoading(false)
        return
      }

      // Success - save session and redirect
      setAdminSessionToken(sessionToken!)
      router.push('/admin-v2')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle recovery code submission
  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recoveryCode.length === 8) {
      await handleVerify2FA(recoveryCode)
    }
  }

  // Step 2b: Set up 2FA (verify initial code)
  const handleSetup2FA = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid code')
        setLoading(false)
        return
      }

      // Show recovery codes
      setRecoveryCodes(data.recoveryCodes)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // After saving recovery codes
  const handleRecoveryCodesSaved = () => {
    setAdminSessionToken(sessionToken!)
    router.push('/admin-v2')
  }

  // Go back to credentials step
  const handleBack = () => {
    setStep('credentials')
    setSessionToken(null)
    setSetupData(null)
    setError('')
    setUseRecoveryCode(false)
    setRecoveryCode('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black text-green-500 mb-2 block text-center">
          Julyu
        </Link>
        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Admin Portal</p>

        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <>
              <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Admin Login</h1>

              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="Enter password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {/* Step 2a: Verify 2FA */}
          {step === 'verify-2fa' && (
            <>
              <button
                onClick={handleBack}
                className="mb-4 text-sm flex items-center gap-1 hover:text-green-500 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Two-Factor Authentication
              </h1>
              {employeeName && (
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Welcome back, {employeeName}
                </p>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm mb-6">
                  {error}
                </div>
              )}

              {!useRecoveryCode ? (
                <>
                  <TotpInput
                    onComplete={handleVerify2FA}
                    disabled={loading}
                    error={undefined}
                  />

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setUseRecoveryCode(true)}
                      className="text-sm hover:text-green-500 transition"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Use a recovery code instead
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleRecoveryCodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Recovery Code
                    </label>
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      maxLength={8}
                      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg tracking-widest"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="XXXXXXXX"
                    />
                    <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                      Enter one of your 8-character recovery codes
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || recoveryCode.length !== 8}
                    className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Recovery Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(false)
                      setRecoveryCode('')
                    }}
                    className="w-full text-sm hover:text-green-500 transition"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Use authenticator app instead
                  </button>
                </form>
              )}

              {loading && (
                <div className="mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Verifying...
                </div>
              )}
            </>
          )}

          {/* Step 2b: Setup 2FA */}
          {step === 'setup-2fa' && setupData && (
            <>
              <button
                onClick={handleBack}
                className="mb-4 text-sm flex items-center gap-1 hover:text-green-500 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-sm mb-6">
                  {error}
                </div>
              )}

              <QrCodeDisplay
                qrCodeUrl={setupData.qrCodeUrl}
                secret={setupData.secret}
                email={email}
              />

              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  Enter the code from your authenticator app to complete setup:
                </p>
                <TotpInput
                  onComplete={handleSetup2FA}
                  disabled={loading}
                  error={undefined}
                />
              </div>

              {loading && (
                <div className="mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Setting up 2FA...
                </div>
              )}
            </>
          )}

          {/* Footer */}
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

      {/* Recovery Codes Modal */}
      {recoveryCodes && (
        <RecoveryCodesModal
          codes={recoveryCodes}
          onClose={() => {}}
          onConfirm={handleRecoveryCodesSaved}
        />
      )}
    </div>
  )
}
