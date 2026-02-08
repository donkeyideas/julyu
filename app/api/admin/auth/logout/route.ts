import { NextRequest, NextResponse } from 'next/server'
import { validateSession, invalidateSession, logAuditEvent } from '@/lib/auth/admin-auth-v2'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ success: true })
    }

    // Get session info for logging before invalidating
    const result = await validateSession(sessionToken)

    // Invalidate the session
    await invalidateSession(sessionToken)

    // Log logout event
    if (result.valid && result.employee) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined

      await logAuditEvent(
        result.employee.id,
        result.employee.email,
        'logout',
        'employee',
        result.employee.id,
        {},
        ipAddress,
        userAgent
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Auth Logout] Error:', error)
    // Still return success - we don't want logout to fail
    return NextResponse.json({ success: true })
  }
}
