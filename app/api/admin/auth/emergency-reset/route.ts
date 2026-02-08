import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/auth/admin-auth-v2'
import bcrypt from 'bcryptjs'

// TEMPORARY: Remove this file after resetting password
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, newPassword, secret } = body

  // Simple protection so only you can call this
  if (secret !== 'julyu-emergency-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createServiceRoleClient()

  // Hash the new password using the same bcrypt lib
  const hash = await bcrypt.hash(newPassword, 12)

  const { data, error } = await supabase
    .from('admin_employees')
    .update({
      password_hash: hash,
      failed_login_attempts: 0,
      locked_until: null,
    })
    .eq('email', email.toLowerCase())
    .select('id, email')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Password reset for ${data.email}`,
    hashPrefix: hash.substring(0, 10),
  })
}
