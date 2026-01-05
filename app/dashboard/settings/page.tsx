import { createServerClient } from '@/lib/supabase/server'

async function getUserData() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { user, preferences }
}

export default async function SettingsPage() {
  const data = await getUserData()

  if (!data) return null

  const { user, preferences } = data

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Settings</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold mb-6">Account</h3>
        <div className="space-y-6">
          <div>
            <div className="font-semibold mb-2">Email</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Subscription</div>
            <div className="text-green-500">
              Premium ($14.99/month)
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-6">Preferences</h3>
        <div className="space-y-4">
          <label className="flex justify-between items-center">
            <span>Price drop alerts</span>
            <input type="checkbox" defaultChecked={preferences?.notification_preferences?.price_alerts} />
          </label>
          <label className="flex justify-between items-center">
            <span>Weekly savings summary</span>
            <input type="checkbox" defaultChecked={preferences?.notification_preferences?.weekly_summary} />
          </label>
          <label className="flex justify-between items-center">
            <span>New feature updates</span>
            <input type="checkbox" />
          </label>
        </div>
      </div>
    </div>
  )
}


