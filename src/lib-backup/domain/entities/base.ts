/**
 * Base Entity - Core domain entity with identity and audit trails
 * Foundation for all domain entities in the Pink Blueberry Salon system
 */

export abstract class Entity<T = string> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = new Date();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals(other: Entity<T>): boolean {
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }

  public hashCode(): string {
    return `${this.constructor.name}:${this._id}`;
  }
}

/**
 * Value Object - Immutable objects defined by their attributes
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(other: ValueObject<T>): boolean {
    if (this === other) return true;
    if (!(other instanceof ValueObject)) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

/**
 * Aggregate Root - Entry point for modifying aggregate state
 */
export abstract class AggregateRoot<T = string> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  protected static isEntity(obj: any): obj is Entity {
    return obj instanceof Entity;
  }

  protected static isValueObject(obj: any): obj is ValueObject<any> {
    return obj instanceof ValueObject;
  }
}

/**
 * Domain Event - Captures business events that occur in the domain
 */
export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: Record<string, any>;
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };
}

/**
 * Domain Error - Business rule violations and domain errors
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Unique Identifier Value Object
 */
export class UniqueId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainError('UniqueId cannot be empty', 'INVALID_ID');
    }
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): UniqueId {
    return new UniqueId(crypto.randomUUID());
  }

  static fromString(value: string): UniqueId {
    return new UniqueId(value);
  }
}

/**
 * Money Value Object for financial calculations
 */
export class Money extends ValueObject<{ amount: number; currency: string }> {
  constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new DomainError('Money amount cannot be negative', 'INVALID_AMOUNT');
    }
    if (!currency || currency.length !== 3) {
      throw new DomainError('Currency must be a valid 3-character code', 'INVALID_CURRENCY');
    }
    super({ amount: Math.round(amount * 100) / 100, currency: currency.toUpperCase() });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new DomainError('Cannot divide by zero', 'DIVISION_BY_ZERO');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
        'CURRENCY_MISMATCH'
      );
    }
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }
}

/**
 * Email Value Object
 */
export class Email extends ValueObject<{ value: string }> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(value: string) {
    if (!value || !Email.EMAIL_REGEX.test(value)) {
      throw new DomainError('Invalid email format', 'INVALID_EMAIL');
    }
    super({ value: value.toLowerCase() });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Phone Number Value Object
 */
export class PhoneNumber extends ValueObject<{ value: string; country?: string }> {
  private static readonly PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,15}$/;

  constructor(value: string, country?: string) {
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    if (!PhoneNumber.PHONE_REGEX.test(value)) {
      throw new DomainError('Invalid phone number format', 'INVALID_PHONE');
    }
    super({ value: cleaned, country });
  }

  get value(): string {
    return this.props.value;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Address Value Object
 */
export class Address extends ValueObject<{
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}> {
  constructor(props: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) {
    if (!props.street?.trim()) {
      throw new DomainError('Street address is required', 'INVALID_ADDRESS');
    }
    if (!props.city?.trim()) {
      throw new DomainError('City is required', 'INVALID_ADDRESS');
    }
    if (!props.state?.trim()) {
      throw new DomainError('State is required', 'INVALID_ADDRESS');
    }
    if (!props.zipCode?.trim()) {
      throw new DomainError('Zip code is required', 'INVALID_ADDRESS');
    }
    if (!props.country?.trim()) {
      throw new DomainError('Country is required', 'INVALID_ADDRESS');
    }

    super({
      street: props.street.trim(),
      city: props.city.trim(),
      state: props.state.trim(),
      zipCode: props.zipCode.trim(),
      country: props.country.trim(),
    });
  }

  get street(): string {
    return this.props.street;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }
}