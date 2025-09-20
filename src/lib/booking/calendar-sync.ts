/**
 * Calendar Synchronization Service for Pink Blueberry Salon
 * Supports Google Calendar, Outlook/Exchange, and iCal integration
 */

import { prisma } from '@/lib/prisma';
import { google, calendar_v3 } from '@googleapis/calendar';
import { CalendarProvider, AppointmentStatus } from '@prisma/client';
import { format, parseISO, addMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { RRule } from 'rrule';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  reminders?: EventReminder[];
  recurrence?: string;
  colorId?: string;
}

interface EventReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: string[];
}

export class CalendarSyncService {
  private googleAuth: any;
  private outlookClient: any;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize calendar provider clients
   */
  private async initializeProviders() {
    // Initialize Google Calendar OAuth2
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const { OAuth2 } = google.auth;
      this.googleAuth = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }

    // Initialize Microsoft Graph client for Outlook
    // This would require @microsoft/microsoft-graph-client
    // For now, we'll stub this out
  }

  /**
   * Main sync orchestrator - runs for all active syncs
   */
  async syncAllCalendars(): Promise<Map<string, SyncResult>> {
    const results = new Map<string, SyncResult>();

    // Get all active calendar syncs that are due
    const now = new Date();
    const activeSync = await prisma.calendarSync.findMany({
      where: {
        is_active: true,
        OR: [
          { next_sync_at: null },
          { next_sync_at: { lte: now } }
        ]
      },
      include: {
        staff: {
          include: {
            user: true,
            branch: true
          }
        }
      }
    });

    // Process each sync
    for (const sync of activeSync) {
      try {
        const result = await this.syncCalendar(sync);
        results.set(sync.id, result);

        // Update next sync time
        await prisma.calendarSync.update({
          where: { id: sync.id },
          data: {
            last_sync_at: now,
            next_sync_at: addMinutes(now, sync.sync_frequency_minutes),
            sync_errors: result.success ? 0 : sync.sync_errors + 1
          }
        });

        // Log sync result
        await this.logSyncResult(sync.id, result);
      } catch (error: any) {
        console.error(`Calendar sync failed for ${sync.id}:`, error);

        results.set(sync.id, {
          success: false,
          created: 0,
          updated: 0,
          deleted: 0,
          conflicts: 0,
          errors: [error.message]
        });

        // Update error count
        await prisma.calendarSync.update({
          where: { id: sync.id },
          data: {
            sync_errors: sync.sync_errors + 1,
            last_error: error.message
          }
        });
      }
    }

    return results;
  }

  /**
   * Sync a specific calendar
   */
  async syncCalendar(sync: any): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      errors: []
    };

    try {
      switch (sync.provider) {
        case CalendarProvider.GOOGLE:
          return await this.syncGoogleCalendar(sync);
        case CalendarProvider.OUTLOOK:
          return await this.syncOutlookCalendar(sync);
        case CalendarProvider.APPLE:
          return await this.syncAppleCalendar(sync);
        default:
          throw new Error(`Unsupported calendar provider: ${sync.provider}`);
      }
    } catch (error: any) {
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Sync with Google Calendar
   */
  private async syncGoogleCalendar(sync: any): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      errors: []
    };

    // Set up OAuth credentials
    this.googleAuth.setCredentials({
      access_token: sync.access_token,
      refresh_token: sync.refresh_token,
      expiry_date: sync.token_expiry?.getTime()
    });

    // Check if token needs refresh
    if (sync.token_expiry && sync.token_expiry < new Date()) {
      try {
        const tokens = await this.googleAuth.refreshAccessToken();
        await prisma.calendarSync.update({
          where: { id: sync.id },
          data: {
            access_token: tokens.credentials.access_token,
            token_expiry: new Date(tokens.credentials.expiry_date!)
          }
        });
      } catch (error: any) {
        result.errors.push('Failed to refresh Google token');
        return result;
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

    // Sync based on direction
    if (sync.sync_direction === 'OUTBOUND' || sync.sync_direction === 'BOTH') {
      await this.pushToGoogleCalendar(calendar, sync, result);
    }

    if (sync.sync_direction === 'INBOUND' || sync.sync_direction === 'BOTH') {
      await this.pullFromGoogleCalendar(calendar, sync, result);
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Push appointments to Google Calendar
   */
  private async pushToGoogleCalendar(
    calendar: calendar_v3.Calendar,
    sync: any,
    result: SyncResult
  ): Promise<void> {
    // Get appointments that need syncing
    const lastSync = sync.last_sync_at || new Date(0);
    const appointments = await prisma.appointment.findMany({
      where: {
        staff_id: sync.staff_id,
        updated_at: { gt: lastSync },
        status: {
          notIn: [AppointmentStatus.CANCELLED]
        }
      },
      include: {
        customer: true,
        services: {
          include: {
            service: true
          }
        },
        branch: true
      }
    });

    for (const appointment of appointments) {
      try {
        const event = this.appointmentToGoogleEvent(appointment, sync);

        // Check if event already exists
        const externalId = await this.getExternalEventId(appointment.id, sync.id);

        if (externalId) {
          // Update existing event
          await calendar.events.update({
            calendarId: sync.external_calendar_id || 'primary',
            eventId: externalId,
            requestBody: event
          });
          result.updated++;
        } else {
          // Create new event
          const response = await calendar.events.insert({
            calendarId: sync.external_calendar_id || 'primary',
            requestBody: event
          });

          // Store mapping
          await this.storeEventMapping(appointment.id, sync.id, response.data.id!);
          result.created++;
        }
      } catch (error: any) {
        console.error(`Failed to sync appointment ${appointment.id}:`, error);
        result.errors.push(`Appointment ${appointment.confirmation_code}: ${error.message}`);
        result.conflicts++;
      }
    }

    // Handle cancelled appointments
    const cancelledAppointments = await prisma.appointment.findMany({
      where: {
        staff_id: sync.staff_id,
        status: AppointmentStatus.CANCELLED,
        cancelled_at: { gt: lastSync }
      }
    });

    for (const appointment of cancelledAppointments) {
      try {
        const externalId = await this.getExternalEventId(appointment.id, sync.id);
        if (externalId) {
          await calendar.events.delete({
            calendarId: sync.external_calendar_id || 'primary',
            eventId: externalId
          });
          result.deleted++;
        }
      } catch (error: any) {
        console.error(`Failed to delete cancelled appointment ${appointment.id}:`, error);
        result.errors.push(`Delete ${appointment.confirmation_code}: ${error.message}`);
      }
    }
  }

  /**
   * Pull events from Google Calendar
   */
  private async pullFromGoogleCalendar(
    calendar: calendar_v3.Calendar,
    sync: any,
    result: SyncResult
  ): Promise<void> {
    try {
      const response = await calendar.events.list({
        calendarId: sync.external_calendar_id || 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];

      for (const event of events) {
        // Skip all-day events or events without proper times
        if (!event.start?.dateTime || !event.end?.dateTime) continue;

        // Check if this event is already synced
        const existingMapping = await this.getAppointmentByExternalId(event.id!, sync.id);

        if (!existingMapping) {
          // Check if this is a salon appointment or external event
          if (this.isSalonEvent(event, sync)) {
            // Create availability override to block time
            await this.createAvailabilityOverride(event, sync);
            result.created++;
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to pull from Google Calendar:', error);
      result.errors.push(`Pull failed: ${error.message}`);
    }
  }

  /**
   * Sync with Outlook/Exchange Calendar
   */
  private async syncOutlookCalendar(sync: any): Promise<SyncResult> {
    // Implementation for Outlook sync
    // This would use Microsoft Graph API
    return {
      success: false,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      errors: ['Outlook sync not yet implemented']
    };
  }

  /**
   * Sync with Apple Calendar (via CalDAV)
   */
  private async syncAppleCalendar(sync: any): Promise<SyncResult> {
    // Implementation for Apple Calendar sync
    // This would use CalDAV protocol
    return {
      success: false,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      errors: ['Apple Calendar sync not yet implemented']
    };
  }

  /**
   * Convert appointment to Google Calendar event
   */
  private appointmentToGoogleEvent(appointment: any, sync: any): any {
    const services = appointment.services.map((s: any) => s.service.name).join(', ');
    const customer = appointment.customer;

    return {
      summary: `${customer.first_name} ${customer.last_name} - ${services}`,
      description: this.buildEventDescription(appointment),
      location: appointment.branch.address,
      start: {
        dateTime: appointment.start_time.toISOString(),
        timeZone: sync.staff.branch.timezone || 'UTC'
      },
      end: {
        dateTime: appointment.end_time.toISOString(),
        timeZone: sync.staff.branch.timezone || 'UTC'
      },
      attendees: [
        {
          email: customer.email,
          displayName: `${customer.first_name} ${customer.last_name}`
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours
          { method: 'popup', minutes: 60 } // 1 hour
        ]
      },
      colorId: this.getEventColorId(appointment.status)
    };
  }

  /**
   * Build detailed event description
   */
  private buildEventDescription(appointment: any): string {
    const lines = [
      `Confirmation Code: ${appointment.confirmation_code}`,
      `Status: ${appointment.status}`,
      '',
      'Services:',
      ...appointment.services.map((s: any) =>
        `- ${s.service.name} (${s.service.duration} min) - $${s.price}`
      ),
      '',
      `Total: $${appointment.final_price}`,
      '',
      'Customer:',
      `${appointment.customer.first_name} ${appointment.customer.last_name}`,
      `Phone: ${appointment.customer.phone || 'N/A'}`,
      `Email: ${appointment.customer.email}`
    ];

    if (appointment.notes) {
      lines.push('', 'Notes:', appointment.notes);
    }

    return lines.join('\n');
  }

  /**
   * Get Google Calendar color ID based on appointment status
   */
  private getEventColorId(status: AppointmentStatus): string {
    const colorMap: Record<string, string> = {
      [AppointmentStatus.PENDING]: '6', // Orange
      [AppointmentStatus.CONFIRMED]: '2', // Green
      [AppointmentStatus.IN_PROGRESS]: '5', // Yellow
      [AppointmentStatus.COMPLETED]: '10', // Green
      [AppointmentStatus.CANCELLED]: '11', // Red
      [AppointmentStatus.NO_SHOW]: '8', // Gray
      [AppointmentStatus.RESCHEDULED]: '9' // Blue
    };

    return colorMap[status] || '0';
  }

  /**
   * Check if a Google event is a salon appointment
   */
  private isSalonEvent(event: any, sync: any): boolean {
    // Check if event title or description contains salon-specific keywords
    const salonKeywords = ['appointment', 'booking', 'service', 'treatment'];
    const summary = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';

    return !salonKeywords.some(keyword =>
      summary.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Create availability override from external calendar event
   */
  private async createAvailabilityOverride(event: any, sync: any): Promise<void> {
    await prisma.availabilityOverride.create({
      data: {
        staff_id: sync.staff_id,
        branch_id: sync.staff.branch_id,
        start_datetime: parseISO(event.start.dateTime),
        end_datetime: parseISO(event.end.dateTime),
        is_available: false,
        reason: `External calendar: ${event.summary}`,
        is_recurring: !!event.recurrence
      }
    });
  }

  /**
   * Store event mapping between our system and external calendar
   */
  private async storeEventMapping(
    appointmentId: string,
    syncId: string,
    externalEventId: string
  ): Promise<void> {
    // This would be stored in a mapping table
    // For now, we'll use appointment metadata
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (appointment) {
      const metadata = appointment.metadata as any || {};
      metadata.calendar_sync = metadata.calendar_sync || {};
      metadata.calendar_sync[syncId] = externalEventId;

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { metadata }
      });
    }
  }

  /**
   * Get external event ID for an appointment
   */
  private async getExternalEventId(
    appointmentId: string,
    syncId: string
  ): Promise<string | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (appointment && appointment.metadata) {
      const metadata = appointment.metadata as any;
      return metadata.calendar_sync?.[syncId] || null;
    }

    return null;
  }

  /**
   * Get appointment by external event ID
   */
  private async getAppointmentByExternalId(
    externalEventId: string,
    syncId: string
  ): Promise<any> {
    // This would query the mapping table
    // For now, we search through appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        metadata: {
          path: ['calendar_sync', syncId],
          equals: externalEventId
        }
      }
    });

    return appointments[0] || null;
  }

  /**
   * Log sync result to database
   */
  private async logSyncResult(syncId: string, result: SyncResult): Promise<void> {
    await prisma.calendarSyncLog.create({
      data: {
        calendar_sync_id: syncId,
        sync_type: 'INCREMENTAL',
        started_at: new Date(),
        completed_at: new Date(),
        success: result.success,
        appointments_created: result.created,
        appointments_updated: result.updated,
        appointments_deleted: result.deleted,
        conflicts_detected: result.conflicts,
        conflicts_resolved: 0,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null
      }
    });
  }

  /**
   * Generate OAuth URL for calendar provider
   */
  async generateOAuthUrl(provider: CalendarProvider, staffId: string): Promise<string> {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        const scopes = [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ];

        return this.googleAuth.generateAuthUrl({
          access_type: 'offline',
          scope: scopes,
          state: JSON.stringify({ staffId, provider })
        });

      case CalendarProvider.OUTLOOK:
        // Microsoft OAuth URL generation
        return '';

      default:
        throw new Error(`OAuth not supported for provider: ${provider}`);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<void> {
    const { staffId, provider } = JSON.parse(state);

    switch (provider) {
      case CalendarProvider.GOOGLE:
        const { tokens } = await this.googleAuth.getToken(code);

        // Store tokens
        await prisma.calendarSync.upsert({
          where: {
            staff_id_provider: {
              staff_id: staffId,
              provider: CalendarProvider.GOOGLE
            }
          },
          create: {
            staff_id: staffId,
            provider: CalendarProvider.GOOGLE,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(tokens.expiry_date!),
            calendar_id: 'primary',
            is_active: true
          },
          update: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(tokens.expiry_date!),
            is_active: true
          }
        });
        break;

      default:
        throw new Error(`OAuth callback not implemented for: ${provider}`);
    }
  }
}

// Export singleton instance
export const calendarSyncService = new CalendarSyncService();