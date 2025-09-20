import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/sendgrid'
import { sendSMS } from '@/lib/sms/twilio'
import { addDays, subDays, format } from 'date-fns'
import { CustomerAnalyticsService } from '@/services/crm/customer-analytics.service'

export interface CampaignTrigger {
  type: 'immediate' | 'scheduled' | 'event' | 'condition'
  event?: string // 'appointment_completed', 'birthday', 'first_visit', etc.
  condition?: any // Complex conditions
  scheduledAt?: Date
  delayDays?: number
}

export interface CampaignContent {
  subject?: string
  preheader?: string
  body: string
  templateId?: string
  variables?: Record<string, any>
  buttons?: Array<{
    text: string
    url: string
    style: 'primary' | 'secondary'
  }>
}

export interface AutomationRule {
  name: string
  trigger: CampaignTrigger
  audience: any // Segment criteria
  content: CampaignContent
  channels: ('email' | 'sms' | 'push' | 'in_app')[]
  isActive: boolean
}

export class MarketingAutomationService {
  private analyticsService: CustomerAnalyticsService

  constructor() {
    this.analyticsService = new CustomerAnalyticsService()
  }

  /**
   * Create and schedule an automated campaign
   */
  async createAutomatedCampaign(
    tenantId: string,
    rule: AutomationRule
  ) {
    const campaign = await prisma.campaign.create({
      data: {
        tenant_id: tenantId,
        name: rule.name,
        type: rule.channels.includes('email') ? 'EMAIL' : 'SMS',
        status: rule.trigger.type === 'scheduled' ? 'SCHEDULED' : 'ACTIVE',
        target_audience: rule.audience,
        content: rule.content as any,
        scheduled_at: rule.trigger.scheduledAt,
      },
    })

    // Set up trigger based on type
    switch (rule.trigger.type) {
      case 'immediate':
        await this.executeCampaign(campaign.id)
        break
      case 'scheduled':
        // Will be handled by cron job
        break
      case 'event':
        await this.setupEventTrigger(campaign.id, rule.trigger)
        break
      case 'condition':
        await this.setupConditionTrigger(campaign.id, rule.trigger)
        break
    }

    return campaign
  }

