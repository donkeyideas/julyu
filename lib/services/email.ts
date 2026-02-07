import { Resend } from 'resend'

// Initialize Resend lazily to avoid build errors when API key is missing
let resend: Resend | null = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Helper to get and validate the app URL
function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Log warning if not using production URL
  if (!appUrl.includes('julyu.com')) {
    console.warn('[Email Service] WARNING: NEXT_PUBLIC_APP_URL is not set to julyu.com')
    console.warn('[Email Service] Current URL:', appUrl)
    console.warn('[Email Service] Email links will use this URL - set NEXT_PUBLIC_APP_URL=https://julyu.com in Vercel and redeploy')
  } else {
    console.log('[Email Service] Using production URL:', appUrl)
  }

  return appUrl
}

interface StoreApprovalEmailProps {
  businessName: string
  businessEmail: string
}

export async function sendStoreApprovalEmail({
  businessName,
  businessEmail,
}: StoreApprovalEmailProps) {
  console.log('[Email Service] Sending approval email to:', businessEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const storePortalUrl = `${appUrl}/store-portal`
    console.log('[Email Service] Store portal URL in email:', storePortalUrl)

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: businessEmail,
      subject: 'Your Store Application Has Been Approved!',
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #4ade80; font-size: 14px;">Application Approved</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Congratulations, <span style="background: linear-gradient(to right, #22c55e, #86efac); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${businessName}</span>!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Your store application has been approved</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Great news! Your application to join the Julyu platform has been approved. You can now start managing your inventory and receiving orders from customers.
                        </p>

                        <!-- Info Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #22c55e; font-size: 16px; font-weight: 600;">What's Next?</h3>
                          <ol style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 15px; line-height: 1.8;">
                            <li>Access your store owner dashboard</li>
                            <li>Add your inventory (manually, via receipt scan, or POS integration)</li>
                            <li>Start receiving and fulfilling customer orders</li>
                          </ol>
                        </div>

                        <!-- Login Info Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 16px; font-weight: 600;">How to Log In</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0 0 8px 0;">Use the temporary password we sent you when you submitted your application:</p>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0 0 4px 0;"><strong style="color: #9ca3af;">Email:</strong> <span style="color: #ffffff;">${businessEmail}</span></p>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0 0 12px 0;"><strong style="color: #9ca3af;">Password:</strong> <span style="color: #ffffff;">The temporary password from your "Account Created" email</span></p>
                          <p style="color: #9ca3af; font-size: 14px; margin: 0;">Can't find it? Use "Forgot Password" on the login page to reset it.</p>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${storePortalUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Log In to Store Dashboard →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.
                        </p>

                        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Welcome to Julyu!</p>
                        <p style="color: #9ca3af; font-size: 15px; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Store approval email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending store approval email:', error)
    return { success: false, error }
  }
}

interface StoreRejectionEmailProps {
  businessName: string
  businessEmail: string
  reason: string
}

