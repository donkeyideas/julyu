import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip Supabase auth entirely for demo routes
  const isDemoPage = request.nextUrl.pathname.startsWith('/demo/dashboard') ||
                     request.nextUrl.pathname.startsWith('/demo/store-portal')
  const isDemoEntry = request.nextUrl.pathname.startsWith('/demo/enter')
  const isDemoApi = request.nextUrl.pathname.startsWith('/api/demo/')

  if (isDemoEntry || isDemoApi) {
    return NextResponse.next()
  }

  if (isDemoPage) {
    const demoSession = request.cookies.get('julyu_demo_session')
    if (!demoSession?.value) {
      return NextResponse.redirect(new URL('/demo/enter', request.url))
    }
    return NextResponse.next()
  }

  // Block /auth/login and /auth/signup if sign-in is disabled
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/login') ||
                      request.nextUrl.pathname.startsWith('/auth/signup')
  if (isAuthRoute) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceKey) {
        const adminClient = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        const { data } = await adminClient
          .from('site_settings')
          .select('value')
          .eq('key', 'user_sign_in_enabled')
          .single()
        if (data?.value?.enabled === false) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    } catch {
      // If check fails, allow through (fail open)
    }
  }

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

  // Log for store-portal routes
  const isStorePortal = request.nextUrl.pathname.startsWith('/store-portal')
  if (isStorePortal) {
    console.log('[Middleware] store-portal route:', request.nextUrl.pathname)
    console.log('[Middleware] user found:', user ? 'YES - ' + user.id : 'NO')
  }

  // Store user ID in request headers for Server Components to read
  // Headers set on request ARE passed to server components via NextResponse.next({ request })
  // Unlike cookies, headers() in server components reads from the modified request
  if (user) {
    // Set user ID in request header - this IS accessible via headers() in server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)

    if (isStorePortal) {
      console.log('[Middleware] Setting x-user-id header:', user.id)
    }

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
    // No Supabase user - but preserve client-sent x-user-id header for Firebase/Google users
    const clientUserId = request.headers.get('x-user-id')

    if (clientUserId) {
      // Firebase/Google user - preserve their client-sent header
      // Don't modify headers at all, let them pass through
      console.log('[Middleware] Preserving client-sent x-user-id for Firebase user:', clientUserId)
    } else {
      // No user at all - clear any stale cookie
      supabaseResponse.cookies.delete('x-user-id')
    }
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
