import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface UserRecord {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  last_login: string | null
  subscription_tier: string
  stripe_customer_id: string | null
}

// GET - List all users (for admin dashboard)
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const userData = users as UserRecord[] | null

    // Calculate stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const usersArray = userData || []
    const stats = {
      total: usersArray.length,
      premium: usersArray.filter((u: UserRecord) => u.subscription_tier === 'premium').length,
      enterprise: usersArray.filter((u: UserRecord) => u.subscription_tier === 'enterprise').length,
      free: usersArray.filter((u: UserRecord) => u.subscription_tier === 'free').length,
      newThisMonth: usersArray.filter((u: UserRecord) => new Date(u.created_at) >= startOfMonth).length,
      activeToday: usersArray.filter((u: UserRecord) => u.last_login && new Date(u.last_login) >= startOfToday).length,
    }

    return NextResponse.json({ users: userData || [], stats })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user (for admin dashboard)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id, full_name, phone, subscription_tier } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        subscription_tier,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
