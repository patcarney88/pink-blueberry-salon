import twilio from 'twilio'

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface SMSOptions {
  to: string
  body: string
  from?: string
  mediaUrl?: string[]
  scheduledAt?: Date
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(options: SMSOptions) {
  try {
    const message = await twilioClient.messages.create({
      body: options.body,
      from: options.from || process.env.TWILIO_PHONE_NUMBER!,
      to: options.to,
      mediaUrl: options.mediaUrl,
      scheduleType: options.scheduledAt ? 'fixed' : undefined,
      sendAt: options.scheduledAt,
    })

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      dateCreated: message.dateCreated,
    }
  } catch (error: any) {
    console.error('Twilio error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      code: error.code,
    }
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  recipients: Array<{
    phone: string
    message: string
    variables?: Record<string, string>
  }>
) {
  const results = await Promise.allSettled(
    recipients.map(recipient => {
      let message = recipient.message

      // Replace variables in message
      if (recipient.variables) {
        Object.entries(recipient.variables).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), value)
        })
      }

      return sendSMS({
        to: recipient.phone,
        body: message,
      })
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return {
    total: recipients.length,
    successful,
    failed,
    results,
  }
}

/**
 * Verify phone number
 */
export async function sendVerificationCode(phoneNumber: string) {
  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      })

    return {
      success: true,
      status: verification.status,
      valid: verification.valid,
    }
  } catch (error: any) {
    console.error('Twilio verification error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send verification code',
    }
  }
}

/**
 * Check verification code
 */
export async function checkVerificationCode(
  phoneNumber: string,
  code: string
) {
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      })

    return {
      success: true,
      status: verificationCheck.status,
      valid: verificationCheck.valid,
    }
  } catch (error: any) {
    console.error('Twilio verification check error:', error)
    return {
      success: false,
      error: error.message || 'Failed to check verification code',
    }
  }
}

/**
 * SMS Templates
 */
export const smsTemplates = {
  // Appointment reminder
  appointmentReminder: (data: {
    customerName: string
    date: string
    time: string
    services: string
    confirmationCode: string
  }) =>
    `Hi ${data.customerName}! Reminder: Your appointment for ${data.services} is on ${data.date} at ${data.time}. Confirmation: ${data.confirmationCode}. Reply CANCEL to cancel or CONFIRM to confirm.`,

  // Appointment confirmation
  appointmentConfirmation: (data: {
    customerName: string
    date: string
    time: string
    confirmationCode: string
  }) =>
    `Hi ${data.customerName}! Your appointment is confirmed for ${data.date} at ${data.time}. Confirmation code: ${data.confirmationCode}. We look forward to seeing you!`,

  // Welcome message
  welcome: (firstName: string) =>
    `Welcome to Pink Blueberry Salon, ${firstName}! Thank you for joining us. Book your first appointment online and get 20% off. Text STOP to unsubscribe.`,

  // Promotion
  promotion: (data: {
    firstName: string
    offer: string
    code: string
    expiry: string
  }) =>
    `Hi ${data.firstName}! ${data.offer} Use code ${data.code} by ${data.expiry}. Book now at pinkblueberry.com. Text STOP to unsubscribe.`,

  // Waitlist available
  waitlistAvailable: (data: {
    customerName: string
    service: string
    date: string
    time: string
  }) =>
    `Hi ${data.customerName}! A spot opened up for ${data.service} on ${data.date} at ${data.time}. Reply YES to book or NO to remain on waitlist.`,

  // Payment confirmation
  paymentConfirmation: (data: {
    amount: string
    last4: string
  }) =>
    `Payment of $${data.amount} received. Card ending in ${data.last4}. Thank you for your business!`,

  // Two-factor authentication
  twoFactorAuth: (code: string) =>
    `Your Pink Blueberry Salon verification code is: ${code}. This code expires in 10 minutes.`,
}

/**
 * Format phone number for Twilio (E.164 format)
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+1'): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // If it starts with country code, return as is with +
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`
  }

  // If it's 10 digits, add country code
  if (digits.length === 10) {
    return `${countryCode}${digits}`
  }

  // Return as is if already in E.164 format
  if (phone.startsWith('+')) {
    return phone
  }

  // Default to adding country code
  return `${countryCode}${digits}`
}

/**
 * Validate phone number
 */
export async function validatePhoneNumber(phone: string) {
  try {
    const phoneNumber = await twilioClient.lookups.v2
      .phoneNumbers(formatPhoneNumber(phone))
      .fetch()

    return {
      valid: true,
      formatted: phoneNumber.phoneNumber,
      countryCode: phoneNumber.countryCode,
      nationalFormat: phoneNumber.nationalFormat,
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid phone number',
    }
  }
}