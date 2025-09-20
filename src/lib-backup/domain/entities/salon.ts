/**
 * Salon Domain Entities - Core business entities for salon management
 * Implements the Salon bounded context from the architecture document
 */

import { Entity, AggregateRoot, UniqueId, Email, PhoneNumber, Address, Money, DomainError } from './base';
import { SalonCreatedEvent, BranchAddedEvent, ServiceUpdatedEvent } from '../events/salon-events';

/**
 * Tenant Entity - Multi-tenant root entity
 */
export class Tenant extends Entity<string> {
  private _name: string;
  private _slug: string;
  private _plan: TenantPlan;
  private _status: TenantStatus;
  private _settings: TenantSettings;

  constructor(
    id: string,
    name: string,
    slug: string,
    plan: TenantPlan = TenantPlan.BASIC,
    status: TenantStatus = TenantStatus.ACTIVE,
    settings?: TenantSettings,
    createdAt?: Date
  ) {
    super(id, createdAt);
    this._name = name;
    this._slug = slug;
    this._plan = plan;
    this._status = status;
    this._settings = settings || new TenantSettings();
  }

  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  get plan(): TenantPlan {
    return this._plan;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get settings(): TenantSettings {
    return this._settings;
  }

  public updatePlan(plan: TenantPlan): void {
    if (this._status !== TenantStatus.ACTIVE) {
      throw new DomainError('Cannot update plan for inactive tenant', 'TENANT_INACTIVE');
    }
    this._plan = plan;
    this.touch();
  }

  public suspend(): void {
    this._status = TenantStatus.SUSPENDED;
    this.touch();
  }

  public activate(): void {
    this._status = TenantStatus.ACTIVE;
    this.touch();
  }

  public isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  public canAddBranches(): boolean {
    const limits = this.getPlanLimits();
    return this.isActive() && limits.maxBranches > 0;
  }

  private getPlanLimits(): { maxBranches: number; maxStaff: number; maxServices: number } {
    switch (this._plan) {
      case TenantPlan.BASIC:
        return { maxBranches: 1, maxStaff: 5, maxServices: 20 };
      case TenantPlan.PROFESSIONAL:
        return { maxBranches: 3, maxStaff: 25, maxServices: 100 };
      case TenantPlan.ENTERPRISE:
        return { maxBranches: -1, maxStaff: -1, maxServices: -1 }; // Unlimited
      default:
        return { maxBranches: 0, maxStaff: 0, maxServices: 0 };
    }
  }
}

/**
 * Salon Aggregate Root - Main salon entity
 */
export class Salon extends AggregateRoot<string> {
  private _tenantId: string;
  private _name: string;
  private _description?: string;
  private _logo?: string;
  private _settings: SalonSettings;
  private _branches: Map<string, Branch> = new Map();
  private _services: Map<string, Service> = new Map();

  constructor(
    id: string,
    tenantId: string,
    name: string,
    description?: string,
    logo?: string,
    settings?: SalonSettings,
    createdAt?: Date
  ) {
    super(id, createdAt);
    this._tenantId = tenantId;
    this._name = name;
    this._description = description;
    this._logo = logo;
    this._settings = settings || new SalonSettings();

    // Emit domain event
    this.addDomainEvent(new SalonCreatedEvent(this.id, this._tenantId, this._name));
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get logo(): string | undefined {
    return this._logo;
  }

  get settings(): SalonSettings {
    return this._settings;
  }

  get branches(): Branch[] {
    return Array.from(this._branches.values());
  }

  get services(): Service[] {
    return Array.from(this._services.values());
  }

  public addBranch(branch: Branch): void {
    if (this._branches.has(branch.id)) {
      throw new DomainError('Branch already exists', 'BRANCH_EXISTS');
    }

    this._branches.set(branch.id, branch);
    this.touch();

    // Emit domain event
    this.addDomainEvent(new BranchAddedEvent(this.id, branch.id, branch.name));
  }

  public getBranch(branchId: string): Branch | undefined {
    return this._branches.get(branchId);
  }

  public addService(service: Service): void {
    if (this._services.has(service.id)) {
      throw new DomainError('Service already exists', 'SERVICE_EXISTS');
    }

    this._services.set(service.id, service);
    this.touch();

    // Emit domain event
    this.addDomainEvent(new ServiceUpdatedEvent(this.id, service.id, 'created'));
  }

  public getService(serviceId: string): Service | undefined {
    return this._services.get(serviceId);
  }

  public updateSettings(settings: Partial<SalonSettings>): void {
    this._settings = { ...this._settings, ...settings };
    this.touch();
  }

  public isWithinOperatingHours(date: Date, branchId?: string): boolean {
    if (branchId) {
      const branch = this.getBranch(branchId);
      return branch ? branch.isWithinOperatingHours(date) : false;
    }

    // Check if any branch is operating
    return this.branches.some(branch => branch.isWithinOperatingHours(date));
  }

  public getAvailableServices(branchId?: string): Service[] {
    return this.services.filter(service => service.isActive);
  }
}

/**
 * Branch Entity - Physical location of the salon
 */
export class Branch extends Entity<string> {
  private _salonId: string;
  private _name: string;
  private _address: Address;
  private _phone: PhoneNumber;
  private _email: Email;
  private _timezone: string;
  private _operatingHours: OperatingHours;
  private _settings: BranchSettings;
  private _isActive: boolean;

