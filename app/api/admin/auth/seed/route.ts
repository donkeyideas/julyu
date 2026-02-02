import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/admin-auth-v2'
import { FULL_ADMIN_PERMISSIONS } from '@/lib/auth/permissions'

// POST: Create initial super admin (can only be called once when no employees exist)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient()

    // Check if any employees already exist
    const { count, error: countError } = await supabase
      .from('admin_employees')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      // Table might not exist yet
      return NextResponse.json(
        { error: 'Database not ready. Please run migrations first.' },
        { status: 500 }
      )
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Seed already completed. Admin employees already exist.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, name, password } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Validate password length (basic check)
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create super admin with full permissions
    const { data: employee, error: createError } = await supabase
      .from('admin_employees')
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        permissions: FULL_ADMIN_PERMISSIONS,
        must_change_password: false, // First admin doesn't need to change password
        is_active: true,
      } as never)
      .select('id, email, name')
      .single()

    if (createError || !employee) {
      console.error('[Admin Seed] Error creating admin:', createError)
      return NextResponse.json(
        { error: 'Failed to create admin employee' },
        { status: 500 }
      )
    }

    const createdEmployee = employee as unknown as { id: string; email: string; name: string }

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully. You can now log in.',
      employee: {
        id: createdEmployee.id,
        email: createdEmployee.email,
        name: createdEmployee.name,
      },
    })
  } catch (error) {
    console.error('[Admin Seed] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// GET: Check if seed is needed
export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    const { count, error: countError } = await supabase
      .from('admin_employees')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({
        needsSeed: true,
        reason: 'Database not ready or table does not exist',
      })
    }

    return NextResponse.json({
      needsSeed: count === 0,
      employeeCount: count,
    })
  } catch (error) {
    return NextResponse.json({
      needsSeed: true,
      reason: 'Error checking database',
    })
  }
}
