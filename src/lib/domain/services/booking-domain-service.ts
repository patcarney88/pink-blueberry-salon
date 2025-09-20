/**
 * Booking Domain Service - Implements complex business logic for booking operations
 */

import { Booking, BookingService, Staff, Service, Customer } from '../entities/booking';
import { Branch } from '../entities/salon';
import { Money, DomainError } from '../entities/base';

export interface IAvailabilityService {
  checkStaffAvailability(staffId: string, startTime: Date, duration: number): Promise<boolean>;
  getAvailableTimeSlots(branchId: string, date: Date, serviceDuration: number): Promise<TimeSlot[]>;
  findOptimalStaffAssignment(serviceIds: string[], startTime: Date, branchId: string): Promise<StaffAssignment[]>;
}

export interface IBookingRepository {
  save(booking: Booking): Promise<void>;
  findById(id: string): Promise<Booking | null>;
  findByCustomerAndDateRange(customerId: string, startDate: Date, endDate: Date): Promise<Booking[]>;
  findByBranchAndDate(branchId: string, date: Date): Promise<Booking[]>;
}

export interface IServiceRepository {
  findById(id: string): Promise<Service | null>;
  findBySalonId(salonId: string): Promise<Service[]>;
}

export interface IStaffRepository {
  findById(id: string): Promise<Staff | null>;
  findByBranchId(branchId: string): Promise<Staff[]>;
  findAvailableStaff(branchId: string, startTime: Date, duration: number): Promise<Staff[]>;
}

export interface IBranchRepository {
  findById(id: string): Promise<Branch | null>;
}

/**
 * Core Booking Domain Service
 */
export class BookingDomainService {
  constructor(
    private availabilityService: IAvailabilityService,
    private bookingRepository: IBookingRepository,
    private serviceRepository: IServiceRepository,
    private staffRepository: IStaffRepository,
    private branchRepository: IBranchRepository
  ) {}

  /**
   * Create a new booking with business rule validation
   */
  async createBooking(command: CreateBookingCommand): Promise<Booking> {
    // Validate branch exists and is active
    const branch = await this.branchRepository.findById(command.branchId);
    if (!branch || !branch.isActive) {
      throw new DomainError('Branch not found or inactive', 'BRANCH_NOT_AVAILABLE');
    }

    // Validate services exist and are active
    const services = await Promise.all(
      command.services.map(s => this.serviceRepository.findById(s.serviceId))
    );

    if (services.some(s => !s || !s.isActive)) {
      throw new DomainError('One or more services not found or inactive', 'INVALID_SERVICES');
    }

    // Check branch operating hours
    if (!branch.isWithinOperatingHours(command.scheduledAt)) {
      throw new DomainError('Booking outside operating hours', 'OUTSIDE_OPERATING_HOURS');
    }

    // Validate booking advance notice
    const hoursUntilBooking = (command.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const minBookingNotice = branch.settings.minBookingNotice || 2;

    if (hoursUntilBooking < minBookingNotice) {
      throw new DomainError(
        `Booking requires at least ${minBookingNotice} hours advance notice`,
        'INSUFFICIENT_NOTICE'
      );
    }

    // Calculate total amount and duration
    let totalAmount = Money.zero(services[0]!.price.currency);
    let totalDuration = 0;

    for (const service of services) {
      if (service) {
        totalAmount = totalAmount.add(service.price);
        totalDuration += service.duration;
      }
    }

    // Create booking
    const booking = new Booking(
      command.bookingId,
      command.branchId,
      command.customerId,
      command.scheduledAt,
      totalAmount,
      command.source,
      command.notes,
      command.metadata
    );

    // Add services to booking
    let currentStartTime = command.scheduledAt;

    for (let i = 0; i < command.services.length; i++) {
      const serviceCommand = command.services[i];
      const service = services[i]!;

      const bookingService = new BookingService(
        crypto.randomUUID(),
        booking.id,
        service.id,
        currentStartTime,
        service.duration,
        service.price,
        serviceCommand.staffId
      );

      booking.addService(bookingService);

      // Calculate next service start time
      currentStartTime = new Date(currentStartTime.getTime() + (service.duration * 60 * 1000));
    }

    // Validate staff availability if assigned
    await this.validateStaffAvailability(booking);

    return booking;
  }

  /**
   * Validate staff availability for all services in a booking
   */
  private async validateStaffAvailability(booking: Booking): Promise<void> {
    for (const service of booking.services) {
      if (service.staffId) {
        const isAvailable = await this.availabilityService.checkStaffAvailability(
          service.staffId,
          service.startTime,
          service.duration
        );

        if (!isAvailable) {
          throw new DomainError(
            `Staff member ${service.staffId} not available at requested time`,
            'STAFF_NOT_AVAILABLE'
          );
        }

        // Validate staff can perform the service
        const staff = await this.staffRepository.findById(service.staffId);
        const serviceEntity = await this.serviceRepository.findById(service.serviceId);

        if (!staff || !serviceEntity) {
          throw new DomainError('Staff or service not found', 'INVALID_ASSIGNMENT');
        }

        if (!staff.canPerformService(serviceEntity.category)) {
          throw new DomainError(
            `Staff member cannot perform this type of service`,
            'INVALID_STAFF_ASSIGNMENT'
          );
        }
      }
    }
  }

  /**
   * Reschedule a booking with validation
   */
  async rescheduleBooking(
    bookingId: string,
    newDateTime: Date,
    userId?: string
  ): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new DomainError('Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (!booking.canReschedule()) {
      throw new DomainError('Booking cannot be rescheduled', 'RESCHEDULE_NOT_ALLOWED');
    }

    // Validate new time slot availability
    const duration = booking.duration;
    const availableSlots = await this.availabilityService.getAvailableTimeSlots(
      booking.branchId,
      newDateTime,
      duration
    );

    const requestedSlot = availableSlots.find(slot =>
      slot.startTime.getTime() === newDateTime.getTime()
    );

    if (!requestedSlot) {
      throw new DomainError('Requested time slot not available', 'TIME_SLOT_UNAVAILABLE');
    }

    // Reschedule the booking
    booking.reschedule(newDateTime);

    // Update service start times
    let currentStartTime = newDateTime;
    for (const service of booking.services) {
      service.assignStaff(service.staffId || ''); // This will update the service
      currentStartTime = new Date(currentStartTime.getTime() + (service.duration * 60 * 1000));
    }

    await this.bookingRepository.save(booking);
  }

