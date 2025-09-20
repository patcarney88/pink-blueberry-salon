/**
 * Booking Engine Team API Contract
 *
 * Team Size: 20 agents (largest team)
 * Purpose: Complex booking system with real-time scheduling
 * Dependencies: Foundation Team (✅ completed), Database Team, Auth Team
 */

export interface BookingContract {
  // Service Management
  services: {
    /**
     * Get available services
     */
    getAvailable(): Promise<Service[]>;

    /**
     * Get service by ID
     */
    getById(serviceId: string): Promise<Service | null>;

    /**
     * Search services
     */
    search(criteria: ServiceSearchCriteria): Promise<Service[]>;

    /**
     * Create new service
     */
    create(service: CreateServiceData): Promise<ServiceResult>;

    /**
     * Update service
     */
    update(serviceId: string, updates: UpdateServiceData): Promise<ServiceResult>;

    /**
     * Archive service
     */
    archive(serviceId: string): Promise<ArchiveResult>;
  };

  // Staff Management
  staff: {
    /**
     * Get available staff
     */
    getAvailable(date?: Date): Promise<StaffMember[]>;

    /**
     * Get staff member by ID
     */
    getById(staffId: string): Promise<StaffMember | null>;

    /**
     * Get staff availability
     */
    getAvailability(
      staffId: string,
      dateRange: DateRange
    ): Promise<AvailabilitySlot[]>;

    /**
     * Update staff schedule
     */
    updateSchedule(
      staffId: string,
      schedule: StaffSchedule
    ): Promise<ScheduleResult>;

    /**
     * Set staff unavailability
     */
    setUnavailable(
      staffId: string,
      timeSlot: TimeSlot,
      reason: string
    ): Promise<UnavailabilityResult>;
  };

  // Booking Operations
  bookings: {
    /**
     * Create new booking
     */
    create(booking: CreateBookingData): Promise<BookingResult>;

    /**
     * Get booking by ID
     */
    getById(bookingId: string): Promise<Booking | null>;

    /**
     * Update booking
     */
    update(
      bookingId: string,
      updates: UpdateBookingData
    ): Promise<BookingResult>;

    /**
     * Cancel booking
     */
    cancel(
      bookingId: string,
      reason: string,
      refundPolicy?: RefundPolicy
    ): Promise<CancellationResult>;

    /**
     * Reschedule booking
     */
    reschedule(
      bookingId: string,
      newTimeSlot: TimeSlot
    ): Promise<RescheduleResult>;

    /**
     * Confirm booking
     */
    confirm(bookingId: string): Promise<ConfirmationResult>;

    /**
     * Check in customer
     */
    checkIn(bookingId: string): Promise<CheckInResult>;

    /**
     * Complete booking
     */
    complete(
      bookingId: string,
      completion: BookingCompletion
    ): Promise<CompletionResult>;
  };

  // Availability Engine
  availability: {
    /**
     * Get available time slots
     */
    getSlots(
      criteria: AvailabilityCriteria
    ): Promise<AvailabilitySlot[]>;

    /**
     * Check slot availability
     */
    checkSlot(
      serviceId: string,
      staffId: string,
      timeSlot: TimeSlot
    ): Promise<SlotAvailability>;

    /**
     * Reserve time slot temporarily
     */
    reserve(
      reservationData: ReservationData
    ): Promise<ReservationResult>;

    /**
     * Release reserved slot
     */
    releaseReservation(reservationId: string): Promise<ReleaseResult>;

    /**
     * Get booking conflicts
     */
    getConflicts(timeSlot: TimeSlot): Promise<BookingConflict[]>;
  };

  // Waitlist Management
  waitlist: {
    /**
     * Add customer to waitlist
     */
    add(waitlistEntry: WaitlistEntry): Promise<WaitlistResult>;

    /**
     * Remove from waitlist
     */
    remove(waitlistId: string): Promise<RemovalResult>;

    /**
     * Get waitlist entries
     */
    getEntries(criteria: WaitlistCriteria): Promise<WaitlistEntry[]>;

    /**
     * Notify waitlist when slot available
     */
    notifyAvailable(
      availabilitySlot: AvailabilitySlot
    ): Promise<NotificationResult>;

    /**
     * Process waitlist automation
     */
    processAutomation(): Promise<AutomationResult>;
  };

