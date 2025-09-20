/**
 * Pink Blueberry Salon - Appointment Repository
 * Advanced appointment data access and business logic
 */

import { Prisma, Appointment, AppointmentStatus } from '@prisma/client';
import { db } from '../client';
import { BaseRepository } from './base.repository';
import { withTransaction } from '../utils';

export interface AppointmentWithRelations extends Appointment {
  customer?: any;
  staff?: any;
  branch?: any;
  services?: any[];
  payment?: any;
}

export interface CreateAppointmentInput {
  branch_id: string;
  customer_id: string;
  staff_id: string;
  appointment_date: Date;
  start_time: Date;
  end_time: Date;
  services: {
    service_id: string;
    price: number;
    duration: number;
    discount_amount?: number;
  }[];
  notes?: string;
  source?: string;
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  staff_id?: string;
  start_time?: Date;
  end_time?: Date;
  notes?: string;
  internal_notes?: string;
}

export interface AppointmentSearchParams {
  branch_id?: string;
  customer_id?: string;
  staff_id?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  staff_id?: string;
  service_id?: string;
}

export class AppointmentRepository extends BaseRepository<
  AppointmentWithRelations,
  CreateAppointmentInput,
  UpdateAppointmentInput
> {
  protected model = db.appointment;
  protected modelName = 'Appointment';

  /**
   * Find appointments with full relations
   */
  async findWithRelations(id: string): Promise<AppointmentWithRelations | null> {
    return this.findById(id, {
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        branch: true,
        services: {
          include: {
            service: true,
          },
        },
        add_ons: {
          include: {
            add_on: true,
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Search appointments with advanced filters
   */
  async search(params: AppointmentSearchParams): Promise<AppointmentWithRelations[]> {
    const where: any = this.applyTenantFilter({});

    if (params.branch_id) {
      where.branch_id = params.branch_id;
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.staff_id) {
      where.staff_id = params.staff_id;
    }

    if (params.status) {
      if (Array.isArray(params.status)) {
        where.status = { in: params.status };
      } else {
        where.status = params.status;
      }
    }

    if (params.date_from || params.date_to) {
      where.appointment_date = {};
      if (params.date_from) {
        where.appointment_date.gte = params.date_from;
      }
      if (params.date_to) {
        where.appointment_date.lte = params.date_to;
      }
    }

    if (params.search) {
      where.OR = [
        { confirmation_code: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { first_name: { contains: params.search, mode: 'insensitive' } },
              { last_name: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.model.findMany({
      where,
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        branch: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: [{ appointment_date: 'asc' }, { start_time: 'asc' }],
    });
  }

  /**
   * Get available time slots for a service
   */
  async getAvailableSlots(
    branch_id: string,
    service_id: string,
    date: Date,
    staff_id?: string
  ): Promise<TimeSlot[]> {
    // Get service duration
    const service = await db.service.findUnique({
      where: { id: service_id },
      select: { duration: true, buffer_time: true },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const totalDuration = service.duration + service.buffer_time;

    // Get branch working hours
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const workingHours = await db.workingHours.findFirst({
      where: {
        branch_id,
        day_of_week: dayOfWeek as any,
        is_closed: false,
      },
    });

    if (!workingHours) {
      return [];
    }

    // Get staff members available for this service
    const availableStaff = await db.staff.findMany({
      where: {
        branch_id,
        status: 'ACTIVE',
        booking_enabled: true,
        deleted_at: null,
        ...(staff_id ? { id: staff_id } : {}),
        staff_services: {
          some: {
            service_id,
            is_available: true,
          },
        },
      },
      include: {
        schedules: {
          where: { date },
        },
      },
    });

    // Get existing appointments for the date
    const existingAppointments = await db.appointment.findMany({
      where: {
        branch_id,
        appointment_date: date,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        deleted_at: null,
        ...(staff_id ? { staff_id } : {}),
      },
      select: {
        staff_id: true,
        start_time: true,
        end_time: true,
      },
    });

    // Generate time slots
    const slots: TimeSlot[] = [];
    const slotDuration = 30; // 30-minute slots

    for (const member of availableStaff) {
      const schedule = member.schedules[0];
      if (!schedule || !schedule.is_available) continue;

      const startHour = parseInt(schedule.start_time.split(':')[0]);
      const startMinute = parseInt(schedule.start_time.split(':')[1]);
      const endHour = parseInt(schedule.end_time.split(':')[0]);
      const endMinute = parseInt(schedule.end_time.split(':')[1]);

      const dayStart = new Date(date);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      let currentSlot = new Date(dayStart);

      while (currentSlot < dayEnd) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(currentSlot.getMinutes() + totalDuration);

        if (slotEnd <= dayEnd) {
          // Check if slot is available (no conflicts)
          const hasConflict = existingAppointments.some(
            (apt) =>
              apt.staff_id === member.id &&
              ((currentSlot >= apt.start_time && currentSlot < apt.end_time) ||
                (slotEnd > apt.start_time && slotEnd <= apt.end_time) ||
                (currentSlot <= apt.start_time && slotEnd >= apt.end_time))
          );

          if (!hasConflict) {
            slots.push({
              start: new Date(currentSlot),
              end: new Date(slotEnd),
              available: true,
              staff_id: member.id,
              service_id,
            });
          }
        }

        currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
      }
    }

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Create appointment with services
   */
  async createWithServices(input: CreateAppointmentInput): Promise<AppointmentWithRelations> {
    return withTransaction(async (tx) => {
      // Calculate totals
      const serviceTotal = input.services.reduce(
        (sum, s) => sum + (s.price - (s.discount_amount || 0)),
        0
      );
      const totalDuration = input.services.reduce((sum, s) => sum + s.duration, 0);
      const taxAmount = serviceTotal * 0.08; // 8% tax
      const finalPrice = serviceTotal + taxAmount;

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          branch_id: input.branch_id,
          customer_id: input.customer_id,
          staff_id: input.staff_id,
          appointment_date: input.appointment_date,
          start_time: input.start_time,
          end_time: input.end_time,
          status: 'PENDING',
          total_duration: totalDuration,
          total_price: serviceTotal,
          tax_amount: taxAmount,
          final_price: finalPrice,
          notes: input.notes,
          source: input.source || 'ONLINE',
          confirmation_code: '', // Will be generated by trigger
          services: {
            create: input.services,
          },
        },
        include: {
          customer: true,
          staff: {
            include: {
              user: true,
            },
          },
          branch: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      // Create time slots
      await this.blockTimeSlots(appointment.id, appointment.staff_id, appointment.start_time, appointment.end_time);

      // Audit log
      await this.createAuditLog('CREATE', appointment.id, { new: appointment });

      return appointment;
    });
  }

  /**
   * Update appointment status
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    metadata?: {
      cancellation_reason?: string;
      cancelled_by?: string;
    }
  ): Promise<AppointmentWithRelations> {
    const updateData: any = { status };

    if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date();
      updateData.cancellation_reason = metadata?.cancellation_reason;
      updateData.cancelled_by = metadata?.cancelled_by;

      // Free up time slots
      await this.freeTimeSlots(id);
    }

    if (status === 'COMPLETED') {
      updateData.completed_at = new Date();
    }

    if (status === 'NO_SHOW') {
      updateData.no_show = true;
    }

    return this.update(id, updateData, {
      include: {
        customer: true,
        staff: true,
        branch: true,
        services: true,
      },
    });
  }

  /**
   * Reschedule appointment
   */
  async reschedule(
    id: string,
    newDateTime: Date,
    newStaffId?: string
  ): Promise<AppointmentWithRelations> {
    return withTransaction(async (tx) => {
      const appointment = await this.findById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Free old time slots
      await this.freeTimeSlots(id);

      // Calculate new end time
      const endTime = new Date(newDateTime);
      endTime.setMinutes(endTime.getMinutes() + appointment.total_duration);

      // Update appointment
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          appointment_date: newDateTime,
          start_time: newDateTime,
          end_time: endTime,
          staff_id: newStaffId || appointment.staff_id,
          status: 'RESCHEDULED',
        },
        include: {
          customer: true,
          staff: true,
          branch: true,
          services: true,
        },
      });

      // Block new time slots
      await this.blockTimeSlots(id, updated.staff_id, newDateTime, endTime);

      return updated;
    });
  }

  /**
   * Get daily appointments summary
   */
  async getDailySummary(branch_id: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await db.appointment.groupBy({
      by: ['status'],
      where: {
        branch_id,
        appointment_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deleted_at: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        final_price: true,
      },
    });

    const staffSchedules = await db.staff.findMany({
      where: {
        branch_id,
        schedules: {
          some: {
            date,
            is_available: true,
          },
        },
      },
      include: {
        appointments: {
          where: {
            appointment_date: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        },
        user: true,
      },
    });

    return {
      date,
      appointments: appointments.map((a) => ({
        status: a.status,
        count: a._count.id,
        revenue: a._sum.final_price || 0,
      })),
      staff: staffSchedules.map((s) => ({
        id: s.id,
        name: `${s.user.first_name} ${s.user.last_name}`,
        appointments: s.appointments.length,
        revenue: s.appointments.reduce((sum, a) => sum + Number(a.final_price), 0),
      })),
      totals: {
        appointments: appointments.reduce((sum, a) => sum + a._count.id, 0),
        revenue: appointments.reduce((sum, a) => sum + Number(a._sum.final_price || 0), 0),
        staff: staffSchedules.length,
      },
    };
  }

  /**
   * Block time slots for appointment
   */
  private async blockTimeSlots(
    appointment_id: string,
    staff_id: string,
    start_time: Date,
    end_time: Date
  ): Promise<void> {
    const schedule = await db.schedule.findFirst({
      where: {
        staff_id,
        date: new Date(start_time.toDateString()),
      },
    });

    if (schedule) {
      await db.timeSlot.create({
        data: {
          schedule_id: schedule.id,
          start_time,
          end_time,
          is_available: false,
          appointment_id,
        },
      });
    }
  }

  /**
   * Free time slots for appointment
   */
  private async freeTimeSlots(appointment_id: string): Promise<void> {
    await db.timeSlot.deleteMany({
      where: { appointment_id },
    });
  }
}