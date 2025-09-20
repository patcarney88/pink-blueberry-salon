/**
 * Advanced Availability Algorithm for Pink Blueberry Salon Booking Engine
 * Handles complex availability calculations across multiple stylists with conflict detection
 */

import { prisma } from '@/lib/prisma';
import {
  addMinutes,
  startOfDay,
  endOfDay,
  format,
  parseISO,
  isWithinInterval,
  differenceInMinutes,
  addDays,
  isBefore,
  isAfter,
  setHours,
  setMinutes
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { AppointmentStatus, BookingRuleType, ConflictType } from '@prisma/client';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  staffId: string;
  price?: number;
  isPeak?: boolean;
}

interface AvailabilityOptions {
  branchId: string;
  serviceIds: string[];
  date: Date;
  staffId?: string;
  customerId?: string;
  timezone?: string;
}

interface BookingConflictCheck {
  appointmentId: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  branchId: string;
}

export class AvailabilityService {
  private readonly DEFAULT_SLOT_DURATION = 15; // minutes
  private readonly DEFAULT_TIMEZONE = 'UTC';

  /**
   * Calculate available time slots for a given date and service combination
   */
  async getAvailableSlots(options: AvailabilityOptions): Promise<TimeSlot[]> {
    const { branchId, serviceIds, date, staffId, customerId, timezone = this.DEFAULT_TIMEZONE } = options;

    // Get branch information and settings
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        working_hours: true,
        booking_rules: {
          where: { is_active: true },
          orderBy: { priority: 'desc' }
        }
      }
    });

    if (!branch || !branch.is_active) {
      throw new Error('Branch not found or inactive');
    }

    // Get services and calculate total duration
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        is_active: true
      }
    });

    const totalDuration = services.reduce((sum, service) => sum + service.duration + service.buffer_time, 0);

    // Get eligible staff members
    const eligibleStaff = await this.getEligibleStaff(branchId, serviceIds, staffId, date);

    // Get all bookings for the date
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
        },
        staff_id: staffId ? staffId : { in: eligibleStaff.map(s => s.id) }
      },
      include: {
        services: true
      }
    });

    // Get availability overrides
    const availabilityOverrides = await prisma.availabilityOverride.findMany({
      where: {
        branch_id: branchId,
        start_datetime: { lte: endDate },
        end_datetime: { gte: startDate },
        OR: [
          { staff_id: null }, // Branch-wide overrides
          { staff_id: staffId ? staffId : { in: eligibleStaff.map(s => s.id) } }
        ]
      }
    });

    // Get staff schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        branch_id: branchId,
        date: date,
        staff_id: staffId ? staffId : { in: eligibleStaff.map(s => s.id) },
        is_available: true
      },
      include: {
        time_slots: true
      }
    });

    // Apply booking rules
    const bookingRules = await this.getApplicableBookingRules(branchId, staffId, date);

    // Calculate available slots for each staff member
    const allSlots: TimeSlot[] = [];

    for (const staff of eligibleStaff) {
      const staffSchedule = schedules.find(s => s.staff_id === staff.id);
      if (!staffSchedule) continue;

      const staffSlots = this.calculateStaffAvailability(
        staff.id,
        staffSchedule,
        existingAppointments.filter(a => a.staff_id === staff.id),
        availabilityOverrides.filter(o => !o.staff_id || o.staff_id === staff.id),
        totalDuration,
        branch,
        bookingRules,
        timezone
      );

      // Apply peak pricing if applicable
      const enhancedSlots = await this.applyPeakPricing(staffSlots, bookingRules, services);

      allSlots.push(...enhancedSlots);
    }

    // Apply VIP priority if customer is VIP
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (customer?.is_vip) {
        return this.prioritizeVIPSlots(allSlots);
      }
    }

    return allSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Detect conflicts for a proposed appointment
   */
  async detectConflicts(booking: BookingConflictCheck): Promise<ConflictType[]> {
    const conflicts: ConflictType[] = [];

    // Check for double booking
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        staff_id: booking.staffId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
        },
        OR: [
          {
            AND: [
              { start_time: { lte: booking.startTime } },
              { end_time: { gt: booking.startTime } }
            ]
          },
          {
            AND: [
              { start_time: { lt: booking.endTime } },
              { end_time: { gte: booking.endTime } }
            ]
          },
          {
            AND: [
              { start_time: { gte: booking.startTime } },
              { end_time: { lte: booking.endTime } }
            ]
          }
        ],
        NOT: {
          id: booking.appointmentId
        }
      }
    });

    if (overlappingAppointments.length > 0) {
      conflicts.push(ConflictType.DOUBLE_BOOKING);
    }

    // Check staff availability
    const staff = await prisma.staff.findUnique({
      where: { id: booking.staffId }
    });

    if (staff?.status !== 'ACTIVE' || !staff.booking_enabled) {
      conflicts.push(ConflictType.STAFF_UNAVAILABLE);
    }

    // Check branch hours
    const branch = await prisma.branch.findUnique({
      where: { id: booking.branchId },
      include: { working_hours: true }
    });

    const dayOfWeek = booking.startTime.getDay();
    const workingHours = branch?.working_hours.find(wh =>
      wh.day_of_week === dayOfWeek && wh.is_open
    );

    if (!workingHours) {
      conflicts.push(ConflictType.BRANCH_CLOSED);
    }

    // Check for availability overrides
    const overrides = await prisma.availabilityOverride.findMany({
      where: {
        OR: [
          { staff_id: booking.staffId },
          { branch_id: booking.branchId, staff_id: null }
        ],
        start_datetime: { lte: booking.endTime },
        end_datetime: { gte: booking.startTime },
        is_available: false
      }
    });

    if (overrides.length > 0) {
      conflicts.push(ConflictType.STAFF_UNAVAILABLE);
    }

    return conflicts;
  }

  /**
   * Suggest alternative slots when conflicts are detected
   */
  async suggestAlternatives(
    booking: BookingConflictCheck,
    serviceIds: string[],
    preferredCount: number = 3
  ): Promise<TimeSlot[]> {
    const alternatives: TimeSlot[] = [];
    const searchDays = 7; // Search up to 7 days ahead

    for (let i = 0; i < searchDays && alternatives.length < preferredCount; i++) {
      const searchDate = addDays(booking.startTime, i);

      const availableSlots = await this.getAvailableSlots({
        branchId: booking.branchId,
        serviceIds,
        date: searchDate,
        staffId: booking.staffId
      });

      // Find slots closest to the original time
      const originalTime = format(booking.startTime, 'HH:mm');
      const sortedByProximity = availableSlots
        .filter(slot => !this.isSlotTaken(slot, alternatives))
        .sort((a, b) => {
          const aTime = format(a.start, 'HH:mm');
          const bTime = format(b.start, 'HH:mm');
          const aDiff = Math.abs(differenceInMinutes(parseISO(`2000-01-01T${aTime}`), parseISO(`2000-01-01T${originalTime}`)));
          const bDiff = Math.abs(differenceInMinutes(parseISO(`2000-01-01T${bTime}`), parseISO(`2000-01-01T${originalTime}`)));
          return aDiff - bDiff;
        });

      alternatives.push(...sortedByProximity.slice(0, preferredCount - alternatives.length));
    }

    return alternatives;
  }

  /**
   * Calculate load balancing score for staff distribution
   */
  async calculateStaffLoadBalance(branchId: string, date: Date): Promise<Map<string, number>> {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const appointments = await prisma.appointment.findMany({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
        }
      },
      include: {
        services: true
      }
    });

    const staffLoad = new Map<string, number>();

    // Calculate total booked minutes per staff
    appointments.forEach(appointment => {
      const currentLoad = staffLoad.get(appointment.staff_id) || 0;
      const appointmentDuration = differenceInMinutes(appointment.end_time, appointment.start_time);
      staffLoad.set(appointment.staff_id, currentLoad + appointmentDuration);
    });

    // Get all staff for normalization
    const allStaff = await prisma.staff.findMany({
      where: {
        branch_id: branchId,
        booking_enabled: true,
        status: 'ACTIVE'
      }
    });

    // Normalize scores (0-1, where 0 is no load, 1 is fully booked)
    const maxWorkMinutes = 480; // 8 hours
    allStaff.forEach(staff => {
      const load = staffLoad.get(staff.id) || 0;
      staffLoad.set(staff.id, Math.min(load / maxWorkMinutes, 1));
    });

    return staffLoad;
  }

  // Private helper methods

  private async getEligibleStaff(
    branchId: string,
    serviceIds: string[],
    preferredStaffId?: string,
    date?: Date
  ) {
    const whereClause: any = {
      branch_id: branchId,
      booking_enabled: true,
      status: 'ACTIVE',
      staff_services: {
        some: {
          service_id: { in: serviceIds },
          is_available: true
        }
      }
    };

    if (preferredStaffId) {
      whereClause.id = preferredStaffId;
    }

    // Check for time off requests if date provided
    if (date) {
      whereClause.time_off_requests = {
        none: {
          start_date: { lte: date },
          end_date: { gte: date },
          status: 'APPROVED'
        }
      };
    }

    return prisma.staff.findMany({
      where: whereClause,
      include: {
        staff_services: {
          where: {
            service_id: { in: serviceIds }
          }
        }
      }
    });
  }

  private calculateStaffAvailability(
    staffId: string,
    schedule: any,
    appointments: any[],
    overrides: any[],
    serviceDuration: number,
    branch: any,
    bookingRules: any[],
    timezone: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Parse schedule times
    const scheduleStart = this.parseTimeToDate(schedule.date, schedule.start_time, timezone);
    const scheduleEnd = this.parseTimeToDate(schedule.date, schedule.end_time, timezone);

    // Generate potential slots
    let currentSlotStart = scheduleStart;

    while (currentSlotStart < scheduleEnd) {
      const currentSlotEnd = addMinutes(currentSlotStart, serviceDuration);

      if (currentSlotEnd > scheduleEnd) break;

      // Check if slot is available
      const isAvailable = this.isSlotAvailable(
        currentSlotStart,
        currentSlotEnd,
        appointments,
        overrides,
        schedule,
        bookingRules
      );

      if (isAvailable) {
        slots.push({
          start: currentSlotStart,
          end: currentSlotEnd,
          available: true,
          staffId
        });
      }

      currentSlotStart = addMinutes(currentSlotStart, this.DEFAULT_SLOT_DURATION);
    }

    // Account for break times
    if (schedule.break_start && schedule.break_end) {
      const breakStart = this.parseTimeToDate(schedule.date, schedule.break_start, timezone);
      const breakEnd = this.parseTimeToDate(schedule.date, schedule.break_end, timezone);

      return slots.filter(slot =>
        !this.overlapsWithInterval(slot.start, slot.end, breakStart, breakEnd)
      );
    }

    return slots;
  }

  private isSlotAvailable(
    slotStart: Date,
    slotEnd: Date,
    appointments: any[],
    overrides: any[],
    schedule: any,
    bookingRules: any[]
  ): boolean {
    // Check appointments
    for (const appointment of appointments) {
      if (this.overlapsWithInterval(slotStart, slotEnd, appointment.start_time, appointment.end_time)) {
        return false;
      }
    }

    // Check overrides
    for (const override of overrides) {
      if (!override.is_available &&
          this.overlapsWithInterval(slotStart, slotEnd, override.start_datetime, override.end_datetime)) {
        return false;
      }
    }

    // Check booking rules
    for (const rule of bookingRules) {
      if (!this.passesBookingRule(slotStart, slotEnd, rule)) {
        return false;
      }
    }

    // Check time slots if they exist
    if (schedule.time_slots && schedule.time_slots.length > 0) {
      const hasAvailableSlot = schedule.time_slots.some((ts: any) =>
        ts.is_available &&
        !ts.appointment_id &&
        this.overlapsWithInterval(slotStart, slotEnd, ts.start_time, ts.end_time)
      );

      if (!hasAvailableSlot) return false;
    }

    return true;
  }

  private passesBookingRule(slotStart: Date, slotEnd: Date, rule: any): boolean {
    const now = new Date();

    switch (rule.rule_type) {
      case BookingRuleType.MIN_ADVANCE_TIME:
        const minAdvanceTime = addMinutes(now, rule.min_advance_hours * 60);
        return isAfter(slotStart, minAdvanceTime);

      case BookingRuleType.MAX_ADVANCE_TIME:
        const maxAdvanceTime = addDays(now, rule.max_advance_days);
        return isBefore(slotStart, maxAdvanceTime);

      case BookingRuleType.BLACKOUT_DATE:
        if (rule.start_date && rule.end_date) {
          return !isWithinInterval(slotStart, {
            start: rule.start_date,
            end: rule.end_date
          });
        }
        break;
    }

    return true;
  }

  private async applyPeakPricing(
    slots: TimeSlot[],
    bookingRules: any[],
    services: any[]
  ): Promise<TimeSlot[]> {
    const basePrice = services.reduce((sum, s) => sum + Number(s.price), 0);

    return slots.map(slot => {
      const peakRule = bookingRules.find(rule =>
        rule.rule_type === BookingRuleType.PEAK_PRICING &&
        this.isTimeInPeakHours(slot.start, rule)
      );

      if (peakRule && peakRule.peak_price_multiplier) {
        return {
          ...slot,
          price: basePrice * Number(peakRule.peak_price_multiplier),
          isPeak: true
        };
      }

      return {
        ...slot,
        price: basePrice,
        isPeak: false
      };
    });
  }

  private isTimeInPeakHours(time: Date, rule: any): boolean {
    if (!rule.start_time || !rule.end_time) return false;

    const timeStr = format(time, 'HH:mm');
    return timeStr >= rule.start_time && timeStr <= rule.end_time;
  }

  private prioritizeVIPSlots(slots: TimeSlot[]): TimeSlot[] {
    // For VIP customers, return prime time slots first (10am-2pm typically)
    return slots.sort((a, b) => {
      const aHour = a.start.getHours();
      const bHour = b.start.getHours();

      const aPrime = aHour >= 10 && aHour <= 14;
      const bPrime = bHour >= 10 && bHour <= 14;

      if (aPrime && !bPrime) return -1;
      if (!aPrime && bPrime) return 1;

      return a.start.getTime() - b.start.getTime();
    });
  }

  private async getApplicableBookingRules(
    branchId: string,
    staffId?: string,
    date?: Date
  ) {
    const where: any = {
      is_active: true,
      OR: [
        { branch_id: branchId, staff_id: null },
        { branch_id: null, staff_id: null } // Global rules
      ]
    };

    if (staffId) {
      where.OR.push({ staff_id: staffId });
    }

    if (date) {
      where.AND = [
        {
          OR: [
            { start_date: null },
            { start_date: { lte: date } }
          ]
        },
        {
          OR: [
            { end_date: null },
            { end_date: { gte: date } }
          ]
        }
      ];
    }

    return prisma.bookingRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });
  }

  private parseTimeToDate(date: Date, time: string, timezone: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    let dateTime = new Date(date);
    dateTime = setHours(dateTime, hours);
    dateTime = setMinutes(dateTime, minutes);
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    return zonedTimeToUtc(dateTime, timezone);
  }

  private overlapsWithInterval(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  private isSlotTaken(slot: TimeSlot, existingSlots: TimeSlot[]): boolean {
    return existingSlots.some(existing =>
      this.overlapsWithInterval(slot.start, slot.end, existing.start, existing.end)
    );
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();