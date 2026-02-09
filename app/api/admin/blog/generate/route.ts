import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { getApiKey } from '@/lib/api/config'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

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

    const { title } = await request.json()

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const apiKey = await getApiKey('deepseek-chat')
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }

    // Fetch existing blog posts for internal linking
    const supabase = await createServiceRoleClient() as any
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    const internalLinks = (existingPosts || [])
      .map((p: { title: string; slug: string }) => `- "${p.title}" → https://www.julyu.com/blog/${p.slug}`)
      .join('\n')

    const systemPrompt = `You are an expert SEO blog writer for Julyu, an AI-powered grocery price comparison platform that helps shoppers save money by comparing prices across stores. Website: https://www.julyu.com

Write blog posts that are:
- Informative, engaging, and easy to read
- SEO-optimized with focus keywords naturally woven into the content
- Written in clean HTML (use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a> tags)
- NEVER use markdown syntax (no **, ##, -, etc.) — only valid HTML tags
- Between 800-1500 words for comprehensive coverage
- Include actionable tips, statistics, or examples where relevant
- Written in a friendly, authoritative tone
- MUST include backlinks (internal and external) throughout the content

Always respond with valid JSON only. No text before or after the JSON.`

    const userPrompt = `Generate a complete, SEO-optimized blog post for the title: "${title.trim()}"

BACKLINKS — This is critical for SEO. You MUST include links in the content:

1. INTERNAL LINKS (link to other pages on Julyu — include 2-4 of these):
   Key Julyu pages:
   - Homepage: https://www.julyu.com
   - Features: https://www.julyu.com/features
   - Pricing: https://www.julyu.com/pricing
   - For Stores: https://www.julyu.com/for-stores
   - Blog: https://www.julyu.com/blog

   Existing blog posts (link to 1-3 that are relevant to this topic):
${internalLinks || '   (No existing posts yet)'}

2. EXTERNAL LINKS (include 2-3 credible sources):
   - Link to authoritative sources like USDA, Bureau of Labor Statistics, Consumer Reports, university studies, or industry reports
   - Use descriptive anchor text (not "click here")
   - External links should open in a new tab: <a href="URL" target="_blank" rel="noopener noreferrer">anchor text</a>
   - Internal links should NOT have target="_blank": <a href="URL">anchor text</a>

Weave links naturally into the content. For example:
- "Using a <a href="https://www.julyu.com/features">price comparison tool like Julyu</a> can help you..."
- "According to the <a href="https://www.bls.gov/cpi/" target="_blank" rel="noopener noreferrer">Bureau of Labor Statistics</a>, food prices..."
- "For more tips, check out our guide on <a href="https://www.julyu.com/blog/some-slug">smart grocery shopping</a>"

Return a JSON object with these exact fields:
{
  "content": "Full blog post in clean HTML. Use <h2> for main sections, <h3> for subsections, <p> for paragraphs, <ul>/<ol>/<li> for lists, <strong> for emphasis, <a> for links. NO markdown. Start with an engaging intro paragraph (no heading for intro). Include 4-6 sections with h2 headings. End with a conclusion section. MUST include 4-7 total backlinks spread throughout the content.",
  "excerpt": "A compelling 1-2 sentence summary for blog listing cards (under 200 characters)",
  "seo_title": "SEO-optimized title between 30-60 characters that includes the primary keyword",
  "meta_description": "Compelling meta description between 120-160 characters with a call to action",
  "focus_keywords": "3-5 comma-separated keywords relevant to this topic and grocery savings",
  "category": "One category from: Savings Tips, Price Comparison, Smart Shopping, Technology, Meal Planning, Budget Guide, Industry Insights",
  "tags": ["array", "of", "4-6", "relevant", "tags"]
}

Important:
- The content MUST be clean HTML only. No markdown ** or ## characters.
- The content MUST include 4-7 backlinks (mix of internal Julyu links and external authority links).
- Focus keywords must appear naturally in the title, content, and meta description.
- The seo_title should include the primary keyword and be 30-60 characters.
- The meta_description should be 120-160 characters with a clear value proposition.
- Content should have proper heading hierarchy (h2 > h3) and be well-structured.
- Include at least one bulleted or numbered list in the content for readability.`

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
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Blog Generate] DeepSeek API error:', response.status, errorData)
      // Track failed call
      const responseTime = Date.now() - startTime
      await supabase.from('ai_model_usage').insert({
        model_name: 'deepseek-chat',
        provider: 'DeepSeek',
        use_case: 'blog_generation',
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        response_time_ms: responseTime,
        cost: 0,
        success: false,
        error_message: errorData?.error?.message || response.statusText,
      }).then(() => {}).catch(() => {})
      return NextResponse.json(
        { error: `AI generation failed: ${errorData?.error?.message || response.statusText}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const aiContent = data.choices?.[0]?.message?.content

    // Track successful AI usage
    const responseTime = Date.now() - startTime
    const inputTokens = data.usage?.prompt_tokens || 0
    const outputTokens = data.usage?.completion_tokens || 0
    const totalTokens = data.usage?.total_tokens || (inputTokens + outputTokens)
    // DeepSeek pricing: $0.14/1M input, $0.28/1M output
    const cost = (inputTokens / 1_000_000) * 0.14 + (outputTokens / 1_000_000) * 0.28
    await supabase.from('ai_model_usage').insert({
      model_name: 'deepseek-chat',
      provider: 'DeepSeek',
      use_case: 'blog_generation',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      response_time_ms: responseTime,
      cost,
      success: true,
    }).then(() => {
      console.log(`[Blog Generate] Tracked: ${totalTokens} tokens, $${cost.toFixed(6)}`)
    }).catch((err: any) => {
      console.error('[Blog Generate] Failed to track usage:', err)
    })

    if (!aiContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 502 })
    }

    // Parse the JSON response
    let parsed
    try {
      parsed = JSON.parse(aiContent)
    } catch {
      // Try to extract JSON from the response if wrapped in extra text
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.error('[Blog Generate] Failed to parse AI response:', aiContent.substring(0, 500))
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 })
      }
    }

    // Clean any remaining markdown artifacts from content
    let cleanContent = parsed.content || ''
    cleanContent = cleanContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')

    return NextResponse.json({
      content: cleanContent,
      excerpt: parsed.excerpt || '',
      seo_title: parsed.seo_title || '',
      meta_description: parsed.meta_description || '',
      focus_keywords: parsed.focus_keywords || '',
      category: parsed.category || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    })
  } catch (error: any) {
    console.error('[Blog Generate] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog content' },
      { status: 500 }
    )
  }
}
