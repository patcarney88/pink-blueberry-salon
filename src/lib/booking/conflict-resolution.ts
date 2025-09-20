/**
 * Intelligent Conflict Resolution System for Pink Blueberry Salon
 * Handles automatic conflict detection, resolution, and rescheduling suggestions
 */

import { prisma } from '@/lib/prisma';
import {
  ConflictType,
  ConflictResolutionStatus,
  AppointmentStatus,
  NotificationType
} from '@prisma/client';
import { availabilityService } from './availability';
import { notificationService } from './notifications';
import { differenceInMinutes, addMinutes, format } from 'date-fns';

interface ConflictResolutionOptions {
  appointmentId: string;
  strategy?: ResolutionStrategy;
  notifyCustomer?: boolean;
  autoResolve?: boolean;
}

enum ResolutionStrategy {
  FIND_ALTERNATIVE_STAFF = 'FIND_ALTERNATIVE_STAFF',
  RESCHEDULE_NEARBY = 'RESCHEDULE_NEARBY',
  SPLIT_SERVICES = 'SPLIT_SERVICES',
  UPGRADE_STAFF = 'UPGRADE_STAFF',
  WAITLIST = 'WAITLIST',
  MANUAL = 'MANUAL'
}

interface ResolutionSuggestion {
  strategy: ResolutionStrategy;
  confidence: number;
  description: string;
  actions: ResolutionAction[];
}

interface ResolutionAction {
  type: string;
  target: string;
  params: Record<string, any>;
}

