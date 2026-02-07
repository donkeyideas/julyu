'use client'

import { useState } from 'react'

// ─── Inline Types (no external imports) ────────────────────────────────────────

type FeatureKey =
  | 'basic_comparisons'
  | 'basic_price_tracking'
  | 'basic_receipts'
  | 'ai_chat'
  | 'receipt_scan'
  | 'price_alerts'
  | 'meal_planning'
  | 'smart_lists'
  | 'spending_insights'
  | 'unlimited_comparisons'
  | 'unlimited_receipts'
  | 'advanced_analytics'
  | 'white_label'
  | 'api_access'
  | 'dedicated_support'

const FEATURE_LABELS: Record<FeatureKey, string> = {
  basic_comparisons: 'Basic Price Comparisons',
  basic_price_tracking: 'Basic Price Tracking',
  basic_receipts: 'Basic Receipt Storage',
  ai_chat: 'AI Shopping Assistant',
  receipt_scan: 'Receipt Scanning & OCR',
  price_alerts: 'Price Drop Alerts',
  meal_planning: 'AI Meal Planning',
  smart_lists: 'Smart Shopping Lists',
  spending_insights: 'Spending Insights & Analytics',
  unlimited_comparisons: 'Unlimited Comparisons',
  unlimited_receipts: 'Unlimited Receipt Storage',
  advanced_analytics: 'Advanced Price Analytics',
  white_label: 'White Label Solution',
  api_access: 'API Access',
  dedicated_support: 'Dedicated Support',
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  stripe_price_id: string | null
  price: number
  billing_interval: 'month' | 'year'
  features: FeatureKey[]
  description: string | null
  is_active: boolean
  is_self_serve: boolean
  sort_order: number
  max_calls_per_day: number
  max_calls_per_minute: number
  max_tokens_per_day: number
  highlight: boolean
  created_at: string
  updated_at: string
}

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
  default_zip_code: string
  default_address: string
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

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_USER: UserInfo = {
  id: 'demo-user-001',
  email: 'sarah.johnson@email.com',
  full_name: 'Sarah Johnson',
  subscription_tier: 'premium',
  auth_provider: 'google',
  avatar_url: null,
}

const MOCK_SUBSCRIPTION = {
  id: 'sub-demo-001',
  status: 'active' as const,
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancel_at_period_end: false,
  stripe_customer_id: 'cus_demo_123',
  stripe_subscription_id: 'sub_demo_123',
}

const MOCK_SUBSCRIPTION_PLAN = {
  name: 'Premium',
  slug: 'premium',
  price: 14.99,
  billing_interval: 'month' as const,
}

