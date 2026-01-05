import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getTestAuth } from '@/lib/auth/test-auth'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use test auth if Supabase not configured or invalid URL
  if (!url || !key) {
    return createTestClient()
  }

  // Validate URL format - if invalid, use test auth instead of throwing error
  try {
    new URL(url)
  } catch {
    // Invalid URL format - use test auth instead
    return createTestClient()
  }

  // Use real Supabase
  return createBrowserClient<Database>(url, key)
}

function createTestClient() {
  const testAuth = getTestAuth()
  return {
    auth: {
      getUser: async () => {
        const result = await testAuth.getUser()
        // Add subscription_tier to user object for compatibility
        if (result.data.user) {
          return {
            data: {
              user: {
                ...result.data.user,
                user_metadata: {
                  full_name: result.data.user.full_name,
                },
              },
            },
            error: result.error,
          }
        }
        return result
      },
      signUp: async (credentials: { email: string; password: string; options?: any }) => {
        const result = await testAuth.signUp(
          credentials.email,
          credentials.password,
          credentials.options?.data
        )
        if (result.data.user) {
          return {
            data: {
              user: {
                ...result.data.user,
                user_metadata: {
                  full_name: result.data.user.full_name,
                },
              },
            },
            error: result.error,
          }
        }
        return result
      },
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        const result = await testAuth.signIn(credentials.email, credentials.password)
        if (result.data.user) {
          return {
            data: {
              user: {
                ...result.data.user,
                user_metadata: {
                  full_name: result.data.user.full_name,
                },
              },
            },
            error: result.error,
          }
        }
        return result
      },
      signOut: async () => testAuth.signOut(),
    },
      from: () => ({
        select: () => {
          const selectQuery = {
            eq: (column: string, value: any) => ({
              single: async () => ({ data: null, error: null }),
              limit: (count: number) => ({
                order: (col: string, opts: any) => ({
                  ascending: async (asc: boolean) => ({ data: [], error: null }),
                }),
              }),
              order: (col: string, opts: any) => ({
                ascending: async (asc: boolean) => ({ data: [], error: null }),
              }),
            }),
            gte: (column: string, value: any) => ({
              order: (col: string, opts: any) => ({
                ascending: async (asc: boolean) => ({ data: [], error: null }),
              }),
              limit: async (count: number) => ({ data: [], error: null }),
            }),
            order: (column: string, options: any) => ({
              limit: async (count: number) => ({ data: [], error: null }),
              ascending: async (asc: boolean) => ({ data: [], error: null }),
            }),
            in: (column: string, values: any[]) => ({
              select: async () => ({ data: [], error: null }),
            }),
          }
          return selectQuery
        },
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        upsert: (data: any, options?: any) => ({
          select: async () => ({ data: [data], error: null }),
        }),
        update: () => ({
          eq: () => ({
            select: async () => ({ data: [], error: null }),
          }),
        }),
      }),
  } as any
}

