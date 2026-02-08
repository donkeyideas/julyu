import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function calculateWordCount(content: string): number {
  const text = stripHtmlTags(content)
  return text.split(/\s+/).filter(Boolean).length
}

function calculateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

// PUT: Update existing post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient() as any

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      featured_image_url,
      seo_title,
      meta_description,
      focus_keywords,
      canonical_url,
      meta_robots,
      status,
    } = body

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) {
      updateData.content = content
      const wordCount = calculateWordCount(content)
      updateData.word_count = wordCount
      updateData.read_time_minutes = calculateReadTime(wordCount)
    }
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (focus_keywords !== undefined) updateData.focus_keywords = focus_keywords
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url
    if (meta_robots !== undefined) updateData.meta_robots = meta_robots
    if (status !== undefined) updateData.status = status

    // If changing to published and no published_at exists, set it
    if (status === 'published') {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!existingPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Admin Blog] Update post error:', error)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('[Admin Blog] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient() as any

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Admin Blog] Delete post error:', error)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Blog] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
