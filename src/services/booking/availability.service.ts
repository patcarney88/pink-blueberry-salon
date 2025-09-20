import { prisma } from '@/lib/db/prisma'
import { addMinutes, format, parse, isWithinInterval, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { AppointmentStatus, DayOfWeek } from '@prisma/client'

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  staffId?: string
  serviceId?: string
}

export interface AvailabilityQuery {
  branchId: string
  serviceId: string
  staffId?: string
  date: Date
  duration: number // in minutes
}

export class AvailabilityService {
  /**
   * Get available time slots for a specific date, service, and optionally staff
   */
  async getAvailableSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const { branchId, serviceId, staffId, date, duration } = query

    // Get branch working hours for the day
    const dayOfWeek = this.getDayOfWeek(date)
    const workingHours = await this.getBranchWorkingHours(branchId, dayOfWeek)

    if (!workingHours || workingHours.is_closed) {
      return []
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      throw new Error('Service not found')
    }

    const totalDuration = service.duration + service.buffer_time

    // Get all staff members who can perform this service
    const eligibleStaff = staffId
      ? [await this.getStaffMember(staffId)]
      : await this.getEligibleStaff(branchId, serviceId)

    const allSlots: TimeSlot[] = []

    // Generate slots for each staff member
    for (const staff of eligibleStaff) {
      if (!staff) continue

      // Get staff schedule for the date
      const staffSchedule = await this.getStaffSchedule(staff.id, date)
      if (!staffSchedule || !staffSchedule.is_available) continue

      // Get existing appointments for the staff on this date
      const existingAppointments = await this.getStaffAppointments(staff.id, date)

      // Get availability overrides
      const overrides = await this.getAvailabilityOverrides(staff.id, branchId, date)

      // Generate time slots
      const slots = this.generateTimeSlots(
        workingHours,
        staffSchedule,
        existingAppointments,
        overrides,
        totalDuration,
        staff.id
      )

      // Check booking rules
      const validSlots = await this.applyBookingRules(slots, branchId, staff.id, serviceId)

      allSlots.push(...validSlots)
    }

    // Remove duplicate slots and sort by time
    const uniqueSlots = this.deduplicateSlots(allSlots)
    return uniqueSlots.sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(
    branchId: string,
    staffId: string,
    serviceId: string,
    startTime: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = addMinutes(startTime, duration)

    // Check for conflicts with existing appointments
    const conflicts = await prisma.appointment.findMany({
      where: {
        staff_id: staffId,
        appointment_date: {
          gte: startOfDay(startTime),
          lte: endOfDay(startTime),
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            start_time: { lte: startTime },
            end_time: { gt: startTime },
          },
          {
            // New appointment ends during existing appointment
            start_time: { lt: endTime },
            end_time: { gte: endTime },
          },
          {
            // New appointment completely contains existing appointment
            start_time: { gte: startTime },
            end_time: { lte: endTime },
          },
        ],
      },
    })

