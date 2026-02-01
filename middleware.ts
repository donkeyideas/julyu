import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware if Supabase not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Store user ID in request headers for Server Components to read
  // Headers set on request ARE passed to server components via NextResponse.next({ request })
  // Unlike cookies, headers() in server components reads from the modified request
  if (user) {
    // Set user ID in request header - this IS accessible via headers() in server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)

    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Also set cookie for future requests (client-side)
    supabaseResponse.cookies.set('x-user-id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  } else {
    // Clear user ID header
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('x-user-id')

    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Clear cookie
    supabaseResponse.cookies.delete('x-user-id')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