  /**
   * Execute a campaign
   */
  async executeCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { tenant: true },
    })

    if (!campaign) return

    // Get target audience
    const customers = await this.getTargetAudience(
      campaign.tenant_id,
      campaign.target_audience
    )

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
        sent_at: new Date(),
        total_recipients: customers.length,
      },
    })

    // Send to each customer
    const results = await Promise.allSettled(
      customers.map(customer => this.sendToCustomer(campaign, customer))
    )

    // Update campaign metrics
    const sentCount = results.filter(r => r.status === 'fulfilled').length
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sent_count: sentCount,
        status: 'COMPLETED',
      },
    })

    return { sent: sentCount, total: customers.length }
  }

  /**
   * Send abandoned cart recovery emails
   */
  async sendAbandonedCartRecovery(tenantId: string) {
    const oneHourAgo = subDays(new Date(), 1/24)
    const threeDaysAgo = subDays(new Date(), 3)

    // Find abandoned carts
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
        last_activity_at: {
          gte: threeDaysAgo,
          lte: oneHourAgo,
        },
        recovery_email_sent: false,
        customer_id: { not: null },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    for (const cart of abandonedCarts) {
      if (!cart.customer?.email) continue

      // Generate discount code
      const discountCode = await this.generateDiscountCode(cart.id, 10) // 10% off

      // Create recovery campaign
      await prisma.cartAbandonmentCampaign.create({
        data: {
          cart_id: cart.id,
          email_subject: 'You left something behind!',
          email_content: this.generateAbandonedCartEmail(cart, discountCode),
          discount_code: discountCode,
          discount_percentage: 10,
          scheduled_at: new Date(),
          status: 'SCHEDULED',
        },
      })

      // Send email
      await this.sendAbandonedCartEmail(cart, discountCode)

      // Mark as sent
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          recovery_email_sent: true,
          recovery_email_sent_at: new Date(),
        },
      })
    }

    return abandonedCarts.length
  }

  /**
   * Send birthday campaigns
   */
  async sendBirthdayCampaigns(tenantId: string) {
    const today = new Date()
    const tomorrow = addDays(today, 1)

    // Find customers with birthdays tomorrow
    const customers = await prisma.customer.findMany({
      where: {
        tenant_id: tenantId,
        date_of_birth: {
          not: null,
        },
        accepts_marketing: true,
      },
    })

    const birthdayCustomers = customers.filter(customer => {
      if (!customer.date_of_birth) return false
      const dob = new Date(customer.date_of_birth)
      return dob.getMonth() === tomorrow.getMonth() &&
             dob.getDate() === tomorrow.getDate()
    })

    for (const customer of birthdayCustomers) {
      // Create special birthday offer
      const promotion = await this.createBirthdayPromotion(customer.id)

      // Send birthday email
      await sendEmail({
        to: customer.email,
        subject: `Happy Birthday ${customer.first_name}! 🎉`,
        html: this.generateBirthdayEmail(customer, promotion),
        variables: {
          firstName: customer.first_name,
          promotionCode: promotion.code,
          promotionValue: promotion.value.toString(),
        },
      })

      // Track notification
      await prisma.notification.create({
        data: {
          recipient_id: customer.user_id!,
          customer_id: customer.id,
          type: 'EMAIL',
          category: 'PROMOTION',
          subject: 'Birthday Wishes',
          message: 'Birthday promotion sent',
          status: 'SENT',
        },
      })
    }

    return birthdayCustomers.length
  }

  /**
   * Send re-engagement campaigns to inactive customers
   */
  async sendReEngagementCampaigns(tenantId: string) {
    const sixtyDaysAgo = subDays(new Date(), 60)
    const ninetyDaysAgo = subDays(new Date(), 90)

    // Find inactive customers
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        tenant_id: tenantId,
        last_visit: {
          gte: ninetyDaysAgo,
          lte: sixtyDaysAgo,
        },
        accepts_marketing: true,
      },
    })

    for (const customer of inactiveCustomers) {
      // Calculate personalized offer based on customer value
      const metrics = await this.analyticsService.calculateCustomerMetrics(customer.id)
      const offerValue = this.calculateReEngagementOffer(metrics)

      // Create re-engagement promotion
      const promotion = await prisma.promotion.create({
        data: {
          code: `COMEBACK${customer.id.substring(0, 6).toUpperCase()}`,
          name: 'We Miss You!',
          type: 'PERCENTAGE',
          value: offerValue,
          valid_from: new Date(),
          valid_to: addDays(new Date(), 30),
          usage_limit: 1,
          per_customer_limit: 1,
          is_active: true,
        },
      })

      // Send re-engagement email
      await sendEmail({
        to: customer.email,
        subject: `We miss you, ${customer.first_name}! Here's ${offerValue}% off`,
        html: this.generateReEngagementEmail(customer, promotion),
      })
    }

    return inactiveCustomers.length
  }

  /**
   * Send appointment reminders
   */
  async sendAppointmentReminders() {
    const tomorrow = addDays(new Date(), 1)
    const dayAfter = addDays(new Date(), 2)

    // Find appointments for tomorrow
    const appointments = await prisma.appointment.findMany({
      where: {
        appointment_date: {
          gte: tomorrow,
          lt: dayAfter,
        },
        status: 'CONFIRMED',
        reminder_sent: false,
      },
      include: {
        customer: true,
        branch: true,
        staff: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    })

    for (const appointment of appointments) {
      // Create reminder record
      await prisma.appointmentReminder.create({
        data: {
          appointment_id: appointment.id,
          reminder_type: 'EMAIL',
          scheduled_at: new Date(),
          recipient: appointment.customer.email,
          subject: 'Appointment Reminder',
          message: this.generateAppointmentReminderMessage(appointment),
        },
      })

      // Send email reminder
      if (appointment.customer.email) {
        await sendEmail({
          to: appointment.customer.email,
          subject: 'Reminder: Your appointment is tomorrow!',
          html: this.generateAppointmentReminderEmail(appointment),
        })
      }

      // Send SMS reminder if phone available
      if (appointment.customer.phone) {
        await sendSMS({
          to: appointment.customer.phone,
          body: this.generateAppointmentReminderSMS(appointment),
        })
      }

      // Mark reminder as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          reminder_sent: true,
          reminder_sent_at: new Date(),
        },
      })
    }

    return appointments.length
  }

  // Helper methods

  private async getTargetAudience(tenantId: string, criteria: any) {
    return await this.analyticsService.segmentCustomers(tenantId, criteria)
  }

  private async sendToCustomer(campaign: any, customer: any) {
    const content = campaign.content as CampaignContent

    if (campaign.type === 'EMAIL' && customer.email) {
      await sendEmail({
        to: customer.email,
        subject: content.subject!,
        html: content.body,
        variables: {
          ...content.variables,
          firstName: customer.first_name,
          lastName: customer.last_name,
        },
      })
    }

    if (campaign.type === 'SMS' && customer.phone) {
      await sendSMS({
        to: customer.phone,
        body: content.body,
      })
    }

    // Track notification
    await prisma.notification.create({
      data: {
        recipient_id: customer.user_id || customer.id,
        customer_id: customer.id,
        type: campaign.type,
        category: 'PROMOTION',
        subject: content.subject,
        message: content.body,
        status: 'SENT',
      },
    })
  }

  private async setupEventTrigger(campaignId: string, trigger: CampaignTrigger) {
    // This would set up event listeners or webhooks
    // Implementation depends on your event system
    console.log(`Setting up event trigger for campaign ${campaignId}`, trigger)
  }

  private async setupConditionTrigger(campaignId: string, trigger: CampaignTrigger) {
    // This would set up condition monitoring
    // Could be handled by a cron job that checks conditions
    console.log(`Setting up condition trigger for campaign ${campaignId}`, trigger)
  }

  private async generateDiscountCode(cartId: string, percentage: number): Promise<string> {
    const code = `SAVE${percentage}${cartId.substring(0, 4).toUpperCase()}`

    await prisma.promotion.create({
      data: {
        code,
        name: 'Abandoned Cart Recovery',
        type: 'PERCENTAGE',
        value: percentage,
        valid_from: new Date(),
        valid_to: addDays(new Date(), 7),
        usage_limit: 1,
        is_active: true,
      },
    })

    return code
  }

  private async createBirthdayPromotion(customerId: string) {
    const code = `BDAY${customerId.substring(0, 6).toUpperCase()}`

    return await prisma.promotion.create({
      data: {
        code,
        name: 'Birthday Special',
        type: 'PERCENTAGE',
        value: 20,
        valid_from: new Date(),
        valid_to: addDays(new Date(), 30),
        usage_limit: 1,
        per_customer_limit: 1,
        is_active: true,
      },
    })
  }

  private calculateReEngagementOffer(metrics: any): number {
    // Higher value customers get bigger offers
    if (metrics.lifetimeValue > 5000) return 30
    if (metrics.lifetimeValue > 2000) return 25
    if (metrics.lifetimeValue > 1000) return 20
    return 15
  }

  private generateAbandonedCartEmail(cart: any, discountCode: string): string {
    const items = cart.items.map((item: any) =>
      `<li>${item.product.name} - $${item.unit_price}</li>`
    ).join('')

    return `
      <h2>You left something in your cart!</h2>
      <p>Hi ${cart.customer.first_name},</p>
      <p>We noticed you left these items in your cart:</p>
      <ul>${items}</ul>
      <p>Complete your purchase with <strong>${discountCode}</strong> for 10% off!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cart">Complete Purchase</a>
    `
  }

  private generateBirthdayEmail(customer: any, promotion: any): string {
    return `
      <h1>Happy Birthday, ${customer.first_name}! 🎂</h1>
      <p>We hope you have an amazing day!</p>
      <p>As our gift to you, enjoy ${promotion.value}% off your next visit with code:</p>
      <h2>${promotion.code}</h2>
      <p>Valid for the next 30 days.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/booking">Book Now</a>
    `
  }

  private generateReEngagementEmail(customer: any, promotion: any): string {
    return `
      <h2>We miss you, ${customer.first_name}!</h2>
      <p>It's been a while since your last visit.</p>
      <p>Come back and enjoy ${promotion.value}% off with code:</p>
      <h2>${promotion.code}</h2>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/booking">Book Your Appointment</a>
    `
  }

  private generateAppointmentReminderEmail(appointment: any): string {
    const services = appointment.services.map((s: any) => s.service.name).join(', ')
    const time = format(appointment.start_time, 'h:mm a')
    const date = format(appointment.appointment_date, 'MMMM d, yyyy')

    return `
      <h2>Appointment Reminder</h2>
      <p>Hi ${appointment.customer.first_name},</p>
      <p>This is a reminder about your appointment tomorrow:</p>
      <ul>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Services:</strong> ${services}</li>
        <li><strong>Staff:</strong> ${appointment.staff.user.first_name}</li>
        <li><strong>Location:</strong> ${appointment.branch.name}</li>
      </ul>
      <p>Confirmation Code: ${appointment.confirmation_code}</p>
    `
  }

  private generateAppointmentReminderSMS(appointment: any): string {
    const time = format(appointment.start_time, 'h:mm a')
    return `Reminder: Your appointment is tomorrow at ${time}. Reply CANCEL to cancel or CONFIRM to confirm. Code: ${appointment.confirmation_code}`
  }

  private generateAppointmentReminderMessage(appointment: any): string {
    const time = format(appointment.start_time, 'h:mm a')
    const services = appointment.services.map((s: any) => s.service.name).join(', ')
    return `Appointment tomorrow at ${time} for ${services}`
  }
}