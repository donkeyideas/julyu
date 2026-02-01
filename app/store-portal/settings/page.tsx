import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import Link from 'next/link'
import SettingsForm from '@/components/store-portal/SettingsForm'

export const metadata = {
  title: 'Settings - Store Portal - Julyu',
  description: 'Manage your store settings',
}

export default async function SettingsPage() {
  // Get auth - layout handles redirects for unauthenticated users
  const { storeOwner, user, error } = await getStoreOwnerAnyStatus()

  // If no auth, show a refresh message (layout should have redirected, but just in case)
  if (!storeOwner || !user) {
    return (
      <div className="p-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Session loading... If this persists, please refresh the page.</p>
      </div>
    )
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
