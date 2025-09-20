/**
 * Salon Domain Events - Events emitted by the Salon bounded context
 */

import { DomainEvent } from '../entities/base';

/**
 * Salon Created Event
 */
export class SalonCreatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.created';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    tenantId: string;
    name: string;
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    tenantId: string,
    name: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      tenantId,
      name,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Branch Added Event
 */
export class BranchAddedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.branch.added';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    branchName: string;
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    branchId: string,
    branchName: string,
    tenantId: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      branchName,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Service Updated Event
 */
export class ServiceUpdatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.service.updated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    serviceId: string;
    operation: 'created' | 'updated' | 'deleted';
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    serviceId: string,
    operation: 'created' | 'updated' | 'deleted',
    tenantId: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      serviceId,
      operation,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Branch Operating Hours Updated Event
 */
export class BranchOperatingHoursUpdatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.branch.hours.updated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    operatingHours: Record<string, any>;
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    branchId: string,
    operatingHours: Record<string, any>,
    tenantId: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      operatingHours,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Service Price Updated Event
 */
export class ServicePriceUpdatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.service.price.updated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    serviceId: string;
    oldPrice: { amount: number; currency: string };
    newPrice: { amount: number; currency: string };
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    serviceId: string,
    oldPrice: { amount: number; currency: string },
    newPrice: { amount: number; currency: string },
    tenantId: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      serviceId,
      oldPrice,
      newPrice,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}

/**
 * Staff Added to Branch Event
 */
export class StaffAddedToBranchEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'salon.branch.staff.added';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    branchId: string;
    staffId: string;
    staffName: string;
    role: string;
  };
  readonly metadata: {
    tenantId: string;
    correlationId: string;
    version?: number;
  };

  constructor(
    salonId: string,
    branchId: string,
    staffId: string,
    staffName: string,
    role: string,
    tenantId: string,
    correlationId: string = crypto.randomUUID()
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = salonId;
    this.timestamp = new Date();
    this.payload = {
      branchId,
      staffId,
      staffName,
      role,
    };
    this.metadata = {
      tenantId,
      correlationId,
      version: 1,
    };
  }
}