    return conflicts.length === 0
  }

  /**
   * Detect and resolve booking conflicts
   */
  async detectConflicts(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { staff: true },
    })

    if (!appointment) return []

    // Find overlapping appointments
    const overlapping = await prisma.appointment.findMany({
      where: {
        id: { not: appointmentId },
        staff_id: appointment.staff_id,
        appointment_date: appointment.appointment_date,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        OR: [
          {
            start_time: {
              gte: appointment.start_time,
              lt: appointment.end_time,
            },
          },
          {
            end_time: {
              gt: appointment.start_time,
              lte: appointment.end_time,
            },
          },
        ],
      },
    })

    // Create conflict records
    for (const conflict of overlapping) {
      await prisma.bookingConflict.create({
        data: {
          appointment_id: appointmentId,
          conflict_type: 'OVERLAPPING',
          conflicting_appointment_id: conflict.id,
          suggested_alternatives: await this.findAlternativeSlots(appointment),
        },
      })
    }

    return overlapping
  }

  /**
   * Find alternative time slots for a conflicted appointment
   */
  private async findAlternativeSlots(appointment: any) {
    const alternatives = []
    const searchDays = 7 // Search within next 7 days

    for (let i = 0; i < searchDays; i++) {
      const searchDate = new Date(appointment.appointment_date)
      searchDate.setDate(searchDate.getDate() + i)

      const slots = await this.getAvailableSlots({
        branchId: appointment.branch_id,
        serviceId: appointment.services[0]?.service_id,
        staffId: appointment.staff_id,
        date: searchDate,
        duration: appointment.total_duration,
      })

      // Get up to 3 alternatives per day
      alternatives.push(...slots.slice(0, 3).map(slot => ({
        date: searchDate,
        start_time: slot.start,
        end_time: slot.end,
        staff_id: slot.staffId,
      })))

      if (alternatives.length >= 10) break // Limit total alternatives
    }

    return alternatives
  }

  // Helper methods

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ]
    return days[date.getDay()]
  }

  private async getBranchWorkingHours(branchId: string, dayOfWeek: DayOfWeek) {
    return await prisma.workingHours.findUnique({
      where: {
        branch_id_day_of_week: {
          branch_id: branchId,
          day_of_week: dayOfWeek,
        },
      },
    })
  }

  private async getStaffMember(staffId: string) {
    return await prisma.staff.findUnique({
      where: { id: staffId },
    })
  }

  private async getEligibleStaff(branchId: string, serviceId: string) {
    return await prisma.staff.findMany({
      where: {
        branch_id: branchId,
        booking_enabled: true,
        staff_services: {
          some: {
            service_id: serviceId,
            is_available: true,
          },
        },
        status: 'ACTIVE',
      },
    })
  }

  private async getStaffSchedule(staffId: string, date: Date) {
    return await prisma.schedule.findUnique({
      where: {
        staff_id_date: {
          staff_id: staffId,
          date: startOfDay(date),
        },
      },
    })
  }

  private async getStaffAppointments(staffId: string, date: Date) {
    return await prisma.appointment.findMany({
      where: {
        staff_id: staffId,
        appointment_date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      orderBy: { start_time: 'asc' },
    })
  }

  private async getAvailabilityOverrides(staffId: string, branchId: string, date: Date) {
    return await prisma.availabilityOverride.findMany({
      where: {
        OR: [
          { staff_id: staffId },
          { branch_id: branchId, staff_id: null },
        ],
        start_datetime: { lte: endOfDay(date) },
        end_datetime: { gte: startOfDay(date) },
      },
    })
  }

  private generateTimeSlots(
    workingHours: any,
    staffSchedule: any,
    appointments: any[],
    overrides: any[],
    duration: number,
    staffId: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const slotDuration = 30 // 30-minute intervals

    // Parse working hours
    const workStart = parse(staffSchedule?.start_time || workingHours.opening_time, 'HH:mm', new Date())
    const workEnd = parse(staffSchedule?.end_time || workingHours.closing_time, 'HH:mm', new Date())

    let currentTime = workStart

    while (currentTime <= workEnd) {
      const slotEnd = addMinutes(currentTime, duration)

      // Check if slot fits within working hours
      if (slotEnd > workEnd) break

      // Check for conflicts with existing appointments
      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)
        return (
          (currentTime >= aptStart && currentTime < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (currentTime <= aptStart && slotEnd >= aptEnd)
        )
      })

      // Check overrides
      const isOverridden = overrides.some(override => {
        const overrideStart = new Date(override.start_datetime)
        const overrideEnd = new Date(override.end_datetime)
        const inOverride = currentTime >= overrideStart && slotEnd <= overrideEnd
        return inOverride && !override.is_available
      })

      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
        available: !hasConflict && !isOverridden,
        staffId,
      })

      currentTime = addMinutes(currentTime, slotDuration)
    }

    return slots
  }

  private async applyBookingRules(
    slots: TimeSlot[],
    branchId: string,
    staffId: string,
    serviceId: string
  ): Promise<TimeSlot[]> {
    const rules = await prisma.bookingRule.findMany({
      where: {
        OR: [
          { branch_id: branchId, staff_id: null },
          { staff_id: staffId },
        ],
        is_active: true,
      },
      orderBy: { priority: 'desc' },
    })

    return slots.filter(slot => {
      for (const rule of rules) {
        // Check minimum advance booking time
        if (rule.min_advance_hours) {
          const minTime = new Date()
          minTime.setHours(minTime.getHours() + rule.min_advance_hours)
          if (slot.start < minTime) return false
        }

        // Check maximum advance booking time
        if (rule.max_advance_days) {
          const maxTime = new Date()
          maxTime.setDate(maxTime.getDate() + rule.max_advance_days)
          if (slot.start > maxTime) return false
        }

        // Check time restrictions
        if (rule.start_time && rule.end_time) {
          const slotTime = format(slot.start, 'HH:mm')
          if (slotTime < rule.start_time || slotTime > rule.end_time) return false
        }
      }

      return slot.available
    })
  }

  private deduplicateSlots(slots: TimeSlot[]): TimeSlot[] {
    const uniqueMap = new Map<string, TimeSlot>()

    for (const slot of slots) {
      const key = `${slot.start.getTime()}-${slot.end.getTime()}`
      if (!uniqueMap.has(key) || slot.available) {
        uniqueMap.set(key, slot)
      }
    }

    return Array.from(uniqueMap.values())
  }
}