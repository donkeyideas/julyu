import Link from 'next/link'

export const metadata = {
  title: 'Settings - Store Portal - Julyu',
  description: 'Manage your store settings',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
          <p className="text-sm text-gray-600 mb-4">
            Update your store name, address, phone, and hours of operation.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            Coming in Phase 5
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage tax ID, business license, and legal information.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            Coming in Phase 5
          </div>
        </div>

        {/* POS Integration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">POS Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect and manage your Point of Sale system integration.
          </p>
          <Link
            href="/store-portal/inventory/pos-sync"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Configure POS Integration →
          </Link>
        </div>

        {/* Stripe Payouts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stripe Payouts</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set up Stripe Connect to receive payouts from your sales.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            Coming in Phase 4
          </div>
        </div>

        {/* Order Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure auto-accept orders, notification settings, and delivery options.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            Coming in Phase 3
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage your account email, password, and notification preferences.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            Coming in Phase 5
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Need help?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Contact our support team if you need assistance with your store settings.
        </p>
        <a
          href="mailto:support@julyu.com"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          support@julyu.com
        </a>
      </div>
    </div>
  )
}
