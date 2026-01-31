import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import crypto from 'crypto'

// Custom password reset using Resend (branded emails)
export async function POST(request: NextRequest) {
  console.log('[Password Reset] Request received')

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('[Password Reset] Processing for:', email)

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Password Reset] RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const supabaseAdmin = createServiceRoleClient() as any

    // Check if user exists
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()

    if (fetchError) {
      console.error('[Password Reset] Error fetching users:', fetchError)
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' })
    }

    const user = users.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.log('[Password Reset] User not found, but returning success for security')
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' })
    }

    console.log('[Password Reset] User found:', user.id)

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in user metadata (or you could use a separate table)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_token: resetToken,
        reset_token_expires: tokenExpiry.toISOString()
      }
    })

    if (updateError) {
      console.error('[Password Reset] Error storing token:', updateError)
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    // Send branded email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'
    const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error: emailError } = await resend.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: email,
      subject: 'Reset Your Julyu Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111111; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 30px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #22c55e;">Julyu</h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 16px;">Password Reset Request</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          We received a request to reset your password. Click the button below to create a new password.
                        </p>

                        <!-- Reset Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <tr>
                            <td align="center">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #22c55e; color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Security Notice -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="margin: 0; color: #fbbf24; font-size: 14px; font-weight: 600;">Security Notice</p>
                          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                            This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.
                          </p>
                        </div>

                        <!-- Link fallback -->
                        <p style="color: #6b7280; font-size: 12px; margin: 0; word-break: break-all;">
                          If the button doesn't work, copy and paste this link:<br>
                          <a href="${resetUrl}" style="color: #22c55e;">${resetUrl}</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #0a0a0a; border-top: 1px solid #222222;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                          &copy; ${new Date().getFullYear()} Julyu. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })

    if (emailError) {
      console.error('[Password Reset] Email send error:', emailError)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    console.log('[Password Reset] Email sent successfully')

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.'
    })

  } catch (error) {
    console.error('[Password Reset] Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
