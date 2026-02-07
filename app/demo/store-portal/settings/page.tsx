'use client'

export default function DemoSettingsPage() {
  // Mock data
  const storeForm = {
    name: 'Martinez Corner Market',
    address: '1247 Atlantic Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11216',
    phone: '(718) 555-0142',
  }

  const businessForm = {
    business_name: 'Martinez Corner Market LLC',
    business_type: 'bodega',
    business_address: '1247 Atlantic Ave, Brooklyn, NY 11216',
    business_phone: '(718) 555-0142',
    business_email: 'carlos@martinezmarket.com',
    tax_id: 'XX-XXXXXXX',
    business_license: 'BL-MCM-2024',
  }

  const orderPreferences = {
    accepts_orders: true,
    auto_accept_orders: true,
  }

  const commissionRate = 12
  const stripeConnected = true
  const applicationStatus = 'approved'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your store settings and preferences
        </p>
      </div>

      {/* Demo Notice */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
      >
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-500">Demo Mode</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This is a demo &mdash; settings cannot be modified. All information shown is sample data.
          </p>
        </div>
      </div>

      {/* Store Information */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
          {/* Verification Status Badges */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Location Set
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Active
            </span>
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Store Name
            </label>
            <input
              type="text"
              value={storeForm.name}
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Address
            </label>
            <input
              type="text"
              value={storeForm.address}
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                City
              </label>
              <input
                type="text"
                value={storeForm.city}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                State
              </label>
              <input
                type="text"
                value={storeForm.state}
                readOnly
                disabled
                maxLength={2}
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                ZIP Code
              </label>
              <input
                type="text"
                value={storeForm.zip}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Store Phone
            </label>
            <input
              type="tel"
              value={storeForm.phone}
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md disabled:opacity-50 cursor-not-allowed"
            >
              Save Store Info (Demo)
            </button>
          </div>
        </form>
      </div>

      {/* Business Information */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Business Information</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Name
              </label>
              <input
                type="text"
                value={businessForm.business_name}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Type
              </label>
              <select
                value={businessForm.business_type}
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="bodega">Bodega</option>
                <option value="convenience">Convenience Store</option>
                <option value="grocery">Grocery Store</option>
                <option value="market">Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Business Address
            </label>
            <input
              type="text"
              value={businessForm.business_address}
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Phone
              </label>
              <input
                type="tel"
                value={businessForm.business_phone}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Email
              </label>
              <input
                type="email"
                value={businessForm.business_email}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={businessForm.tax_id}
                readOnly
                disabled
                placeholder="12-3456789"
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business License #
              </label>
              <input
                type="text"
                value={businessForm.business_license}
                readOnly
                disabled
                placeholder="BL-123456"
                className="w-full px-3 py-2 rounded-md opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md disabled:opacity-50 cursor-not-allowed"
            >
              Save Business Info (Demo)
            </button>
          </div>
        </form>
      </div>

      {/* Order Preferences */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Accept Orders</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                When enabled, customers can place orders at your store
              </p>
            </div>
            <button
              type="button"
              disabled
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-not-allowed opacity-70 ${
                orderPreferences.accepts_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                orderPreferences.accepts_orders ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Auto-Accept Orders</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Automatically accept incoming orders without manual review
              </p>
            </div>
            <button
              type="button"
              disabled
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-not-allowed opacity-70 ${
                orderPreferences.auto_accept_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                orderPreferences.auto_accept_orders ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md disabled:opacity-50 cursor-not-allowed"
            >
              Save Preferences (Demo)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission & Payouts */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Commission & Payouts</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Commission Rate</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {commissionRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Stripe Status</span>
              <span className="font-semibold text-green-500">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* POS Integration */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>POS Integration</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Connect your Point of Sale system to automatically sync inventory.
          </p>
          <span className="inline-flex items-center text-sm text-green-500 opacity-70 cursor-not-allowed">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Configure POS Integration (Demo)
          </span>
        </div>
      </div>

      {/* Account Status */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Status</h2>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-3 bg-green-500" />
          <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
            {applicationStatus}
          </span>
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Your store account is currently {applicationStatus}. You can receive and fulfill orders.
        </p>
      </div>

      {/* Support */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Need help?</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Contact our support team if you need assistance with your store settings.
        </p>
        <a href="mailto:info@donkeyideas.com" className="text-sm text-green-500 hover:text-green-400">
          info@donkeyideas.com
        </a>
      </div>
    </div>
  )
}
