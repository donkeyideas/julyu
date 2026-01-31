import Link from 'next/link'

export const metadata = {
  title: 'Settings - Store Portal - Julyu',
  description: 'Manage your store settings',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your store settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Information */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Update your store name, address, phone, and hours of operation.
          </p>
          <div className="rounded-md p-3 text-sm bg-green-500/10 text-green-500 border border-green-500/30">
            Coming in Phase 5
          </div>
        </div>

        {/* Business Settings */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Business Settings</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Manage tax ID, business license, and legal information.
          </p>
          <div className="rounded-md p-3 text-sm bg-green-500/10 text-green-500 border border-green-500/30">
            Coming in Phase 5
          </div>
        </div>

        {/* POS Integration */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>POS Integration</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Connect and manage your Point of Sale system integration.
          </p>
          <Link
            href="/store-portal/inventory/pos-sync"
            className="text-sm text-green-500 hover:text-green-400"
          >
            Configure POS Integration →
          </Link>
        </div>

        {/* Stripe Payouts */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Stripe Payouts</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Set up Stripe Connect to receive payouts from your sales.
          </p>
          <div className="rounded-md p-3 text-sm bg-green-500/10 text-green-500 border border-green-500/30">
            Coming in Phase 4
          </div>
        </div>

        {/* Order Preferences */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Preferences</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Configure auto-accept orders, notification settings, and delivery options.
          </p>
          <div className="rounded-md p-3 text-sm bg-green-500/10 text-green-500 border border-green-500/30">
            Coming in Phase 3
          </div>
        </div>

        {/* Account */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Manage your account email, password, and notification preferences.
          </p>
          <div className="rounded-md p-3 text-sm bg-green-500/10 text-green-500 border border-green-500/30">
            Coming in Phase 5
          </div>
        </div>
      </div>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Need help?</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Contact our support team if you need assistance with your store settings.
        </p>
        <a
          href="mailto:support@julyu.com"
          className="text-sm text-green-500 hover:text-green-400"
        >
          support@julyu.com
        </a>
      </div>
    </div>
  )
}
