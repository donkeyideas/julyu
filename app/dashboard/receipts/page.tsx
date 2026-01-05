import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getReceipts() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*, stores(name, retailer)')
    .eq('user_id', user.id)
    .order('purchase_date', { ascending: false })
    .limit(20)

  return receipts || []
}

export default async function ReceiptsPage() {
  const receipts = await getReceipts()

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Receipt History</h1>
        <Link href="/dashboard/receipts/scan" className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
          Scan New Receipt
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Date</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Store</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Items</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Total</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Potential Savings</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length > 0 ? (
              receipts.map((receipt: any) => (
                <tr key={receipt.id} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4">
                    {receipt.purchase_date
                      ? new Date(receipt.purchase_date).toLocaleDateString()
                      : new Date(receipt.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">{receipt.stores?.name || 'Unknown Store'}</td>
                  <td className="p-4">
                    {receipt.ocr_result?.items?.length || '-'}
                  </td>
                  <td className="p-4 font-bold">
                    ${receipt.total_amount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-4 text-green-500 font-bold">$0.00</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No receipts yet. Scan your first receipt to start tracking prices!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


