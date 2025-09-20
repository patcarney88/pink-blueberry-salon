/**
 * Booking Domain Entities - Core entities for booking and scheduling
 * Implements the Booking & Scheduling bounded context
 */

import { Entity, AggregateRoot, UniqueId, Email, PhoneNumber, Money, DomainError } from './base';
import { BookingCreatedEvent, BookingConfirmedEvent, BookingCancelledEvent } from '../events/booking-events';

/**
 * Customer Entity - Customer information and preferences
 */
export class Customer extends Entity<string> {
  private _email: Email;
  private _name: string;
  private _phone: PhoneNumber;
  private _dateOfBirth?: Date;
  private _gender?: Gender;
  private _preferences?: CustomerPreferences;
  private _notes?: string;
  private _tags: string[];
  private _isVip: boolean;

  constructor(
    id: string,
    email: Email,
    name: string,
    phone: PhoneNumber,
    dateOfBirth?: Date,
    gender?: Gender,
    preferences?: CustomerPreferences,
    notes?: string,
    tags: string[] = [],
    isVip: boolean = false,
    createdAt?: Date
  ) {
    super(id, createdAt);
    this._email = email;
    this._name = name;
    this._phone = phone;
    this._dateOfBirth = dateOfBirth;
    this._gender = gender;
    this._preferences = preferences;
    this._notes = notes;
    this._tags = tags;
    this._isVip = isVip;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get phone(): PhoneNumber {
    return this._phone;
  }

  get dateOfBirth(): Date | undefined {
    return this._dateOfBirth;
  }

  get gender(): Gender | undefined {
    return this._gender;
  }

  get preferences(): CustomerPreferences | undefined {
    return this._preferences;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get isVip(): boolean {
    return this._isVip;
  }

  public updateContactInfo(email?: Email, phone?: PhoneNumber): void {
    if (email) this._email = email;
    if (phone) this._phone = phone;
    this.touch();
  }

  public updatePreferences(preferences: CustomerPreferences): void {
    this._preferences = { ...this._preferences, ...preferences };
    this.touch();
  }

  public addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this.touch();
    }
  }

  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this.touch();
    }
  }

  public promoteToVip(): void {
    this._isVip = true;
    this.touch();
  }

  public updateNotes(notes: string): void {
    this._notes = notes;
    this.touch();
  }

  public getAge(): number | undefined {
    if (!this._dateOfBirth) return undefined;
    const today = new Date();
    const birthDate = new Date(this._dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

/**
 * Staff Entity - Staff member information and capabilities
 */
export class Staff extends Entity<string> {
  private _branchId: string;
  private _name: string;
  private _email: Email;
  private _phone: PhoneNumber;
  private _role: StaffRole;
  private _specialties: string[];
  private _commissionRate: number; // Percentage (0-100)
  private _isActive: boolean;
  private _avatar?: string;
  private _bio?: string;

  constructor(
    id: string,
    branchId: string,
    name: string,
    email: Email,
    phone: PhoneNumber,
    role: StaffRole,
    specialties: string[] = [],
    commissionRate: number = 0,
    isActive: boolean = true,
    avatar?: string,
    bio?: string,
    createdAt?: Date
  ) {
    super(id, createdAt);

    if (commissionRate < 0 || commissionRate > 100) {
      throw new DomainError('Commission rate must be between 0 and 100', 'INVALID_COMMISSION_RATE');
    }

    this._branchId = branchId;
    this._name = name;
    this._email = email;
    this._phone = phone;
    this._role = role;
    this._specialties = specialties;
    this._commissionRate = commissionRate;
    this._isActive = isActive;
    this._avatar = avatar;
    this._bio = bio;
  }

  get branchId(): string {
    return this._branchId;
  }

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get phone(): PhoneNumber {
    return this._phone;
  }

  get role(): StaffRole {
    return this._role;
  }

  get specialties(): string[] {
    return [...this._specialties];
  }

  get commissionRate(): number {
    return this._commissionRate;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get bio(): string | undefined {
    return this._bio;
  }

  public updateCommissionRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new DomainError('Commission rate must be between 0 and 100', 'INVALID_COMMISSION_RATE');
    }
    this._commissionRate = rate;
    this.touch();
  }

  public addSpecialty(specialty: string): void {
    if (!this._specialties.includes(specialty)) {
      this._specialties.push(specialty);
      this.touch();
    }
  }

  public removeSpecialty(specialty: string): void {
    const index = this._specialties.indexOf(specialty);
    if (index > -1) {
      this._specialties.splice(index, 1);
      this.touch();
    }
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public canPerformService(serviceCategory: string): boolean {
    if (!this._isActive) return false;

    // Admin and Manager can perform any service
    if (this._role === StaffRole.ADMIN || this._role === StaffRole.MANAGER) {
      return true;
    }

    // Check if staff has the required specialty
    return this._specialties.includes(serviceCategory);
  }

  public calculateCommission(amount: Money): Money {
    return amount.multiply(this._commissionRate / 100);
  }
}

/**
 * Booking Aggregate Root - Main booking entity
 */
export class Booking extends AggregateRoot<string> {
  private _branchId: string;
  private _customerId: string;
  private _status: BookingStatus;
  private _scheduledAt: Date;
  private _duration: number; // Total duration in minutes
  private _totalAmount: Money;
  private _depositPaid: Money;
  private _notes?: string;
  private _source: BookingSource;
  private _metadata?: Record<string, any>;
  private _confirmedAt?: Date;
  private _completedAt?: Date;
  private _cancelledAt?: Date;
  private _cancellationReason?: string;
  private _services: Map<string, BookingService> = new Map();

  constructor(
    id: string,
    branchId: string,
    customerId: string,
    scheduledAt: Date,
    totalAmount: Money,
    source: BookingSource = BookingSource.WEB,
    notes?: string,
    metadata?: Record<string, any>,
    createdAt?: Date
  ) {
    super(id, createdAt);

    if (scheduledAt <= new Date()) {
      throw new DomainError('Booking cannot be scheduled in the past', 'INVALID_SCHEDULE_TIME');
    }

    this._branchId = branchId;
    this._customerId = customerId;
    this._status = BookingStatus.PENDING;
    this._scheduledAt = scheduledAt;
    this._duration = 0;
    this._totalAmount = totalAmount;
    this._depositPaid = Money.zero(totalAmount.currency);
    this._notes = notes;
    this._source = source;
    this._metadata = metadata;

    // Emit domain event
    this.addDomainEvent(new BookingCreatedEvent(
      this.id,
      this._branchId,
      this._customerId,
      this._scheduledAt,
      this._totalAmount
    ));
  }

  get branchId(): string {
    return this._branchId;
  }

  get customerId(): string {
    return this._customerId;
  }

  get status(): BookingStatus {
    return this._status;
  }

  get scheduledAt(): Date {
    return this._scheduledAt;
  }

  get duration(): number {
    return this._duration;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get depositPaid(): Money {
    return this._depositPaid;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get source(): BookingSource {
    return this._source;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get confirmedAt(): Date | undefined {
    return this._confirmedAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  get cancellationReason(): string | undefined {
    return this._cancellationReason;
  }

  get services(): BookingService[] {
    return Array.from(this._services.values());
  }

  public addService(service: BookingService): void {
    if (this._status !== BookingStatus.PENDING) {
      throw new DomainError('Cannot modify services after booking is confirmed', 'BOOKING_LOCKED');
    }

    this._services.set(service.id, service);
    this.recalculateTotals();
  }

  public removeService(serviceId: string): void {
    if (this._status !== BookingStatus.PENDING) {
      throw new DomainError('Cannot modify services after booking is confirmed', 'BOOKING_LOCKED');
    }

    this._services.delete(serviceId);
    this.recalculateTotals();
  }

  public confirm(): void {
    if (this._status !== BookingStatus.PENDING) {
      throw new DomainError('Booking can only be confirmed from pending status', 'INVALID_STATUS_TRANSITION');
    }

    if (this._services.size === 0) {
      throw new DomainError('Cannot confirm booking without services', 'NO_SERVICES');
    }

    this._status = BookingStatus.CONFIRMED;
    this._confirmedAt = new Date();
    this.touch();

    // Emit domain event
    this.addDomainEvent(new BookingConfirmedEvent(this.id, this._branchId, this._scheduledAt));
  }

  public start(): void {
    if (this._status !== BookingStatus.CONFIRMED) {
      throw new DomainError('Booking must be confirmed before starting', 'INVALID_STATUS_TRANSITION');
    }

    this._status = BookingStatus.IN_PROGRESS;
    this.touch();
  }

  public complete(): void {
    if (this._status !== BookingStatus.IN_PROGRESS) {
      throw new DomainError('Booking must be in progress to complete', 'INVALID_STATUS_TRANSITION');
    }

    this._status = BookingStatus.COMPLETED;
    this._completedAt = new Date();
    this.touch();
  }

  public cancel(reason?: string): void {
    if (this._status === BookingStatus.COMPLETED || this._status === BookingStatus.CANCELLED) {
      throw new DomainError('Cannot cancel completed or already cancelled booking', 'INVALID_STATUS_TRANSITION');
    }

    this._status = BookingStatus.CANCELLED;
    this._cancelledAt = new Date();
    this._cancellationReason = reason;
    this.touch();

    // Emit domain event
    this.addDomainEvent(new BookingCancelledEvent(this.id, this._branchId, reason));
  }

  public reschedule(newDateTime: Date): void {
    if (this._status !== BookingStatus.CONFIRMED) {
      throw new DomainError('Can only reschedule confirmed bookings', 'INVALID_STATUS_TRANSITION');
    }

    if (newDateTime <= new Date()) {
      throw new DomainError('Cannot reschedule to past date', 'INVALID_SCHEDULE_TIME');
    }

    this._scheduledAt = newDateTime;
    this.touch();
  }

  public payDeposit(amount: Money): void {
    this._depositPaid = this._depositPaid.add(amount);
    this.touch();
  }

  public canReschedule(): boolean {
    const hoursUntilBooking = (this._scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return this._status === BookingStatus.CONFIRMED && hoursUntilBooking >= 24;
  }

  public canCancel(): boolean {
    const hoursUntilBooking = (this._scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return this._status !== BookingStatus.COMPLETED &&
           this._status !== BookingStatus.CANCELLED &&
           hoursUntilBooking >= 2;
  }

  public calculateRemainingBalance(): Money {
    return this._totalAmount.subtract(this._depositPaid);
  }

  private recalculateTotals(): void {
    let totalDuration = 0;
    let totalAmount = Money.zero(this._totalAmount.currency);

    for (const service of this._services.values()) {
      totalDuration += service.duration;
      totalAmount = totalAmount.add(service.price);
    }

    this._duration = totalDuration;
    this._totalAmount = totalAmount;
    this.touch();
  }
}

/**
 * BookingService Entity - Individual service within a booking
 */
export class BookingService extends Entity<string> {
  private _bookingId: string;
  private _serviceId: string;
  private _staffId?: string;
  private _startTime: Date;
  private _duration: number;
  private _price: Money;
  private _discount: Money;
  private _status: ServiceStatus;

  constructor(
    id: string,
    bookingId: string,
    serviceId: string,
    startTime: Date,
    duration: number,
    price: Money,
    staffId?: string,
    discount?: Money,
    status: ServiceStatus = ServiceStatus.PENDING,
    createdAt?: Date
  ) {
    super(id, createdAt);

    if (duration <= 0) {
      throw new DomainError('Service duration must be positive', 'INVALID_DURATION');
    }

    this._bookingId = bookingId;
    this._serviceId = serviceId;
    this._staffId = staffId;
    this._startTime = startTime;
    this._duration = duration;
    this._price = price;
    this._discount = discount || Money.zero(price.currency);
    this._status = status;
  }

  get bookingId(): string {
    return this._bookingId;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get staffId(): string | undefined {
    return this._staffId;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get duration(): number {
    return this._duration;
  }

  get price(): Money {
    return this._price;
  }

  get discount(): Money {
    return this._discount;
  }

  get status(): ServiceStatus {
    return this._status;
  }

  public assignStaff(staffId: string): void {
    this._staffId = staffId;
    this.touch();
  }

  public applyDiscount(discount: Money): void {
    if (discount.isGreaterThan(this._price)) {
      throw new DomainError('Discount cannot exceed service price', 'INVALID_DISCOUNT');
    }
    this._discount = discount;
    this.touch();
  }

  public start(): void {
    if (this._status !== ServiceStatus.PENDING) {
      throw new DomainError('Service must be pending to start', 'INVALID_STATUS_TRANSITION');
    }
    this._status = ServiceStatus.IN_PROGRESS;
    this.touch();
  }

  public complete(): void {
    if (this._status !== ServiceStatus.IN_PROGRESS) {
      throw new DomainError('Service must be in progress to complete', 'INVALID_STATUS_TRANSITION');
    }
    this._status = ServiceStatus.COMPLETED;
    this.touch();
  }

  public cancel(): void {
    if (this._status === ServiceStatus.COMPLETED) {
      throw new DomainError('Cannot cancel completed service', 'INVALID_STATUS_TRANSITION');
    }
    this._status = ServiceStatus.CANCELLED;
    this.touch();
  }

  public getFinalPrice(): Money {
    return this._price.subtract(this._discount);
  }

  public getEndTime(): Date {
    return new Date(this._startTime.getTime() + (this._duration * 60 * 1000));
  }
}

/**
 * Supporting Types and Enums
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export enum StaffRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STYLIST = 'STYLIST',
  RECEPTIONIST = 'RECEPTIONIST',
  ASSISTANT = 'ASSISTANT'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum BookingSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  PHONE = 'PHONE',
  WALK_IN = 'WALK_IN',
  ADMIN = 'ADMIN'
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CustomerPreferences {
  preferredStaff?: string[];
  allergies?: string[];
  skinType?: string;
  preferredTime?: string;
  communicationPreferences?: {
    email?: boolean;
    sms?: boolean;
    phone?: boolean;
  };
  languagePreference?: string;
}