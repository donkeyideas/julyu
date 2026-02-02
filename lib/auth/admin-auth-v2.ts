// Admin Authentication v2 with TOTP 2FA and Server-Side Sessions
import { generateSecret, generateURI, verifySync } from 'otplib'
import * as QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminPermissions } from './permissions'

// Constants
const SESSION_DURATION_HOURS = 24
const LOCKOUT_THRESHOLD = 5
const LOCKOUT_DURATION_MINUTES = 15
const BCRYPT_ROUNDS = 12
const SESSION_TOKEN_LENGTH = 32 // 64 hex characters
const RECOVERY_CODE_COUNT = 10
const TOTP_ISSUER = 'Julyu Admin'

// Types
export interface AdminEmployee {
  id: string
  email: string
  name: string
  permissions: AdminPermissions
  totp_enabled: boolean
  totp_secret: string | null
  last_login: string | null
  is_active: boolean
  must_change_password: boolean
  failed_login_attempts: number
  locked_until: string | null
}

export interface AdminSession {
  id: string
  employee_id: string
  session_token: string
  requires_2fa: boolean
  requires_password_change: boolean
  expires_at: string
  created_at: string
}

export interface SessionValidationResult {
  valid: boolean
  employee: AdminEmployee | null
  requires2FA: boolean
  requiresPasswordChange: boolean
  error?: string
}

// Database row types (for type assertions)
interface AdminEmployeeRow {
  id: string
  email: string
  name: string
  password_hash: string
  permissions: AdminPermissions
  totp_secret: string | null
  totp_enabled: boolean
  totp_verified_at: string | null
  recovery_codes: string[]
  recovery_codes_generated_at: string | null
  last_login: string | null
  last_login_ip: string | null
  failed_login_attempts: number
  locked_until: string | null
  must_change_password: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  is_active: boolean
}

interface AdminSessionRow {
  id: string
  employee_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  requires_2fa: boolean
  two_fa_verified_at: string | null
  requires_password_change: boolean
  created_at: string
  expires_at: string
  last_activity: string
  admin_employees?: AdminEmployeeRow
}

// ============ Password Management ============

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

// ============ TOTP Management ============

export function generateTotpSecret(): string {
  return generateSecret()
}

export async function generateTotpQrCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = generateURI({
    secret,
    label: email,
    issuer: TOTP_ISSUER,
  })
  return QRCode.toDataURL(otpauthUrl)
}

export function getTotpUrl(email: string, secret: string): string {
  return generateURI({
    secret,
    label: email,
    issuer: TOTP_ISSUER,
  })
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const result = verifySync({ token: code, secret })
  return result.valid
}

// ============ Recovery Codes ============

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, BCRYPT_ROUNDS)))
}

export async function verifyRecoveryCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; remainingCodes: string[]; usedIndex: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(code.toUpperCase(), hashedCodes[i])
    if (isMatch) {
      // Remove the used code
      const remainingCodes = [...hashedCodes]
      remainingCodes.splice(i, 1)
      return { valid: true, remainingCodes, usedIndex: i }
    }
  }
  return { valid: false, remainingCodes: hashedCodes, usedIndex: -1 }
}

// ============ Session Management ============

export function generateSessionToken(): string {
  return crypto.randomBytes(SESSION_TOKEN_LENGTH).toString('hex')
}

export async function createSession(
  employeeId: string,
  requires2FA: boolean,
  requiresPasswordChange: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminSession | null> {
  const supabase = await createServiceRoleClient()
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      employee_id: employeeId,
      session_token: sessionToken,
      requires_2fa: requires2FA,
      requires_password_change: requiresPasswordChange,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    } as never)
    .select()
    .single()

  if (error) {
    console.error('[Admin Auth] Failed to create session:', error)
    return null
  }

  return data as unknown as AdminSession
}

export async function validateSession(token: string): Promise<SessionValidationResult> {
  if (!token) {
    return { valid: false, employee: null, requires2FA: false, requiresPasswordChange: false, error: 'No session token' }
  }

  const supabase = await createServiceRoleClient()

  // Get session with employee data
  const { data: session, error: sessionError } = await supabase
    .from('admin_sessions')
    .select('*, admin_employees(*)')
    .eq('session_token', token)
    .single()

  if (sessionError || !session) {
    return { valid: false, employee: null, requires2FA: false, requiresPasswordChange: false, error: 'Invalid session' }
  }

  const sessionRow = session as unknown as AdminSessionRow

  // Check if session is expired
  if (new Date(sessionRow.expires_at) < new Date()) {
    await invalidateSession(token)
    return { valid: false, employee: null, requires2FA: false, requiresPasswordChange: false, error: 'Session expired' }
  }

  const employee = sessionRow.admin_employees as AdminEmployeeRow

  // Check if employee is still active
  if (!employee.is_active) {
    await invalidateSession(token)
    return { valid: false, employee: null, requires2FA: false, requiresPasswordChange: false, error: 'Account deactivated' }
  }

  // Update last activity
  await supabase
    .from('admin_sessions')
    .update({ last_activity: new Date().toISOString() } as never)
    .eq('session_token', token)

  return {
    valid: true,
    employee: employee as unknown as AdminEmployee,
    requires2FA: sessionRow.requires_2fa,
    requiresPasswordChange: sessionRow.requires_password_change,
  }
}

export async function invalidateSession(token: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  await supabase.from('admin_sessions').delete().eq('session_token', token)
}

export async function invalidateAllEmployeeSessions(employeeId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  await supabase.from('admin_sessions').delete().eq('employee_id', employeeId)
}

export async function markSessionAs2FAVerified(token: string): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('admin_sessions')
    .update({
      requires_2fa: false,
      two_fa_verified_at: new Date().toISOString(),
    } as never)
    .eq('session_token', token)

  return !error
}

