import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Get usage stats for last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: deepseekUsage } = await supabase
      .from('ai_model_usage')
      .select('response_time_ms')
      .eq('model_name', 'deepseek-chat')
      .gte('created_at', yesterday)

    const { data: openaiUsage } = await supabase
      .from('ai_model_usage')
      .select('response_time_ms')
      .eq('model_name', 'gpt-4-vision')
      .gte('created_at', yesterday)

    interface UsageRecord {
      response_time_ms?: number | null
    }

    // Calculate average response time
    const deepseekAvgTime = deepseekUsage && deepseekUsage.length > 0
      ? (deepseekUsage as UsageRecord[]).reduce((sum: number, u: UsageRecord) => sum + (u.response_time_ms || 0), 0) / deepseekUsage.length
      : null

    const openaiAvgTime = openaiUsage && openaiUsage.length > 0
      ? (openaiUsage as UsageRecord[]).reduce((sum: number, u: UsageRecord) => sum + (u.response_time_ms || 0), 0) / openaiUsage.length
      : null

    return NextResponse.json({
      deepseek: {
        requests24h: deepseekUsage?.length || 0,
        avgResponseTime: deepseekAvgTime ? Math.round(deepseekAvgTime) : null,
      },
      openai: {
        requests24h: openaiUsage?.length || 0,
        avgResponseTime: openaiAvgTime ? Math.round(openaiAvgTime) : null,
      },
    })
  } catch (error) {
    // Return empty stats if database not available
    return NextResponse.json({
      deepseek: {
        requests24h: 0,
        avgResponseTime: null,
      },
      openai: {
        requests24h: 0,
        avgResponseTime: null,
      },
    })
  }
}


