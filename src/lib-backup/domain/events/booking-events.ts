/**
 * Booking Domain Events - Events emitted by the Booking & Scheduling bounded context
 */

import { DomainEvent } from '../entities/base';
import { Money } from '../entities/base';

/**
 * Booking Created Event
 */
export class BookingCreatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.created';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    customerId: string;
    scheduledAt: Date;
    totalAmount: { amount: number; currency: string };
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    branchId: string,
    customerId: string,
    scheduledAt: Date,
    totalAmount: Money,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      customerId,
      scheduledAt,
      totalAmount: {
        amount: totalAmount.amount,
        currency: totalAmount.currency,
      },
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Booking Confirmed Event
 */
export class BookingConfirmedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.confirmed';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    scheduledAt: Date;
    confirmedAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    branchId: string,
    scheduledAt: Date,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      scheduledAt,
      confirmedAt: new Date(),
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Booking Cancelled Event
 */
export class BookingCancelledEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.cancelled';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    reason?: string;
    cancelledAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    branchId: string,
    reason: string | undefined,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      reason,
      cancelledAt: new Date(),
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Booking Rescheduled Event
 */
export class BookingRescheduledEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.rescheduled';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    oldScheduledAt: Date;
    newScheduledAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    branchId: string,
    oldScheduledAt: Date,
    newScheduledAt: Date,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      oldScheduledAt,
      newScheduledAt,
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Booking Completed Event
 */
export class BookingCompletedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.completed';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    customerId: string;
    totalAmount: { amount: number; currency: string };
    duration: number;
    completedAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    branchId: string,
    customerId: string,
    totalAmount: Money,
    duration: number,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      customerId,
      totalAmount: {
        amount: totalAmount.amount,
        currency: totalAmount.currency,
      },
      duration,
      completedAt: new Date(),
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Payment Received Event
 */
export class PaymentReceivedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.payment.received';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    paymentId: string;
    amount: { amount: number; currency: string };
    method: string;
    isDeposit: boolean;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    paymentId: string,
    amount: Money,
    method: string,
    isDeposit: boolean,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      paymentId,
      amount: {
        amount: amount.amount,
        currency: amount.currency,
      },
      method,
      isDeposit,
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Service Started Event
 */
export class ServiceStartedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.service.started';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    serviceId: string;
    staffId?: string;
    startedAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    serviceId: string,
    tenantId: string,
    staffId?: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      serviceId,
      staffId,
      startedAt: new Date(),
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Service Completed Event
 */
export class ServiceCompletedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.service.completed';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    serviceId: string;
    staffId?: string;
    completedAt: Date;
    duration: number;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    serviceId: string,
    duration: number,
    tenantId: string,
    staffId?: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      serviceId,
      staffId,
      completedAt: new Date(),
      duration,
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Customer No Show Event
 */
export class CustomerNoShowEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'booking.customer.no_show';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    customerId: string;
    branchId: string;
    scheduledAt: Date;
    noShowAt: Date;
  };
  readonly metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    bookingId: string,
    customerId: string,
    branchId: string,
    scheduledAt: Date,
    tenantId: string,
    userId?: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = bookingId;
    this.timestamp = new Date();
    this.payload = {
      customerId,
      branchId,
      scheduledAt,
      noShowAt: new Date(),
    };
    this.metadata = {
      userId,
      tenantId,
      correlationId,
      version: 1,
    };
  }
}