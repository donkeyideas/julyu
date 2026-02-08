import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required', valid: false },
        { status: 401 }
      )
    }

    const result = await validateSession(sessionToken)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error, valid: false },
        { status: 401 }
      )
    }

    // Session is valid but may still require 2FA or password change
    if (result.requires2FA) {
      return NextResponse.json({
        valid: true,
        requires2FA: true,
        employee: {
          id: result.employee?.id,
          email: result.employee?.email,
          name: result.employee?.name,
        },
      })
    }

    if (result.requiresPasswordChange) {
      return NextResponse.json({
        valid: true,
        requiresPasswordChange: true,
        employee: {
          id: result.employee?.id,
          email: result.employee?.email,
          name: result.employee?.name,
        },
      })
    }

    // Fully authenticated
    return NextResponse.json({
      valid: true,
      employee: {
        id: result.employee?.id,
        email: result.employee?.email,
        name: result.employee?.name,
        permissions: result.employee?.permissions,
      },
    })
  } catch (error) {
    console.error('[Admin Auth Session] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred', valid: false },
      { status: 500 }
    )
  }
}
