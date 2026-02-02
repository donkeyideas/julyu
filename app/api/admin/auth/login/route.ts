import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateEmployee,
  createSession,
  logAuditEvent,
} from '@/lib/auth/admin-auth-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Authenticate employee
    const authResult = await authenticateEmployee(email, password, ipAddress)

    if (!authResult.success || !authResult.employee) {
      return NextResponse.json(
        {
          error: authResult.error,
          locked: authResult.locked,
          lockUntil: authResult.lockUntil,
        },
        { status: 401 }
      )
    }

    const employee = authResult.employee

    // Determine what the user needs to do next
    const requires2FA = employee.totp_enabled
    const needsSetup2FA = !employee.totp_enabled
    const requiresPasswordChange = employee.must_change_password

    // Create session
    const session = await createSession(
      employee.id,
      requires2FA || needsSetup2FA, // Require 2FA step if enabled or needs setup
      requiresPasswordChange,
      ipAddress,
      userAgent
    )

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Log successful login
    await logAuditEvent(
      employee.id,
      employee.email,
      'login_success',
      'employee',
      employee.id,
      { step: 'password' },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      sessionToken: session.session_token,
      requires2FA,
      needsSetup2FA,
      requiresPasswordChange,
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
      },
    })
  } catch (error) {
    console.error('[Admin Auth Login] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
