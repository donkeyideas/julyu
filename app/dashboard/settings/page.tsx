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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Settings</h1>
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-6">Account</h3>
        <div className="space-y-6">
          <div>
            <div className="font-semibold mb-2">Email</div>
            <div className="text-gray-500">{user?.email || 'Not available'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Name</div>
            <div className="text-gray-500">{user?.full_name || 'Not set'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Subscription</div>
            <div className={subscriptionDisplay[user?.subscription_tier || 'free'].color}>
              {subscriptionDisplay[user?.subscription_tier || 'free'].label}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-6">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium">Price drop alerts</span>
              <p className="text-sm text-gray-500">Get notified when items on your watchlist drop in price</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.price_alerts}
                onChange={() => updateNotificationPreference('price_alerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium">Weekly savings summary</span>
              <p className="text-sm text-gray-500">Receive a weekly report of your savings and spending</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.weekly_summary}
                onChange={() => updateNotificationPreference('weekly_summary')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium">New feature updates</span>
              <p className="text-sm text-gray-500">Learn about new features and improvements</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.notification_preferences.new_features}
                onChange={() => updateNotificationPreference('new_features')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-6">AI Features</h3>
        <div className="space-y-4">
          <label className="flex justify-between items-center cursor-pointer">
            <div>
              <span className="font-medium">Enable AI features</span>
              <p className="text-sm text-gray-500">Use AI for smart recommendations, insights, and budget optimization</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.ai_features_enabled}
                onChange={() => setSettings(prev => ({ ...prev, ai_features_enabled: !prev.ai_features_enabled }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Budget Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-6">Budget Settings</h3>
        <div className="space-y-6">
          <div>
            <label className="font-medium mb-2 block">Monthly grocery budget</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.budget_monthly || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  budget_monthly: e.target.value ? parseFloat(e.target.value) : null
                }))}
                placeholder="Enter amount"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-40 focus:border-green-500 focus:outline-none"
              />
              <span className="text-gray-500">per month</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Set a budget to get AI-powered spending alerts and recommendations</p>
          </div>
          <div>
            <label className="font-medium mb-2 block">Shopping frequency</label>
            <select
              value={settings.shopping_frequency}
              onChange={(e) => setSettings(prev => ({ ...prev, shopping_frequency: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-48 focus:border-green-500 focus:outline-none"
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

      {/* Danger Zone */}
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-red-500">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">Export my data</span>
              <p className="text-sm text-gray-500">Download all your data including shopping lists, receipts, and preferences</p>
            </div>
            <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500 transition">
              Export
            </button>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <div>
              <span className="font-medium text-red-500">Delete account</span>
              <p className="text-sm text-gray-500">Permanently delete your account and all associated data</p>
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
