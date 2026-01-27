'use client'

import { useState, useEffect } from 'react'

interface NotificationPreferences {
  price_alerts: boolean
  weekly_summary: boolean
  new_features: boolean
}

interface Settings {
  notification_preferences: NotificationPreferences
  ai_features_enabled: boolean
  budget_monthly: number | null
  favorite_stores: string[]
  shopping_frequency: string
  preferred_language: string
  auto_translate_chat: boolean
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tieng Viet' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
]

interface UserInfo {
  id?: string
  email: string
  full_name: string | null
  subscription_tier: 'free' | 'premium' | 'enterprise'
  auth_provider?: 'email' | 'google'
  avatar_url?: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notification_preferences: { price_alerts: true, weekly_summary: true, new_features: false },
    ai_features_enabled: true,
    budget_monthly: null,
    favorite_stores: [],
    shopping_frequency: 'weekly',
    preferred_language: 'en',
    auto_translate_chat: true
  })
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null)
  const [subscriptionPromo, setSubscriptionPromo] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [consent, setConsent] = useState({
    data_aggregation: false,
    ai_training: false,
    marketing: false,
    analytics: false,
  })
  const [consentLoading, setConsentLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadSettings()
    loadConsent()
    loadSubscription()

    // Check for subscription success
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      setSaveMessage({ type: 'success', text: 'Subscription activated successfully!' })
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings')
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }, [])

  const loadSettings = async () => {
    try {
      // First check localStorage for cached settings
      const cachedSettings = localStorage.getItem('userSettings')
      if (cachedSettings) {
        try {
          const cached = JSON.parse(cachedSettings)
          setSettings(prev => ({
            ...prev,
            ...cached
          }))
        } catch (e) {
          console.error('Failed to parse cached settings:', e)
        }
      }

      // Check for Firebase/Google user in localStorage
      let firebaseUser: { id: string; email: string; full_name: string | null; avatar_url: string | null; auth_provider?: string; subscription_tier?: string } | null = null
      const storedUser = localStorage.getItem('julyu_user')
      if (storedUser) {
        try {
          firebaseUser = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }

      // Build request headers - include user ID for Firebase users
      const headers: HeadersInit = {}
      if (firebaseUser?.id) {
        headers['x-user-id'] = firebaseUser.id
      }

      const response = await fetch('/api/settings', { headers })
      if (response.ok) {
        const data = await response.json()
        const newSettings = {
          notification_preferences: {
            price_alerts: data.preferences?.notification_preferences?.price_alerts ?? true,
            weekly_summary: data.preferences?.notification_preferences?.weekly_summary ?? true,
            new_features: data.preferences?.notification_preferences?.new_features ?? false
          },
          ai_features_enabled: data.preferences?.ai_features_enabled ?? true,
          budget_monthly: data.preferences?.budget_monthly ?? null,
          favorite_stores: data.preferences?.favorite_stores ?? [],
          shopping_frequency: data.preferences?.shopping_frequency ?? 'weekly',
          preferred_language: data.preferences?.preferred_language ?? 'en',
          auto_translate_chat: data.preferences?.auto_translate_chat ?? true
        }
        setSettings(newSettings)

        // Merge API user data with Firebase user data (Firebase data takes priority for email/name if API returns empty)
        const apiUser = data.user
        const mergedUser: UserInfo = {
          id: apiUser?.id || firebaseUser?.id,
          email: apiUser?.email || firebaseUser?.email || '',
          full_name: apiUser?.full_name || firebaseUser?.full_name || null,
          subscription_tier: apiUser?.subscription_tier || 'free',
          auth_provider: apiUser?.auth_provider || (firebaseUser ? 'google' : 'email'),
          avatar_url: apiUser?.avatar_url || firebaseUser?.avatar_url || null
        }
        setUser(mergedUser)
        setEditedName(mergedUser.full_name || '')

        // Cache settings in localStorage
        localStorage.setItem('userSettings', JSON.stringify(newSettings))
      } else if (firebaseUser) {
        // API failed but we have Firebase user data - use it directly
        setUser({
          id: firebaseUser.id,
          email: firebaseUser.email,
          full_name: firebaseUser.full_name,
          subscription_tier: (firebaseUser.subscription_tier as 'free' | 'premium' | 'enterprise') || 'free',
          auth_provider: (firebaseUser.auth_provider as 'email' | 'google') || 'google',
          avatar_url: firebaseUser.avatar_url
        })
        setEditedName(firebaseUser.full_name || '')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Try to load Firebase user from localStorage as fallback
      const storedUser = localStorage.getItem('julyu_user')
      if (storedUser) {
        try {
          const firebaseUser = JSON.parse(storedUser)
          setUser({
            id: firebaseUser.id,
            email: firebaseUser.email,
            full_name: firebaseUser.full_name,
            subscription_tier: firebaseUser.subscription_tier || 'free',
            auth_provider: firebaseUser.auth_provider || 'google',
            avatar_url: firebaseUser.avatar_url
          })
          setEditedName(firebaseUser.full_name || '')
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)

    try {
      // Always save to localStorage as a backup
      localStorage.setItem('userSettings', JSON.stringify(settings))

      // Get user ID from state or localStorage for Firebase users
      const storedUser = localStorage.getItem('julyu_user')
      const userId = user?.id || (storedUser ? JSON.parse(storedUser).id : null)

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (userId) {
        headers['x-user-id'] = userId
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        // API failed but localStorage succeeded
        setSaveMessage({ type: 'success', text: 'Settings saved locally!' })
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Still saved to localStorage
      setSaveMessage({ type: 'success', text: 'Settings saved locally!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationPreference = (key: keyof NotificationPreferences) => {
    setSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: !prev.notification_preferences[key]
      }
    }))
  }

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    const storedUser = localStorage.getItem('julyu_user')
    const userId = user?.id || (storedUser ? JSON.parse(storedUser).id : null)
    if (userId) headers['x-user-id'] = userId
    return headers
  }

  const loadConsent = async () => {
    try {
      const headers = getHeaders()
      const res = await fetch('/api/privacy/consent', { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.consent) setConsent(data.consent)
      }
    } catch (error) {
      console.error('Failed to load consent:', error)
    } finally {
      setConsentLoading(false)
    }
  }

  const loadSubscription = async () => {
    try {
      const headers = getHeaders()
      const res = await fetch('/api/subscriptions/manage', { headers })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
        setSubscriptionPlan(data.plan)
        setSubscriptionPromo(data.promo)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleSubscriptionAction = async (action: 'cancel' | 'reactivate' | 'portal') => {
    try {
      const headers = getHeaders()
      const res = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (action === 'portal' && data.url) {
        window.location.href = data.url
        return
      }

      if (data.message) {
        setSaveMessage({ type: 'success', text: data.message })
        setTimeout(() => setSaveMessage(null), 5000)
        loadSubscription()
      } else if (data.error) {
        setSaveMessage({ type: 'error', text: data.error })
        setTimeout(() => setSaveMessage(null), 5000)
      }
    } catch (error) {
      console.error('Subscription action failed:', error)
      setSaveMessage({ type: 'error', text: 'Failed to process action' })
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  const handleConsentChange = async (key: keyof typeof consent) => {
    const newValue = !consent[key]
    setConsent(prev => ({ ...prev, [key]: newValue }))

    try {
      const headers = getHeaders()
      await fetch('/api/privacy/consent', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ consent: { [key]: newValue } }),
      })
    } catch (error) {
      console.error('Failed to update consent:', error)
      // Revert on failure
      setConsent(prev => ({ ...prev, [key]: !newValue }))
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const headers = getHeaders()
      const res = await fetch('/api/privacy/export', { method: 'POST', headers })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `julyu-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setSaveMessage({ type: 'success', text: 'Data exported successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to export data' })
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setSaveMessage({ type: 'error', text: 'Failed to export data' })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const headers = getHeaders()
      const res = await fetch('/api/privacy/delete', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
      })
      if (res.ok) {
        // Clear local storage and redirect
        localStorage.clear()
        window.location.href = '/'
      } else {
        const data = await res.json()
        setSaveMessage({ type: 'error', text: data.error || 'Failed to delete account' })
        setTimeout(() => setSaveMessage(null), 5000)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setSaveMessage({ type: 'error', text: 'Failed to delete account' })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const subscriptionDisplay = {
    free: { label: 'Free Plan', color: 'text-gray-400' },
    premium: { label: 'Premium ($14.99/month)', color: 'text-green-500' },
    enterprise: { label: 'Enterprise', color: 'text-purple-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Account Section */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Account</h3>
        <div className="space-y-6">
          {/* Avatar for Google users */}
          {user?.avatar_url && (
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-green-500"
              />
              {user.auth_provider === 'google' && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Signed in with Google</span>
                </div>
              )}
            </div>
          )}
          <div>
            <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email</div>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span>{user?.email || 'Not available'}</span>
              {user?.auth_provider === 'google' && !user?.avatar_url && (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Name</div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                  className="rounded-lg px-3 py-2 w-64 focus:border-green-500 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={async () => {
                    setSavingName(true)
                    try {
                      // Get user ID from state or localStorage
                      const storedUser = localStorage.getItem('julyu_user')
                      const userId = user?.id || (storedUser ? JSON.parse(storedUser).id : null)

                      const headers: HeadersInit = { 'Content-Type': 'application/json' }
                      if (userId) {
                        headers['x-user-id'] = userId
                      }

                      const response = await fetch('/api/settings', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ ...settings, full_name: editedName || null })
                      })

                      if (response.ok) {
                        // Update local state
                        setUser(prev => prev ? { ...prev, full_name: editedName || null } : null)
                        // Update localStorage for Firebase users
                        if (storedUser) {
                          const parsedUser = JSON.parse(storedUser)
                          localStorage.setItem('julyu_user', JSON.stringify({
                            ...parsedUser,
                            full_name: editedName || null
                          }))
                        }
                        setSaveMessage({ type: 'success', text: 'Name updated successfully!' })
                        setTimeout(() => setSaveMessage(null), 3000)
                      } else {
                        setSaveMessage({ type: 'error', text: 'Failed to update name' })
                        setTimeout(() => setSaveMessage(null), 3000)
                      }
                    } catch (error) {
                      console.error('Failed to save name:', error)
                      setSaveMessage({ type: 'error', text: 'Failed to update name' })
                      setTimeout(() => setSaveMessage(null), 3000)
                    } finally {
                      setSavingName(false)
                      setEditingName(false)
                    }
                  }}
                  disabled={savingName}
                  className="px-3 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditedName(user?.full_name || '')
                    setEditingName(false)
                  }}
                  disabled={savingName}
                  className="px-3 py-2 rounded-lg hover:opacity-80 transition text-sm disabled:opacity-50"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-muted)' }}>{user?.full_name || 'Not set'}</span>
                <button
                  onClick={() => {
                    setEditedName(user?.full_name || '')
                    setEditingName(true)
                  }}
                  className="text-green-500 hover:text-green-400 text-sm transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Subscription</h3>
        {subscriptionLoading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading subscription info...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {subscriptionPlan?.name || 'Free Plan'}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {subscriptionPlan?.price > 0
                    ? `$${subscriptionPlan.price}/${subscriptionPlan.billing_interval}`
                    : 'Free forever'}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                subscription?.status === 'active' ? 'bg-green-500/15 text-green-500' :
                subscription?.status === 'trialing' ? 'bg-blue-500/15 text-blue-500' :
                subscription?.status === 'past_due' ? 'bg-yellow-500/15 text-yellow-500' :
                subscription?.status === 'canceled' ? 'bg-red-500/15 text-red-500' :
                'bg-gray-500/15 text-gray-400'
              }`}>
                {subscription?.status === 'active' ? 'Active' :
                 subscription?.status === 'trialing' ? 'Trial' :
                 subscription?.status === 'past_due' ? 'Past Due' :
                 subscription?.status === 'canceled' ? 'Canceled' :
                 'Free'}
              </span>
            </div>

            {subscription?.current_period_end && (
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {subscription.cancel_at_period_end
                  ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </div>
            )}

            {subscriptionPromo && (
              <div className="text-sm text-green-400">
                Promo applied: {subscriptionPromo.code}
                {subscriptionPromo.type === 'free_months' && ` (${subscriptionPromo.value} months free)`}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {(!subscription || subscription.status === 'free' || subscription.status === 'canceled') && (
                <a
                  href="/pricing"
                  className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm"
                >
                  Upgrade Plan
                </a>
              )}

              {subscription?.stripe_customer_id && (
                <button
                  onClick={() => handleSubscriptionAction('portal')}
                  className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Manage Billing
                </button>
              )}

              {subscription?.status === 'active' && !subscription?.cancel_at_period_end && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
                      handleSubscriptionAction('cancel')
                    }
                  }}
                  className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition text-sm"
                >
                  Cancel Subscription
                </button>
              )}

              {subscription?.cancel_at_period_end && (
                <button
                  onClick={() => handleSubscriptionAction('reactivate')}
                  className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm"
                >
                  Reactivate Subscription
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Price drop alerts</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Get notified when items on your watchlist drop in price</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.price_alerts}
                onChange={() => updateNotificationPreference('price_alerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Weekly savings summary</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Receive a weekly report of your savings and spending</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.weekly_summary}
                onChange={() => updateNotificationPreference('weekly_summary')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>New feature updates</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Learn about new features and improvements</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.new_features}
                onChange={() => updateNotificationPreference('new_features')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
        </div>
      </div>

      {/* AI Features */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>AI Features</h3>
        <div className="space-y-4">
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Enable AI features</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Use AI for smart recommendations, insights, and budget optimization</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.ai_features_enabled}
                onChange={() => setSettings(prev => ({ ...prev, ai_features_enabled: !prev.ai_features_enabled }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Language Preferences */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Language Preferences</h3>
        <div className="space-y-6">
          <div>
            <label className="font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Dashboard Language</label>
            <select
              value={settings.preferred_language}
              onChange={(e) => setSettings(prev => ({ ...prev, preferred_language: e.target.value }))}
              className="rounded-lg px-4 py-2 w-64 focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Choose your preferred language for the dashboard interface</p>
          </div>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Auto-translate chat messages</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Automatically translate messages from other users to your preferred language</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.auto_translate_chat}
                onChange={() => setSettings(prev => ({ ...prev, auto_translate_chat: !prev.auto_translate_chat }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Budget Settings */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Budget Settings</h3>
        <div className="space-y-6">
          <div>
            <label className="font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Monthly grocery budget</label>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}>$</span>
              <input
                type="number"
                value={settings.budget_monthly || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  budget_monthly: e.target.value ? parseFloat(e.target.value) : null
                }))}
                placeholder="Enter amount"
                className="rounded-lg px-4 py-2 w-40 focus:border-green-500 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>per month</span>
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Set a budget to get AI-powered spending alerts and recommendations</p>
          </div>
          <div>
            <label className="font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Shopping frequency</label>
            <select
              value={settings.shopping_frequency}
              onChange={(e) => setSettings(prev => ({ ...prev, shopping_frequency: e.target.value }))}
              className="rounded-lg px-4 py-2 w-48 focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="daily">Daily</option>
              <option value="twice_weekly">Twice a week</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Privacy & Data</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Control how your data is used. Changes take effect immediately.
        </p>
        <div className="space-y-4">
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Analytics</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Help us improve Julyu by sharing anonymous usage data</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={() => handleConsentChange('analytics')}
                disabled={consentLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Aggregated data sharing</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Allow your anonymized data to be included in aggregated price insights</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={consent.data_aggregation}
                onChange={() => handleConsentChange('data_aggregation')}
                disabled={consentLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>AI model training</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Help improve AI recommendations by allowing your interactions to train our models</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={consent.ai_training}
                onChange={() => handleConsentChange('ai_training')}
                disabled={consentLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Marketing communications</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Receive promotional emails about deals and new features</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={() => handleConsentChange('marketing')}
                disabled={consentLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 bg-gray-600"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h3 className="text-2xl font-bold mb-6 text-red-500">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Export my data</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Download all your data including shopping lists, receipts, and preferences</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 rounded-lg hover:border-green-500 transition disabled:opacity-50"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span className="font-medium text-red-500">Delete account</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Permanently delete your account and all associated data</p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
