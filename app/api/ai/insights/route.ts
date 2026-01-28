import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

type ReceiptRow = {
  total_amount: number | null
  purchase_date: string | null
  ocr_result: unknown
}

function resolveUserId(request: NextRequest, user: { id: string } | null): string | null {
  if (user) return user.id
  return request.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createServiceRoleClient()

    // Get existing non-dismissed insights
    const { data: insights, error } = await adminSupabase
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
      return NextResponse.json({ insights: [] })
    }

    // If user has active insights, return them
    if (insights && insights.length > 0) {
      return NextResponse.json({ insights })
    }

    // Check if user has ANY insights (including dismissed) — if so, don't regenerate
    const { count } = await adminSupabase
      .from('ai_insights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count && count > 0) {
      // User has dismissed all their insights — don't regenerate, show empty
      return NextResponse.json({ insights: [] })
    }

    // First-time user: generate insights from their data
    try {
      await generateUserInsights(adminSupabase, userId)

      // Re-fetch from DB so we return real UUIDs
      const { data: newInsights } = await adminSupabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({ insights: newInsights || [] })
    } catch (genErr) {
      console.error('[Insights] Generation error:', genErr)
      return NextResponse.json({ insights: [] })
    }
  } catch (error) {
    console.error('[Insights] Error:', error)
    return NextResponse.json({ insights: [] })
  }
}

// Dismiss an insight
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { insight_id } = await request.json()

    if (!insight_id) {
      return NextResponse.json({ error: 'Missing insight_id' }, { status: 400 })
    }

    const adminSupabase = createServiceRoleClient()

    const { error } = await adminSupabase
      .from('ai_insights')
      .update({ dismissed: true })
      .eq('id', insight_id)
      .eq('user_id', userId)

    if (error) {
      console.error('[Insights] Dismiss error:', error)
      return NextResponse.json({ error: 'Failed to dismiss insight' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Insights] Dismiss error:', error)
    return NextResponse.json({ error: 'Failed to dismiss insight' }, { status: 500 })
  }
}

async function generateUserInsights(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
) {
  // Fetch all user data in parallel
  const [savingsResult, receiptsResult, listsResult, alertsResult] = await Promise.all([
    supabase
      .from('user_savings')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(3),
    supabase
      .from('receipts')
      .select('total_amount, purchase_date, ocr_result')
      .eq('user_id', userId)
      .eq('ocr_status', 'complete')
      .order('purchase_date', { ascending: false })
      .limit(10),
    supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('price_alerts')
      .select('*, products(name)')
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  const savings = savingsResult.data
  const receipts = receiptsResult.data
  const lists = listsResult.data
  const alerts = alertsResult.data

  const insightsToInsert: Array<{
    user_id: string
    insight_type: string
    title: string
    content: string
    priority: number
    action_url?: string
    expires_at: string
  }> = []

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Generate insights based on available data
  if (savings && savings.length >= 2) {
    const current = savings[0]
    const previous = savings[1]
    const savingsChange = (current.total_saved || 0) - (previous.total_saved || 0)

    if (savingsChange > 0) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'savings',
        title: 'Great progress on savings!',
        content: `You saved $${savingsChange.toFixed(2)} more this month compared to last month. Keep using price comparisons to maintain your momentum!`,
        priority: 2,
        action_url: '/dashboard/savings',
        expires_at: expiresAt,
      })
    } else if (savingsChange < -10) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'spending',
        title: 'Spending increased this month',
        content: `Your savings decreased by $${Math.abs(savingsChange).toFixed(2)} compared to last month. Consider using our price comparison tool before your next shopping trip.`,
        priority: 3,
        action_url: '/dashboard/compare',
        expires_at: expiresAt,
      })
    }
  }

  const receiptRows: ReceiptRow[] = receipts ?? []
  if (receiptRows.length > 0) {
    const totalSpent = receiptRows.reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const avgPerTrip = totalSpent / receiptRows.length

    insightsToInsert.push({
      user_id: userId,
      insight_type: 'spending',
      title: 'Your shopping patterns',
      content: `You've spent $${totalSpent.toFixed(2)} across ${receiptRows.length} shopping trips recently, averaging $${avgPerTrip.toFixed(2)} per trip.`,
      priority: 1,
      action_url: '/dashboard/receipts',
      expires_at: expiresAt,
    })
  }

  if (!lists || lists.length === 0) {
    insightsToInsert.push({
      user_id: userId,
      insight_type: 'recommendation',
      title: 'Create your first shopping list',
      content: 'Creating a shopping list before you go to the store can help you save 20-30% by avoiding impulse purchases and comparing prices.',
      priority: 2,
      action_url: '/dashboard/lists/new',
      expires_at: expiresAt,
    })
  }

  if (!alerts || alerts.length === 0) {
    insightsToInsert.push({
      user_id: userId,
      insight_type: 'recommendation',
      title: 'Set up price alerts',
      content: 'Never miss a deal! Set price alerts for items you buy regularly and we\'ll notify you when prices drop.',
      priority: 1,
      action_url: '/dashboard/alerts',
      expires_at: expiresAt,
    })
  } else {
    const triggeredAlerts = alerts.filter((a: { current_price?: number; target_price: number }) =>
      a.current_price && a.current_price <= a.target_price
    )
    if (triggeredAlerts.length > 0) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'alert',
        title: `${triggeredAlerts.length} price alert${triggeredAlerts.length > 1 ? 's' : ''} triggered!`,
        content: 'Prices dropped on items you\'re watching! Check your alerts to see the deals.',
        priority: 4,
        action_url: '/dashboard/alerts',

        expires_at: expiresAt,
      })
    }
  }

  // Add a general tip
  const tips = [
    {
      title: 'Shop on Wednesdays',
      content: 'Most grocery stores release new weekly ads on Wednesday, making it the best day to find fresh deals and stack savings.',
    },
    {
      title: 'Check unit prices',
      content: 'Compare unit prices (price per oz, lb, etc.) rather than total price. Larger packages aren\'t always the better deal.',
    },
    {
      title: 'Use the 10-minute rule',
      content: 'Before adding non-essential items to your cart, wait 10 minutes. This reduces impulse buying by up to 40%.',
    },
    {
      title: 'Plan meals around sales',
      content: 'Check store flyers before meal planning. Building meals around what\'s on sale can cut your grocery bill by 25%.',
    },
  ]

  const randomTip = tips[Math.floor(Math.random() * tips.length)]
  insightsToInsert.push({
    user_id: userId,
    insight_type: 'recommendation',
    title: randomTip.title,
    content: randomTip.content,
    priority: 0,
    expires_at: expiresAt,
  })

  // If no data-driven insights were generated, add a welcome insight
  if (insightsToInsert.length <= 1) {
    insightsToInsert.push({
      user_id: userId,
      insight_type: 'recommendation',
      title: 'Welcome to Smart Insights!',
      content: 'Start scanning receipts and comparing prices to get personalized tips and savings recommendations.',
      priority: 1,
      action_url: '/dashboard/compare',
      expires_at: expiresAt,
    })
  }

  // Batch insert all insights
  if (insightsToInsert.length > 0) {
    const { error } = await supabase.from('ai_insights').insert(insightsToInsert)
    if (error) {
      console.error('[Insights] Insert error:', error)
    }
  }
}
