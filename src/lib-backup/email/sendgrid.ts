import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  templateId?: string
  variables?: Record<string, any>
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: string
  }>
  categories?: string[]
  scheduledAt?: number
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: EmailOptions) {
  const msg = {
    to: options.to,
    from: options.from || process.env.SENDGRID_FROM_EMAIL!,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html || ''),
    replyTo: options.replyTo,
    templateId: options.templateId,
    dynamicTemplateData: options.variables,
    attachments: options.attachments,
    categories: options.categories,
    sendAt: options.scheduledAt,
  }

  try {
    const [response] = await sgMail.send(msg)
    return {
      success: true,
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode,
    }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
      details: error.response?.body,
    }
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(
  recipients: Array<{
    email: string
    variables?: Record<string, any>
  }>,
  subject: string,
  templateId: string,
  categories?: string[]
) {
  const messages = recipients.map(recipient => ({
    to: recipient.email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    templateId,
    dynamicTemplateData: recipient.variables,
    categories,
  }))

  try {
    const responses = await sgMail.sendMultiple({
      personalizations: messages.map(msg => ({
        to: msg.to,
        dynamicTemplateData: msg.dynamicTemplateData,
      })),
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      templateId,
      categories,
    })

    return {
      success: true,
      sent: responses.length,
    }
  } catch (error: any) {
    console.error('SendGrid bulk error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send bulk emails',
    }
  }
}

/**
 * Email templates
 */
export const emailTemplates = {
  // Welcome email
  welcome: (firstName: string, verificationUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff69b4, #1e90ff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #ff69b4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Pink Blueberry Salon!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We're thrilled to have you join our beauty community!</p>
          <p>Please verify your email address to get started:</p>
          <center>
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </center>
          <p>Once verified, you can:</p>
          <ul>
            <li>Book appointments online 24/7</li>
            <li>Access exclusive member offers</li>
            <li>Earn loyalty points with every visit</li>
            <li>Shop our premium beauty products</li>
          </ul>
          <p>Questions? Reply to this email or call us at (555) 123-4567.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Pink Blueberry Salon. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Appointment confirmation
  appointmentConfirmation: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff69b4, #1e90ff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .button { display: inline-block; padding: 12px 30px; background: #ff69b4; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .button-secondary { background: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.customerName},</h2>
          <p>Your appointment has been successfully booked!</p>

          <div class="appointment-card">
            <h3>Appointment Details</h3>
            <div class="detail-row">
              <strong>Date:</strong>
              <span>${data.date}</span>
            </div>
            <div class="detail-row">
              <strong>Time:</strong>
              <span>${data.time}</span>
            </div>
            <div class="detail-row">
              <strong>Services:</strong>
              <span>${data.services}</span>
            </div>
            <div class="detail-row">
              <strong>Staff:</strong>
              <span>${data.staffName}</span>
            </div>
            <div class="detail-row">
              <strong>Location:</strong>
              <span>${data.location}</span>
            </div>
            <div class="detail-row">
              <strong>Total:</strong>
              <span>$${data.total}</span>
            </div>
            <div class="detail-row">
              <strong>Confirmation Code:</strong>
              <span>${data.confirmationCode}</span>
            </div>
          </div>

          <center>
            <a href="${data.manageUrl}" class="button">Manage Appointment</a>
            <a href="${data.calendarUrl}" class="button button-secondary">Add to Calendar</a>
          </center>

          <p><strong>Important:</strong> Please arrive 5 minutes early for your appointment.</p>
          <p>Need to make changes? You can reschedule or cancel up to 24 hours before your appointment.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Password reset
  passwordReset: (firstName: string, resetUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff69b4; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #ff69b4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    </body>
    </html>
  `,
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}