  // Real-time Updates
  realtime: {
    /**
     * Subscribe to booking updates
     */
    subscribe(
      criteria: SubscriptionCriteria,
      callback: (update: BookingUpdate) => void
    ): Promise<Subscription>;

    /**
     * Unsubscribe from updates
     */
    unsubscribe(subscriptionId: string): Promise<void>;

    /**
     * Broadcast booking change
     */
    broadcast(update: BookingUpdate): Promise<BroadcastResult>;

    /**
     * Get live booking status
     */
    getLiveStatus(): Promise<LiveBookingStatus>;
  };

  // Reporting & Analytics
  analytics: {
    /**
     * Get booking statistics
     */
    getStats(period: DateRange): Promise<BookingStats>;

    /**
     * Get utilization report
     */
    getUtilization(
      staffId?: string,
      period?: DateRange
    ): Promise<UtilizationReport>;

    /**
     * Get revenue analysis
     */
    getRevenue(period: DateRange): Promise<RevenueAnalysis>;

    /**
     * Get popular services
     */
    getPopularServices(period: DateRange): Promise<ServicePopularity[]>;

    /**
     * Generate booking trends
     */
    getTrends(metric: BookingMetric): Promise<TrendData>;
  };
}

// Supporting Types
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
  staffRequirements: StaffRequirement[];
  availability: ServiceAvailability;
  resources: ResourceRequirement[];
  tags: string[];
  active: boolean;
  imageUrl?: string;
}

export interface ServiceSearchCriteria {
  query?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  tags?: string[];
  staffId?: string;
}

export interface CreateServiceData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  staffRequirements: StaffRequirement[];
  availability: ServiceAvailability;
  resources: ResourceRequirement[];
  tags: string[];
  imageUrl?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface ServiceResult {
  success: boolean;
  service?: Service;
  error?: string;
}

export interface ArchiveResult {
  success: boolean;
  error?: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  skills: string[];
  schedule: StaffSchedule;
  availability: AvailabilitySlot[];
  active: boolean;
  imageUrl?: string;
}

export interface StaffSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  start: string; // HH:mm format
  end: string; // HH:mm format
  breaks: TimeSlot[];
  available: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  staffId: string;
  serviceIds: string[];
  available: boolean;
  reason?: string;
}

export interface ScheduleResult {
  success: boolean;
  conflicts?: TimeSlot[];
  error?: string;
}

