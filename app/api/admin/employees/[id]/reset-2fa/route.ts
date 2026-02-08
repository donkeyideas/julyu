import { NextRequest, NextResponse } from 'next/server'
import { validateSession, resetEmployeeTotp } from '@/lib/auth/admin-auth-v2'
import { hasActionPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: Reset employee's 2FA
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check permission
    if (!hasActionPermission(sessionResult.employee.permissions, 'manage_employees')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Reset 2FA for the employee
    const success = await resetEmployeeTotp(id, sessionResult.employee.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset 2FA' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA has been reset. The employee will need to set up 2FA again on their next login.',
    })
  } catch (error) {
    console.error('[Admin Employees] Reset 2FA Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
