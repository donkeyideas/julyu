import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import Link from 'next/link'
import SettingsForm from '@/components/store-portal/SettingsForm'

export const metadata = {
  title: 'Settings - Store Portal - Julyu',
  description: 'Manage your store settings',
}

export default async function SettingsPage() {
  // Use cached auth helper - same as layout for consistent auth state
  const { storeOwner, user, error } = await getStoreOwnerAnyStatus()

  // Layout handles redirects, but if somehow we get here without auth, show nothing
  if (!storeOwner || !user) {
    return null
  }

  // Get store owner's stores
  const { stores } = await getStoreOwnerStores(storeOwner.id)
  const primaryStore = stores[0] || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your store settings and preferences
        </p>
      </div>

      <SettingsForm
        initialStoreOwner={storeOwner}
        initialStore={primaryStore}
      />
    </div>
  )
}
