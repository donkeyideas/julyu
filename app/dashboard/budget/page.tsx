'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

  // Demo categories for when no real data exists
  const demoCategories: BudgetCategory[] = [
    { category: 'Produce', monthly_limit: 100, current_spent: 78.50 },
    { category: 'Dairy', monthly_limit: 60, current_spent: 45.20 },
    { category: 'Meat & Seafood', monthly_limit: 120, current_spent: 98.00 },
    { category: 'Pantry Staples', monthly_limit: 80, current_spent: 62.30 },
    { category: 'Snacks & Beverages', monthly_limit: 50, current_spent: 55.00 },
    { category: 'Household', monthly_limit: 40, current_spent: 28.50 },
  ]

  const demoRecommendations: Recommendation[] = [
    {
      id: '1',
      recommendation_type: 'store_change',
      title: 'Switch stores for dairy products',
      description: 'Based on your purchase history, you could save an average of $12/month by buying dairy at Aldi instead of your current store.',
      potential_savings: 12.00,
      implemented: false
    },
    {
      id: '2',
      recommendation_type: 'substitution',
      title: 'Try store brand alternatives',
      description: 'Switching to store brands for 5 commonly purchased items could save you $8.50/month without sacrificing quality.',
      potential_savings: 8.50,
      implemented: false
    },
    {
      id: '3',
      recommendation_type: 'bulk_buy',
      title: 'Buy rice and pasta in bulk',
      description: 'You buy these items frequently. Purchasing in bulk once a month instead of weekly would save $4.20/month.',
      potential_savings: 4.20,
      implemented: false
    },
    {
      id: '4',
      recommendation_type: 'timing',
      title: 'Shop on Wednesday mornings',
      description: 'Stores restock on Tuesdays and mark down items. Wednesday morning shopping could save you $6/month on discounted items.',
      potential_savings: 6.00,
      implemented: false
    }
  ]

  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    try {
      // Try to load from settings first
      const settingsResponse = await fetch('/api/settings')
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        if (data.preferences?.budget_monthly) {
          setTotalBudget(data.preferences.budget_monthly)
          setNewBudget(data.preferences.budget_monthly.toString())
        }
      }

      // Use demo data for now
      setCategories(demoCategories)
      setRecommendations(demoRecommendations)
      setTotalSpent(demoCategories.reduce((sum, c) => sum + c.current_spent, 0))
    } catch (error) {
      console.error('Failed to load budget data:', error)
      setCategories(demoCategories)
      setRecommendations(demoRecommendations)
      setTotalSpent(demoCategories.reduce((sum, c) => sum + c.current_spent, 0))
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
        headers: { 'Content-Type': 'application/json' },
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

  const implementRecommendation = (id: string) => {
    setRecommendations(prev =>
      prev.map(r => r.id === id ? { ...r, implemented: true } : r)
    )
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
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading budget data...</div>
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
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Budget Optimizer</h1>
        <p className="text-gray-500 mt-2">Track spending and get AI recommendations to save more</p>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Budget Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm text-gray-500">Monthly Budget</div>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 focus:border-green-500 focus:outline-none"
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
            <div className="text-4xl font-black">${totalBudget.toFixed(2)}</div>
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Spent This Month</div>
          <div className={`text-4xl font-black ${totalBudget && budgetUsed >= 80 ? 'text-yellow-500' : ''} ${totalBudget && budgetUsed >= 100 ? 'text-red-500' : ''}`}>
            ${totalSpent.toFixed(2)}
          </div>
          {totalBudget && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(totalSpent, totalBudget)} transition-all`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Spending by Category</h2>
        <div className="space-y-4">
          {categories.map((cat, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{cat.category}</span>
                <span className={getProgressTextColor(cat.current_spent, cat.monthly_limit)}>
                  ${cat.current_spent.toFixed(2)} / ${cat.monthly_limit.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
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

      {/* AI Recommendations */}
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
              className={`bg-gray-900 border rounded-2xl p-6 transition ${
                rec.implemented
                  ? 'border-green-500/30 opacity-60'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs capitalize">
                  {rec.recommendation_type.replace('_', ' ')}
                </span>
                <span className="text-green-500 font-bold">
                  Save ${rec.potential_savings.toFixed(2)}/mo
                </span>
              </div>
              <h3 className="font-bold mb-2">{rec.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{rec.description}</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/compare"
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition group"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1">Compare Prices</h3>
          <p className="text-gray-500 text-sm">Find the best deals before you shop</p>
        </Link>

        <Link
          href="/dashboard/receipts/scan"
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition group"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1">Scan Receipt</h3>
          <p className="text-gray-500 text-sm">Track your spending automatically</p>
        </Link>

        <Link
          href="/dashboard/assistant"
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition group"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1">Ask AI Assistant</h3>
          <p className="text-gray-500 text-sm">Get personalized budget advice</p>
        </Link>
      </div>
    </div>
  )
}
