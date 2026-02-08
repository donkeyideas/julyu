import { NextRequest, NextResponse } from 'next/server'
import {
  validateSession,
  setupTotpForEmployee,
  verifyAndEnableTotp,
  markSessionAs2FAVerified,
  logAuditEvent,
} from '@/lib/auth/admin-auth-v2'

export const dynamic = 'force-dynamic'

// GET: Generate QR code and secret for 2FA setup
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 401 }
      )
    }

    // Validate session
    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json(
        { error: sessionResult.error || 'Invalid session' },
        { status: 401 }
      )
    }

    const employee = sessionResult.employee

    // Check if 2FA is already enabled
    if (employee.totp_enabled) {
      return NextResponse.json(
        { error: '2FA is already enabled. Reset it first to set up again.' },
        { status: 400 }
      )
    }

    // Generate TOTP setup data
    const totpData = await setupTotpForEmployee(employee.id)

    if (!totpData) {
      return NextResponse.json(
        { error: 'Failed to generate 2FA setup' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qrCodeUrl: totpData.qrCodeUrl,
      secret: totpData.secret, // For manual entry
      otpauthUrl: totpData.otpauthUrl, // For direct link
    })
  } catch (error) {
    console.error('[Admin Auth Setup 2FA] GET Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST: Verify initial code and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid code. Please enter a 6-digit code.' },
        { status: 400 }
      )
    }

    // Validate session
    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json(
        { error: sessionResult.error || 'Invalid session' },
        { status: 401 }
      )
    }

    const employee = sessionResult.employee

    // Verify and enable TOTP
    const result = await verifyAndEnableTotp(employee.id, code)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid code' },
        { status: 400 }
      )
    }

    // Mark session as 2FA verified
    await markSessionAs2FAVerified(sessionToken)

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Log event
    await logAuditEvent(
      employee.id,
      employee.email,
      '2fa_setup_complete',
      'employee',
      employee.id,
      {},
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      recoveryCodes: result.recoveryCodes,
      message: '2FA has been enabled successfully. Save your recovery codes!',
    })
  } catch (error) {
    console.error('[Admin Auth Setup 2FA] POST Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
