import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Ensure user exists in public.users table (required for FK constraints).
 * Firebase/Google sign-in users only exist in public.users, not in auth.users.
 * This must be called before any DB insert that has a FK to public.users.
 */
export async function ensureUserExists(
  userId: string,
  email?: string | null,
  fullName?: string | null
): Promise<void> {
  try {
    const supabase = createServiceRoleClient() as any
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existing) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email || `user-${userId.slice(0, 8)}@unknown`,
          full_name: fullName || 'User',
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        // Race condition: another request may have created the user
        const { data: recheckUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single()

        if (!recheckUser) {
          console.error('[ensureUserExists] Failed to create user:', insertError)
        }
      }
    }
  } catch (err) {
    console.error('[ensureUserExists] Unexpected error:', err)
  }
}
