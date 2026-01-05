import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const model = searchParams.get('model')

    if (!model) {
      return NextResponse.json({ success: false, error: 'Model parameter required' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    // Get model configuration from database
    const { data: config, error } = await supabase
      .from('ai_model_config')
      .select('config')
      .eq('model_name', model)
      .single()

    if (error) {
      // Return default config if not found
      return NextResponse.json({
        success: true,
        config: {
          modelName: model,
          temperature: 0.3,
          maxTokens: 2000,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      config: config?.config || {
        modelName: model,
        temperature: 0.3,
        maxTokens: 2000,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
      },
    })
  } catch (error: any) {
    console.error('Error getting model config:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, config } = body

    if (!model || !config) {
      return NextResponse.json({ success: false, error: 'Model and config required' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    // Save model configuration
    const { error } = await supabase
      .from('ai_model_config')
      .upsert({
        model_name: model,
        config: config,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'model_name',
      })

    if (error) {
      // If table doesn't exist, that's okay - return success anyway
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, message: 'Config accepted (database not available)' })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Model configuration saved' })
  } catch (error: any) {
    console.error('Error saving model config:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}


