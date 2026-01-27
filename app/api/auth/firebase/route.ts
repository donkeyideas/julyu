import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, displayName, photoURL } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Check if user already exists by email
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser && !findError) {
      // User exists - update their Firebase UID and return
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          firebase_uid: uid,
          full_name: displayName || existingUser.full_name,
          avatar_url: photoURL || existingUser.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('[Firebase Auth] Update user error:', updateError)
      }

      return NextResponse.json({
        user: updatedUser || existingUser,
        isNewUser: false
      })
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: displayName || email.split('@')[0],
        firebase_uid: uid,
        avatar_url: photoURL,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('[Firebase Auth] Create user error:', createError)
      // If error is due to missing column, try without firebase_uid
      if (createError.message?.includes('firebase_uid')) {
        const { data: userWithoutFirebase, error: retryError } = await supabase
          .from('users')
          .insert({
            email,
            full_name: displayName || email.split('@')[0],
            avatar_url: photoURL,
            subscription_tier: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (retryError) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        return NextResponse.json({
          user: userWithoutFirebase,
          isNewUser: true
        })
      }
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({
      user: newUser,
      isNewUser: true
    })
  } catch (error: any) {
    console.error('[Firebase Auth] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
