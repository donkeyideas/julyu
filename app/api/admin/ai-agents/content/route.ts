/**
 * POST /api/admin/ai-agents/content
 * Generate marketing content using AI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateContent, type ContentRequest, type ContentType } from '@/lib/ai/agents/content-generator'

const VALID_TYPES: ContentType[] = ['blog_post', 'email', 'social_media', 'product_description', 'newsletter']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, topic, tone, length, targetAudience, keywords, additionalContext } = body as ContentRequest

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const result = await generateContent(
      { type, topic, tone, length, targetAudience, keywords, additionalContext },
      'admin'
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ContentGen] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
