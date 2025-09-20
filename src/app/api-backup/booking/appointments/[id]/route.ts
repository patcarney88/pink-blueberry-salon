import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { conflictResolutionService } from '@/lib/booking/conflict-resolution';
import { notificationService } from '@/lib/booking/notifications';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

const updateAppointmentSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  staffId: z.string().uuid().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
});

const cancelAppointmentSchema = z.object({
  reason: z.string(),
  notifyCustomer: z.boolean().default(true)
});

const rescheduleAppointmentSchema = z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  newStaffId: z.string().uuid().optional(),
  reason: z.string().optional(),
  notifyCustomer: z.boolean().default(true)
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        staff: { include: { user: true } },
        services: { include: { service: true } },
        add_ons: { include: { add_on: true } },
        branch: true,
        payment: true,
        conflicts: true,
        reminders: true
      }
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          confirmationCode: appointment.confirmation_code,
          status: appointment.status,
          appointmentDate: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          totalDuration: appointment.total_duration,
          totalPrice: appointment.total_price,
          discountAmount: appointment.discount_amount,
          depositAmount: appointment.deposit_amount,
          taxAmount: appointment.tax_amount,
          finalPrice: appointment.final_price,
          notes: appointment.notes,
          internalNotes: appointment.internal_notes,
          source: appointment.source,
          isRecurring: appointment.is_recurring,
          recurringId: appointment.recurring_id,
          reminderSent: appointment.reminder_sent,
          reminderSentAt: appointment.reminder_sent_at,
          checkedInAt: appointment.checked_in_at,
          completedAt: appointment.completed_at,
          cancelledAt: appointment.cancelled_at,
          cancellationReason: appointment.cancellation_reason,
          customer: {
            id: appointment.customer.id,
            name: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
            email: appointment.customer.email,
            phone: appointment.customer.phone,
            isVip: appointment.customer.is_vip
          },
          staff: {
            id: appointment.staff.id,
            name: `${appointment.staff.user.first_name} ${appointment.staff.user.last_name}`,
            title: appointment.staff.title,
            specializations: appointment.staff.specializations
          },
          services: appointment.services.map(s => ({
            id: s.service_id,
            name: s.service.name,
            price: s.price,
            duration: s.duration,
            discount: s.discount_amount
          })),
          addOns: appointment.add_ons.map(a => ({
            id: a.add_on_id,
            name: a.add_on.name,
            price: a.price
          })),
          branch: {
            id: appointment.branch.id,
            name: appointment.branch.name,
            address: appointment.branch.address,
            phone: appointment.branch.phone
          },
          payment: appointment.payment ? {
            id: appointment.payment.id,
            status: appointment.payment.status,
            method: appointment.payment.method,
            amount: appointment.payment.amount
          } : null,
          conflicts: appointment.conflicts.map(c => ({
            id: c.id,
            type: c.conflict_type,
            status: c.status,
            detectedAt: c.detected_at,
            resolvedAt: c.resolved_at
          })),
          reminders: appointment.reminders.map(r => ({
            id: r.id,
            type: r.reminder_type,
            scheduledAt: r.scheduled_at,
            sentAt: r.sent_at,
            isSent: r.is_sent,
            deliveryStatus: r.delivery_status
          }))
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Get current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        staff: { include: { user: true } }
      }
    });

    if (!currentAppointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found'
        },
        { status: 404 }
      );
    }

    // Check for conflicts if time or staff is being changed
    if (validatedData.startTime || validatedData.endTime || validatedData.staffId) {
      const conflicts = await conflictResolutionService.detectAndRecordConflicts(params.id);

      if (conflicts.length > 0) {
        // Attempt auto-resolution
        for (const conflictId of conflicts) {
          const resolved = await conflictResolutionService.attemptAutoResolution(conflictId);
          if (!resolved) {
            return NextResponse.json(
              {
                success: false,
                error: 'Conflicts detected and could not be auto-resolved',
                conflictIds: conflicts
              },
              { status: 409 }
            );
          }
        }
      }
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        start_time: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
        end_time: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
        staff_id: validatedData.staffId,
        notes: validatedData.notes,
        internal_notes: validatedData.internalNotes,
        updated_at: new Date()
      },
      include: {
        customer: true,
        staff: { include: { user: true } },
        services: { include: { service: true } },
        branch: true
      }
    });

    // Send notification if status changed
    if (validatedData.status && validatedData.status !== currentAppointment.status) {
      if (validatedData.status === AppointmentStatus.CONFIRMED) {
        await notificationService.sendNotification({
          customerId: updatedAppointment.customer_id,
          appointmentId: updatedAppointment.id,
          type: 'EMAIL',
          subject: 'Appointment Confirmed',
          message: `Your appointment has been confirmed for ${updatedAppointment.start_time.toLocaleString()}`
        });
      } else if (validatedData.status === AppointmentStatus.NO_SHOW) {
        await notificationService.sendNoShowNotification(updatedAppointment.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: { appointment: updatedAppointment }
    });
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

    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update appointment'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = cancelAppointmentSchema.parse(body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        staff: { include: { user: true } },
        branch: true
      }
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found'
        },
        { status: 404 }
      );
    }

    // Update appointment status
    const cancelledAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: validatedData.reason
      }
    });

    // Free up time slots
    await prisma.timeSlot.updateMany({
      where: { appointment_id: params.id },
      data: {
        is_available: true,
        appointment_id: null
      }
    });

    // Send cancellation notification if requested
    if (validatedData.notifyCustomer) {
      await notificationService.sendNotification({
        customerId: appointment.customer_id,
        appointmentId: appointment.id,
        type: 'SMS',
        message: `Your appointment on ${appointment.start_time.toLocaleDateString()} at ${appointment.start_time.toLocaleTimeString()} has been cancelled. Reason: ${validatedData.reason}. Please call ${appointment.branch.phone} to reschedule.`
      });

      await notificationService.sendNotification({
        customerId: appointment.customer_id,
        appointmentId: appointment.id,
        type: 'EMAIL',
        subject: 'Appointment Cancellation - Pink Blueberry Salon',
        message: `Dear ${appointment.customer.first_name},\n\nYour appointment scheduled for ${appointment.start_time.toLocaleString()} with ${appointment.staff.user.first_name} has been cancelled.\n\nReason: ${validatedData.reason}\n\nWe apologize for any inconvenience. Please visit our website or call ${appointment.branch.phone} to reschedule.\n\nBest regards,\nPink Blueberry Salon`
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Appointment cancelled successfully',
        appointmentId: cancelledAppointment.id
      }
    });
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

    console.error('Failed to cancel appointment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel appointment'
      },
      { status: 500 }
    );
  }
}