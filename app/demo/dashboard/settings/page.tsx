'use client'

// Inline mock data for settings page
const USER_PROFILE = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@email.com',
  plan: 'Premium',
  zipCode: '45202',
  preferredStores: ['Kroger', 'ALDI', 'Walmart'],
  notifications: true,
  memberSince: 'January 2024',
}

const SETTINGS_SECTIONS = [
  {
    title: 'Profile Information',
    fields: [
      { label: 'Full Name', value: USER_PROFILE.name },
      { label: 'Email', value: USER_PROFILE.email },
      { label: 'Member Since', value: USER_PROFILE.memberSince },
    ],
  },
  {
    title: 'Subscription',
    fields: [
      { label: 'Current Plan', value: USER_PROFILE.plan, badge: true },
      { label: 'Features', value: 'Unlimited comparisons, AI insights, price alerts, receipt scanning' },
    ],
  },
  {
    title: 'Shopping Preferences',
    fields: [
      { label: 'Zip Code', value: USER_PROFILE.zipCode },
      { label: 'Preferred Stores', value: USER_PROFILE.preferredStores.join(', ') },
    ],
  },
]

export default function DemoSettingsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Demo Notice */}
      <div
        className="rounded-xl p-4 mb-8 flex items-center gap-3"
        style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
      >
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Demo Mode</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This is a demo -- settings cannot be modified. Sign up for a real account to customize your experience.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {SETTINGS_SECTIONS.map(section => (
          <div
            key={section.title}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div
                  key={field.label}
                  className="flex items-start justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {field.label}
                  </div>
                  <div className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>
                    {'badge' in field && field.badge ? (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                      >
                        {field.value}
                      </span>
                    ) : (
                      field.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Notifications */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Price Alert Notifications', description: 'Get notified when tracked prices drop', enabled: true },
              { label: 'Weekly Savings Report', description: 'Receive a summary of your savings every Monday', enabled: true },
              { label: 'Deal Alerts', description: 'Get notified about deals at your preferred stores', enabled: true },
              { label: 'Marketing Emails', description: 'Receive promotional offers and updates', enabled: false },
            ].map(notif => (
              <div
                key={notif.label}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {notif.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {notif.description}
                  </div>
                </div>
                <div
                  className="w-10 h-6 rounded-full relative cursor-not-allowed opacity-60"
                  style={{
                    backgroundColor: notif.enabled ? '#22c55e' : 'var(--bg-primary)',
                    border: notif.enabled ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: notif.enabled ? '22px' : '2px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: '#ef4444' }}>
            Danger Zone
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            These actions are irreversible. Not available in demo mode.
          </p>
          <div className="flex gap-3">
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
              style={{ border: '1px solid #ef4444', color: '#ef4444' }}
            >
              Export All Data
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
