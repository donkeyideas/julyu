import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * Direct API key test - bypasses all encryption/decryption
 * This is for debugging purposes only
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ success: false, error: 'API key required' }, { status: 400 })
    }

    const trimmedKey = apiKey.trim()
    
    console.log('[Direct Test] Testing API key directly')
    console.log('[Direct Test] Key length:', trimmedKey.length)
    console.log('[Direct Test] Key starts with:', trimmedKey.substring(0, 10))
    console.log('[Direct Test] Key ends with:', trimmedKey.substring(Math.max(0, trimmedKey.length - 10)))

    // Validate format
    if (!trimmedKey.startsWith('sk-')) {
      return NextResponse.json({
        success: false,
        error: `Invalid key format - starts with "${trimmedKey.substring(0, 3)}" instead of "sk-"`,
        keyPreview: trimmedKey.substring(0, 30),
      }, { status: 400 })
    }

    // Test the API directly
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test. Respond with "Test successful".',
            },
          ],
          max_tokens: 20,
        },
        {
          headers: {
            'Authorization': `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      const inputTokens = response.data.usage?.prompt_tokens || 0
      const outputTokens = response.data.usage?.completion_tokens || 0
      const totalTokens = response.data.usage?.total_tokens || (inputTokens + outputTokens)
      
      // Calculate cost
      const pricing = { input: 0.14, output: 0.28 } // DeepSeek pricing per 1M tokens
      const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output

      return NextResponse.json({
        success: true,
        message: 'API key is valid and working!',
        responseStatus: response.status,
        responseTime: `${Date.now() - startTime}ms`,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        cost: cost,
        details: {
          model: response.data.model,
          finish_reason: response.data.choices[0]?.finish_reason,
        },
      })
    } catch (apiError: any) {
      console.error('[Direct Test] API error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
      })

      let errorMessage = 'API test failed'
      if (apiError.response?.status === 401) {
        errorMessage = 'Invalid API key - authentication failed'
      } else if (apiError.response?.status === 403) {
        errorMessage = 'API key does not have required permissions'
      } else if (apiError.response?.status === 429) {
        errorMessage = 'Rate limit exceeded'
      } else if (apiError.response?.data) {
        errorMessage = `API error: ${JSON.stringify(apiError.response.data)}`
      } else {
        errorMessage = apiError.message || 'Unknown error'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: apiError.response?.data || null,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[Direct Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
    }, { status: 500 })
  }
}

