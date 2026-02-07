'use client'

// Inline mock data for insights page
const SPENDING_CATEGORIES = [
  { category: 'Meat & Seafood', amount: 312.67, color: '#ef4444' },
  { category: 'Produce', amount: 234.18, color: '#22c55e' },
  { category: 'Dairy', amount: 178.42, color: '#3b82f6' },
  { category: 'Baby & Household', amount: 164.91, color: '#a855f7' },
  { category: 'Snacks & Beverages', amount: 142.89, color: '#f59e0b' },
  { category: 'Pantry Staples', amount: 118.36, color: '#06b6d4' },
  { category: 'Frozen Foods', amount: 95.24, color: '#6366f1' },
  { category: 'Bakery & Bread', amount: 87.53, color: '#ec4899' },
]

const maxAmount = Math.max(...SPENDING_CATEGORIES.map(c => c.amount))

interface Insight {
  id: string
  type: 'savings_tip' | 'trend' | 'deal'
  title: string
  description: string
  potentialSavings: number
  icon: string
}

const INSIGHTS: Insight[] = [
  {
    id: '1',
    type: 'savings_tip',
    title: 'Switch to ALDI for dairy products',
    description: 'Based on your last 3 months of purchases, you could save an average of $4.82 per trip by buying dairy items at ALDI instead of Publix.',
    potentialSavings: 19.28,
    icon: '💡',
  },
  {
    id: '2',
    type: 'trend',
    title: 'Your meat spending is trending up',
    description: "You've spent 18% more on meat and seafood this month compared to your 3-month average. Consider buying family packs at Kroger.",
    potentialSavings: 24.50,
    icon: '📈',
  },
  {
    id: '3',
    type: 'deal',
    title: 'Kroger BOGO on chicken breast this week',
    description: 'Kroger is running a buy-one-get-one-free deal on boneless chicken breast through this weekend. Since you buy chicken weekly, stock up!',
    potentialSavings: 9.98,
    icon: '🏷️',
  },
  {
    id: '4',
    type: 'savings_tip',
    title: 'Buy produce at local farmers market',
    description: "You spend an average of $58 on produce per week. Seasonal fruits and vegetables at farmers markets are typically 15-25% cheaper.",
    potentialSavings: 14.50,
    icon: '🥬',
  },
  {
    id: '5',
    type: 'trend',
    title: 'Your snack spending has decreased',
    description: "Great job! You've cut snack and beverage spending by 12% over the last 2 months by switching to store brands.",
    potentialSavings: 0,
    icon: '🎉',
  },
  {
    id: '6',
    type: 'deal',
    title: 'Stock up on pasta at Target this week',
    description: 'Target has Barilla pasta on sale for $0.99 per box (normally $1.89). Your purchase history shows you buy pasta every 2 weeks.',
    potentialSavings: 5.40,
    icon: '🍝',
  },
]

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  savings_tip: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', label: 'Savings Tip' },
  trend: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', label: 'Trend' },
  deal: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'Deal' },
}

export default function DemoInsightsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Smart Insights</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          AI-powered analysis of your spending patterns and savings opportunities
        </p>
      </div>

      {/* Spending by Category */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Spending by Category
        </h2>
        <div className="space-y-4">
          {SPENDING_CATEGORIES.map(cat => {
            const widthPct = (cat.amount / maxAmount) * 100
            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {cat.category}
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${cat.amount.toFixed(2)}
                  </span>
                </div>
                <div
                  className="w-full h-6 rounded-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{ width: `${widthPct}%`, backgroundColor: cat.color, opacity: 0.8 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Total: ${SPENDING_CATEGORIES.reduce((sum, c) => sum + c.amount, 0).toFixed(2)} across all categories
        </div>
      </div>

      {/* Insight Cards */}
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Personalized Insights
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INSIGHTS.map(insight => {
          const typeStyle = TYPE_COLORS[insight.type]
          return (
            <div
              key={insight.id}
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                      style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                    >
                      {typeStyle.label}
                    </span>
                    {insight.potentialSavings > 0 && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                      >
                        Save ${insight.potentialSavings.toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {insight.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
