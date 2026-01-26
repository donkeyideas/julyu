import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface ReceiptItem {
  name: string
  price: number
  quantity?: number
}

interface Receipt {
  id: string
  purchase_date: string | null
  created_at: string
  total_amount: number | null
  ocr_status: string | null
  ocr_result: {
    items?: ReceiptItem[]
    store?: { name?: string }
  } | null
  stores: {
    name: string | null
    retailer: string | null
  } | null
  potential_savings?: number
}

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

  if (!receipts) return []

  // Calculate potential savings for each receipt
  const receiptsWithSavings = await Promise.all(
    receipts.map(async (receipt: Receipt) => {
      const savings = await calculatePotentialSavings(supabase, receipt)
      return { ...receipt, potential_savings: savings }
    })
  )

  return receiptsWithSavings
}

async function calculatePotentialSavings(
  supabase: ReturnType<typeof createServerClient>,
  receipt: Receipt
): Promise<number> {
  if (!receipt.ocr_result?.items || receipt.ocr_result.items.length === 0) {
    return 0
  }

  let totalSavings = 0

  for (const item of receipt.ocr_result.items) {
    try {
      // Search for similar products
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${item.name.split(' ').slice(0, 2).join(' ')}%`)
        .limit(3)

      if (!products || products.length === 0) continue

      // Get lowest price for any of these products
      const productIds = products.map((p: { id: string }) => p.id)
      const { data: prices } = await supabase
        .from('prices')
        .select('price')
        .in('product_id', productIds)
        .order('price', { ascending: true })
        .limit(1)

      if (prices && prices.length > 0) {
        const lowestPrice = prices[0].price
        const itemPrice = item.price * (item.quantity || 1)

        if (lowestPrice < itemPrice) {
          totalSavings += itemPrice - lowestPrice
        }
      }
    } catch {
      // Skip items that fail to match
      continue
    }
  }

  return totalSavings
}

export default async function ReceiptsPage() {
  const receipts = await getReceipts()

  const totalPotentialSavings = receipts.reduce(
    (sum, r) => sum + (r.potential_savings || 0),
    0
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Receipt History</h1>
          <p className="text-gray-500 mt-2">Track your purchases and find savings opportunities</p>
        </div>
        <Link
          href="/dashboard/receipts/scan"
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Scan New Receipt
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500 mb-1">Total Receipts</div>
          <div className="text-3xl font-bold">{receipts.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500 mb-1">Total Spent</div>
          <div className="text-3xl font-bold">
            ${receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-sm text-green-400 mb-1">Potential Savings Found</div>
          <div className="text-3xl font-bold text-green-500">
            ${totalPotentialSavings.toFixed(2)}
          </div>
        </div>
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
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length > 0 ? (
              receipts.map((receipt) => {
                const itemCount = receipt.ocr_result?.items?.length || 0
                const hasSavings = (receipt.potential_savings || 0) > 0

                return (
                  <tr key={receipt.id} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4">
                      {receipt.purchase_date
                        ? new Date(receipt.purchase_date).toLocaleDateString()
                        : new Date(receipt.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {receipt.stores?.name || receipt.ocr_result?.store?.name || 'Unknown Store'}
                      </div>
                      {receipt.stores?.retailer && receipt.stores.retailer !== receipt.stores.name && (
                        <div className="text-sm text-gray-500">{receipt.stores.retailer}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-800 rounded text-sm">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      ${receipt.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4">
                      {hasSavings ? (
                        <span className="text-green-500 font-bold">
                          ${receipt.potential_savings?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/dashboard/receipts/${receipt.id}`}
                        className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition inline-block text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    No receipts yet
                  </div>
                  <p className="text-gray-600 mb-6">Scan your first receipt to start tracking prices and finding savings!</p>
                  <Link
                    href="/dashboard/receipts/scan"
                    className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition inline-block"
                  >
                    Scan Your First Receipt
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tips Section */}
      {receipts.length > 0 && (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            How We Calculate Savings
          </h3>
          <p className="text-gray-500 text-sm">
            We compare prices on your receipt to the lowest prices we&apos;ve found across all stores in our database.
            The &quot;Potential Savings&quot; shows how much you could save by shopping at stores with better prices for those items.
            Click &quot;View Details&quot; on any receipt to see item-by-item comparisons.
          </p>
        </div>
      )}
    </div>
  )
}
