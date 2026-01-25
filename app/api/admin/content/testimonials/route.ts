import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Testimonials API] Error fetching:', error)
      return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
    }

    return NextResponse.json({ testimonials: data || [] })
  } catch (error: any) {
    console.error('[Testimonials API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('testimonials')
      .insert([{
        author_name: body.author_name,
        author_title: body.author_title,
        author_location: body.author_location,
        author_image_url: body.author_image_url || null,
        quote: body.quote,
        savings_amount: body.savings_amount,
        rating: body.rating || 5,
        is_featured: body.is_featured || false,
        is_active: body.is_active !== false,
        display_order: body.display_order || 0,
      }])
      .select()
      .single()

    if (error) {
      console.error('[Testimonials API] Error creating:', error)
      return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, success: true })
  } catch (error: any) {
    console.error('[Testimonials API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('testimonials')
      .update({
        author_name: body.author_name,
        author_title: body.author_title,
        author_location: body.author_location,
        author_image_url: body.author_image_url,
        quote: body.quote,
        savings_amount: body.savings_amount,
        rating: body.rating,
        is_featured: body.is_featured,
        is_active: body.is_active,
        display_order: body.display_order,
      })
      .eq('id', body.id)

    if (error) {
      console.error('[Testimonials API] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Testimonials API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Testimonials API] Error deleting:', error)
      return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Testimonials API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
