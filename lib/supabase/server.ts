import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { Database } from '@/types/database'
import { getTestAuth } from '@/lib/auth/test-auth'

// Service role client - bypasses RLS, use for server-side operations
export const createServiceRoleClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[Supabase] CRITICAL: Service role key not configured! URL:', !!url, 'Key:', !!serviceKey)
    throw new Error('Service role key is required for admin operations')
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cached per request - ensures layout and page components share the same client instance
export const createServerClient = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use test auth if Supabase not configured or invalid URL
  if (!url || !key) {
    return createTestServerClient()
  }

  // Validate URL format - if invalid, use test auth instead of throwing error
  try {
    new URL(url)
  } catch {
    // Invalid URL format - use test auth instead
    return createTestServerClient()
  }

  // Use real Supabase - await cookies() in Next.js 15
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get(key: string) {
          const cookie = cookieStore.get(key)
          return cookie?.value ?? null
        },
        set(key: string, value: string, options: any) {
          try {
            cookieStore.set(key, value, options)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(key: string, options: any) {
          try {
            cookieStore.set(key, '', { ...options, maxAge: 0 })
          } catch {
            // Ignore errors
          }
        },
      },
    }
  )
})

function createTestServerClient() {
  const testAuth = getTestAuth()
  return {
    auth: {
      getUser: async () => testAuth.getUser(),
      getSession: async () => testAuth.getSession(),
    },
    from: (table: string) => ({
      select: (columns: string, options?: any) => {
        const selectQuery = {
          eq: (column: string, value: any) => {
            const eqQuery = {
              single: async () => ({ data: null, error: null }),
              limit: (count: number) => ({
                order: (col: string, opts: any) => ({
                  ascending: async (asc: boolean) => ({ data: [], error: null }),
                }),
              }),
              order: (col: string, opts: any) => ({
                ascending: async (asc: boolean) => ({ data: [], error: null }),
              }),
            }
            return eqQuery
          },
          gte: (column: string, value: any) => ({
            order: (col: string, opts: any) => ({
              ascending: async (asc: boolean) => ({ data: [], error: null }),
            }),
            limit: async (count: number) => ({ data: [], error: null }),
          }),
          in: (column: string, values: any[]) => ({
            select: async () => ({ data: [], error: null }),
            single: async () => ({ data: null, error: null }),
          }),
          order: (column: string, options: any) => ({
            limit: async (count: number) => ({ data: [], error: null }),
            ascending: async (asc: boolean) => ({ data: [], error: null }),
          }),
        }

        // Handle count queries
        if (options?.count === 'exact' && options?.head === true) {
          return {
            eq: (column: string, value: any) => ({
              eq: async (col2: string, val2: any) => ({ count: 0, error: null }),
              head: async () => ({ count: 0, error: null }),
            }),
            head: async () => ({ count: 0, error: null }),
          }
        }

        return selectQuery
      },
        insert: (data: any) => ({
          select: (columns: string) => ({
            single: async () => ({ data: { id: `new-${Date.now()}`, ...data }, error: null }),
          }),
        }),
        upsert: (data: any, options?: any) => ({
          select: async () => ({ data: [data], error: null }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: async () => ({ data: [], error: null }),
          }),
        }),
    }),
  } as any
}

