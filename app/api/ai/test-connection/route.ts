import { NextRequest, NextResponse } from 'next/server'
import { deepseekClient } from '@/lib/api/deepseek'
import { openaiClient } from '@/lib/api/openai'
import { aiTracker } from '@/lib/ai/tracker'
import { getApiKey } from '@/lib/api/config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const model = searchParams.get('model')

  if (!model) {
    return NextResponse.json({ success: false, error: 'Model parameter required' }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    if (model === 'deepseek-product-matcher' || model.includes('deepseek')) {
      // Check if API key is configured
      let apiKey: string | null = null
      try {
        apiKey = await getApiKey('deepseek-chat')
        console.log('[Test Connection] API key retrieved:', apiKey ? `${apiKey.substring(0, 10)}...` : 'null')
      } catch (keyError: any) {
        console.error('[Test Connection] Error getting API key:', keyError)
        return NextResponse.json({ 
          success: false, 
          error: `DeepSeek API key not configured: ${keyError.message || 'Unknown error'}` 
        }, { status: 400 })
      }
      
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json({ 
          success: false, 
          error: 'DeepSeek API key not configured. Please add it in Admin → AI Models.' 
        }, { status: 400 })
      }

      // Test DeepSeek connection with a simple request
      try {
        console.log('[Test Connection] Testing DeepSeek API...')
        console.log('[Test Connection] API key retrieved, length:', apiKey.length)
        console.log('[Test Connection] API key starts with:', apiKey.substring(0, 10))
        console.log('[Test Connection] API key ends with:', apiKey.substring(Math.max(0, apiKey.length - 10)))
        
        // Validate key format before making request
        if (!apiKey.startsWith('sk-')) {
          console.error('[Test Connection] Key validation failed - does not start with sk-')
          console.error('[Test Connection] Key preview:', apiKey.substring(0, 30))
          return NextResponse.json({
            success: false,
            error: `Invalid API key format - should start with "sk-" but starts with "${apiKey.substring(0, 3)}"`,
          }, { status: 400 })
        }
        
        const testInput = ['milk', 'bread']
        console.log('[Test Connection] Calling deepseekClient.matchProducts...')
        const result = await deepseekClient.matchProducts(testInput)
        
        const responseTime = Date.now() - startTime
        console.log('[Test Connection] DeepSeek API test successful')
        console.log('[Test Connection] Result:', result)

        // Note: Usage is already tracked by matchProducts internally
        return NextResponse.json({ 
          success: true, 
          message: 'DeepSeek API connection successful',
          responseTime: `${responseTime}ms`,
          result: result,
        })
      } catch (apiError: any) {
        const responseTime = Date.now() - startTime
        
        console.error('[Test Connection] DeepSeek API test error:', {
          message: apiError.message,
          stack: apiError.stack,
          response: apiError.response?.data,
          status: apiError.response?.status,
        })
        
        // Provide more helpful error message
        let errorMessage = apiError.message || 'Unknown error'
        const statusCode = apiError.response?.status || apiError.status
        
        if (statusCode === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Invalid API key. Please check your DeepSeek API key is correct.'
        } else if (statusCode === 403 || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage = 'API key does not have required permissions.'
        } else if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          errorMessage = 'API rate limit exceeded. Please try again later.'
        } else if (apiError.response?.data) {
          errorMessage = `API error: ${JSON.stringify(apiError.response.data)}`
        }
        
        return NextResponse.json({ 
          success: false, 
          error: `API connection failed: ${errorMessage}`,
          responseTime: `${responseTime}ms`,
          details: apiError.response?.data || null,
        }, { status: 500 })
      }
    } else if (model === 'openai-receipt-ocr' || model.includes('openai')) {
      // Test OpenAI connection - check if API key is configured
      let apiKey: string | null = null
      try {
        apiKey = await getApiKey('gpt-4-vision')
      } catch (keyError: any) {
        console.error('Error getting OpenAI API key:', keyError)
        return NextResponse.json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please add it in Admin → AI Models.' 
        }, { status: 400 })
      }
      
      if (!apiKey) {
        return NextResponse.json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please add it in Admin → AI Models.' 
        }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'OpenAI API key configured (full test requires receipt image)',
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Unknown model' 
      }, { status: 400 })
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    console.error('[Test Connection] Top-level error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data,
      status: error.response?.status,
    })
    
    // Track failed usage (but don't fail if tracking fails)
    try {
      await aiTracker.trackUsage({
        model_name: model?.includes('deepseek') ? 'deepseek-chat' : 'gpt-4-vision',
        provider: model?.includes('deepseek') ? 'DeepSeek' : 'OpenAI',
        use_case: 'connection_test',
        input_tokens: 0,
        output_tokens: 0,
        response_time_ms: responseTime,
        cost: 0,
        success: false,
        error_message: error.message || 'Unknown error',
      })
    } catch (trackError) {
      // Ignore tracking errors
      console.warn('[Test Connection] Failed to track usage:', trackError)
    }

    // Provide detailed error message
    let errorMessage = error.message || 'Connection test failed'
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error.response?.data) {
      errorMessage = JSON.stringify(error.response.data)
    }

    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: error.response?.data || null,
    }, { status: 500 })
  }
}