  /**
   * Cancel a booking with validation
   */
  async cancelBooking(
    bookingId: string,
    reason?: string,
    userId?: string
  ): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new DomainError('Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (!booking.canCancel()) {
      throw new DomainError('Booking cannot be cancelled', 'CANCELLATION_NOT_ALLOWED');
    }

    booking.cancel(reason);
    await this.bookingRepository.save(booking);
  }

  /**
   * Auto-assign optimal staff to booking services
   */
  async autoAssignStaff(bookingId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new DomainError('Booking not found', 'BOOKING_NOT_FOUND');
    }

    const serviceIds = booking.services.map(s => s.serviceId);
    const assignments = await this.availabilityService.findOptimalStaffAssignment(
      serviceIds,
      booking.scheduledAt,
      booking.branchId
    );

    // Apply assignments
    for (const assignment of assignments) {
      const service = booking.services.find(s => s.serviceId === assignment.serviceId);
      if (service) {
        service.assignStaff(assignment.staffId);
      }
    }

    await this.bookingRepository.save(booking);
  }

  /**
   * Check for booking conflicts
   */
  async checkBookingConflicts(
    branchId: string,
    scheduledAt: Date,
    duration: number,
    excludeBookingId?: string
  ): Promise<BookingConflict[]> {
    const startTime = scheduledAt;
    const endTime = new Date(scheduledAt.getTime() + (duration * 60 * 1000));

    // Get bookings for the same day
    const existingBookings = await this.bookingRepository.findByBranchAndDate(branchId, scheduledAt);

    const conflicts: BookingConflict[] = [];

    for (const booking of existingBookings) {
      if (excludeBookingId && booking.id === excludeBookingId) continue;

      const bookingStart = booking.scheduledAt;
      const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60 * 1000));

      // Check for time overlap
      if (startTime < bookingEnd && endTime > bookingStart) {
        conflicts.push({
          bookingId: booking.id,
          conflictType: 'TIME_OVERLAP',
          startTime: bookingStart,
          endTime: bookingEnd,
          customerId: booking.customerId
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate booking pricing with discounts and deposits
   */
  async calculateBookingPrice(
    serviceIds: string[],
    customerId: string,
    discountCodes?: string[]
  ): Promise<BookingPricing> {
    const services = await Promise.all(
      serviceIds.map(id => this.serviceRepository.findById(id))
    );

    if (services.some(s => !s)) {
      throw new DomainError('One or more services not found', 'INVALID_SERVICES');
    }

    let subtotal = Money.zero();
    let totalDeposit = Money.zero();
    const serviceDetails: ServicePricing[] = [];

    for (const service of services) {
      if (service) {
        subtotal = subtotal.add(service.price);

        if (service.requiresDeposit && service.depositAmount) {
          totalDeposit = totalDeposit.add(service.depositAmount);
        }

        serviceDetails.push({
          serviceId: service.id,
          name: service.name,
          price: service.price,
          depositRequired: service.requiresDeposit,
          depositAmount: service.depositAmount
        });
      }
    }

    // Apply discounts (implementation would check discount rules)
    const discountAmount = Money.zero(); // Simplified - would implement discount logic
    const total = subtotal.subtract(discountAmount);

    return {
      subtotal,
      discountAmount,
      total,
      depositRequired: totalDeposit,
      remainingBalance: total.subtract(totalDeposit),
      services: serviceDetails
    };
  }
}

/**
 * Supporting Types
 */
export interface CreateBookingCommand {
  bookingId: string;
  branchId: string;
  customerId: string;
  scheduledAt: Date;
  services: {
    serviceId: string;
    staffId?: string;
  }[];
  source: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  staffId?: string;
}

export interface StaffAssignment {
  serviceId: string;
  staffId: string;
  confidence: number; // 0-1 score
}

export interface BookingConflict {
  bookingId: string;
  conflictType: 'TIME_OVERLAP' | 'STAFF_CONFLICT' | 'RESOURCE_CONFLICT';
  startTime: Date;
  endTime: Date;
  customerId: string;
}

export interface BookingPricing {
  subtotal: Money;
  discountAmount: Money;
  total: Money;
  depositRequired: Money;
  remainingBalance: Money;
  services: ServicePricing[];
}

export interface ServicePricing {
  serviceId: string;
  name: string;
  price: Money;
  depositRequired: boolean;
  depositAmount?: Money;
}