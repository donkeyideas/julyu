import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id

    const { data: list, error } = await supabase
      .from('shopping_lists')
      .select('*, list_items(*)')
      .eq('id', listId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[Lists] Get list error:', error)
      if (isTestMode) {
        return NextResponse.json({
          success: true,
          list: getTestList(listId),
        })
      }
      throw error
    }

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      list,
    })
  } catch (error: any) {
    console.error('[Lists] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch list' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id
    const body = await request.json()
    const { name } = body

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updates.name = name.trim()
    }

    const { data: list, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .eq('user_id', userId)
      .select('*, list_items(*)')
      .single()

    if (error) {
      console.error('[Lists] Update list error:', error)
      if (isTestMode) {
        return NextResponse.json({
          success: true,
          list: { id: listId, ...updates, list_items: [] },
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      list,
    })
  } catch (error: any) {
    console.error('[Lists] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = params.id

    // First delete all items in the list
    const { error: itemsError } = await supabase
      .from('list_items')
      .delete()
      .eq('list_id', listId)

    if (itemsError) {
      console.error('[Lists] Delete items error:', itemsError)
    }

    // Then delete the list
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId)

    if (error) {
      console.error('[Lists] Delete list error:', error)
      if (!isTestMode) {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'List deleted successfully',
    })
  } catch (error: any) {
    console.error('[Lists] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete list' },
      { status: 500 }
    )
  }
}

function getTestList(id: string) {
  return {
    id,
    name: 'Test List',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: '1', user_input: 'Milk 2%', quantity: 1 },
      { id: '2', user_input: 'Eggs organic', quantity: 1 },
    ],
  }
}
