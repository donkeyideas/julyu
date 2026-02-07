'use client'

// Inline mock data for receipts page
function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Receipt {
  id: string
  store: string
  date: string
  total: number
  items: number
  color: string
}

const RECEIPTS: Receipt[] = [
  { id: '1', store: 'Kroger', date: daysAgoStr(1), total: 67.43, items: 11, color: '#E31837' },
  { id: '2', store: 'Walmart', date: daysAgoStr(3), total: 89.17, items: 14, color: '#0071CE' },
  { id: '3', store: 'Target', date: daysAgoStr(5), total: 52.86, items: 8, color: '#CC0000' },
  { id: '4', store: 'Publix', date: daysAgoStr(7), total: 74.52, items: 10, color: '#3F8F29' },
  { id: '5', store: 'Kroger', date: daysAgoStr(10), total: 58.24, items: 9, color: '#E31837' },
  { id: '6', store: 'Walmart', date: daysAgoStr(12), total: 43.67, items: 8, color: '#0071CE' },
  { id: '7', store: 'Target', date: daysAgoStr(15), total: 61.38, items: 9, color: '#CC0000' },
  { id: '8', store: 'Publix', date: daysAgoStr(18), total: 82.95, items: 12, color: '#3F8F29' },
]

export default function DemoReceiptsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Receipts</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            View and manage your scanned grocery receipts
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition hover:opacity-90"
          style={{ backgroundColor: '#22c55e' }}
        >
          + Scan Receipt
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Receipts</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>89</div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>This Month</div>
          <div className="text-3xl font-bold" style={{ color: '#22c55e' }}>12</div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Tracked</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>$4,234</div>
        </div>
      </div>

      {/* Receipt Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {RECEIPTS.map(receipt => (
          <div
            key={receipt.id}
            className="rounded-xl p-6 transition hover:scale-[1.02] cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              {/* Receipt Icon with store color */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: receipt.color + '20' }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={receipt.color}
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: receipt.color }}
              />
            </div>

            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {receipt.store}
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              {receipt.date}
            </p>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  ${receipt.total.toFixed(2)}
                </div>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {receipt.items} items
              </div>
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                Processed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
