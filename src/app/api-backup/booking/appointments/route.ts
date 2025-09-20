import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { availabilityService } from '@/lib/booking/availability';
import { conflictResolutionService } from '@/lib/booking/conflict-resolution';
import { notificationService } from '@/lib/booking/notifications';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AppointmentStatus } from '@prisma/client';

const createAppointmentSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  appointmentDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    price: z.number(),
    duration: z.number()
  })),
  addOns: z.array(z.object({
    addOnId: z.string().uuid(),
    price: z.number()
  })).optional(),
  notes: z.string().optional(),
  source: z.enum(['ONLINE', 'PHONE', 'WALK_IN']).default('ONLINE'),
  sendConfirmation: z.boolean().default(true),
  autoResolveConflicts: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Check for conflicts before creating
    const conflicts = await availabilityService.detectConflicts({
      appointmentId: '', // New appointment
      staffId: validatedData.staffId,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      branchId: validatedData.branchId
    });

    if (conflicts.length > 0 && !validatedData.autoResolveConflicts) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking conflicts detected',
          conflicts: conflicts
        },
        { status: 409 }
      );
    }

    // Calculate pricing
    const totalServicePrice = validatedData.services.reduce((sum, s) => sum + s.price, 0);
    const totalAddOnPrice = validatedData.addOns?.reduce((sum, a) => sum + a.price, 0) || 0;
    const totalDuration = validatedData.services.reduce((sum, s) => sum + s.duration, 0);

    // Get branch for tax calculation
    const branch = await prisma.branch.findUnique({
      where: { id: validatedData.branchId }
    });

    const taxRate = (branch?.settings as any)?.taxRate || 0.1;
    const taxAmount = (totalServicePrice + totalAddOnPrice) * taxRate;
    const finalPrice = totalServicePrice + totalAddOnPrice + taxAmount;

    // Create appointment in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // Create the appointment
      const newAppointment = await tx.appointment.create({
        data: {
          branch_id: validatedData.branchId,
          customer_id: validatedData.customerId,
          staff_id: validatedData.staffId,
          appointment_date: new Date(validatedData.appointmentDate),
          start_time: new Date(validatedData.startTime),
          end_time: new Date(validatedData.endTime),
          status: AppointmentStatus.PENDING,
          total_duration: totalDuration,
          total_price: totalServicePrice + totalAddOnPrice,
          tax_amount: taxAmount,
          final_price: finalPrice,
          notes: validatedData.notes,
          confirmation_code: generateConfirmationCode(),
          source: validatedData.source,
          services: {
            create: validatedData.services.map(service => ({
              service_id: service.serviceId,
              price: service.price,
              duration: service.duration
            }))
          },
          add_ons: validatedData.addOns ? {
            create: validatedData.addOns.map(addOn => ({
              add_on_id: addOn.addOnId,
              price: addOn.price
            }))
          } : undefined
        },
        include: {
          customer: true,
          staff: { include: { user: true } },
          services: { include: { service: true } },
          add_ons: { include: { add_on: true } },
          branch: true
        }
      });

      // Update time slots if they exist
      await tx.timeSlot.updateMany({
        where: {
          schedule: {
            staff_id: validatedData.staffId,
            date: new Date(validatedData.appointmentDate)
          },
          start_time: { gte: new Date(validatedData.startTime) },
          end_time: { lte: new Date(validatedData.endTime) }
        },
        data: {
          is_available: false,
          appointment_id: newAppointment.id
        }
      });

      return newAppointment;
    });

    // Handle conflicts if they exist
    if (conflicts.length > 0 && validatedData.autoResolveConflicts) {
      const conflictIds = await conflictResolutionService.detectAndRecordConflicts(appointment.id);

      // Attempt auto-resolution for each conflict
      for (const conflictId of conflictIds) {
        await conflictResolutionService.attemptAutoResolution(conflictId);
      }
    }

    // Schedule reminders
    await notificationService.scheduleAppointmentReminders(appointment.id);

    // Send confirmation if requested
    if (validatedData.sendConfirmation) {
      await notificationService.sendBookingConfirmation(appointment.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          confirmationCode: appointment.confirmation_code,
          status: appointment.status,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          totalDuration: appointment.total_duration,
          finalPrice: appointment.final_price,
          customer: {
            id: appointment.customer.id,
            name: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
            email: appointment.customer.email
          },
          staff: {
            id: appointment.staff.id,
            name: `${appointment.staff.user.first_name} ${appointment.staff.user.last_name}`
          },
          services: appointment.services.map(s => ({
            id: s.service_id,
            name: s.service.name,
            price: s.price,
            duration: s.duration
          })),
          branch: {
            id: appointment.branch.id,
            name: appointment.branch.name,
            address: appointment.branch.address
          }
        }
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Appointment creation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create appointment'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get('branchId');
    const customerId = searchParams.get('customerId');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (branchId) where.branch_id = branchId;
    if (customerId) where.customer_id = customerId;
    if (staffId) where.staff_id = staffId;
    if (status) where.status = status as AppointmentStatus;

    if (date) {
      const targetDate = new Date(date);
      where.appointment_date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      where.appointment_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          staff: { include: { user: true } },
          services: { include: { service: true } },
          branch: true
        },
        orderBy: { start_time: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.appointment.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments.map(appointment => ({
          id: appointment.id,
          confirmationCode: appointment.confirmation_code,
          status: appointment.status,
          appointmentDate: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          totalDuration: appointment.total_duration,
          finalPrice: appointment.final_price,
          customer: {
            id: appointment.customer.id,
            name: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
            email: appointment.customer.email,
            phone: appointment.customer.phone
          },
          staff: {
            id: appointment.staff.id,
            name: `${appointment.staff.user.first_name} ${appointment.staff.user.last_name}`
          },
          services: appointment.services.map(s => ({
            id: s.service_id,
            name: s.service.name,
            price: s.price,
            duration: s.duration
          })),
          branch: {
            id: appointment.branch.id,
            name: appointment.branch.name
          }
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointments'
      },
      { status: 500 }
    );
  }
}

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}