export async function markSessionPasswordChanged(token: string): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('admin_sessions')
    .update({ requires_password_change: false } as never)
    .eq('session_token', token)

  return !error
}

// ============ Employee Authentication ============

export async function authenticateEmployee(
  email: string,
  password: string,
  ipAddress?: string
): Promise<{
  success: boolean
  employee?: AdminEmployee
  error?: string
  locked?: boolean
  lockUntil?: string
}> {
  const supabase = await createServiceRoleClient()

  // Get employee by email
  const { data, error } = await supabase
    .from('admin_employees')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { success: false, error: 'Invalid email or password' }
  }

  const employee = data as unknown as AdminEmployeeRow

  // Check if account is locked
  if (employee.locked_until && new Date(employee.locked_until) > new Date()) {
    return {
      success: false,
      error: 'Account is temporarily locked due to too many failed attempts',
      locked: true,
      lockUntil: employee.locked_until,
    }
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, employee.password_hash)

  if (!isValidPassword) {
    // Increment failed attempts
    const newAttempts = (employee.failed_login_attempts || 0) + 1
    const updateData: Record<string, unknown> = { failed_login_attempts: newAttempts }

    if (newAttempts >= LOCKOUT_THRESHOLD) {
      updateData.locked_until = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      ).toISOString()
    }

    await supabase
      .from('admin_employees')
      .update(updateData as never)
      .eq('id', employee.id)

    // Log failed attempt
    await logAuditEvent(employee.id, email, 'login_failed', 'employee', employee.id, { ip_address: ipAddress })

    if (newAttempts >= LOCKOUT_THRESHOLD) {
      return {
        success: false,
        error: `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts`,
        locked: true,
        lockUntil: updateData.locked_until as string,
      }
    }

    return { success: false, error: 'Invalid email or password' }
  }

  // Reset failed attempts on successful login
  await supabase
    .from('admin_employees')
    .update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString(),
      last_login_ip: ipAddress,
    } as never)
    .eq('id', employee.id)

  return { success: true, employee: employee as unknown as AdminEmployee }
}

// ============ 2FA Setup ============

export async function setupTotpForEmployee(employeeId: string): Promise<{
  secret: string
  qrCodeUrl: string
  otpauthUrl: string
} | null> {
  const supabase = await createServiceRoleClient()

  // Get employee email
  const { data, error } = await supabase
    .from('admin_employees')
    .select('email, totp_enabled')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    return null
  }

  const employee = data as unknown as AdminEmployeeRow

  // If already enabled, don't allow re-setup (must reset first)
  if (employee.totp_enabled) {
    return null
  }

  const secret = generateTotpSecret()
  const qrCodeUrl = await generateTotpQrCode(employee.email, secret)
  const otpauthUrl = getTotpUrl(employee.email, secret)

  // Store secret temporarily (not enabled until verified)
  await supabase
    .from('admin_employees')
    .update({ totp_secret: secret } as never)
    .eq('id', employeeId)

  return { secret, qrCodeUrl, otpauthUrl }
}

export async function verifyAndEnableTotp(
  employeeId: string,
  code: string
): Promise<{ success: boolean; recoveryCodes?: string[]; error?: string }> {
  const supabase = await createServiceRoleClient()

  // Get employee with secret
  const { data, error } = await supabase
    .from('admin_employees')
    .select('totp_secret, email')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    return { success: false, error: 'TOTP not set up' }
  }

  const employee = data as unknown as AdminEmployeeRow

  if (!employee.totp_secret) {
    return { success: false, error: 'TOTP not set up' }
  }

  // Verify the code
  const isValid = verifyTotpCode(employee.totp_secret, code)

  if (!isValid) {
    return { success: false, error: 'Invalid code' }
  }

  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(recoveryCodes)

  // Enable 2FA
  await supabase
    .from('admin_employees')
    .update({
      totp_enabled: true,
      totp_verified_at: new Date().toISOString(),
      recovery_codes: hashedCodes,
      recovery_codes_generated_at: new Date().toISOString(),
    } as never)
    .eq('id', employeeId)

  // Log event
  await logAuditEvent(employeeId, employee.email, '2fa_enabled', 'employee', employeeId, {})

  return { success: true, recoveryCodes }
}

export async function resetEmployeeTotp(employeeId: string, adminId: string): Promise<boolean> {
  const supabase = await createServiceRoleClient()

  const { data } = await supabase
    .from('admin_employees')
    .select('email')
    .eq('id', employeeId)
    .single()

  const employee = data as unknown as AdminEmployeeRow | null

  const { error } = await supabase
    .from('admin_employees')
    .update({
      totp_secret: null,
      totp_enabled: false,
      totp_verified_at: null,
      recovery_codes: [],
      recovery_codes_generated_at: null,
    } as never)
    .eq('id', employeeId)

  if (!error && employee) {
    await logAuditEvent(adminId, '', '2fa_reset', 'employee', employeeId, { target_email: employee.email })
    // Invalidate all sessions for this employee
    await invalidateAllEmployeeSessions(employeeId)
  }

  return !error
}

// ============ Audit Logging ============

export async function logAuditEvent(
  employeeId: string | null,
  employeeEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = await createServiceRoleClient()

  await supabase.from('admin_audit_log').insert({
    employee_id: employeeId,
    employee_email: employeeEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || {},
    ip_address: ipAddress,
    user_agent: userAgent,
  } as never)
}

// ============ Client-Side Session Helpers ============

const SESSION_STORAGE_KEY = 'julyu_admin_session_token'

export function setAdminSessionToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, token)
  }
}

export function getAdminSessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_STORAGE_KEY)
  }
  return null
}

export function clearAdminSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
