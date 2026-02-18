import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Try to insert user with progressively fewer columns if some don't exist
async function createUserWithFallback(
  supabase: any,
  userData: {
    email: string
    full_name: string
    firebase_uid?: string
    avatar_url?: string
    auth_provider?: string
  }
) {
  // Try with all columns first
  const fullData = {
    email: userData.email,
    full_name: userData.full_name,
    firebase_uid: userData.firebase_uid,
    avatar_url: userData.avatar_url,
    auth_provider: userData.auth_provider || 'google',
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  let result = await supabase.from('users').insert(fullData).select().single()

  // If error due to missing columns, try progressively simpler inserts
  if (result.error) {
    console.log('[Firebase Auth] Full insert failed:', result.error.message)

    // Try without auth_provider
    const withoutAuthProvider = {
      email: userData.email,
      full_name: userData.full_name,
      firebase_uid: userData.firebase_uid,
      avatar_url: userData.avatar_url,
      subscription_tier: 'free',
      created_at: new Date().toISOString()
    }

    result = await supabase.from('users').insert(withoutAuthProvider).select().single()

    if (result.error) {
      console.log('[Firebase Auth] Without auth_provider failed:', result.error.message)

      // Try without firebase_uid and avatar_url
      const minimalData = {
        email: userData.email,
        full_name: userData.full_name,
        subscription_tier: 'free',
        created_at: new Date().toISOString()
      }

      result = await supabase.from('users').insert(minimalData).select().single()
    }
  }

  return result
}

async function updateUserWithFallback(
  supabase: any,
  userId: string,
  userData: {
    full_name?: string
    firebase_uid?: string
    avatar_url?: string
    auth_provider?: string
  }
) {
  // Try with all columns first
  const fullUpdate = {
    full_name: userData.full_name,
    firebase_uid: userData.firebase_uid,
    avatar_url: userData.avatar_url,
    auth_provider: userData.auth_provider || 'google',
    updated_at: new Date().toISOString()
  }

  let result = await supabase
    .from('users')
    .update(fullUpdate)
    .eq('id', userId)
    .select()
    .single()

  // If error due to missing columns, try simpler updates
  if (result.error) {
    console.log('[Firebase Auth] Full update failed:', result.error.message)

    // Try without auth_provider
    const withoutAuthProvider = {
      full_name: userData.full_name,
      firebase_uid: userData.firebase_uid,
      avatar_url: userData.avatar_url
    }

    result = await supabase
      .from('users')
      .update(withoutAuthProvider)
      .eq('id', userId)
      .select()
      .single()

    if (result.error) {
      console.log('[Firebase Auth] Without auth_provider update failed:', result.error.message)

      // Try just full_name
      const minimalUpdate = {
        full_name: userData.full_name
      }

      result = await supabase
        .from('users')
        .update(minimalUpdate)
        .eq('id', userId)
        .select()
        .single()
    }
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, displayName, photoURL } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient() as any

    // Check if user already exists by email
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    // If this is a NEW user, check if registration is disabled
    if (!existingUser || findError) {
      const { data: settingData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'user_sign_in_enabled')
        .single()

      if (settingData?.value?.enabled === false) {
        return NextResponse.json(
          { error: 'Registration is currently disabled' },
          { status: 403 }
        )
      }
    }

    if (existingUser && !findError) {
      // User exists - update their info
      const { data: updatedUser, error: updateError } = await updateUserWithFallback(
        supabase,
        existingUser.id,
        {
          full_name: displayName || existingUser.full_name,
          firebase_uid: uid,
          avatar_url: photoURL || existingUser.avatar_url,
          auth_provider: 'google'
        }
      )

      if (updateError) {
        console.error('[Firebase Auth] Update user error:', updateError)
      }

      // Return user with auth_provider set for frontend to track
      const userWithProvider = {
        ...(updatedUser || existingUser),
        auth_provider: 'google'
      }

      return NextResponse.json({
        user: userWithProvider,
        isNewUser: false
      })
    }

    // Create new user
    const { data: newUser, error: createError } = await createUserWithFallback(
      supabase,
      {
        email,
        full_name: displayName || email.split('@')[0],
        firebase_uid: uid,
        avatar_url: photoURL,
        auth_provider: 'google'
      }
    )

    if (createError) {
      console.error('[Firebase Auth] Create user error:', createError)
      return NextResponse.json({ error: 'Failed to create user: ' + createError.message }, { status: 500 })
    }

    // Return user with auth_provider set
    const userWithProvider = {
      ...newUser,
      auth_provider: 'google'
    }

    return NextResponse.json({
      user: userWithProvider,
      isNewUser: true
    })
  } catch (error: any) {
    console.error('[Firebase Auth] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
