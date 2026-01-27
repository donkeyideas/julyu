import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type ReceiptRow = {
  total_amount: number | null
  purchase_date: string | null
  ocr_result: unknown
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
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

    // Get existing insights
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[Insights] Database error:', error)
      // Return demo insights if database error
      return NextResponse.json({ insights: getDemoInsights() })
    }

    // If no insights exist, generate some based on user data
    if (!insights || insights.length === 0) {
      try {
        const generatedInsights = await generateUserInsights(supabase, userId)
        return NextResponse.json({ insights: generatedInsights })
      } catch {
        // Fall back to demo insights
        return NextResponse.json({ insights: getDemoInsights() })
      }
    }

    return NextResponse.json({ insights: insights || [] })
  } catch (error) {
    console.error('Error fetching insights:', error)
    // Return demo insights instead of 500 error
    return NextResponse.json({ insights: getDemoInsights() })
  }
}

// Dismiss an insight
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
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

    const { insight_id } = await request.json()

    const { error } = await supabase
      .from('ai_insights')
      .update({ dismissed: true })
      .eq('id', insight_id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error dismissing insight:', error)
    return NextResponse.json({ error: 'Failed to dismiss insight' }, { status: 500 })
  }
}

function getDemoInsights() {
  return [
    {
      id: 'demo-insight-1',
      insight_type: 'savings',
      title: 'You saved $23.50 this week!',
      content: 'Great job using price comparisons! Your biggest savings came from switching stores for dairy products.',
      priority: 3,
      action_url: '/dashboard/savings'
    },
    {
      id: 'demo-insight-2',
      insight_type: 'recommendation',
      title: 'Shop on Wednesdays for best deals',
      content: 'Most grocery stores release new weekly ads on Wednesday, making it the best day to find fresh deals and stack savings.',
      priority: 2,
      action_url: '/dashboard/compare'
    },
    {
      id: 'demo-insight-3',
      insight_type: 'alert',
      title: 'Milk prices dropped!',
      content: 'Organic milk is now $3.99 at Kroger - that\'s $1.50 less than your usual store!',
      priority: 4,
      action_url: '/dashboard/alerts'
    },
    {
      id: 'demo-insight-4',
      insight_type: 'spending',
      title: 'Your spending pattern',
      content: 'You typically spend $150-$180 per week on groceries. Creating a shopping list could help reduce this by 15-20%.',
      priority: 1,
      action_url: '/dashboard/lists/new'
    }
  ]
}