export interface UnavailabilityResult {
  success: boolean;
  affectedBookings?: string[];
  error?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  timeSlot: TimeSlot;
  status: BookingStatus;
  notes?: string;
  price: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  remindersSent: number;
  metadata?: Record<string, any>;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'failed';

export interface CreateBookingData {
  customerId: string;
  serviceId: string;
  staffId: string;
  timeSlot: TimeSlot;
  notes?: string;
  paymentMethod?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBookingData extends Partial<CreateBookingData> {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  conflicts?: BookingConflict[];
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  refundId?: string;
  error?: string;
}

export interface RescheduleResult {
  success: boolean;
  oldTimeSlot?: TimeSlot;
  newTimeSlot?: TimeSlot;
  conflicts?: BookingConflict[];
  error?: string;
}

export interface ConfirmationResult {
  success: boolean;
  confirmationNumber?: string;
  error?: string;
}

export interface CheckInResult {
  success: boolean;
  checkInTime?: Date;
  error?: string;
}

export interface BookingCompletion {
  notes?: string;
  rating?: number;
  feedback?: string;
  products?: string[];
  additionalCharges?: number;
}

export interface CompletionResult {
  success: boolean;
  completionTime?: Date;
  finalAmount?: number;
  error?: string;
}

export interface AvailabilityCriteria {
  serviceId: string;
  staffId?: string;
  dateRange: DateRange;
  duration?: number;
  preferredTimes?: string[];
}

export interface SlotAvailability {
  available: boolean;
  conflicts?: BookingConflict[];
  alternatives?: AvailabilitySlot[];
}

export interface ReservationData {
  serviceId: string;
  staffId: string;
  timeSlot: TimeSlot;
  customerId?: string;
  expiresAt: Date;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  expiresAt?: Date;
  error?: string;
}

export interface ReleaseResult {
  success: boolean;
  error?: string;
}

export interface BookingConflict {
  type: 'staff_unavailable' | 'double_booking' | 'resource_conflict' | 'service_unavailable';
  description: string;
  conflictingBookingId?: string;
  suggestions?: string[];
}

export interface WaitlistEntry {
  id: string;
  customerId: string;
  serviceId: string;
  preferredStaffId?: string;
  preferredDateRange: DateRange;
  preferredTimes?: string[];
  priority: number;
  createdAt: Date;
  notified: boolean;
}

export interface WaitlistCriteria {
  serviceId?: string;
  staffId?: string;
  dateRange?: DateRange;
  priority?: number;
}

export interface WaitlistResult {
  success: boolean;
  waitlistEntry?: WaitlistEntry;
  position?: number;
  error?: string;
}

export interface RemovalResult {
  success: boolean;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationsSent: number;
  errors?: string[];
}

export interface AutomationResult {
  processed: number;
  bookingsCreated: number;
  notificationsSent: number;
  errors: string[];
}

export interface SubscriptionCriteria {
  bookingIds?: string[];
  staffIds?: string[];
  serviceIds?: string[];
  customerIds?: string[];
  eventTypes?: string[];
}

export interface BookingUpdate {
  type: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed';
  bookingId: string;
  data: Partial<Booking>;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  criteria: SubscriptionCriteria;
  callback: (update: BookingUpdate) => void;
  createdAt: Date;
}

export interface BroadcastResult {
  success: boolean;
  subscribersNotified: number;
  error?: string;
}

export interface LiveBookingStatus {
  totalBookings: number;
  todayBookings: number;
  activeBookings: number;
  staffUtilization: Record<string, number>;
  revenueToday: number;
  lastUpdated: Date;
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShows: number;
  averageBookingValue: number;
  totalRevenue: number;
  conversionRate: number;
  repeatCustomers: number;
}

export interface UtilizationReport {
  staffId?: string;
  period: DateRange;
  utilization: number; // percentage
  hoursWorked: number;
  hoursAvailable: number;
  bookingsCompleted: number;
  revenue: number;
  breakdown: {
    date: string;
    utilization: number;
    revenue: number;
  }[];
}

export interface RevenueAnalysis {
  period: DateRange;
  totalRevenue: number;
  averageBookingValue: number;
  revenueByService: Record<string, number>;
  revenueByStaff: Record<string, number>;
  trends: {
    daily: { date: string; revenue: number }[];
    weekly: { week: string; revenue: number }[];
    monthly: { month: string; revenue: number }[];
  };
}

export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
  revenue: number;
  averageRating: number;
  growthRate: number;
}

export type BookingMetric =
  | 'bookings'
  | 'revenue'
  | 'utilization'
  | 'cancellations'
  | 'no_shows'
  | 'new_customers';

export interface TrendData {
  metric: BookingMetric;
  period: DateRange;
  data: {
    date: string;
    value: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export interface StaffRequirement {
  skillRequired: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
}

export interface ServiceAvailability {
  days: string[]; // ['monday', 'tuesday', ...]
  timeSlots: {
    start: string;
    end: string;
  }[];
  blackoutDates: Date[];
  advanceBookingDays: number;
}

export interface ResourceRequirement {
  resourceId: string;
  quantity: number;
  mandatory: boolean;
}

export interface RefundPolicy {
  type: 'full' | 'partial' | 'none';
  percentage?: number;
  fees?: number;
}