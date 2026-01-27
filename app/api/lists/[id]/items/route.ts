import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id

    const { data: items, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[ListItems] Get items error:', error)
      if (isTestMode) {
        return NextResponse.json({
          success: true,
          items: [],
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    })
  } catch (error: any) {
    console.error('[ListItems] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Update the list's updated_at timestamp
    await supabase
      .from('shopping_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)
      .eq('user_id', userId)

    const itemsToInsert = items.map((item: any) => ({
      list_id: listId,
      user_input: typeof item === 'string' ? item : item.name || item.user_input,
      quantity: typeof item === 'object' ? item.quantity || 1 : 1,
      unit: typeof item === 'object' ? item.unit || null : null,
      created_at: new Date().toISOString(),
    }))

    const { data: insertedItems, error } = await supabase
      .from('list_items')
      .insert(itemsToInsert)
      .select('*')

    if (error) {
      console.error('[ListItems] Insert error:', error)
      if (isTestMode) {
        return NextResponse.json({
          success: true,
          items: itemsToInsert.map((item, i) => ({
            ...item,
            id: `item-${Date.now()}-${i}`,
          })),
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      items: insertedItems || [],
    })
  } catch (error: any) {
    console.error('[ListItems] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add items' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId)

    if (error) {
      console.error('[ListItems] Delete error:', error)
      if (!isTestMode) {
        throw error
      }
    }

    // Update the list's updated_at timestamp
    await supabase
      .from('shopping_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    })
  } catch (error: any) {
    console.error('[ListItems] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    )
  }
}
