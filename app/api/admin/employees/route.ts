import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  validateSession,
  hashPassword,
  validatePasswordStrength,
  logAuditEvent,
} from '@/lib/auth/admin-auth-v2'
import { hasActionPermission, DEFAULT_PERMISSIONS, AdminPermissions } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

// GET: List all employees
export async function GET(request: NextRequest) {
  try {
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

    const supabase = await createServiceRoleClient()

    const { data: employees, error } = await supabase
      .from('admin_employees')
      .select('id, email, name, permissions, totp_enabled, last_login, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin Employees] List error:', error)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      employees,
    })
  } catch (error) {
    console.error('[Admin Employees] GET Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST: Create new employee
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { email, name, password, permissions } = body

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    const supabase = await createServiceRoleClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('admin_employees')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An employee with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Merge provided permissions with defaults
    const finalPermissions: AdminPermissions = {
      pages: { ...DEFAULT_PERMISSIONS.pages, ...(permissions?.pages || {}) },
      actions: { ...DEFAULT_PERMISSIONS.actions, ...(permissions?.actions || {}) },
    }

    // Create employee
    const { data: newEmployee, error: createError } = await supabase
      .from('admin_employees')
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        permissions: finalPermissions,
        must_change_password: true,
        created_by: sessionResult.employee.id,
      } as never)
      .select('id, email, name, permissions, totp_enabled, is_active, created_at')
      .single()

    if (createError || !newEmployee) {
      console.error('[Admin Employees] Create error:', createError)
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }

    const createdEmployee = newEmployee as { id: string; email: string; name: string }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Log audit event
    await logAuditEvent(
      sessionResult.employee.id,
      sessionResult.employee.email,
      'employee_created',
      'employee',
      createdEmployee.id,
      { new_email: email, new_name: name },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: 'Employee created successfully',
    })
  } catch (error) {
    console.error('[Admin Employees] POST Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
