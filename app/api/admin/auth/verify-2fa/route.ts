import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  validateSession,
  verifyTotpCode,
  verifyRecoveryCode,
  markSessionAs2FAVerified,
  logAuditEvent,
} from '@/lib/auth/admin-auth-v2'

export const dynamic = 'force-dynamic'

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
    const { code, isRecoveryCode } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
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
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    if (!employee.totp_secret) {
      return NextResponse.json(
        { error: '2FA is not set up for this account' },
        { status: 400 }
      )
    }

    let isValid = false

    if (isRecoveryCode) {
      // Verify recovery code
      const supabase = await createServiceRoleClient()
      const { data: empData } = await supabase
        .from('admin_employees')
        .select('recovery_codes')
        .eq('id', employee.id)
        .single()

      const empRow = empData as unknown as { recovery_codes: string[] } | null

      if (empRow?.recovery_codes) {
        const result = await verifyRecoveryCode(code, empRow.recovery_codes)
        isValid = result.valid

        if (isValid) {
          // Update remaining recovery codes
          await supabase
            .from('admin_employees')
            .update({ recovery_codes: result.remainingCodes } as never)
            .eq('id', employee.id)

          // Log recovery code usage
          await logAuditEvent(
            employee.id,
            employee.email,
            'recovery_code_used',
            'employee',
            employee.id,
            { remaining_codes: result.remainingCodes.length },
            ipAddress,
            userAgent
          )
        }
      }
    } else {
      // Verify TOTP code
      isValid = verifyTotpCode(employee.totp_secret, code)
    }

    if (!isValid) {
      await logAuditEvent(
        employee.id,
        employee.email,
        '2fa_verification_failed',
        'employee',
        employee.id,
        { is_recovery_code: isRecoveryCode },
        ipAddress,
        userAgent
      )

      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400 }
      )
    }

    // Mark session as 2FA verified
    await markSessionAs2FAVerified(sessionToken)

    // Log successful verification
    await logAuditEvent(
      employee.id,
      employee.email,
      '2fa_verification_success',
      'employee',
      employee.id,
      { is_recovery_code: isRecoveryCode },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        permissions: employee.permissions,
      },
    })
  } catch (error) {
    console.error('[Admin Auth Verify 2FA] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
