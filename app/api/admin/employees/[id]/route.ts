import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  validateSession,
  hashPassword,
  validatePasswordStrength,
  invalidateAllEmployeeSessions,
  logAuditEvent,
} from '@/lib/auth/admin-auth-v2'
import { hasActionPermission, AdminPermissions } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get single employee
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check permission (or allow if viewing own profile)
    const isOwnProfile = sessionResult.employee.id === id
    if (!isOwnProfile && !hasActionPermission(sessionResult.employee.permissions, 'manage_employees')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const supabase = await createServiceRoleClient()

    const { data: employee, error } = await supabase
      .from('admin_employees')
      .select('id, email, name, permissions, totp_enabled, last_login, is_active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error) {
    console.error('[Admin Employees] GET by ID Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT: Update employee
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json()
    const { name, permissions, password, is_active } = body

    const supabase = await createServiceRoleClient()

    // Get current employee data
    const { data: currentEmployeeData } = await supabase
      .from('admin_employees')
      .select('email, name, permissions, is_active')
      .eq('id', id)
      .single()

    if (!currentEmployeeData) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const currentEmployee = currentEmployeeData as unknown as { email: string; name: string; permissions: AdminPermissions; is_active: boolean }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: sessionResult.employee.id,
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (permissions !== undefined) {
      // Merge with existing permissions
      const mergedPermissions: AdminPermissions = {
        pages: { ...currentEmployee.permissions.pages, ...permissions.pages },
        actions: { ...currentEmployee.permissions.actions, ...permissions.actions },
      }
      updateData.permissions = mergedPermissions
    }

    if (password !== undefined && password !== '') {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.errors.join('. ') },
          { status: 400 }
        )
      }
      updateData.password_hash = await hashPassword(password)
      updateData.must_change_password = true // Force password change on next login
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active
      // If deactivating, invalidate all sessions
      if (!is_active) {
        await invalidateAllEmployeeSessions(id)
      }
    }

    // Update employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('admin_employees')
      .update(updateData as never)
      .eq('id', id)
      .select('id, email, name, permissions, totp_enabled, is_active, last_login, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('[Admin Employees] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Log audit event
    await logAuditEvent(
      sessionResult.employee.id,
      sessionResult.employee.email,
      'employee_updated',
      'employee',
      id,
      {
        changes: {
          name: name !== undefined ? { from: currentEmployee.name, to: name } : undefined,
          is_active: is_active !== undefined ? { from: currentEmployee.is_active, to: is_active } : undefined,
          password_changed: password !== undefined && password !== '',
          permissions_changed: permissions !== undefined,
        },
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: 'Employee updated successfully',
    })
  } catch (error) {
    console.error('[Admin Employees] PUT Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE: Deactivate employee (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Prevent self-deletion
    if (sessionResult.employee.id === id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    const supabase = await createServiceRoleClient()

    // Get employee email for logging
    const { data: employeeData } = await supabase
      .from('admin_employees')
      .select('email')
      .eq('id', id)
      .single()

    if (!employeeData) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const employee = employeeData as unknown as { email: string }

    // Deactivate (soft delete)
    const { error: updateError } = await supabase
      .from('admin_employees')
      .update({
        is_active: false,
        updated_by: sessionResult.employee.id,
      } as never)
      .eq('id', id)

    if (updateError) {
      console.error('[Admin Employees] Delete error:', updateError)
      return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 })
    }

    // Invalidate all sessions for this employee
    await invalidateAllEmployeeSessions(id)

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Log audit event
    await logAuditEvent(
      sessionResult.employee.id,
      sessionResult.employee.email,
      'employee_deactivated',
      'employee',
      id,
      { deactivated_email: employee.email },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully',
    })
  } catch (error) {
    console.error('[Admin Employees] DELETE Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
