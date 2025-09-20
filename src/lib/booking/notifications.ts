/**
 * Automated Notification and Reminder Service for Pink Blueberry Salon
 * Handles SMS, Email, Push, and In-App notifications
 */

import { prisma } from '@/lib/prisma';
import { NotificationType, AppointmentStatus } from '@prisma/client';
import { addHours, addDays, format, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

interface NotificationOptions {
  customerId?: string;
  staffId?: string;
  appointmentId?: string;
  type: NotificationType;
  message: string;
  subject?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledFor?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface ReminderSchedule {
  appointmentId: string;
  reminders: ReminderConfig[];
}

interface ReminderConfig {
  type: NotificationType;
  hoursBeforeAppointment: number;
  template: string;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: string;
}

export class NotificationService {
  private twilioClient: twilio.Twilio | null = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize notification providers
   */
  private initializeProviders() {
    // Initialize Twilio for SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    // Initialize SendGrid for Email
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  /**
   * Send a notification immediately or schedule it
   */
  async sendNotification(options: NotificationOptions): Promise<NotificationResult> {
    try {
      // If scheduled for future, create reminder record
      if (options.scheduledFor && isBefore(new Date(), options.scheduledFor)) {
        return await this.scheduleNotification(options);
      }

      // Send immediately based on type
      switch (options.type) {
        case NotificationType.SMS:
          return await this.sendSMS(options);
        case NotificationType.EMAIL:
          return await this.sendEmail(options);
        case NotificationType.PUSH:
          return await this.sendPushNotification(options);
        case NotificationType.IN_APP:
          return await this.createInAppNotification(options);
        default:
          throw new Error(`Unsupported notification type: ${options.type}`);
      }
    } catch (error: any) {
      console.error('Notification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SMS notification via Twilio
   */
  private async sendSMS(options: NotificationOptions): Promise<NotificationResult> {
    if (!this.twilioClient) {
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    try {
      // Get recipient phone number
      const recipient = await this.getRecipient(options);
      if (!recipient?.phone) {
        return {
          success: false,
          error: 'Recipient phone number not found'
        };
      }

      // Format message
      const message = await this.formatMessage(options);

      // Send SMS
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient.phone
      });

      // Log notification
      await this.logNotification({
        ...options,
        recipient: recipient.phone,
        deliveryStatus: 'SENT',
        messageId: result.sid
      });

      return {
        success: true,
        messageId: result.sid,
        deliveryStatus: result.status
      };
    } catch (error: any) {
      console.error('SMS send failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email notification via SendGrid
   */
  private async sendEmail(options: NotificationOptions): Promise<NotificationResult> {
    try {
      // Get recipient email
      const recipient = await this.getRecipient(options);
      if (!recipient?.email) {
        return {
          success: false,
          error: 'Recipient email not found'
        };
      }

      // Prepare email content
      const message = await this.formatMessage(options);
      const subject = options.subject || 'Pink Blueberry Salon Notification';

      // Build email
      const msg = {
        to: recipient.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@pinkblueberrysalon.com',
        subject: subject,
        text: message,
        html: await this.generateEmailHTML(options, message)
      };

      // Add template if specified
      if (options.templateId) {
        Object.assign(msg, {
          templateId: options.templateId,
          dynamicTemplateData: options.templateData
        });
      }

      // Send email
      const [response] = await sgMail.send(msg);

      // Log notification
      await this.logNotification({
        ...options,
        recipient: recipient.email,
        deliveryStatus: 'SENT',
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        deliveryStatus: 'SENT'
      };
    } catch (error: any) {
      console.error('Email send failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send push notification (mobile app)
   */
  private async sendPushNotification(options: NotificationOptions): Promise<NotificationResult> {
    // This would integrate with Firebase Cloud Messaging or similar service
    // For now, we'll create an in-app notification as fallback
    return this.createInAppNotification(options);
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(options: NotificationOptions): Promise<NotificationResult> {
    try {
      const recipient = await this.getRecipient(options);
      if (!recipient) {
        return {
          success: false,
          error: 'Recipient not found'
        };
      }

      const notification = await prisma.notification.create({
        data: {
          type: NotificationType.IN_APP,
          title: options.subject || 'Notification',
          message: options.message,
          priority: options.priority || 'MEDIUM',
          scheduled_for: options.scheduledFor || new Date(),
          metadata: {
            appointmentId: options.appointmentId,
            staffId: options.staffId
          }
        }
      });

      return {
        success: true,
        messageId: notification.id,
        deliveryStatus: 'DELIVERED'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminders(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        staff: { include: { user: true } },
        services: { include: { service: true } },
        branch: true
      }
    });

    if (!appointment || appointment.status === AppointmentStatus.CANCELLED) {
      return;
    }

    // Default reminder schedule
    const reminderSchedule: ReminderConfig[] = [
      {
        type: NotificationType.EMAIL,
        hoursBeforeAppointment: 48,
        template: 'appointment_reminder_48h'
      },
      {
        type: NotificationType.SMS,
        hoursBeforeAppointment: 24,
        template: 'appointment_reminder_24h'
      },
      {
        type: NotificationType.SMS,
        hoursBeforeAppointment: 2,
        template: 'appointment_reminder_2h'
      }
    ];

    // Check customer preferences
    const customerPreferences = appointment.customer.metadata as any;
    if (customerPreferences?.reminderPreferences) {
      // Override with customer preferences
      Object.assign(reminderSchedule, customerPreferences.reminderPreferences);
    }

    // Create reminder records
    for (const config of reminderSchedule) {
      const scheduledAt = new Date(appointment.start_time);
      scheduledAt.setHours(scheduledAt.getHours() - config.hoursBeforeAppointment);

      // Skip if scheduled time has passed
      if (isBefore(scheduledAt, new Date())) {
        continue;
      }

      // Check if reminder already exists
      const existingReminder = await prisma.appointmentReminder.findFirst({
        where: {
          appointment_id: appointmentId,
          reminder_type: config.type,
          scheduled_at: scheduledAt
        }
      });

      if (existingReminder) {
        continue;
      }

      // Create reminder
      await prisma.appointmentReminder.create({
        data: {
          appointment_id: appointmentId,
          reminder_type: config.type,
          scheduled_at: scheduledAt,
          recipient: config.type === NotificationType.SMS
            ? appointment.customer.phone || ''
            : appointment.customer.email,
          subject: await this.generateReminderSubject(appointment, config),
          message: await this.generateReminderMessage(appointment, config),
          is_sent: false,
          metadata: {
            template: config.template,
            hoursBeforeAppointment: config.hoursBeforeAppointment
          }
        }
      });
    }
  }

  /**
   * Process pending reminders
   */
  async processPendingReminders(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    // Get pending reminders that are due
    const pendingReminders = await prisma.appointmentReminder.findMany({
      where: {
        is_sent: false,
        scheduled_at: { lte: now }
      },
      include: {
        appointment: {
          include: {
            customer: true,
            staff: { include: { user: true } },
            services: { include: { service: true } },
            branch: true
          }
        }
      },
      take: 100 // Process in batches
    });

    for (const reminder of pendingReminders) {
      try {
        // Skip if appointment is cancelled
        if (reminder.appointment.status === AppointmentStatus.CANCELLED) {
          await prisma.appointmentReminder.update({
            where: { id: reminder.id },
            data: {
              is_sent: true,
              delivery_status: 'SKIPPED',
              error_message: 'Appointment cancelled'
            }
          });
          continue;
        }

        // Send reminder
        const result = await this.sendNotification({
          customerId: reminder.appointment.customer_id,
          appointmentId: reminder.appointment_id,
          type: reminder.reminder_type,
          message: reminder.message,
          subject: reminder.subject || undefined
        });

        // Update reminder status
        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: {
            is_sent: true,
            sent_at: new Date(),
            delivery_status: result.success ? 'DELIVERED' : 'FAILED',
            delivery_attempts: { increment: 1 },
            last_attempt_at: new Date(),
            error_message: result.error
          }
        });

        // Update appointment reminder status
        if (result.success) {
          await prisma.appointment.update({
            where: { id: reminder.appointment_id },
            data: {
              reminder_sent: true,
              reminder_sent_at: new Date()
            }
          });
        }

        processedCount++;
      } catch (error: any) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);

        // Update error status
        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: {
            delivery_attempts: { increment: 1 },
            last_attempt_at: new Date(),
            error_message: error.message
          }
        });
      }
    }

    return processedCount;
  }

  /**
   * Send no-show notifications
   */
  async sendNoShowNotification(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        branch: true
      }
    });

    if (!appointment) return;

    // Send to customer
    await this.sendNotification({
      customerId: appointment.customer_id,
      appointmentId,
      type: NotificationType.EMAIL,
      subject: 'Missed Appointment at Pink Blueberry Salon',
      message: `We missed you today! Your appointment was marked as a no-show. Please contact us at ${appointment.branch.phone} to reschedule.`
    });

    // Update customer record
    await prisma.customer.update({
      where: { id: appointment.customer_id },
      data: {
        metadata: {
          ...(appointment.customer.metadata as any || {}),
          lastNoShow: new Date(),
          noShowCount: ((appointment.customer.metadata as any)?.noShowCount || 0) + 1
        }
      }
    });
  }

  /**
   * Send confirmation notification for new booking
   */
  async sendBookingConfirmation(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        staff: { include: { user: true } },
        services: { include: { service: true } },
        branch: true
      }
    });

    if (!appointment) return;

    const services = appointment.services.map(s => s.service.name).join(', ');
    const appointmentTime = format(appointment.start_time, 'EEEE, MMMM d, yyyy h:mm a');

    // Send SMS if phone available
    if (appointment.customer.phone) {
      await this.sendNotification({
        customerId: appointment.customer_id,
        appointmentId,
        type: NotificationType.SMS,
        message: `Booking confirmed at Pink Blueberry Salon!\n` +
                `Date: ${appointmentTime}\n` +
                `Services: ${services}\n` +
                `Stylist: ${appointment.staff.user.first_name}\n` +
                `Confirmation: ${appointment.confirmation_code}\n` +
                `Reply CANCEL to cancel or RESCHEDULE to change.`
      });
    }

    // Send email
    await this.sendNotification({
      customerId: appointment.customer_id,
      appointmentId,
      type: NotificationType.EMAIL,
      subject: 'Booking Confirmation - Pink Blueberry Salon',
      templateId: process.env.SENDGRID_CONFIRMATION_TEMPLATE_ID,
      templateData: {
        customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
        appointmentTime,
        services,
        stylist: `${appointment.staff.user.first_name} ${appointment.staff.user.last_name}`,
        branchName: appointment.branch.name,
        branchAddress: appointment.branch.address,
        branchPhone: appointment.branch.phone,
        confirmationCode: appointment.confirmation_code,
        totalPrice: appointment.final_price,
        cancelUrl: `${process.env.NEXT_PUBLIC_URL}/booking/cancel/${appointment.confirmation_code}`,
        rescheduleUrl: `${process.env.NEXT_PUBLIC_URL}/booking/reschedule/${appointment.confirmation_code}`
      }
    });
  }

  /**
   * Send waitlist notification when spot becomes available
   */
  async sendWaitlistNotification(waitlistEntryId: string): Promise<void> {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: waitlistEntryId },
      include: {
        customer: true,
        service: true,
        staff: { include: { user: true } },
        branch: true
      }
    });

    if (!entry || entry.status !== 'WAITING') return;

    // Update waitlist entry
    await prisma.waitlistEntry.update({
      where: { id: waitlistEntryId },
      data: {
        status: 'NOTIFIED',
        notified_at: new Date(),
        notification_sent_via: 'SMS'
      }
    });

    // Send notification
    await this.sendNotification({
      customerId: entry.customer_id,
      type: NotificationType.SMS,
      message: `Great news! A spot opened up for your ${entry.service.name} appointment. ` +
              `Click here to book: ${process.env.NEXT_PUBLIC_URL}/booking/waitlist/${waitlistEntryId}`,
      priority: 'URGENT'
    });
  }

  // Helper methods

  private async getRecipient(options: NotificationOptions): Promise<any> {
    if (options.customerId) {
      return prisma.customer.findUnique({
        where: { id: options.customerId }
      });
    }

    if (options.staffId) {
      return prisma.staff.findUnique({
        where: { id: options.staffId },
        include: { user: true }
      }).then(staff => ({
        email: staff?.user.email,
        phone: staff?.user.phone,
        first_name: staff?.user.first_name,
        last_name: staff?.user.last_name
      }));
    }

    return null;
  }

  private async formatMessage(options: NotificationOptions): Promise<string> {
    // If template is specified, process it
    if (options.templateId && options.templateData) {
      return this.processTemplate(options.templateId, options.templateData);
    }

    return options.message;
  }

  private async processTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<string> {
    // This would fetch and process templates from database
    // For now, return a simple formatted message
    return Object.entries(data).reduce((message, [key, value]) => {
      return message.replace(`{{${key}}}`, value);
    }, '');
  }

  private async generateEmailHTML(
    options: NotificationOptions,
    message: string
  ): Promise<string> {
    // Generate HTML email template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff69b4; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pink Blueberry Salon</h1>
          </div>
          <div class="content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>&copy; 2024 Pink Blueberry Salon. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async generateReminderSubject(
    appointment: any,
    config: ReminderConfig
  ): Promise<string> {
    const timeLabel = config.hoursBeforeAppointment >= 24
      ? `${Math.floor(config.hoursBeforeAppointment / 24)} day${config.hoursBeforeAppointment >= 48 ? 's' : ''}`
      : `${config.hoursBeforeAppointment} hour${config.hoursBeforeAppointment > 1 ? 's' : ''}`;

    return `Reminder: Your appointment in ${timeLabel} - Pink Blueberry Salon`;
  }

  private async generateReminderMessage(
    appointment: any,
    config: ReminderConfig
  ): Promise<string> {
    const services = appointment.services.map((s: any) => s.service.name).join(', ');
    const appointmentTime = format(appointment.start_time, 'EEEE, MMMM d h:mm a');

    return `Hi ${appointment.customer.first_name}!\n\n` +
           `This is a reminder of your upcoming appointment:\n\n` +
           `Date & Time: ${appointmentTime}\n` +
           `Services: ${services}\n` +
           `Stylist: ${appointment.staff.user.first_name}\n` +
           `Location: ${appointment.branch.name}\n` +
           `${appointment.branch.address}\n\n` +
           `Confirmation Code: ${appointment.confirmation_code}\n\n` +
           `To cancel or reschedule, please call ${appointment.branch.phone} or visit our website.\n\n` +
           `We look forward to seeing you!`;
  }

  private async scheduleNotification(
    options: NotificationOptions
  ): Promise<NotificationResult> {
    // Store scheduled notification
    if (options.appointmentId) {
      await prisma.appointmentReminder.create({
        data: {
          appointment_id: options.appointmentId,
          reminder_type: options.type,
          scheduled_at: options.scheduledFor!,
          recipient: '', // Will be filled when sending
          subject: options.subject,
          message: options.message,
          is_sent: false,
          metadata: options.templateData
        }
      });
    }

    return {
      success: true,
      deliveryStatus: 'SCHEDULED'
    };
  }

  private async logNotification(data: any): Promise<void> {
    // Log notification for audit purposes
    // This could be stored in a notifications log table
    console.log('Notification sent:', data);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();