export async function sendStoreRejectionEmail({
  businessName,
  businessEmail,
  reason,
}: StoreRejectionEmailProps) {
  try {
    const client = getResendClient()
    if (!client) {
      console.warn('Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: businessEmail,
      subject: 'Update on Your Store Application',
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
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Application Status Update
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${businessName},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Thank you for your interest in joining the Julyu platform. After careful review, we regret to inform you that we are unable to approve your store application at this time.
                        </p>

                        <!-- Reason Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #f87171; font-size: 16px; font-weight: 600;">Reason:</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0;">${reason}</p>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you believe this decision was made in error or if you'd like to discuss your application further, please don't hesitate to contact our support team.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Best regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Store rejection email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending store rejection email:', error)
    return { success: false, error }
  }
}

interface StoreApplicationSubmittedEmailProps {
  businessName: string
  businessEmail: string
  storeName: string
}

export async function sendStoreApplicationSubmittedEmail({
  businessName,
  businessEmail,
  storeName,
}: StoreApplicationSubmittedEmailProps) {
  try {
    const client = getResendClient()
    if (!client) {
      console.warn('Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: businessEmail,
      subject: 'Store Application Received - Under Review',
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #60a5fa; font-size: 14px;">Under Review</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Application Received!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Thank you for applying to partner with Julyu</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${businessName},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          We've successfully received your application to join the Julyu platform for <strong style="color: #ffffff;">${storeName}</strong>.
                        </p>

                        <!-- What Happens Next Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 16px; font-weight: 600;">What Happens Next?</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0;">Our team will review your application within <strong style="color: #ffffff;">1-2 business days</strong>. We'll verify your business information and ensure everything is in order.</p>
                        </div>

                        <!-- Once Approved Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #4ade80; font-size: 16px; font-weight: 600;">Once Approved, You'll Receive:</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 15px; line-height: 1.8;">
                            <li>Login credentials for your store owner dashboard</li>
                            <li>Instructions on how to set up your inventory</li>
                            <li>Next steps to start receiving customer orders</li>
                          </ul>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you have any questions in the meantime, please don't hesitate to reach out to our support team.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Best regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Store application submitted email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending store application submitted email:', error)
    return { success: false, error }
  }
}

interface StoreAccountCreatedEmailProps {
  businessName: string
  businessEmail: string
  temporaryPassword: string
}

export async function sendStoreAccountCreatedEmail({
  businessName,
  businessEmail,
  temporaryPassword,
}: StoreAccountCreatedEmailProps) {
  console.log('[Email Service] Sending account created email to:', businessEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const storePortalUrl = `${appUrl}/store-portal`
    console.log('[Email Service] Store portal URL in email:', storePortalUrl)

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: businessEmail,
      subject: 'Your Julyu Store Account Has Been Created',
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #4ade80; font-size: 14px;">Account Ready</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Account Created!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Your store owner account is ready</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${businessName},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Your store owner account has been created as part of your application submission. Below are your temporary login credentials:
                        </p>

                        <!-- Credentials Box -->
                        <div style="background-color: #1a1a1a; border: 2px solid #22c55e; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                          <h3 style="margin: 0 0 16px 0; color: #22c55e; font-size: 18px; font-weight: 600;">Login Credentials</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0 0 8px 0;"><strong style="color: #9ca3af;">Email:</strong> <span style="color: #ffffff;">${businessEmail}</span></p>
                          <p style="color: #9ca3af; font-size: 15px; margin: 16px 0 8px 0;"><strong>Temporary Password:</strong></p>
                          <div style="background-color: #0d0d0d; color: #22c55e; padding: 12px 20px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; border-radius: 8px; border: 1px solid #333333; display: inline-block;">
                            ${temporaryPassword}
                          </div>
                        </div>

                        <!-- Warning Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="color: #fbbf24; font-size: 15px; margin: 0;"><strong>Important:</strong> <span style="color: #d1d5db;">Please change this temporary password after your first login for security purposes.</span></p>
                        </div>

                        <p style="color: #d1d5db; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          You can log in to your store portal once your application is approved. You'll receive another email when that happens.
                        </p>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${storePortalUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Go to Store Portal →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you have any questions, please contact our support team.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Best regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Store account created email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending store account created email:', error)
    return { success: false, error }
  }
}

// ============================================
// Order Notification Emails
// ============================================

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderConfirmationEmailProps {
  customerEmail: string
  customerName: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  storeName: string
  storeAddress?: string
  orderType: 'pickup' | 'delivery'
  estimatedTime?: string
}

export async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  orderNumber,
  items,
  subtotal,
  tax,
  total,
  storeName,
  storeAddress,
  orderType,
  estimatedTime,
}: OrderConfirmationEmailProps) {
  console.log('[Email Service] Sending order confirmation email to:', customerEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const orderTrackingUrl = `${appUrl}/orders/${orderNumber}`

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #222222; color: #d1d5db; font-size: 15px;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #222222; color: #9ca3af; font-size: 15px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #222222; color: #ffffff; font-size: 15px; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('')

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: customerEmail,
      subject: `Order #${orderNumber} Confirmed - ${storeName}`,
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #4ade80; font-size: 14px;">Order Confirmed</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Thank you, ${customerName}!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Your order has been received</p>
                      </td>
                    </tr>

                    <!-- Order Details -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <!-- Order Number Box -->
                        <div style="background-color: #1a1a1a; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">Order Number</p>
                          <p style="color: #22c55e; font-size: 24px; font-weight: 800; margin: 0; font-family: 'Courier New', monospace;">#${orderNumber}</p>
                        </div>

                        <!-- Store & Order Type Info -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="color: #60a5fa; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${storeName}</p>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0 0 8px 0;">
                            <strong style="color: #9ca3af;">${orderType === 'pickup' ? 'Pickup' : 'Delivery'}:</strong>
                            ${estimatedTime || 'We\'ll notify you when ready'}
                          </p>
                          ${storeAddress && orderType === 'pickup' ? `<p style="color: #9ca3af; font-size: 14px; margin: 0;">${storeAddress}</p>` : ''}
                        </div>

                        <!-- Items Table -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <thead>
                            <tr>
                              <th style="padding: 12px 0; border-bottom: 2px solid #333333; color: #9ca3af; font-size: 13px; text-align: left; font-weight: 600;">ITEM</th>
                              <th style="padding: 12px 0; border-bottom: 2px solid #333333; color: #9ca3af; font-size: 13px; text-align: center; font-weight: 600;">QTY</th>
                              <th style="padding: 12px 0; border-bottom: 2px solid #333333; color: #9ca3af; font-size: 13px; text-align: right; font-weight: 600;">PRICE</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                        </table>

                        <!-- Totals -->
                        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #9ca3af; font-size: 15px;">Subtotal</span>
                            <span style="color: #d1d5db; font-size: 15px;">$${subtotal.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: #9ca3af; font-size: 15px;">Tax</span>
                            <span style="color: #d1d5db; font-size: 15px;">$${tax.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #333333;">
                            <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Total</span>
                            <span style="color: #22c55e; font-size: 18px; font-weight: 700;">$${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${orderTrackingUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Track Your Order →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                          You'll receive updates as your order progresses.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Order confirmation email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return { success: false, error }
  }
}

interface NewOrderAlertEmailProps {
  storeOwnerEmail: string
  storeOwnerName: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  items: OrderItem[]
  total: number
  orderType: 'pickup' | 'delivery'
  deliveryAddress?: string
}

export async function sendNewOrderAlertEmail({
  storeOwnerEmail,
  storeOwnerName,
  orderNumber,
  customerName,
  customerPhone,
  items,
  total,
  orderType,
  deliveryAddress,
}: NewOrderAlertEmailProps) {
  console.log('[Email Service] Sending new order alert email to:', storeOwnerEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const storePortalUrl = `${appUrl}/store-portal/orders`

    const itemsList = items.map(item =>
      `<li style="color: #d1d5db; font-size: 15px; margin-bottom: 8px;">${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`
    ).join('')

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: storeOwnerEmail,
      subject: `🔔 New Order #${orderNumber} - $${total.toFixed(2)}`,
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #f97316; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #fb923c; font-size: 14px;">New Order</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          New Order Received!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Order #${orderNumber}</p>
                      </td>
                    </tr>

                    <!-- Order Details -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <!-- Order Summary Box -->
                        <div style="background-color: #1a1a1a; border: 2px solid #f97316; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                            <span style="color: #9ca3af; font-size: 14px;">Order Total</span>
                            <span style="color: #22c55e; font-size: 24px; font-weight: 800;">$${total.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                            <span style="color: #9ca3af; font-size: 14px;">Order Type</span>
                            <span style="color: #ffffff; font-size: 16px; font-weight: 600; text-transform: capitalize;">${orderType}</span>
                          </div>
                        </div>

                        <!-- Customer Info -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 16px; font-weight: 600;">Customer Info</h3>
                          <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0;">${customerName}</p>
                          ${customerPhone ? `<p style="color: #9ca3af; font-size: 15px; margin: 0;">Phone: ${customerPhone}</p>` : ''}
                          ${deliveryAddress && orderType === 'delivery' ? `<p style="color: #9ca3af; font-size: 15px; margin: 8px 0 0 0;">Delivery: ${deliveryAddress}</p>` : ''}
                        </div>

                        <!-- Items List -->
                        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: 600;">Order Items</h3>
                          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
                            ${itemsList}
                          </ul>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${storePortalUrl}" style="display: inline-block; background-color: #f97316; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            View Order Details →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                          Please accept or prepare this order as soon as possible.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('New order alert email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending new order alert email:', error)
    return { success: false, error }
  }
}

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'

const ORDER_STATUS_MESSAGES: Record<OrderStatus, { label: string; message: string; color: string }> = {
  pending: { label: 'Order Pending', message: 'Your order is waiting to be accepted by the store.', color: '#9ca3af' },
  accepted: { label: 'Order Accepted', message: 'Great news! The store has accepted your order and will begin preparing it soon.', color: '#3b82f6' },
  preparing: { label: 'Being Prepared', message: 'Your order is being prepared right now!', color: '#f59e0b' },
  ready: { label: 'Ready for Pickup', message: 'Your order is ready! Head to the store to pick it up.', color: '#22c55e' },
  out_for_delivery: { label: 'Out for Delivery', message: 'Your order is on its way to you!', color: '#8b5cf6' },
  delivered: { label: 'Delivered', message: 'Your order has been delivered. Enjoy!', color: '#22c55e' },
  cancelled: { label: 'Order Cancelled', message: 'Your order has been cancelled.', color: '#ef4444' },
}

interface OrderStatusUpdateEmailProps {
  customerEmail: string
  customerName: string
  orderNumber: string
  newStatus: OrderStatus
  storeName: string
  estimatedTime?: string
}

export async function sendOrderStatusUpdateEmail({
  customerEmail,
  customerName,
  orderNumber,
  newStatus,
  storeName,
  estimatedTime,
}: OrderStatusUpdateEmailProps) {
  console.log('[Email Service] Sending order status update email to:', customerEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const orderTrackingUrl = `${appUrl}/orders/${orderNumber}`
    const statusInfo = ORDER_STATUS_MESSAGES[newStatus]

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: customerEmail,
      subject: `Order #${orderNumber} - ${statusInfo.label}`,
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(${statusInfo.color === '#22c55e' ? '34, 197, 94' : statusInfo.color === '#3b82f6' ? '59, 130, 246' : statusInfo.color === '#f59e0b' ? '245, 158, 11' : statusInfo.color === '#8b5cf6' ? '139, 92, 246' : statusInfo.color === '#ef4444' ? '239, 68, 68' : '156, 163, 175'}, 0.1); border: 1px solid rgba(${statusInfo.color === '#22c55e' ? '34, 197, 94' : statusInfo.color === '#3b82f6' ? '59, 130, 246' : statusInfo.color === '#f59e0b' ? '245, 158, 11' : statusInfo.color === '#8b5cf6' ? '139, 92, 246' : statusInfo.color === '#ef4444' ? '239, 68, 68' : '156, 163, 175'}, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: ${statusInfo.color}; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: ${statusInfo.color}; font-size: 14px;">${statusInfo.label}</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Order Update
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Order #${orderNumber}</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Hi ${customerName},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          ${statusInfo.message}
                        </p>

                        <!-- Status Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid ${statusInfo.color}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="color: ${statusInfo.color}; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">${statusInfo.label}</p>
                          <p style="color: #9ca3af; font-size: 15px; margin: 0;">From ${storeName}</p>
                          ${estimatedTime ? `<p style="color: #ffffff; font-size: 15px; margin: 12px 0 0 0;"><strong>Estimated time:</strong> ${estimatedTime}</p>` : ''}
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${orderTrackingUrl}" style="display: inline-block; background-color: ${statusInfo.color}; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            View Order Details →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                          Thank you for shopping with Julyu!
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Order status update email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending order status update email:', error)
    return { success: false, error }
  }
}

interface StoreSuspensionEmailProps {
  storeOwnerEmail: string
  storeOwnerName: string
  storeName: string
  reason: string
}

export async function sendStoreSuspensionEmail({
  storeOwnerEmail,
  storeOwnerName,
  storeName,
  reason,
}: StoreSuspensionEmailProps) {
  console.log('[Email Service] Sending store suspension email to:', storeOwnerEmail)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: storeOwnerEmail,
      subject: `Important: ${storeName} Has Been Suspended`,
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #f87171; font-size: 14px;">Store Suspended</span>
                        </div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Store Suspension Notice
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${storeOwnerName},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          We regret to inform you that your store <strong style="color: #ffffff;">${storeName}</strong> has been suspended from the Julyu platform.
                        </p>

                        <!-- Reason Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #f87171; font-size: 16px; font-weight: 600;">Reason for Suspension:</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0;">${reason}</p>
                        </div>

                        <!-- What This Means Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #9ca3af; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #d1d5db; font-size: 16px; font-weight: 600;">What This Means:</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 15px; line-height: 1.8;">
                            <li>Your store is no longer visible to customers</li>
                            <li>You cannot receive new orders</li>
                            <li>Any pending orders should be fulfilled or cancelled</li>
                          </ul>
                        </div>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you believe this suspension was made in error or would like to appeal this decision, please contact our support team as soon as possible.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Store suspension email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending store suspension email:', error)
    return { success: false, error }
  }
}

// ============================================
// Demo Request Emails
// ============================================

interface DemoRequestConfirmationEmailProps {
  name: string
  email: string
}

export async function sendDemoRequestConfirmationEmail({
  name,
  email,
}: DemoRequestConfirmationEmailProps) {
  console.log('[Email Service] Sending demo request confirmation email to:', email)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: email,
      subject: 'Demo Request Received - Julyu',
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #60a5fa; font-size: 14px;">Under Review</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Demo Request Received!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Thank you for your interest in Julyu</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${name},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Thank you for requesting a demo of the Julyu platform! We've received your request and our team is currently reviewing it. This process typically takes up to <strong style="color: #ffffff;">24 hours</strong>.
                        </p>

                        <!-- What Happens Next Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 16px; font-weight: 600;">What Happens Next?</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 15px; line-height: 1.8;">
                            <li>Our team will review your demo request</li>
                            <li>Once approved, you'll receive an email with your demo access code</li>
                            <li>Use the code to explore the Julyu platform firsthand</li>
                          </ul>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you have any questions in the meantime, please don't hesitate to reach out to our support team.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Best regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Demo request confirmation email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending demo request confirmation email:', error)
    return { success: false, error }
  }
}

interface DemoApprovalEmailProps {
  name: string
  email: string
  code: string
  demoType: string
  expiresAt: string
}

export async function sendDemoApprovalEmail({
  name,
  email,
  code,
  demoType,
  expiresAt,
}: DemoApprovalEmailProps) {
  console.log('[Email Service] Sending demo approval email to:', email)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = getAppUrl()
    const demoUrl = `${appUrl}/demo/enter?code=${code}`
    console.log('[Email Service] Demo URL in email:', demoUrl)

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: email,
      subject: 'Your Julyu Demo Access is Ready!',
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
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50px; margin-bottom: 24px;">
                          <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                          <span style="color: #4ade80; font-size: 14px;">Access Granted</span>
                        </div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Welcome to <span style="background: linear-gradient(to right, #22c55e, #86efac); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Julyu Demo</span>!
                        </h1>
                        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 18px;">Your demo access is ready to go</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${name},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Great news! Your demo request has been approved. Use the code below to access and explore the Julyu platform.
                        </p>

                        <!-- Demo Code Box -->
                        <div style="background-color: #1a1a1a; border: 2px solid #22c55e; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                          <h3 style="margin: 0 0 16px 0; color: #22c55e; font-size: 18px; font-weight: 600;">Your Demo Code</h3>
                          <div style="background-color: #0d0d0d; color: #22c55e; padding: 12px 20px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; border-radius: 8px; border: 1px solid #333333; display: inline-block; letter-spacing: 2px;">
                            ${code}
                          </div>
                          <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0 0;">Demo Type: <strong style="color: #ffffff;">${demoType}</strong></p>
                        </div>

                        <!-- What You Can Explore Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #4ade80; font-size: 16px; font-weight: 600;">What You Can Explore</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0;">
                            With the <strong style="color: #ffffff;">${demoType}</strong> demo, you'll be able to explore the Julyu platform features firsthand. Take your time to navigate the dashboard, test out the workflows, and see how Julyu can work for your business.
                          </p>
                        </div>

                        <!-- Expiration Notice -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="color: #fbbf24; font-size: 15px; margin: 0;"><strong>Expires:</strong> <span style="color: #d1d5db;">${expiresAt}</span></p>
                          <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">Please make sure to access your demo before the expiration date.</p>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${demoUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Access Demo →
                          </a>
                        </div>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you have any questions or need assistance during the demo, please don't hesitate to reach out to our support team.
                        </p>

                        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Enjoy the demo!</p>
                        <p style="color: #9ca3af; font-size: 15px; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Demo approval email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending demo approval email:', error)
    return { success: false, error }
  }
}

interface DemoRejectionEmailProps {
  name: string
  email: string
  reason: string
}

export async function sendDemoRejectionEmail({
  name,
  email,
  reason,
}: DemoRejectionEmailProps) {
  console.log('[Email Service] Sending demo rejection email to:', email)

  try {
    const client = getResendClient()
    if (!client) {
      console.warn('[Email Service] Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await client.emails.send({
      from: 'Julyu <noreply@julyu.com>',
      to: email,
      subject: 'Update on Your Demo Request - Julyu',
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
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                          Demo Request Update
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
                          Dear ${name},
                        </p>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          Thank you for your interest in the Julyu platform. After careful review, we are unable to grant demo access at this time.
                        </p>

                        <!-- Reason Box -->
                        <div style="background-color: #1a1a1a; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; color: #f87171; font-size: 16px; font-weight: 600;">Reason:</h3>
                          <p style="color: #d1d5db; font-size: 15px; margin: 0;">${reason}</p>
                        </div>

                        <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                          We understand this may be disappointing. If you'd like to learn more about Julyu or explore alternative options, we encourage you to contact our sales team who can help find the right solution for your needs.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                          If you believe this decision was made in error or if you'd like to discuss your request further, please don't hesitate to contact our support team.
                        </p>

                        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 4px 0;">Best regards,</p>
                        <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0;">The Julyu Team</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #222222; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent by Julyu. If you have questions, please contact support.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error }
    }

    console.log('Demo rejection email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending demo rejection email:', error)
    return { success: false, error }
  }
}
