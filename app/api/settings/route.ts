import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      throw error
    }

    // Get user subscription info
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, email, full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      preferences: preferences || {
        notification_preferences: { price_alerts: true, weekly_summary: true },
        ai_features_enabled: true,
        budget_monthly: null,
        favorite_stores: [],
        shopping_frequency: 'weekly'
      },
      user: {
        email: userData?.email || user.email,
        full_name: userData?.full_name,
        subscription_tier: userData?.subscription_tier || 'free'
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_preferences, ai_features_enabled, budget_monthly, favorite_stores, shopping_frequency } = body

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const preferencesData = {
      user_id: user.id,
      notification_preferences,
      ai_features_enabled,
      budget_monthly,
      favorite_stores,
      shopping_frequency,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      preferences: result.data
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
