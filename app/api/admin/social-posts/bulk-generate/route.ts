import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { getApiKey } from '@/lib/api/config'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PLATFORM_CHAR_LIMITS, type Platform } from '@/lib/social/types'

export const dynamic = 'force-dynamic'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

const PLATFORM_MAX_TOKENS: Record<string, number> = {
  TWITTER: 150,
  TIKTOK: 150,
  FACEBOOK: 600,
  INSTAGRAM: 600,
  LINKEDIN: 600,
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { topic, tone, platforms } = await request.json()

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 })
    }

    const apiKey = await getApiKey('deepseek-chat')
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }

    const supabase = await createServiceRoleClient() as any
    const toneLabel = tone || 'engaging'

    // Generate posts in parallel using Promise.allSettled
    const generationPromises = platforms.map(async (platform: Platform) => {
      const charLimit = PLATFORM_CHAR_LIMITS[platform] || 280
      const maxTokens = PLATFORM_MAX_TOKENS[platform] || 300

      const systemPrompt = `You are a social media content creator for Julyu, an AI-powered grocery price comparison platform that helps shoppers save money. Website: https://www.julyu.com

Generate social media posts that are tailored to each platform's style and constraints. Always respond with valid JSON only.`

      const userPrompt = `Generate a ${toneLabel} social media post for ${platform} about: "${topic.trim()}"

Platform constraints:
- Character limit: ${charLimit} characters (STRICT — content must not exceed this)
- Platform: ${platform}
${platform === 'TWITTER' ? '- Keep it punchy, use relevant emojis, conversational tone' : ''}
${platform === 'LINKEDIN' ? '- Professional tone, can be longer-form, include a hook in the first line' : ''}
${platform === 'FACEBOOK' ? '- Conversational and relatable, encourage engagement' : ''}
${platform === 'INSTAGRAM' ? '- Visual-friendly caption, use line breaks for readability, emoji-heavy' : ''}
${platform === 'TIKTOK' ? '- Trendy, casual, use current social media language, hook in first 3 words' : ''}

Tone: ${toneLabel}
${toneLabel === 'informative' ? 'Focus on facts, stats, and educational value.' : ''}
${toneLabel === 'engaging' ? 'Focus on questions, calls to action, and conversation starters.' : ''}
${toneLabel === 'promotional' ? 'Focus on benefits, features, and value proposition of Julyu.' : ''}
${toneLabel === 'controversial' ? 'Take a bold stance on grocery shopping or food pricing. Be thought-provoking.' : ''}

Return JSON:
{
  "content": "The post text (MUST be under ${charLimit} characters, do NOT include hashtags in this field)",
  "hashtags": ["tag1", "tag2", "tag3"],
  "image_prompt": "A brief description of an ideal accompanying image"
}`

      const startTime = Date.now()
      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Track failed call
        await supabase.from('ai_model_usage').insert({
          model_name: 'deepseek-chat',
          use_case: 'social_media_generation',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          response_time_ms: responseTime,
          cost: 0,
          success: false,
          error_message: errorData?.error?.message || response.statusText,
        }).catch(() => {})
        throw new Error(errorData?.error?.message || `DeepSeek API error: ${response.status}`)
      }

      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content

      // Track usage
      const inputTokens = data.usage?.prompt_tokens || 0
      const outputTokens = data.usage?.completion_tokens || 0
      const totalTokens = data.usage?.total_tokens || (inputTokens + outputTokens)
      const cost = (inputTokens / 1_000_000) * 0.14 + (outputTokens / 1_000_000) * 0.28

      await supabase.from('ai_model_usage').insert({
        model_name: 'deepseek-chat',
        use_case: 'social_media_generation',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        response_time_ms: responseTime,
        cost,
        success: true,
      }).catch(() => {})

      if (!aiContent) throw new Error('No content generated')

      let parsed
      try {
        parsed = JSON.parse(aiContent)
      } catch {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Failed to parse AI response')
        }
      }

      // Clean content
      let content = (parsed.content || '').trim()
      // Remove any markdown artifacts
      content = content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

      // Extract hashtags
      let hashtags = parsed.hashtags || []
      if (typeof hashtags === 'string') {
        hashtags = hashtags.split(/[,\s]+/).filter(Boolean)
      }
      hashtags = hashtags.map((h: string) => h.replace(/^#/, '').trim()).filter(Boolean)

      // Save as DRAFT
      const { data: post, error: insertError } = await supabase
        .from('social_media_posts')
        .insert({
          platform,
          content,
          status: 'DRAFT',
          hashtags,
          image_prompt: parsed.image_prompt || null,
          topic: topic.trim(),
          tone: toneLabel,
        })
        .select()
        .single()

      if (insertError) {
        console.error(`[Social Posts] Insert error for ${platform}:`, insertError)
        throw new Error(`Failed to save ${platform} post`)
      }

      return { platform, post }
    })

    const results = await Promise.allSettled(generationPromises)

    const generated: any[] = []
    const errors: any[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        generated.push(result.value)
      } else {
        errors.push({ error: result.reason?.message || 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      errors,
      totalGenerated: generated.length,
      totalErrors: errors.length,
    })
  } catch (error: any) {
    console.error('[Social Posts] Bulk Generate Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate posts' }, { status: 500 })
  }
}
