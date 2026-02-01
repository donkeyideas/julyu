import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import Link from 'next/link'
import SettingsForm from '@/components/store-portal/SettingsForm'

export const metadata = {
  title: 'Settings - Store Portal - Julyu',
  description: 'Manage your store settings',
}

export default async function SettingsPage() {
  const supabase = await createServerClient()

  // Get user and store owner directly - layout handles auth redirects
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }

  // Get store owner record directly
  const { data: storeOwner } = await supabase
    .from('store_owners')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!storeOwner) {
    return (
      <div className="p-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
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
