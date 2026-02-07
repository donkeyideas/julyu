'use client'

export default function DemoSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Store Settings</h1>

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

      {/* Business Information */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SettingsField label="Business Name" value="Martinez Corner Market" />
          <SettingsField label="Business Type" value="Corner Store / Bodega" />
          <SettingsField label="Owner" value="Carlos Martinez" />
          <SettingsField label="Email" value="carlos@martinezmarket.com" />
          <SettingsField label="Phone" value="(718) 555-0142" />
          <SettingsField label="Tax ID" value="XX-XXXXXXX" />
        </div>
      </div>

      {/* Store Information */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <SettingsField label="Address" value="1247 Atlantic Ave, Brooklyn, NY 11216" />
          </div>
          <SettingsField label="Hours (Mon-Sat)" value="6:00 AM - 11:00 PM" />
          <SettingsField label="Hours (Sunday)" value="7:00 AM - 10:00 PM" />
          <SettingsField label="Delivery" value="Enabled (3 mile radius)" badge={{ text: 'Enabled', color: '#22c55e' }} />
          <SettingsField label="Pickup" value="Enabled" badge={{ text: 'Enabled', color: '#22c55e' }} />
        </div>
      </div>

      {/* Payment Settings */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Payment Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SettingsField label="Stripe Connected" value="Yes" badge={{ text: 'Connected', color: '#22c55e' }} />
          <SettingsField label="Commission Rate" value="12%" />
          <SettingsField label="Payout Schedule" value="Weekly" />
          <SettingsField label="Bank Account" value="...ending 4523" />
        </div>
      </div>

      {/* Order Preferences */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Order Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SettingsField label="Auto-accept orders" value="Yes" badge={{ text: 'Active', color: '#22c55e' }} />
          <SettingsField label="Min order for delivery" value="$15.00" />
          <SettingsField label="Estimated prep time" value="15-20 minutes" />
        </div>
      </div>
    </div>
  )
}

function SettingsField({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge?: { text: string; color: string }
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <p
          className="text-sm px-3 py-2 rounded-lg w-full"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {value}
        </p>
        {badge && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}
