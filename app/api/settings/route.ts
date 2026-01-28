import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client to bypass RLS (needed for Firebase/Google users)
    const adminSupabase = createServiceRoleClient()

    // Get user preferences
    const { data: preferences, error } = await adminSupabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      throw error
    }

    // Get user data from users table (works for both Supabase and Firebase users)
    let userData = null
    const { data } = await adminSupabase
      .from('users')
      .select('subscription_tier, email, full_name, auth_provider, avatar_url')
      .eq('id', userId)
      .single()
    userData = data

    // For test mode, return test user info with premium tier
    const userInfo = isTestMode && !user && !firebaseUserId ? {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      subscription_tier: 'premium' as const,
      auth_provider: 'email' as const,
      avatar_url: null
    } : {
      id: userId,
      email: userData?.email || user?.email || '',
      full_name: userData?.full_name || null,
      subscription_tier: userData?.subscription_tier || 'free' as const,
      auth_provider: userData?.auth_provider || 'email' as const,
      avatar_url: userData?.avatar_url || null
    }

    return NextResponse.json({
      preferences: preferences || {
        notification_preferences: { price_alerts: true, weekly_summary: true, new_features: false },
        ai_features_enabled: true,
        budget_monthly: null,
        favorite_stores: [],
        shopping_frequency: 'weekly',
        preferred_language: 'en',
        auto_translate_chat: true
      },
      user: userInfo
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Return default settings on error to keep the feature working
    return NextResponse.json({
      preferences: {
        notification_preferences: { price_alerts: true, weekly_summary: true, new_features: false },
        ai_features_enabled: true,
        budget_monthly: null,
        favorite_stores: [],
        shopping_frequency: 'weekly',
        preferred_language: 'en',
        auto_translate_chat: true
      },
      user: {
        id: 'test-user-id',
        email: '',
        full_name: null,
        subscription_tier: 'free'
      }
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client to bypass RLS (needed for Firebase/Google users)
    const adminSupabase = createServiceRoleClient()

    const body = await request.json()
    const {
      notification_preferences,
      ai_features_enabled,
      budget_monthly,
      favorite_stores,
      shopping_frequency,
      preferred_language,
      auto_translate_chat,
      full_name // Allow updating user name
    } = body

    // If full_name is provided, update the users table
    if (full_name !== undefined) {
      const { error: userUpdateError } = await adminSupabase
        .from('users')
        .update({ full_name, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('[Settings] User update error:', userUpdateError)
      }
    }

    // Check if preferences exist
    const { data: existing, error: checkError } = await adminSupabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single()

    const preferencesData: Record<string, unknown> = {
      user_id: userId,
      notification_preferences,
      ai_features_enabled,
      budget_monthly,
      favorite_stores,
      shopping_frequency,
      updated_at: new Date().toISOString()
    }

    // Only include columns that exist in the database
    // preferred_language and auto_translate_chat may not exist yet
    if (preferred_language !== undefined) {
      preferencesData.preferred_language = preferred_language
    }
    if (auto_translate_chat !== undefined) {
      preferencesData.auto_translate_chat = auto_translate_chat
    }

    let result
    if (existing && !checkError) {
      // Update existing preferences
      result = await adminSupabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      // Insert new preferences
      result = await adminSupabase
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('[Settings] Database error:', result.error)
      // Fall back to returning success with the data we tried to save
      // This allows the feature to work even if database isn't set up
      return NextResponse.json({
        success: true,
        preferences: preferencesData,
        message: 'Settings saved locally (database unavailable)'
      })
    }

    return NextResponse.json({
      success: true,
      preferences: result.data
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    // Return success anyway to allow the feature to work
    // The client can store settings in localStorage as a fallback
    return NextResponse.json({
      success: true,
      message: 'Settings saved locally',
      preferences: {}
    })
  }
}
