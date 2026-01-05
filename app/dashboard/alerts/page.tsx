import { createServerClient } from '@/lib/supabase/server'

async function getAlerts() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*, products(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return alerts || []
}

export default async function AlertsPage() {
  const alerts = await getAlerts()

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Price Alerts</h1>
        <button className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
          + New Alert
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Product</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Target Price</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Current Price</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alert: any) => {
                const isTriggered = alert.current_price && alert.current_price <= alert.target_price
                return (
                  <tr key={alert.id} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4">{alert.products?.name || 'Product'}</td>
                    <td className="p-4">${alert.target_price?.toFixed(2)}</td>
                    <td className={`p-4 font-bold ${isTriggered ? 'text-green-500' : ''}`}>
                      {alert.current_price ? `$${alert.current_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4">
                      {isTriggered ? (
                        <span className="text-green-500">✓ Alert!</span>
                      ) : (
                        <span className="text-gray-500">Waiting</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isTriggered ? (
                        <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500">
                          Shop Now
                        </button>
                      ) : (
                        <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No price alerts yet. Create an alert to be notified when prices drop!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