  constructor(
    id: string,
    salonId: string,
    name: string,
    address: Address,
    phone: PhoneNumber,
    email: Email,
    timezone: string,
    operatingHours: OperatingHours,
    settings?: BranchSettings,
    isActive: boolean = true,
    createdAt?: Date
  ) {
    super(id, createdAt);
    this._salonId = salonId;
    this._name = name;
    this._address = address;
    this._phone = phone;
    this._email = email;
    this._timezone = timezone;
    this._operatingHours = operatingHours;
    this._settings = settings || new BranchSettings();
    this._isActive = isActive;
  }

  get salonId(): string {
    return this._salonId;
  }

  get name(): string {
    return this._name;
  }

  get address(): Address {
    return this._address;
  }

  get phone(): PhoneNumber {
    return this._phone;
  }

  get email(): Email {
    return this._email;
  }

  get timezone(): string {
    return this._timezone;
  }

  get operatingHours(): OperatingHours {
    return this._operatingHours;
  }

  get settings(): BranchSettings {
    return this._settings;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  public updateOperatingHours(hours: OperatingHours): void {
    this._operatingHours = hours;
    this.touch();
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public isWithinOperatingHours(date: Date): boolean {
    if (!this._isActive) return false;

    const dayOfWeek = date.toLocaleDateString('en-US', {
      weekday: 'lowercase',
      timeZone: this._timezone
    }) as keyof OperatingHours;

    const todayHours = this._operatingHours[dayOfWeek];
    if (!todayHours || todayHours.closed) return false;

    const currentTime = date.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: this._timezone,
      hour: '2-digit',
      minute: '2-digit'
    });

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }
}

/**
 * Service Entity - Services offered by the salon
 */
export class Service extends Entity<string> {
  private _salonId: string;
  private _name: string;
  private _description?: string;
  private _category: string;
  private _duration: number; // in minutes
  private _price: Money;
  private _isActive: boolean;
  private _requiresDeposit: boolean;
  private _depositAmount?: Money;
  private _metadata?: Record<string, any>;

  constructor(
    id: string,
    salonId: string,
    name: string,
    category: string,
    duration: number,
    price: Money,
    description?: string,
    isActive: boolean = true,
    requiresDeposit: boolean = false,
    depositAmount?: Money,
    metadata?: Record<string, any>,
    createdAt?: Date
  ) {
    super(id, createdAt);

    if (duration <= 0) {
      throw new DomainError('Service duration must be positive', 'INVALID_DURATION');
    }
    if (requiresDeposit && !depositAmount) {
      throw new DomainError('Deposit amount required when deposit is required', 'MISSING_DEPOSIT');
    }

    this._salonId = salonId;
    this._name = name;
    this._description = description;
    this._category = category;
    this._duration = duration;
    this._price = price;
    this._isActive = isActive;
    this._requiresDeposit = requiresDeposit;
    this._depositAmount = depositAmount;
    this._metadata = metadata;
  }

  get salonId(): string {
    return this._salonId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get category(): string {
    return this._category;
  }

  get duration(): number {
    return this._duration;
  }

  get price(): Money {
    return this._price;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get requiresDeposit(): boolean {
    return this._requiresDeposit;
  }

  get depositAmount(): Money | undefined {
    return this._depositAmount;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  public updatePrice(price: Money): void {
    this._price = price;
    this.touch();
  }

  public updateDuration(duration: number): void {
    if (duration <= 0) {
      throw new DomainError('Service duration must be positive', 'INVALID_DURATION');
    }
    this._duration = duration;
    this.touch();
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public setDepositRequired(amount: Money): void {
    this._requiresDeposit = true;
    this._depositAmount = amount;
    this.touch();
  }

  public removeDepositRequirement(): void {
    this._requiresDeposit = false;
    this._depositAmount = undefined;
    this.touch();
  }
}

/**
 * Supporting Types and Enums
 */
export enum TenantPlan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

export interface TenantSettings {
  allowMultipleBranches?: boolean;
  maxBranches?: number;
  features?: string[];
  customBranding?: boolean;
  apiAccess?: boolean;
}

export interface SalonSettings {
  bookingConfirmationRequired?: boolean;
  allowOnlineBooking?: boolean;
  cancellationPolicy?: string;
  paymentMethods?: string[];
  defaultCurrency?: string;
  businessLicense?: string;
  taxRate?: number;
}

export interface BranchSettings {
  maxAdvanceBookingDays?: number;
  minBookingNotice?: number; // hours
  allowWalkIns?: boolean;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  wifiAvailable?: boolean;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // Format: "HH:mm"
  close: string; // Format: "HH:mm"
  closed?: boolean;
  breaks?: { start: string; end: string }[];
}