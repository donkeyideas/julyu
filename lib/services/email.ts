import { Resend } from 'resend'

// Initialize Resend lazily to avoid build errors when API key is missing
let resend: Resend | null = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

interface StoreApprovalEmailProps {
  businessName: string
  businessEmail: string
  resetPasswordLink?: string
}

export async function sendStoreApprovalEmail({
  businessName,
  businessEmail,
  resetPasswordLink,
}: StoreApprovalEmailProps) {
  try {
    const client = getResendClient()
    if (!client) {
      console.warn('Resend API key not configured - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const storePortalUrl = `${appUrl}/store-portal`

    const { data, error } = await client.emails.send({
      from: 'Julyu <onboarding@resend.dev>', // Replace with your verified domain
      to: businessEmail,
      subject: 'Your Store Application Has Been Approved! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background: #059669;
              }
              .info-box {
                background: white;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Congratulations, ${businessName}!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your store application has been approved</p>
            </div>

            <div class="content">
              <p>Great news! Your application to join the Julyu platform has been approved. You can now start managing your inventory and receiving orders from customers.</p>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">What's Next?</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Access your store owner dashboard</li>
                  <li>Add your inventory (manually, via receipt scan, or POS integration)</li>
                  <li>Start receiving and fulfilling customer orders</li>
                </ol>
              </div>

              <div style="text-align: center;">
                <a href="${storePortalUrl}" class="button">
                  Access Store Dashboard →
                </a>
              </div>

              ${resetPasswordLink ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #3b82f6;">Login Instructions</h3>
                <p>If you need to set or reset your password, click the link below:</p>
                <p><a href="${resetPasswordLink}" style="color: #3b82f6;">Set Your Password</a></p>
              </div>
              ` : `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #3b82f6;">Login Instructions</h3>
                <p>Use the email address <strong>${businessEmail}</strong> and your password to log in.</p>
                <p>If you've forgotten your password, you can reset it on the login page.</p>
              </div>
              `}

              <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>

              <p style="margin-top: 30px;">Welcome to Julyu!</p>
              <p style="margin: 0;"><strong>The Julyu Team</strong></p>
            </div>

            <div class="footer">
              <p>This email was sent by Julyu. If you have questions, please contact support.</p>
            </div>
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
      from: 'Julyu <onboarding@resend.dev>', // Replace with your verified domain
      to: businessEmail,
      subject: 'Update on Your Store Application',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #6b7280;
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .info-box {
                background: white;
                border-left: 4px solid #ef4444;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Application Status Update</h1>
            </div>

            <div class="content">
              <p>Dear ${businessName},</p>

              <p>Thank you for your interest in joining the Julyu platform. After careful review, we regret to inform you that we are unable to approve your store application at this time.</p>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #ef4444;">Reason:</h3>
                <p style="margin: 0;">${reason}</p>
              </div>

              <p>If you believe this decision was made in error or if you'd like to discuss your application further, please don't hesitate to contact our support team.</p>

              <p style="margin-top: 30px;">Best regards,</p>
              <p style="margin: 0;"><strong>The Julyu Team</strong></p>
            </div>

            <div class="footer">
              <p>This email was sent by Julyu. If you have questions, please contact support.</p>
            </div>
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
