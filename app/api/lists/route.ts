import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get lists from database
    const { data: lists, error } = await supabase
      .from('shopping_lists')
      .select('*, list_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Lists] Database error:', error)
      // In test mode, return mock data
      if (isTestMode) {
        return NextResponse.json({
          success: true,
          lists: getTestLists(),
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      lists: lists || [],
    })
  } catch (error: any) {
    console.error('[Lists] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, items } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Create the shopping list
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name: name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (listError) {
      console.error('[Lists] Create list error:', listError)
      // In test mode, return mock data
      if (isTestMode) {
        const mockList: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
          list_items: Array<{
            id: string
            list_id: string
            user_input: string
            quantity: number
            unit: string | null
            created_at: string
          }>
        } = {
          id: `list-${Date.now()}`,
          user_id: userId,
          name: name.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          list_items: [],
        }

        // Parse and add items if provided
        if (items && Array.isArray(items) && items.length > 0) {
          mockList.list_items = items.map((item: any, index: number) => ({
            id: `item-${Date.now()}-${index}`,
            list_id: mockList.id,
            user_input: typeof item === 'string' ? item : item.name || item.user_input,
            quantity: typeof item === 'object' ? item.quantity || 1 : 1,
            unit: typeof item === 'object' ? item.unit || null : null,
            created_at: new Date().toISOString(),
          }))
        }

        // Store in localStorage for test mode persistence
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          try {
            const existingLists = JSON.parse(localStorage.getItem('test_lists') || '[]')
            existingLists.unshift(mockList)
            localStorage.setItem('test_lists', JSON.stringify(existingLists))
          } catch {
            // Ignore localStorage errors
          }
        }

        return NextResponse.json({
          success: true,
          list: mockList,
        })
      }
      throw listError
    }

    // Add items if provided
    if (items && Array.isArray(items) && items.length > 0 && list) {
      const itemsToInsert = items.map((item: any) => ({
        list_id: list.id,
        user_input: typeof item === 'string' ? item : item.name || item.user_input,
        quantity: typeof item === 'object' ? item.quantity || 1 : 1,
        unit: typeof item === 'object' ? item.unit || null : null,
        created_at: new Date().toISOString(),
      }))

      const { data: insertedItems, error: itemsError } = await supabase
        .from('list_items')
        .insert(itemsToInsert)
        .select('*')

      if (itemsError) {
        console.error('[Lists] Add items error:', itemsError)
      }

      return NextResponse.json({
        success: true,
        list: {
          ...list,
          list_items: insertedItems || [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      list: {
        ...list,
        list_items: [],
      },
    })
  } catch (error: any) {
    console.error('[Lists] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create list' },
      { status: 500 }
    )
  }
}

function getTestLists() {
  return [
    {
      id: 'test-list-1',
      name: 'Weekly Groceries',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      list_items: [
        { id: '1', user_input: 'Milk 2%', quantity: 1 },
        { id: '2', user_input: 'Eggs organic', quantity: 1 },
        { id: '3', user_input: 'Bread whole wheat', quantity: 1 },
        { id: '4', user_input: 'Bananas', quantity: 1 },
      ],
    },
    {
      id: 'test-list-2',
      name: 'Party Supplies',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      list_items: [
        { id: '5', user_input: 'Chips', quantity: 3 },
        { id: '6', user_input: 'Soda', quantity: 2 },
        { id: '7', user_input: 'Salsa', quantity: 2 },
      ],
    },
  ]
}
