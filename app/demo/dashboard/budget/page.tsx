'use client'

// Inline mock data for budget page
const BUDGET = {
  total: 800,
  spent: 623,
  remaining: 177,
}

const CATEGORIES = [
  { name: 'Groceries', budgeted: 600, spent: 487, color: '#22c55e' },
  { name: 'Household Supplies', budgeted: 100, spent: 72, color: '#3b82f6' },
  { name: 'Personal Care', budgeted: 50, spent: 38, color: '#a855f7' },
  { name: 'Pet', budgeted: 50, spent: 26, color: '#f59e0b' },
]

const RECOMMENDATIONS = [
  {
    id: '1',
    icon: '💡',
    text: "You're on track to come in $47 under your grocery budget this month. Consider stocking up on non-perishable staples like rice, canned goods, and pasta while you have room.",
  },
  {
    id: '2',
    icon: '🥩',
    text: 'Switching your weekly chicken and ground beef purchases from Publix to Kroger or ALDI could save you $12-18 per month based on your typical quantities.',
  },
  {
    id: '3',
    icon: '🏠',
    text: 'Your household supplies spending is higher than average. Buying paper towels and trash bags in bulk at Walmart or Costco could reduce this category by 20%.',
  },
  {
    id: '4',
    icon: '🎯',
    text: "You've been spending less on personal care this month -- great discipline! Redirecting that surplus toward next month's grocery budget would give you more flexibility for meal planning.",
  },
]

export default function DemoBudgetPage() {
  const spentPct = Math.round((BUDGET.spent / BUDGET.total) * 100)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Budget Optimizer</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Track spending against your monthly budget with AI-powered recommendations
        </p>
      </div>

      {/* Overall Budget */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Monthly Budget Overview
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Budget</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${BUDGET.total}
            </div>
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Spent</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${BUDGET.spent}
            </div>
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Remaining</div>
            <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
              ${BUDGET.remaining}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span style={{ color: 'var(--text-secondary)' }}>{spentPct}% spent</span>
            <span style={{ color: 'var(--text-muted)' }}>${BUDGET.remaining} remaining</span>
          </div>
          <div
            className="w-full h-4 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${spentPct}%`,
                backgroundColor: spentPct > 90 ? '#ef4444' : spentPct > 75 ? '#f59e0b' : '#22c55e',
              }}
            />
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Budget Categories
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['CATEGORY', 'BUDGETED', 'SPENT', 'REMAINING', 'PROGRESS'].map(h => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-wider pb-3 px-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const remaining = cat.budgeted - cat.spent
                const pct = Math.round((cat.spent / cat.budgeted) * 100)
                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ${cat.budgeted}
                    </td>
                    <td className="py-4 px-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${cat.spent}
                    </td>
                    <td className="py-4 px-2 text-sm font-semibold" style={{ color: '#22c55e' }}>
                      ${remaining}
                    </td>
                    <td className="py-4 px-2 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--bg-primary)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-xs font-semibold min-w-[32px] text-right" style={{ color: 'var(--text-muted)' }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendations */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Recommendations
        </h2>

        <div className="space-y-3">
          {RECOMMENDATIONS.map(rec => (
            <div
              key={rec.id}
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <span className="text-xl">{rec.icon}</span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {rec.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
