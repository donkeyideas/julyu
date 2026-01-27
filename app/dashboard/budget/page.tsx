'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Helper to get auth headers for API calls (supports Firebase/Google users)
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('julyu_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.id) headers['x-user-id'] = user.id
        if (user.email) headers['x-user-email'] = user.email
        if (user.full_name) headers['x-user-name'] = user.full_name
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

interface BudgetCategory {
  category: string
  monthly_limit: number
  current_spent: number
}

interface Recommendation {
  id: string
  recommendation_type: string
  title: string
  description: string
  potential_savings: number
  implemented: boolean
}

export default function BudgetPage() {
  const [totalBudget, setTotalBudget] = useState<number | null>(null)
  const [totalSpent, setTotalSpent] = useState(0)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState(false)
  const [newBudget, setNewBudget] = useState('')
  const [hasRealData, setHasRealData] = useState(false)

  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    try {
      // Load budget settings
      const settingsResponse = await fetch('/api/settings', { headers: getAuthHeaders() })
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        if (data.preferences?.budget_monthly) {
          setTotalBudget(data.preferences.budget_monthly)
          setNewBudget(data.preferences.budget_monthly.toString())
        }
      }

      // Load real spending data from budget API
      const budgetResponse = await fetch('/api/budget', { headers: getAuthHeaders() })
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json()

        if (budgetData.categories && budgetData.categories.length > 0) {
          setCategories(budgetData.categories)
          setTotalSpent(budgetData.totalSpent || 0)
          setHasRealData(true)
        }

        if (budgetData.recommendations && budgetData.recommendations.length > 0) {
          setRecommendations(budgetData.recommendations)
        }
      }
    } catch (error) {
      console.error('Failed to load budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveBudget = async () => {
    const budget = parseFloat(newBudget)
    if (isNaN(budget) || budget <= 0) return

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ budget_monthly: budget })
      })

      if (response.ok) {
        setTotalBudget(budget)
        setEditingBudget(false)
      }
    } catch (error) {
      console.error('Failed to save budget:', error)
    }
  }

  const implementRecommendation = async (id: string) => {
    try {
      await fetch('/api/budget/recommendations', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, implemented: true })
      })
      setRecommendations(prev =>
        prev.map(r => r.id === id ? { ...r, implemented: true } : r)
      )
    } catch (error) {
      console.error('Failed to update recommendation:', error)
      // Still update locally
      setRecommendations(prev =>
        prev.map(r => r.id === id ? { ...r, implemented: true } : r)
      )
    }
  }

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return 'text-red-500'
    if (percentage >= 80) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading budget data...</div>
        </div>
      </div>
    )
  }

  const budgetUsed = totalBudget ? (totalSpent / totalBudget) * 100 : 0
  const potentialSavings = recommendations
    .filter(r => !r.implemented)
    .reduce((sum, r) => sum + r.potential_savings, 0)

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Budget Optimizer</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Track spending and get AI recommendations to save more</p>
      </div>

      {/* No Data State */}
      {!hasRealData && categories.length === 0 && (
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Start Tracking Your Spending</h3>
          <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            Scan receipts or run price comparisons to see your spending breakdown by category and get personalized savings recommendations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard/receipts/scan"
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Scan Receipt
            </Link>
            <Link
              href="/dashboard/compare"
              className="px-6 py-3 rounded-lg hover:border-green-500 transition"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Compare Prices
            </Link>
          </div>
        </div>
      )}

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Budget Card */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Monthly Budget</div>
            <button
              onClick={() => setEditingBudget(true)}
              className="text-green-500 hover:text-green-400 text-sm"
            >
              Edit
            </button>
          </div>
          {editingBudget ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full rounded-lg pl-7 pr-3 py-2 focus:border-green-500 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={saveBudget}
                className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600"
              >
                Save
              </button>
            </div>
          ) : totalBudget ? (
            <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>${totalBudget.toFixed(2)}</div>
          ) : (
            <button
              onClick={() => setEditingBudget(true)}
              className="text-green-500 hover:text-green-400 font-semibold"
            >
              + Set Budget
            </button>
          )}
        </div>

        {/* Spent So Far */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Spent This Month</div>
          <div className={`text-4xl font-black ${totalBudget && budgetUsed >= 80 ? 'text-yellow-500' : ''} ${totalBudget && budgetUsed >= 100 ? 'text-red-500' : ''}`} style={{ color: totalBudget && (budgetUsed >= 80 || budgetUsed >= 100) ? undefined : 'var(--text-primary)' }}>
            ${totalSpent.toFixed(2)}
          </div>
          {totalBudget && (
            <div className="mt-3">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div
                  className={`h-full ${getProgressColor(totalSpent, totalBudget)} transition-all`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {budgetUsed.toFixed(0)}% of budget used
              </div>
            </div>
          )}
        </div>

        {/* Potential Savings */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6">
          <div className="text-sm text-green-400 mb-4">Potential Savings</div>
          <div className="text-4xl font-black text-green-500">
            ${potentialSavings.toFixed(2)}
          </div>
          <div className="text-sm text-green-400/70 mt-1">
            /month with recommendations
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Spending by Category</h2>
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                  <span className={getProgressTextColor(cat.current_spent, cat.monthly_limit)}>
                    ${cat.current_spent.toFixed(2)} / ${cat.monthly_limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div
                    className={`h-full ${getProgressColor(cat.current_spent, cat.monthly_limit)} transition-all`}
                    style={{ width: `${Math.min((cat.current_spent / cat.monthly_limit) * 100, 100)}%` }}
                  />
                </div>
                {cat.current_spent > cat.monthly_limit && (
                  <div className="text-xs text-red-500 mt-1">
                    Over budget by ${(cat.current_spent - cat.monthly_limit).toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Recommendations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className={`rounded-2xl p-6 transition ${
                  rec.implemented
                    ? 'border-green-500/30 opacity-60'
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: 'var(--bg-card)', border: rec.implemented ? undefined : '1px solid var(--border-color)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 rounded text-xs capitalize" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    {rec.recommendation_type.replace('_', ' ')}
                  </span>
                  <span className="text-green-500 font-bold">
                    Save ${rec.potential_savings.toFixed(2)}/mo
                  </span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{rec.title}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{rec.description}</p>
                {rec.implemented ? (
                  <span className="inline-flex items-center gap-1 text-green-500 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Implemented
                  </span>
                ) : (
                  <button
                    onClick={() => implementRecommendation(rec.id)}
                    className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm"
                  >
                    Mark as Done
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/compare"
          className="rounded-2xl p-6 hover:opacity-90 transition group"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Compare Prices</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Find the best deals before you shop</p>
        </Link>

        <Link
          href="/dashboard/receipts/scan"
          className="rounded-2xl p-6 hover:opacity-90 transition group"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Scan Receipt</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track your spending automatically</p>
        </Link>

        <Link
          href="/dashboard/assistant"
          className="rounded-2xl p-6 hover:opacity-90 transition group"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Ask AI Assistant</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Get personalized budget advice</p>
        </Link>
      </div>
    </div>
  )
}
