import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ReceiptItem {
  name: string
  price: number
  quantity?: number
}

interface ItemWithSavings extends ReceiptItem {
  lowestPrice?: number
  lowestStore?: string
  savings?: number
}

async function getReceipt(id: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*, stores(name, retailer, address)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !receipt) return null

  // Calculate savings for each item
  const itemsWithSavings: ItemWithSavings[] = []

  if (receipt.ocr_result?.items) {
    for (const item of receipt.ocr_result.items as ReceiptItem[]) {
      const itemData: ItemWithSavings = { ...item }

      try {
        // Search for similar products
        const searchTerms = item.name.split(' ').slice(0, 3).join(' ')
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', `%${searchTerms}%`)
          .limit(5)

        if (products && products.length > 0) {
          const productIds = products.map((p: { id: string }) => p.id)

          // Get lowest price with store info
          const { data: prices } = await supabase
            .from('prices')
            .select('price, stores(name)')
            .in('product_id', productIds)
            .order('price', { ascending: true })
            .limit(1)

          if (prices && prices.length > 0) {
            itemData.lowestPrice = prices[0].price
            itemData.lowestStore = (prices[0].stores as { name?: string })?.name || 'Other Store'

            const itemTotal = item.price * (item.quantity || 1)
            if (prices[0].price < itemTotal) {
              itemData.savings = itemTotal - prices[0].price
            }
          }
        }
      } catch {
        // Keep item without savings data
      }

      itemsWithSavings.push(itemData)
    }
  }

  return { receipt, itemsWithSavings }
}

export default async function ReceiptDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getReceipt(id)

  if (!data) {
    notFound()
  }

  const { receipt, itemsWithSavings } = data

  const totalSavings = itemsWithSavings.reduce((sum, item) => sum + (item.savings || 0), 0)
  const itemsWithBetterPrices = itemsWithSavings.filter(item => item.savings && item.savings > 0)

  const storeName = receipt.stores?.name ||
    (receipt.ocr_result as { store?: { name?: string } })?.store?.name ||
    'Unknown Store'

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/receipts"
          className="text-gray-500 hover:text-white transition inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Receipts
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">{storeName}</h1>
          <p className="text-gray-500 mt-2">
            {receipt.purchase_date
              ? new Date(receipt.purchase_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : new Date(receipt.created_at).toLocaleDateString()}
          </p>
          {receipt.stores?.address && (
            <p className="text-gray-600 text-sm mt-1">{receipt.stores.address}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 text-center">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">${receipt.total_amount?.toFixed(2) || '0.00'}</div>
          </div>
          {totalSavings > 0 && (
            <div className="bg-green-500/15 border border-green-500/30 rounded-xl px-6 py-4 text-center">
              <div className="text-sm text-green-400">Could Save</div>
              <div className="text-2xl font-bold text-green-500">${totalSavings.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Savings Summary */}
      {itemsWithBetterPrices.length > 0 && (
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Savings Opportunities Found
          </h2>
          <p className="text-gray-400 mb-4">
            We found {itemsWithBetterPrices.length} item{itemsWithBetterPrices.length !== 1 ? 's' : ''} with
            better prices at other stores. You could save <span className="text-green-500 font-bold">${totalSavings.toFixed(2)}</span> next time!
          </p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(itemsWithBetterPrices.map(i => i.lowestStore))].map((store, idx) => (
              <span key={idx} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                {store}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="bg-black px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold">Items ({itemsWithSavings.length})</h2>
        </div>

        <div className="divide-y divide-gray-800">
          {itemsWithSavings.map((item, idx) => (
            <div key={idx} className="p-4 hover:bg-black/30">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.quantity && item.quantity > 1 && (
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                  {item.quantity && item.quantity > 1 && (
                    <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                  )}
                </div>
              </div>

              {item.savings && item.savings > 0 && (
                <div className="mt-3 flex items-center justify-between bg-green-500/10 rounded-lg px-3 py-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Better price at </span>
                    <span className="text-green-400 font-medium">{item.lowestStore}</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-white">${item.lowestPrice?.toFixed(2)}</span>
                  </div>
                  <span className="text-green-500 font-bold text-sm">
                    Save ${item.savings.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Receipt Totals */}
        <div className="bg-black px-6 py-4 border-t border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Subtotal</span>
            <span>${((receipt.total_amount || 0) - (receipt.tax_amount || 0)).toFixed(2)}</span>
          </div>
          {receipt.tax_amount && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Tax</span>
              <span>${receipt.tax_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-800">
            <span>Total</span>
            <span>${receipt.total_amount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/dashboard/compare"
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Compare Prices for These Items
        </Link>
        <Link
          href="/dashboard/lists/new"
          className="px-6 py-3 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition"
        >
          Create List from Receipt
        </Link>
      </div>

      {/* OCR Confidence */}
      {receipt.ocr_confidence && (
        <div className="mt-8 text-sm text-gray-600">
          OCR Confidence: {Math.round(receipt.ocr_confidence * 100)}%
        </div>
      )}
    </div>
  )
}
