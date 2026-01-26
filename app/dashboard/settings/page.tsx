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
}

interface UserInfo {
  email: string
  full_name: string | null
  subscription_tier: 'free' | 'premium' | 'enterprise'
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notification_preferences: { price_alerts: true, weekly_summary: true, new_features: false },
    ai_features_enabled: true,
    budget_monthly: null,
    favorite_stores: [],
    shopping_frequency: 'weekly'
  })
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          notification_preferences: {
            price_alerts: data.preferences?.notification_preferences?.price_alerts ?? true,
            weekly_summary: data.preferences?.notification_preferences?.weekly_summary ?? true,
            new_features: data.preferences?.notification_preferences?.new_features ?? false
          },
          ai_features_enabled: data.preferences?.ai_features_enabled ?? true,
          budget_monthly: data.preferences?.budget_monthly ?? null,
          favorite_stores: data.preferences?.favorite_stores ?? [],
          shopping_frequency: data.preferences?.shopping_frequency ?? 'weekly'
        })
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
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

  const subscriptionDisplay = {
    free: { label: 'Free Plan', color: 'text-gray-400' },
    premium: { label: 'Premium ($14.99/month)', color: 'text-green-500' },
    enterprise: { label: 'Enterprise', color: 'text-purple-500' }
  }

  const handleSeedDemo = async () => {
    setSeedingDemo(true)
    setSaveMessage(null)
    try {
      const response = await fetch('/api/demo/seed', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        setSaveMessage({
          type: 'success',
          text: `Demo data loaded! Created: ${Object.entries(data.results).map(([k, v]) => `${v} ${k}`).join(', ')}`
        })
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to seed demo data' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to seed demo data' })
    } finally {
      setSeedingDemo(false)
    }
  }

  const handleClearDemo = async () => {
    if (!confirm('Are you sure? This will delete all your shopping data.')) return
    setClearingDemo(true)
    setSaveMessage(null)
    try {
      const response = await fetch('/api/demo/seed', { method: 'DELETE' })
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'All data cleared successfully!' })
      } else {
        const data = await response.json()
        setSaveMessage({ type: 'error', text: data.error || 'Failed to clear data' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to clear data' })
    } finally {
      setClearingDemo(false)
    }
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
          <div>
            <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email</div>
            <div style={{ color: 'var(--text-muted)' }}>{user?.email || 'Not available'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Name</div>
            <div style={{ color: 'var(--text-muted)' }}>{user?.full_name || 'Not set'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Subscription</div>
            <div className={subscriptionDisplay[user?.subscription_tier || 'free'].color}>
              {subscriptionDisplay[user?.subscription_tier || 'free'].label}
            </div>
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
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
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
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
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
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
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
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
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

      {/* Demo Data Section */}
      <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Demo Data</h3>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Load sample data to explore all dashboard features</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-green-500">Load demo data</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Populate your dashboard with realistic sample data including shopping lists, receipts, savings history, and AI insights</p>
            </div>
            <button
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {seedingDemo ? 'Loading...' : 'Load Demo Data'}
            </button>
          </div>
          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span className="font-medium text-yellow-500">Clear all data</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Remove all shopping data (lists, receipts, savings, etc.)</p>
            </div>
            <button
              onClick={handleClearDemo}
              disabled={clearingDemo}
              className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-black transition disabled:opacity-50"
            >
              {clearingDemo ? 'Clearing...' : 'Clear Data'}
            </button>
          </div>
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
            <button className="px-4 py-2 rounded-lg hover:border-green-500 transition" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              Export
            </button>
          </div>
          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span className="font-medium text-red-500">Delete account</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Permanently delete your account and all associated data</p>
            </div>
            <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
