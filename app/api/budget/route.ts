import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface CategorySpending {
  category: string
  monthly_limit: number
  current_spent: number
}

interface ReceiptItem {
  description?: string
  amount?: number
  category?: string
}

interface BudgetRecommendation {
  id: string
  recommendation_type: string | null
  title: string | null
  description: string | null
  potential_savings: number | null
  implemented: boolean | null
}

// Category mapping for receipt items
const categoryPatterns: Record<string, RegExp[]> = {
  'Produce': [/fruit/i, /vegetable/i, /apple/i, /banana/i, /tomato/i, /lettuce/i, /carrot/i, /onion/i, /potato/i],
  'Dairy': [/milk/i, /cheese/i, /yogurt/i, /butter/i, /cream/i, /egg/i],
  'Meat & Seafood': [/chicken/i, /beef/i, /pork/i, /fish/i, /salmon/i, /shrimp/i, /turkey/i, /bacon/i],
  'Pantry Staples': [/bread/i, /rice/i, /pasta/i, /flour/i, /sugar/i, /oil/i, /cereal/i, /oat/i],
  'Snacks & Beverages': [/chips/i, /soda/i, /juice/i, /water/i, /coffee/i, /tea/i, /snack/i, /cookie/i],
  'Household': [/paper/i, /towel/i, /soap/i, /detergent/i, /trash/i, /clean/i],
  'Frozen Foods': [/frozen/i, /ice cream/i, /pizza/i],
}

function categorizeItem(description: string): string {
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(description)) {
        return category
      }
    }
  }
  return 'Other'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month's start date
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)

    // Fetch receipts, user budgets, and recommendations in parallel
    const [receiptsResult, userBudgetsResult, recommendationsResult] = await Promise.all([
      supabase
        .from('receipts')
        .select('id, total_amount, ocr_result, purchase_date')
        .eq('user_id', userId)
        .eq('ocr_status', 'complete')
        .gte('purchase_date', currentMonthStart.toISOString()),
      supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonthStart.toISOString().slice(0, 7) + '-01'),
      supabase
        .from('budget_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('potential_savings', { ascending: false })
        .limit(6),
    ])

    const { data: receipts, error: receiptsError } = receiptsResult
    const { data: userBudgets } = userBudgetsResult
    const { data: recommendations } = recommendationsResult

    if (receiptsError) {
      console.error('Failed to fetch receipts:', receiptsError)
    }

    // Calculate spending by category
    const categorySpending: Record<string, number> = {}
    let totalSpent = 0

    if (receipts && receipts.length > 0) {
      for (const receipt of receipts) {
        totalSpent += receipt.total_amount || 0

        // Parse OCR result to extract items
        const ocrResult = receipt.ocr_result as { items?: ReceiptItem[] } | null
        if (ocrResult?.items) {
          for (const item of ocrResult.items) {
            const category = item.category || categorizeItem(item.description || '')
            categorySpending[category] = (categorySpending[category] || 0) + (item.amount || 0)
          }
        }
      }
    }

    // Build category list with limits
    const defaultLimits: Record<string, number> = {
      'Produce': 100,
      'Dairy': 60,
      'Meat & Seafood': 120,
      'Pantry Staples': 80,
      'Snacks & Beverages': 50,
      'Household': 40,
      'Frozen Foods': 30,
      'Other': 50,
    }

    const categories: CategorySpending[] = []

    // If user has budget data, use it
    if (userBudgets && userBudgets.length > 0) {
      for (const budget of userBudgets) {
        categories.push({
          category: budget.category || 'Other',
          monthly_limit: budget.monthly_limit || defaultLimits[budget.category || 'Other'] || 50,
          current_spent: categorySpending[budget.category || 'Other'] || 0,
        })
      }
    } else {
      // Use default categories with spending data
      for (const [category, spent] of Object.entries(categorySpending)) {
        categories.push({
          category,
          monthly_limit: defaultLimits[category] || 50,
          current_spent: spent,
        })
      }
    }

    return NextResponse.json({
      categories: categories.sort((a, b) => b.current_spent - a.current_spent),
      totalSpent,
      receiptsCount: receipts?.length || 0,
      recommendations: recommendations?.map((r: BudgetRecommendation) => ({
        id: r.id,
        recommendation_type: r.recommendation_type || 'general',
        title: r.title || 'Savings Tip',
        description: r.description || '',
        potential_savings: r.potential_savings || 0,
        implemented: r.implemented || false,
      })) || [],
    })
  } catch (error) {
    console.error('Budget API error:', error)
    return NextResponse.json({ error: 'Failed to fetch budget data' }, { status: 500 })
  }
}
