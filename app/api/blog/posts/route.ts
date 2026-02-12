import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const POSTS_PER_PAGE = 9

export async function GET(request: NextRequest) {
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10))

  const supabase = createServiceRoleClient() as any

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, featured_image_url, published_at, read_time_minutes')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1)

  if (error) {
    return NextResponse.json({ posts: [] }, { status: 500 })
  }

  return NextResponse.json(
    { posts: data || [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
