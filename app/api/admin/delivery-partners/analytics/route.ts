import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PartnerRecord {
  id: string
  name: string
  slug: string
  brand_color: string | null
  commission_type: string | null
  commission_rate: number | null
  flat_commission: number | null
}

interface ClickRecord {
  id: string
  partner_id: string | null
  user_id: string | null
  store_name: string | null
  store_retailer: string | null
  items_count: number | null
  estimated_total: number | null
  deep_link_used: boolean | null
  commission_rate: number | null
  estimated_commission: number | null
  converted: boolean | null
  conversion_date: string | null
  order_total: number | null
  actual_commission: number | null
  created_at: string
}

// GET - Get delivery partner analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    // Parse date range
    const startDate = searchParams.get('start') || (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString()
    })()
    const endDate = searchParams.get('end') || new Date().toISOString()
    const partnerId = searchParams.get('partner_id')

    // Build query
    let query = supabase
      .from('delivery_partner_clicks')
      .select(`
        id,
        partner_id,
        user_id,
        store_name,
        store_retailer,
        items_count,
        estimated_total,
        deep_link_used,
        commission_rate,
        estimated_commission,
        converted,
        conversion_date,
        order_total,
        actual_commission,
        created_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data: clicks, error: clicksError } = await query

    if (clicksError) throw clicksError

    // Get all partners for reference
    const { data: partners, error: partnersError } = await supabase
      .from('delivery_partners')
      .select('id, name, slug, brand_color, commission_type, commission_rate, flat_commission')

    if (partnersError) throw partnersError

    // Create partner lookup map
    const partnerData = partners as PartnerRecord[] | null
    const clickData = clicks as ClickRecord[] | null
    const partnerMap: Record<string, PartnerRecord> = {}
    partnerData?.forEach((p: PartnerRecord) => { partnerMap[p.id] = p })

    // Calculate overall stats
    const totalClicks = clickData?.length || 0
    const conversions = clickData?.filter((c: ClickRecord) => c.converted).length || 0
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0
    const totalRevenue = clickData?.reduce((sum: number, c: ClickRecord) =>
      sum + (c.actual_commission || c.estimated_commission || 0), 0) || 0
    const estimatedRevenue = clickData?.reduce((sum: number, c: ClickRecord) =>
      sum + (c.estimated_commission || 0), 0) || 0
    const actualRevenue = clickData?.reduce((sum: number, c: ClickRecord) =>
      sum + (c.actual_commission || 0), 0) || 0
    const totalOrderValue = clickData?.filter((c: ClickRecord) => c.converted)
      .reduce((sum: number, c: ClickRecord) => sum + (c.order_total || 0), 0) || 0
    const avgOrderValue = conversions > 0 ? totalOrderValue / conversions : 0

    // Calculate stats per partner
    const partnerStats: Record<string, {
      partner: PartnerRecord | null
      clicks: number
      conversions: number
      conversionRate: number
      estimatedRevenue: number
      actualRevenue: number
      totalOrderValue: number
      avgOrderValue: number
    }> = {}

    clickData?.forEach((click: ClickRecord) => {
      const pid = click.partner_id || 'unknown'
      if (!partnerStats[pid]) {
        partnerStats[pid] = {
          partner: partnerMap[pid] || null,
          clicks: 0,
          conversions: 0,
          conversionRate: 0,
          estimatedRevenue: 0,
          actualRevenue: 0,
          totalOrderValue: 0,
          avgOrderValue: 0
        }
      }
      partnerStats[pid].clicks++
      partnerStats[pid].estimatedRevenue += click.estimated_commission || 0
      if (click.converted) {
        partnerStats[pid].conversions++
        partnerStats[pid].actualRevenue += click.actual_commission || 0
        partnerStats[pid].totalOrderValue += click.order_total || 0
      }
    })

    // Calculate conversion rates and avg order values
    Object.values(partnerStats).forEach(stat => {
      stat.conversionRate = stat.clicks > 0 ? (stat.conversions / stat.clicks) * 100 : 0
      stat.avgOrderValue = stat.conversions > 0 ? stat.totalOrderValue / stat.conversions : 0
    })

    // Daily breakdown
    const dailyStats: Record<string, {
      date: string
      clicks: number
      conversions: number
      revenue: number
    }> = {}

    clickData?.forEach((click: ClickRecord) => {
      const date = click.created_at.split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { date, clicks: 0, conversions: 0, revenue: 0 }
      }
      dailyStats[date].clicks++
      if (click.converted) {
        dailyStats[date].conversions++
        dailyStats[date].revenue += click.actual_commission || click.estimated_commission || 0
      }
    })

    // Top stores
    const storeStats: Record<string, { store: string; retailer: string; clicks: number; conversions: number }> = {}
    clickData?.forEach((click: ClickRecord) => {
      const key = click.store_name || 'Unknown Store'
      if (!storeStats[key]) {
        storeStats[key] = {
          store: click.store_name || 'Unknown',
          retailer: click.store_retailer || 'Unknown',
          clicks: 0,
          conversions: 0
        }
      }
      storeStats[key].clicks++
      if (click.converted) storeStats[key].conversions++
    })

    const topStores = Object.values(storeStats)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)

    return NextResponse.json({
      summary: {
        totalClicks,
        conversions,
        conversionRate: conversionRate.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        estimatedRevenue: estimatedRevenue.toFixed(2),
        actualRevenue: actualRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        dateRange: { start: startDate, end: endDate }
      },
      byPartner: Object.values(partnerStats).sort((a, b) => b.clicks - a.clicks),
      dailyTrend: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      topStores,
      recentClicks: clickData?.slice(0, 20).map((c: ClickRecord) => ({
        ...c,
        partnerName: partnerMap[c.partner_id || '']?.name || 'Unknown'
      }))
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