export class ConflictResolutionService {
  /**
   * Detect and record conflicts for an appointment
   */
  async detectAndRecordConflicts(appointmentId: string): Promise<string[]> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        services: true,
        customer: true,
        staff: true,
        branch: true
      }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Detect conflicts using availability service
    const conflicts = await availabilityService.detectConflicts({
      appointmentId,
      staffId: appointment.staff_id,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      branchId: appointment.branch_id
    });

    const conflictIds: string[] = [];

    // Record each conflict
    for (const conflictType of conflicts) {
      const conflictingAppointment = await this.findConflictingAppointment(
        appointment,
        conflictType
      );

      const conflict = await prisma.bookingConflict.create({
        data: {
          appointment_id: appointmentId,
          conflict_type: conflictType,
          conflicting_appointment_id: conflictingAppointment?.id,
          status: ConflictResolutionStatus.PENDING,
          suggested_alternatives: await this.generateAlternatives(appointment, conflictType)
        }
      });

      conflictIds.push(conflict.id);

      // Attempt auto-resolution if enabled
      if (appointment.branch.settings &&
          (appointment.branch.settings as any).auto_resolve_conflicts) {
        await this.attemptAutoResolution(conflict.id);
      }
    }

    return conflictIds;
  }

  /**
   * Attempt automatic resolution of a conflict
   */
  async attemptAutoResolution(conflictId: string): Promise<boolean> {
    const conflict = await prisma.bookingConflict.findUnique({
      where: { id: conflictId },
      include: {
        appointment: {
          include: {
            customer: true,
            staff: true,
            services: { include: { service: true } },
            branch: true
          }
        },
        conflicting_appointment: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!conflict || conflict.status !== ConflictResolutionStatus.PENDING) {
      return false;
    }

    // Increment auto-resolution attempts
    await prisma.bookingConflict.update({
      where: { id: conflictId },
      data: {
        auto_resolution_attempts: { increment: 1 }
      }
    });

    // Generate resolution suggestions
    const suggestions = await this.generateResolutionSuggestions(conflict);

    // Try each suggestion in order of confidence
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= 0.7) {
        const success = await this.executeResolution(conflict, suggestion);
        if (success) {
          await prisma.bookingConflict.update({
            where: { id: conflictId },
            data: {
              status: ConflictResolutionStatus.AUTO_RESOLVED,
              resolved_at: new Date(),
              resolution_notes: `Auto-resolved using ${suggestion.strategy}: ${suggestion.description}`
            }
          });
          return true;
        }
      }
    }

    // If auto-resolution fails after 3 attempts, mark for manual intervention
    if (conflict.auto_resolution_attempts >= 2) {
      await this.escalateToManual(conflictId);
    }

    return false;
  }

  /**
   * Generate intelligent resolution suggestions
   */
  async generateResolutionSuggestions(conflict: any): Promise<ResolutionSuggestion[]> {
    const suggestions: ResolutionSuggestion[] = [];
    const appointment = conflict.appointment;

    switch (conflict.conflict_type) {
      case ConflictType.DOUBLE_BOOKING:
        // Suggest alternative staff
        const alternativeStaff = await this.findAlternativeStaff(appointment);
        if (alternativeStaff.length > 0) {
          suggestions.push({
            strategy: ResolutionStrategy.FIND_ALTERNATIVE_STAFF,
            confidence: 0.9,
            description: `Switch to ${alternativeStaff[0].user.first_name} ${alternativeStaff[0].user.last_name}`,
            actions: [{
              type: 'UPDATE_APPOINTMENT',
              target: appointment.id,
              params: { staff_id: alternativeStaff[0].id }
            }]
          });
        }

        // Suggest nearby time slots
        const nearbySlots = await this.findNearbySlots(appointment);
        if (nearbySlots.length > 0) {
          suggestions.push({
            strategy: ResolutionStrategy.RESCHEDULE_NEARBY,
            confidence: 0.8,
            description: `Reschedule to ${format(nearbySlots[0].start, 'HH:mm')}`,
            actions: [{
              type: 'UPDATE_APPOINTMENT',
              target: appointment.id,
              params: {
                start_time: nearbySlots[0].start,
                end_time: nearbySlots[0].end
              }
            }]
          });
        }
        break;

      case ConflictType.STAFF_UNAVAILABLE:
        // Check if staff member is on unexpected leave
        const availableStaff = await this.findAvailableStaffWithSkills(appointment);
        if (availableStaff.length > 0) {
          // Prioritize staff with similar skills
          const bestMatch = this.rankStaffBySkillMatch(
            availableStaff,
            appointment.staff.specializations
          );

          suggestions.push({
            strategy: ResolutionStrategy.FIND_ALTERNATIVE_STAFF,
            confidence: bestMatch.matchScore,
            description: `Reassign to equally skilled ${bestMatch.staff.user.first_name}`,
            actions: [{
              type: 'UPDATE_APPOINTMENT',
              target: appointment.id,
              params: { staff_id: bestMatch.staff.id }
            }, {
              type: 'NOTIFY_CUSTOMER',
              target: appointment.customer_id,
              params: {
                type: NotificationType.SMS,
                message: `Your stylist is unavailable. We've reassigned you to ${bestMatch.staff.user.first_name} who specializes in the same services.`
              }
            }]
          });
        }
        break;

      case ConflictType.OVERLAPPING:
        // Check if services can be split between multiple staff
        if (appointment.services.length > 1) {
          const splitPlan = await this.planServiceSplit(appointment);
          if (splitPlan) {
            suggestions.push({
              strategy: ResolutionStrategy.SPLIT_SERVICES,
              confidence: 0.75,
              description: 'Split services between multiple stylists for concurrent treatment',
              actions: splitPlan.actions
            });
          }
        }
        break;

      case ConflictType.BRANCH_CLOSED:
        // Find alternative branches
        const alternativeBranches = await this.findNearbyBranches(
          appointment.branch,
          appointment.start_time
        );

        if (alternativeBranches.length > 0) {
          suggestions.push({
            strategy: ResolutionStrategy.RESCHEDULE_NEARBY,
            confidence: 0.6,
            description: `Move to ${alternativeBranches[0].name} branch`,
            actions: [{
              type: 'UPDATE_APPOINTMENT',
              target: appointment.id,
              params: { branch_id: alternativeBranches[0].id }
            }]
          });
        }
        break;
    }

    // Always include waitlist option as fallback
    suggestions.push({
      strategy: ResolutionStrategy.WAITLIST,
      confidence: 0.5,
      description: 'Add customer to waitlist for preferred time',
      actions: [{
        type: 'CREATE_WAITLIST',
        target: appointment.customer_id,
        params: {
          branch_id: appointment.branch_id,
          service_id: appointment.services[0].service_id,
          preferred_date: appointment.appointment_date,
          staff_id: appointment.staff_id
        }
      }, {
        type: 'CANCEL_APPOINTMENT',
        target: appointment.id,
        params: { reason: 'Moved to waitlist due to conflict' }
      }]
    });

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Execute a resolution strategy
   */
  async executeResolution(
    conflict: any,
    suggestion: ResolutionSuggestion
  ): Promise<boolean> {
    try {
      for (const action of suggestion.actions) {
        switch (action.type) {
          case 'UPDATE_APPOINTMENT':
            await prisma.appointment.update({
              where: { id: action.target },
              data: action.params
            });
            break;

          case 'CANCEL_APPOINTMENT':
            await prisma.appointment.update({
              where: { id: action.target },
              data: {
                status: AppointmentStatus.CANCELLED,
                cancelled_at: new Date(),
                cancellation_reason: action.params.reason
              }
            });
            break;

          case 'CREATE_WAITLIST':
            await prisma.waitlistEntry.create({
              data: {
                ...action.params,
                status: 'WAITING',
                expires_at: addMinutes(new Date(), 60 * 24 * 7) // 7 days
              }
            });
            break;

          case 'NOTIFY_CUSTOMER':
            await notificationService.sendNotification({
              customerId: action.target,
              type: action.params.type,
              message: action.params.message
            });
            break;
        }
      }

      return true;
    } catch (error) {
      console.error('Resolution execution failed:', error);
      return false;
    }
  }

  /**
   * Escalate conflict to manual resolution
   */
  async escalateToManual(conflictId: string): Promise<void> {
    const conflict = await prisma.bookingConflict.findUnique({
      where: { id: conflictId },
      include: {
        appointment: {
          include: {
            branch: true,
            customer: true
          }
        }
      }
    });

    if (!conflict) return;

    // Update conflict status
    await prisma.bookingConflict.update({
      where: { id: conflictId },
      data: {
        status: ConflictResolutionStatus.PENDING,
        resolution_notes: 'Requires manual intervention - auto-resolution failed'
      }
    });

    // Notify branch manager
    await prisma.notification.create({
      data: {
        type: NotificationType.IN_APP,
        title: 'Booking Conflict Requires Attention',
        message: `Appointment ${conflict.appointment.confirmation_code} has an unresolved conflict`,
        priority: 'HIGH',
        action_url: `/dashboard/conflicts/${conflictId}`,
        scheduled_for: new Date()
      }
    });
  }

  // Private helper methods

  private async findConflictingAppointment(
    appointment: any,
    conflictType: ConflictType
  ): Promise<any> {
    if (conflictType === ConflictType.DOUBLE_BOOKING || conflictType === ConflictType.OVERLAPPING) {
      return prisma.appointment.findFirst({
        where: {
          staff_id: appointment.staff_id,
          status: {
            notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
          },
          NOT: { id: appointment.id },
          OR: [
            {
              AND: [
                { start_time: { lte: appointment.start_time } },
                { end_time: { gt: appointment.start_time } }
              ]
            },
            {
              AND: [
                { start_time: { lt: appointment.end_time } },
                { end_time: { gte: appointment.end_time } }
              ]
            }
          ]
        }
      });
    }
    return null;
  }

  private async generateAlternatives(appointment: any, conflictType: ConflictType): Promise<any> {
    const serviceIds = appointment.services.map((s: any) => s.service_id);

    const alternatives = await availabilityService.suggestAlternatives(
      {
        appointmentId: appointment.id,
        staffId: appointment.staff_id,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        branchId: appointment.branch_id
      },
      serviceIds,
      5
    );

    return {
      slots: alternatives.map(slot => ({
        start: slot.start,
        end: slot.end,
        staffId: slot.staffId
      })),
      generatedAt: new Date()
    };
  }

  private async findAlternativeStaff(appointment: any): Promise<any[]> {
    const serviceIds = appointment.services.map((s: any) => s.service_id);

    return prisma.staff.findMany({
      where: {
        branch_id: appointment.branch_id,
        booking_enabled: true,
        status: 'ACTIVE',
        NOT: { id: appointment.staff_id },
        staff_services: {
          some: {
            service_id: { in: serviceIds },
            is_available: true
          }
        },
        schedules: {
          some: {
            date: appointment.appointment_date,
            is_available: true
          }
        }
      },
      include: {
        user: true,
        staff_services: true
      }
    });
  }

  private async findNearbySlots(appointment: any): Promise<any[]> {
    const serviceIds = appointment.services.map((s: any) => s.service_id);

    // Look for slots within 2 hours of original time
    const searchStart = addMinutes(appointment.start_time, -120);
    const searchEnd = addMinutes(appointment.start_time, 120);

    const availableSlots = await availabilityService.getAvailableSlots({
      branchId: appointment.branch_id,
      serviceIds,
      date: appointment.appointment_date,
      staffId: appointment.staff_id
    });

    return availableSlots
      .filter(slot =>
        slot.start >= searchStart &&
        slot.start <= searchEnd &&
        slot.staffId === appointment.staff_id
      )
      .sort((a, b) => {
        // Sort by proximity to original time
        const aDiff = Math.abs(differenceInMinutes(a.start, appointment.start_time));
        const bDiff = Math.abs(differenceInMinutes(b.start, appointment.start_time));
        return aDiff - bDiff;
      })
      .slice(0, 3);
  }

  private async findAvailableStaffWithSkills(appointment: any): Promise<any[]> {
    return prisma.staff.findMany({
      where: {
        branch_id: appointment.branch_id,
        booking_enabled: true,
        status: 'ACTIVE',
        NOT: { id: appointment.staff_id },
        specializations: {
          hasSome: appointment.staff.specializations
        },
        schedules: {
          some: {
            date: appointment.appointment_date,
            is_available: true
          }
        }
      },
      include: {
        user: true,
        staff_services: true
      }
    });
  }

  private rankStaffBySkillMatch(staff: any[], requiredSkills: string[]): any {
    const ranked = staff.map(s => ({
      staff: s,
      matchScore: this.calculateSkillMatchScore(s.specializations, requiredSkills)
    }));

    return ranked.sort((a, b) => b.matchScore - a.matchScore)[0];
  }

  private calculateSkillMatchScore(staffSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0.5;

    const matches = staffSkills.filter(skill =>
      requiredSkills.includes(skill)
    ).length;

    return matches / requiredSkills.length;
  }

  private async planServiceSplit(appointment: any): Promise<any> {
    // Complex logic to split services between multiple staff
    // This is a simplified version
    const services = appointment.services;
    if (services.length < 2) return null;

    const availableStaff = await this.findAlternativeStaff(appointment);
    if (availableStaff.length === 0) return null;

    const actions: ResolutionAction[] = [];

    // Keep primary service with original staff
    const primaryService = services[0];

    // Assign additional services to available staff
    for (let i = 1; i < services.length && i <= availableStaff.length; i++) {
      actions.push({
        type: 'CREATE_APPOINTMENT',
        target: appointment.customer_id,
        params: {
          staff_id: availableStaff[i - 1].id,
          service_id: services[i].service_id,
          start_time: appointment.start_time,
          branch_id: appointment.branch_id
        }
      });
    }

    return { actions };
  }

  private async findNearbyBranches(currentBranch: any, appointmentTime: Date): Promise<any[]> {
    const dayOfWeek = appointmentTime.getDay();
    const timeStr = format(appointmentTime, 'HH:mm');

    return prisma.branch.findMany({
      where: {
        salon_id: currentBranch.salon_id,
        NOT: { id: currentBranch.id },
        is_active: true,
        working_hours: {
          some: {
            day_of_week: dayOfWeek,
            is_open: true,
            open_time: { lte: timeStr },
            close_time: { gte: timeStr }
          }
        }
      },
      orderBy: [
        // Order by distance if coordinates are available
        ...(currentBranch.latitude && currentBranch.longitude ? [{
          latitude: 'asc' as const
        }] : [])
      ],
      take: 3
    });
  }
}

// Export singleton instance
export const conflictResolutionService = new ConflictResolutionService();