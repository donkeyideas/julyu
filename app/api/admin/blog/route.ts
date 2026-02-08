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

// GET: List all posts or get single post
export async function GET(request: NextRequest) {
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

    const supabase = await createServiceRoleClient() as any

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[Admin Blog] Get post error:', error)
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
      }

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, post })
    }

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin Blog] List posts error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, posts: posts || [] })
  } catch (error) {
    console.error('[Admin Blog] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new post
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

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    const wordCount = calculateWordCount(content)
    const readTime = calculateReadTime(wordCount)

    const insertData: Record<string, any> = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      category: category || null,
      tags: tags || null,
      featured_image_url: featured_image_url || null,
      seo_title: seo_title || null,
      meta_description: meta_description || null,
      focus_keywords: focus_keywords || null,
      canonical_url: canonical_url || null,
      meta_robots: meta_robots || null,
      status: status || 'draft',
      word_count: wordCount,
      read_time_minutes: readTime,
      author_id: sessionResult.employee.id,
    }

    if (status === 'published') {
      insertData.published_at = new Date().toISOString()
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[Admin Blog] Create post error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A post with this slug already exists. Please use a different slug.' }, { status: 409 })
      }
      return NextResponse.json({ error: `Failed to create post: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('[Admin Blog] POST error:', error)
    return NextResponse.json({ error: `Internal server error: ${error.message || 'Unknown'}` }, { status: 500 })
  }
}

// PUT: Update existing post
export async function PUT(request: NextRequest) {
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

    const supabase = await createServiceRoleClient() as any

    const body = await request.json()
    const {
      id,
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

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

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
export async function DELETE(request: NextRequest) {
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

    const supabase = await createServiceRoleClient() as any

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

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
