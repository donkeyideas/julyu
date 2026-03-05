import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List posts with filters + stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient() as any
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')

    // Build query
    let query = supabase
      .from('social_media_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }
    if (platform && platform !== 'ALL') {
      query = query.eq('platform', platform)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('[Social Posts] List error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Compute stats from all posts (unfiltered)
    const { data: allPosts } = await supabase
      .from('social_media_posts')
      .select('status, platform')

    const stats = {
      drafts: 0,
      scheduled: 0,
      published: 0,
      failed: 0,
      total: 0,
      byPlatform: {} as Record<string, number>,
    }

    if (allPosts) {
      for (const p of allPosts) {
        stats.total++
        if (p.status === 'DRAFT') stats.drafts++
        else if (p.status === 'SCHEDULED') stats.scheduled++
        else if (p.status === 'PUBLISHED') stats.published++
        else if (p.status === 'FAILED') stats.failed++

        stats.byPlatform[p.platform] = (stats.byPlatform[p.platform] || 0) + (p.status === 'PUBLISHED' ? 1 : 0)
      }
    }

    return NextResponse.json({ success: true, posts: posts || [], stats })
  } catch (error: any) {
    console.error('[Social Posts] GET Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST - Create a single post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, content, hashtags, image_prompt, topic, tone, status, scheduled_at } = body

    if (!platform || !content) {
      return NextResponse.json({ error: 'Platform and content are required' }, { status: 400 })
    }

    const validPlatforms = ['TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient() as any
    const { data: post, error } = await supabase
      .from('social_media_posts')
      .insert({
        platform,
        content,
        hashtags: hashtags || [],
        image_prompt: image_prompt || null,
        topic: topic || null,
        tone: tone || null,
        status: status || 'DRAFT',
        scheduled_at: scheduled_at || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Social Posts] Create error:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('[Social Posts] POST Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