const MOCK_UPGRADE_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    slug: 'free',
    stripe_price_id: null,
    price: 0,
    billing_interval: 'month',
    features: ['basic_comparisons', 'basic_price_tracking', 'basic_receipts'] as FeatureKey[],
    description: 'Get started with basic features',
    is_active: true,
    is_self_serve: true,
    sort_order: 1,
    max_calls_per_day: 50,
    max_calls_per_minute: 5,
    max_tokens_per_day: 10000,
    highlight: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    slug: 'premium',
    stripe_price_id: 'price_demo_premium',
    price: 14.99,
    billing_interval: 'month',
    features: ['basic_comparisons', 'basic_price_tracking', 'basic_receipts', 'ai_chat', 'receipt_scan', 'price_alerts', 'meal_planning', 'smart_lists', 'spending_insights', 'unlimited_comparisons', 'unlimited_receipts'] as FeatureKey[],
    description: 'Everything you need for smart shopping',
    is_active: true,
    is_self_serve: true,
    sort_order: 2,
    max_calls_per_day: 500,
    max_calls_per_minute: 20,
    max_tokens_per_day: 100000,
    highlight: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    stripe_price_id: null,
    price: 0,
    billing_interval: 'month',
    features: ['basic_comparisons', 'basic_price_tracking', 'basic_receipts', 'ai_chat', 'receipt_scan', 'price_alerts', 'meal_planning', 'smart_lists', 'spending_insights', 'unlimited_comparisons', 'unlimited_receipts', 'advanced_analytics', 'white_label', 'api_access', 'dedicated_support'] as FeatureKey[],
    description: 'Custom solutions for large organizations',
    is_active: true,
    is_self_serve: false,
    sort_order: 3,
    max_calls_per_day: 10000,
    max_calls_per_minute: 100,
    max_tokens_per_day: 1000000,
    highlight: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DemoSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notification_preferences: { price_alerts: true, weekly_summary: true, new_features: true },
    ai_features_enabled: true,
    budget_monthly: 400,
    favorite_stores: [],
    shopping_frequency: 'weekly',
    preferred_language: 'en',
    auto_translate_chat: true,
    default_zip_code: '45202',
    default_address: '123 Main St, Cincinnati, OH'
  })
  const [user, setUser] = useState<UserInfo>(MOCK_USER)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState(MOCK_USER.full_name || '')
  const [savingName, setSavingName] = useState(false)
  const [consent, setConsent] = useState({
    data_aggregation: true,
    ai_training: true,
    marketing: true,
    analytics: true,
  })
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradePromoCode, setUpgradePromoCode] = useState('')
  const [upgradePromoResult, setUpgradePromoResult] = useState<{
    valid: boolean; error?: string; promo?: { type: string; value: number; description: string | null }
  } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  // ─── Mock Handlers ─────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaving(true)
    setSaveMessage(null)
    setTimeout(() => {
      setSaving(false)
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    }, 800)
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

  const handleConsentChange = (key: keyof typeof consent) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setSaveMessage({ type: 'success', text: 'Demo data export generated! (No file downloaded in demo mode)' })
      setTimeout(() => setSaveMessage(null), 3000)
    }, 1500)
  }

  const handleDelete = () => {
    setDeleting(true)
    setTimeout(() => {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setSaveMessage({ type: 'error', text: 'This feature is disabled in demo mode' })
      setTimeout(() => setSaveMessage(null), 5000)
    }, 1000)
  }

  const openUpgradeModal = () => {
    setShowUpgradeModal(true)
  }

  const handleUpgradeValidatePromo = (planSlug: string) => {
    if (!upgradePromoCode.trim()) return
    setValidatingPromo(true)
    setUpgradePromoResult(null)
    setTimeout(() => {
      if (upgradePromoCode.trim().toUpperCase() === 'DEMO50') {
        setUpgradePromoResult({
          valid: true,
          promo: { type: 'percentage', value: 50, description: '50% off your first month' }
        })
      } else {
        setUpgradePromoResult({ valid: false, error: 'Invalid promo code' })
      }
      setValidatingPromo(false)
    }, 600)
  }

  const handleUpgradeCheckout = (planSlug: string) => {
    setCheckingOut(planSlug)
    setTimeout(() => {
      setCheckingOut(null)
      setShowUpgradeModal(false)
      setSaveMessage({ type: 'success', text: 'Demo mode: Checkout is disabled. Sign up for a real account to subscribe!' })
      setTimeout(() => setSaveMessage(null), 5000)
    }, 1000)
  }

  const handleSubscriptionAction = (action: 'cancel' | 'reactivate' | 'portal') => {
    if (action === 'cancel') {
      setSaveMessage({ type: 'success', text: 'Demo mode: Subscription cancellation is disabled.' })
      setTimeout(() => setSaveMessage(null), 5000)
    } else if (action === 'reactivate') {
      setSaveMessage({ type: 'success', text: 'Demo mode: Subscription reactivation is disabled.' })
      setTimeout(() => setSaveMessage(null), 5000)
    } else if (action === 'portal') {
      setSaveMessage({ type: 'success', text: 'Demo mode: Billing portal is disabled.' })
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

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
                  onClick={() => {
                    setSavingName(true)
                    setTimeout(() => {
                      setUser(prev => ({ ...prev, full_name: editedName || null }))
                      setSavingName(false)
                      setEditingName(false)
                      setSaveMessage({ type: 'success', text: 'Name updated successfully!' })
                      setTimeout(() => setSaveMessage(null), 3000)
                    }, 500)
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

      {/* Address & Location */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Address & Location</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Used for Get Directions and pre-filling the Compare Prices page
        </p>
        <div className="space-y-6">
          <div>
            <label className="font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Zip Code</label>
            <input
              type="text"
              value={settings.default_zip_code}
              onChange={(e) => setSettings(prev => ({ ...prev, default_zip_code: e.target.value }))}
              placeholder="45202"
              maxLength={10}
              className="rounded-lg px-4 py-2 w-40 focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Full Address</label>
            <input
              type="text"
              value={settings.default_address}
              onChange={(e) => setSettings(prev => ({ ...prev, default_address: e.target.value }))}
              placeholder="123 Main St, Cincinnati, OH 45202"
              className="rounded-lg px-4 py-2 w-full focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Subscription</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {MOCK_SUBSCRIPTION_PLAN.name}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                ${MOCK_SUBSCRIPTION_PLAN.price}/{MOCK_SUBSCRIPTION_PLAN.billing_interval}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              MOCK_SUBSCRIPTION.status === 'active' ? 'bg-green-500/15 text-green-500' :
              'bg-gray-500/15 text-gray-400'
            }`}>
              Active
            </span>
          </div>

          {MOCK_SUBSCRIPTION.current_period_end && (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {MOCK_SUBSCRIPTION.cancel_at_period_end
                ? `Cancels on ${new Date(MOCK_SUBSCRIPTION.current_period_end).toLocaleDateString()}`
                : `Renews on ${new Date(MOCK_SUBSCRIPTION.current_period_end).toLocaleDateString()}`}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {MOCK_SUBSCRIPTION.stripe_customer_id && (
              <button
                onClick={() => handleSubscriptionAction('portal')}
                className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Manage Billing
              </button>
            )}

            {MOCK_SUBSCRIPTION.status === 'active' && !MOCK_SUBSCRIPTION.cancel_at_period_end && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition text-sm"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
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

      {/* Cancel Subscription Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Cancel Subscription</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to cancel your subscription? You will still have access to all premium features until the end of your current billing period.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-2.5 rounded-lg transition text-sm font-medium"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false)
                  handleSubscriptionAction('cancel')
                }}
                className="px-5 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Choose a Plan</h2>
              <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {MOCK_UPGRADE_PLANS.map(plan => {
                const features = Array.isArray(plan.features) ? plan.features : []
                const isFree = plan.price === 0 && plan.is_self_serve
                const isEnterprise = !plan.is_self_serve
                const isHighlighted = plan.highlight
                const isCurrent = MOCK_SUBSCRIPTION_PLAN.slug === plan.slug

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-6 text-center ${
                      isHighlighted
                        ? 'border-2 border-green-500 bg-green-500/5'
                        : 'border border-gray-700'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="text-green-400 text-xs font-semibold mb-2 uppercase tracking-wider">Most Popular</div>
                    )}
                    <div className="text-xl font-bold text-white mb-2">{plan.name}</div>
                    <div className="text-3xl font-black text-green-500 mb-1">
                      {isEnterprise ? 'Custom' : `$${plan.price}`}
                    </div>
                    <div className="text-gray-500 text-sm mb-4">
                      {isFree ? 'Forever free' : isEnterprise ? 'Contact sales' : `per ${plan.billing_interval}`}
                    </div>

                    <ul className="text-left space-y-2 mb-6 text-sm">
                      {features.slice(0, 6).map(feature => (
                        <li key={feature} className="text-gray-300">
                          <span className="text-green-500 mr-2">&#10003;</span>
                          {FEATURE_LABELS[feature as FeatureKey] || feature}
                        </li>
                      ))}
                      {features.length > 6 && (
                        <li className="text-gray-500">+{features.length - 6} more features</li>
                      )}
                    </ul>

                    {isCurrent ? (
                      <div className="py-2 rounded-lg border border-gray-600 text-gray-400 text-sm">Current Plan</div>
                    ) : isFree ? (
                      <div className="py-2 rounded-lg border border-gray-700 text-gray-500 text-sm">Free</div>
                    ) : plan.is_self_serve && plan.price > 0 ? (
                      <button
                        onClick={() => handleUpgradeCheckout(plan.slug)}
                        disabled={checkingOut === plan.slug}
                        className="w-full py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 disabled:opacity-50 text-sm"
                      >
                        {checkingOut === plan.slug ? 'Loading...' : 'Subscribe'}
                      </button>
                    ) : isEnterprise ? (
                      <a href="/contact" className="block w-full py-2 rounded-lg border border-gray-700 text-white hover:border-green-500 text-center text-sm">
                        Contact Sales
                      </a>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Promo Code */}
            <div className="mt-6 border-t border-gray-700 pt-6">
              <div className="max-w-sm mx-auto text-center">
                <h3 className="text-sm font-semibold text-white mb-3">Have a promo code?</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upgradePromoCode}
                    onChange={(e) => {
                      setUpgradePromoCode(e.target.value.toUpperCase())
                      setUpgradePromoResult(null)
                    }}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => handleUpgradeValidatePromo('premium')}
                    disabled={validatingPromo || !upgradePromoCode.trim()}
                    className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    {validatingPromo ? '...' : 'Apply'}
                  </button>
                </div>
                {upgradePromoResult && (
                  <div className={`mt-2 text-sm ${upgradePromoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {upgradePromoResult.valid
                      ? `Code applied! ${upgradePromoResult.promo?.type === 'free_months'
                          ? `${upgradePromoResult.promo.value} month(s) free`
                          : upgradePromoResult.promo?.type === 'percentage'
                          ? `${upgradePromoResult.promo.value}% off`
                          : `$${upgradePromoResult.promo?.value} off`}`
                      : upgradePromoResult.error || 'Invalid code'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