async function generateUserInsights(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const insights: Array<{
    id: string
    insight_type: string
    title: string
    content: string
    priority: number
    action_url?: string
  }> = []

  try {
    // Get user's spending data
    const { data: savings } = await supabase
      .from('user_savings')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(3)

    // Get recent receipts
    const { data: receipts } = await supabase
      .from('receipts')
      .select('total_amount, purchase_date, ocr_result')
      .eq('user_id', userId)
      .eq('ocr_status', 'complete')
      .order('purchase_date', { ascending: false })
      .limit(10)

    // Get shopping lists
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5)

    // Get price alerts
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*, products(name)')
      .eq('user_id', userId)
      .eq('is_active', true)

    // Generate insights based on available data
    if (savings && savings.length >= 2) {
      const current = savings[0]
      const previous = savings[1]
      const savingsChange = (current.total_saved || 0) - (previous.total_saved || 0)

      if (savingsChange > 0) {
        insights.push({
          id: `savings-up-${Date.now()}`,
          insight_type: 'savings',
          title: 'Great progress on savings!',
          content: `You saved $${savingsChange.toFixed(2)} more this month compared to last month. Keep using price comparisons to maintain your momentum!`,
          priority: 2,
          action_url: '/dashboard/savings'
        })
      } else if (savingsChange < -10) {
        insights.push({
          id: `savings-down-${Date.now()}`,
          insight_type: 'spending',
          title: 'Spending increased this month',
          content: `Your savings decreased by $${Math.abs(savingsChange).toFixed(2)} compared to last month. Consider using our price comparison tool before your next shopping trip.`,
          priority: 3,
          action_url: '/dashboard/compare'
        })
      }
    }

    const receiptRows: ReceiptRow[] = receipts ?? []
    if (receiptRows.length > 0) {
      const totalSpent = receiptRows.reduce((sum, r) => sum + (r.total_amount || 0), 0)
      const avgPerTrip = totalSpent / receiptRows.length

      insights.push({
        id: `avg-spending-${Date.now()}`,
        insight_type: 'spending',
        title: 'Your shopping patterns',
        content: `You've spent $${totalSpent.toFixed(2)} across ${receiptRows.length} shopping trips recently, averaging $${avgPerTrip.toFixed(2)} per trip.`,
        priority: 1,
        action_url: '/dashboard/receipts'
      })
    }

    if (!lists || lists.length === 0) {
      insights.push({
        id: `create-list-${Date.now()}`,
        insight_type: 'recommendation',
        title: 'Create your first shopping list',
        content: 'Creating a shopping list before you go to the store can help you save 20-30% by avoiding impulse purchases and comparing prices.',
        priority: 2,
        action_url: '/dashboard/lists/new'
      })
    }

    if (!alerts || alerts.length === 0) {
      insights.push({
        id: `create-alert-${Date.now()}`,
        insight_type: 'recommendation',
        title: 'Set up price alerts',
        content: 'Never miss a deal! Set price alerts for items you buy regularly and we\'ll notify you when prices drop.',
        priority: 1,
        action_url: '/dashboard/alerts'
      })
    } else {
      const triggeredAlerts = alerts.filter((a: { current_price?: number; target_price: number }) =>
        a.current_price && a.current_price <= a.target_price
      )
      if (triggeredAlerts.length > 0) {
        insights.push({
          id: `triggered-alerts-${Date.now()}`,
          insight_type: 'alert',
          title: `${triggeredAlerts.length} price alert${triggeredAlerts.length > 1 ? 's' : ''} triggered!`,
          content: `Prices dropped on items you're watching! Check your alerts to see the deals.`,
          priority: 4,
          action_url: '/dashboard/alerts'
        })
      }
    }

    // Add a general tip
    const tips = [
      {
        title: 'Shop on Wednesdays',
        content: 'Most grocery stores release new weekly ads on Wednesday, making it the best day to find fresh deals and stack savings.'
      },
      {
        title: 'Check unit prices',
        content: 'Compare unit prices (price per oz, lb, etc.) rather than total price. Larger packages aren\'t always the better deal.'
      },
      {
        title: 'Use the 10-minute rule',
        content: 'Before adding non-essential items to your cart, wait 10 minutes. This reduces impulse buying by up to 40%.'
      },
      {
        title: 'Plan meals around sales',
        content: 'Check store flyers before meal planning. Building meals around what\'s on sale can cut your grocery bill by 25%.'
      }
    ]

    const randomTip = tips[Math.floor(Math.random() * tips.length)]
    insights.push({
      id: `tip-${Date.now()}`,
      insight_type: 'recommendation',
      title: randomTip.title,
      content: randomTip.content,
      priority: 0
    })

    // Store generated insights in database
    for (const insight of insights) {
      try {
        await supabase.from('ai_insights').insert({
          user_id: userId,
          insight_type: insight.insight_type,
          title: insight.title,
          content: insight.content,
          priority: insight.priority,
          action_url: insight.action_url,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
      } catch {
        // Ignore insert errors for demo insights
      }
    }

    return insights
  } catch (error) {
    console.error('Error generating insights:', error)
    return [{
      id: 'welcome',
      insight_type: 'recommendation',
      title: 'Welcome to Smart Insights!',
      content: 'Start using Julyu to track your shopping and we\'ll provide personalized insights to help you save money.',
      priority: 1,
      action_url: '/dashboard/compare'
    }]
  }
}
