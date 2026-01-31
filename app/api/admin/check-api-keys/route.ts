import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Check database for API keys
    const { data: configs } = await supabase
      .from('ai_model_config')
      .select('model_name, api_key_encrypted, is_active')
      .in('model_name', ['deepseek-chat', 'gpt-4-vision'])

    const deepseekConfigured = configs?.some((c: any) => c.model_name === 'deepseek-chat' && c.api_key_encrypted && c.is_active) || false
    const openaiConfigured = configs?.some((c: any) => c.model_name === 'gpt-4-vision' && c.api_key_encrypted && c.is_active) || false

    // Also check environment variables as fallback
    return NextResponse.json({
      deepseekConfigured: deepseekConfigured || !!process.env.DEEPSEEK_API_KEY,
      openaiConfigured: openaiConfigured || !!process.env.OPENAI_API_KEY,
    })
  } catch (error) {
    // Fallback to environment variables
    return NextResponse.json({
      deepseekConfigured: !!process.env.DEEPSEEK_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    })
  }
}

