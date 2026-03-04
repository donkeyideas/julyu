import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH - Update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { content, hashtags, image_prompt, status, scheduled_at } = body

    const updates: Record<string, any> = {}
    if (content !== undefined) updates.content = content
    if (hashtags !== undefined) updates.hashtags = hashtags
    if (image_prompt !== undefined) updates.image_prompt = image_prompt
    if (status !== undefined) updates.status = status
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient() as any
    const { data: post, error } = await supabase
      .from('social_media_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Social Posts] Update error:', error)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('[Social Posts] PATCH Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const supabase = await createServiceRoleClient() as any
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Social Posts] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error: any) {
    console.error('[Social Posts] DELETE Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
