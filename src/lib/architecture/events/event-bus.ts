/**
 * Event-Driven Architecture Implementation
 * Handles domain events with reliable delivery and retry mechanisms
 */

import { DomainEvent } from '../../domain/entities/base';

/**
 * Event Handler Interface
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: DomainEvent): boolean;
}

/**
 * Event Store Interface
 */
export interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion?: number): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<StoredEvent[]>;
  getAllEvents(fromPosition?: number): Promise<StoredEvent[]>;
  getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null>;
  saveSnapshot(snapshot: AggregateSnapshot): Promise<void>;
}

/**
 * Event Publisher Interface
 */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

/**
 * Stored Event with metadata
 */
export interface StoredEvent {
  id: string;
  streamId: string;
  version: number;
  eventType: string;
  eventData: string;
  metadata: string;
  timestamp: Date;
}

/**
 * Aggregate Snapshot for optimization
 */
export interface AggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: string;
  timestamp: Date;
}

/**
 * Event Bus Implementation
 */
export class EventBus implements EventPublisher {
  private handlers = new Map<string, EventHandler[]>();
  private middleware: EventMiddleware[] = [];
  private deadLetterQueue: DomainEvent[] = [];

  constructor(private eventStore?: EventStore) {}

  /**
   * Subscribe an event handler to specific event types
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  /**
   * Subscribe a handler to all events
   */
  subscribeToAll(handler: EventHandler): void {
    this.subscribe('*', handler);
  }

  /**
   * Add middleware to the event processing pipeline
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Publish a single event
   */
  async publish(event: DomainEvent): Promise<void> {
    await this.publishBatch([event]);
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    // Store events if event store is available
    if (this.eventStore && events.length > 0) {
      const streamId = events[0].aggregateId;
      await this.eventStore.append(streamId, events);
    }

    // Process each event through middleware and handlers
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  /**
   * Process a single event through middleware and handlers
   */
  private async processEvent(event: DomainEvent): Promise<void> {
    try {
      // Apply middleware
      let processedEvent = event;
      for (const middleware of this.middleware) {
        processedEvent = await middleware.process(processedEvent);
      }

      // Get handlers for this event type
      const eventTypeHandlers = this.handlers.get(event.type) || [];
      const allEventHandlers = this.handlers.get('*') || [];
      const allHandlers = [...eventTypeHandlers, ...allEventHandlers];

      // Filter handlers that can handle this event
      const applicableHandlers = allHandlers.filter(handler =>
        handler.canHandle(processedEvent)
      );

      // Execute all handlers in parallel
      const handlerPromises = applicableHandlers.map(async handler => {
        try {
          await handler.handle(processedEvent);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
          await this.handleEventFailure(processedEvent, handler, error);
        }
      });

      await Promise.allSettled(handlerPromises);
    } catch (error) {
      console.error(`Failed to process event ${event.type}:`, error);
      this.deadLetterQueue.push(event);
    }
  }

  /**
   * Handle event processing failures
   */
  private async handleEventFailure(
    event: DomainEvent,
    handler: EventHandler,
    error: any
  ): Promise<void> {
    // Add to dead letter queue for retry
    this.deadLetterQueue.push(event);

    // Could implement retry logic here
    console.error(`Event handler failed for ${event.type}:`, {
      eventId: event.id,
      handlerName: handler.constructor.name,
      error: error.message,
    });
  }

  /**
   * Replay events from the event store
   */
  async replayEvents(fromPosition?: number): Promise<void> {
    if (!this.eventStore) {
      throw new Error('Event store not configured');
    }

    const storedEvents = await this.eventStore.getAllEvents(fromPosition);

    for (const storedEvent of storedEvents) {
      const event = this.deserializeEvent(storedEvent);
      await this.processEvent(event);
    }
  }

  /**
   * Get dead letter queue for manual processing
   */
  getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Deserialize stored event back to domain event
   */
  private deserializeEvent(storedEvent: StoredEvent): DomainEvent {
    const eventData = JSON.parse(storedEvent.eventData);
    const metadata = JSON.parse(storedEvent.metadata);

    return {
      id: storedEvent.id,
      type: storedEvent.eventType,
      aggregateId: eventData.aggregateId,
      timestamp: new Date(eventData.timestamp),
      payload: eventData.payload,
      metadata: metadata,
    };
  }
}

/**
 * Event Middleware Interface
 */
export interface EventMiddleware {
  process(event: DomainEvent): Promise<DomainEvent>;
}

/**
 * Event Enrichment Middleware
 */
export class EventEnrichmentMiddleware implements EventMiddleware {
  async process(event: DomainEvent): Promise<DomainEvent> {
    // Add system metadata
    const enrichedEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        processedAt: new Date().toISOString(),
        serverName: process.env.SERVER_NAME || 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
      },
    };

    return enrichedEvent;
  }
}

/**
 * Event Validation Middleware
 */
export class EventValidationMiddleware implements EventMiddleware {
  async process(event: DomainEvent): Promise<DomainEvent> {
    // Validate required fields
    if (!event.id) {
      throw new Error('Event ID is required');
    }
    if (!event.type) {
      throw new Error('Event type is required');
    }
    if (!event.aggregateId) {
      throw new Error('Aggregate ID is required');
    }
    if (!event.timestamp) {
      throw new Error('Event timestamp is required');
    }
    if (!event.metadata?.tenantId) {
      throw new Error('Tenant ID is required in event metadata');
    }

    return event;
  }
}

/**
 * Event Logging Middleware
 */
export class EventLoggingMiddleware implements EventMiddleware {
  async process(event: DomainEvent): Promise<DomainEvent> {
    console.log(`[EventBus] Processing event: ${event.type}`, {
      eventId: event.id,
      aggregateId: event.aggregateId,
      tenantId: event.metadata.tenantId,
      timestamp: event.timestamp,
    });

    return event;
  }
}

/**
 * Base Event Handler Implementation
 */
export abstract class BaseEventHandler<T extends DomainEvent>
  implements EventHandler<T>
{
  protected abstract eventTypes: string[];

  canHandle(event: DomainEvent): boolean {
    return this.eventTypes.includes(event.type);
  }

  abstract handle(event: T): Promise<void>;
}

/**
 * In-Memory Event Store Implementation
 */
export class InMemoryEventStore implements EventStore {
  private events: StoredEvent[] = [];
  private snapshots: Map<string, AggregateSnapshot> = new Map();
  private streamVersions: Map<string, number> = new Map();

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void> {
    const currentVersion = this.streamVersions.get(streamId) || 0;

    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new Error(
        `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${currentVersion}`
      );
    }

    let version = currentVersion;

    for (const event of events) {
      version++;

      const storedEvent: StoredEvent = {
        id: event.id,
        streamId,
        version,
        eventType: event.type,
        eventData: JSON.stringify({
          aggregateId: event.aggregateId,
          timestamp: event.timestamp,
          payload: event.payload,
        }),
        metadata: JSON.stringify(event.metadata),
        timestamp: event.timestamp,
      };

      this.events.push(storedEvent);
    }

    this.streamVersions.set(streamId, version);
  }

  async getEvents(
    streamId: string,
    fromVersion: number = 0
  ): Promise<StoredEvent[]> {
    return this.events.filter(
      event => event.streamId === streamId && event.version > fromVersion
    );
  }

  async getAllEvents(fromPosition: number = 0): Promise<StoredEvent[]> {
    return this.events.slice(fromPosition);
  }

  async getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null> {
    return this.snapshots.get(aggregateId) || null;
  }

  async saveSnapshot(snapshot: AggregateSnapshot): Promise<void> {
    this.snapshots.set(snapshot.aggregateId, snapshot);
  }
}

/**
 * Example Event Handlers
 */
export class BookingNotificationHandler extends BaseEventHandler<DomainEvent> {
  protected eventTypes = [
    'booking.created',
    'booking.confirmed',
    'booking.cancelled',
    'booking.rescheduled',
  ];

  async handle(event: DomainEvent): Promise<void> {
    switch (event.type) {
      case 'booking.created':
        await this.sendBookingCreatedNotification(event);
        break;
      case 'booking.confirmed':
        await this.sendBookingConfirmedNotification(event);
        break;
      case 'booking.cancelled':
        await this.sendBookingCancelledNotification(event);
        break;
      case 'booking.rescheduled':
        await this.sendBookingRescheduledNotification(event);
        break;
    }
  }

  private async sendBookingCreatedNotification(event: DomainEvent): Promise<void> {
    console.log('Sending booking created notification', {
      bookingId: event.aggregateId,
      customerId: event.payload.customerId,
    });
    // Implementation would integrate with notification service
  }

  private async sendBookingConfirmedNotification(event: DomainEvent): Promise<void> {
    console.log('Sending booking confirmed notification', {
      bookingId: event.aggregateId,
    });
  }

  private async sendBookingCancelledNotification(event: DomainEvent): Promise<void> {
    console.log('Sending booking cancelled notification', {
      bookingId: event.aggregateId,
    });
  }

  private async sendBookingRescheduledNotification(event: DomainEvent): Promise<void> {
    console.log('Sending booking rescheduled notification', {
      bookingId: event.aggregateId,
    });
  }
}

/**
 * Inventory Update Handler
 */
export class InventoryUpdateHandler extends BaseEventHandler<DomainEvent> {
  protected eventTypes = ['booking.service.completed'];

  async handle(event: DomainEvent): Promise<void> {
    if (event.type === 'booking.service.completed') {
      await this.updateInventoryForCompletedService(event);
    }
  }

  private async updateInventoryForCompletedService(event: DomainEvent): Promise<void> {
    console.log('Updating inventory for completed service', {
      bookingId: event.aggregateId,
      serviceId: event.payload.serviceId,
    });
    // Implementation would update product usage in inventory
  }
}

/**
 * Event Bus Factory
 */
export class EventBusFactory {
  static create(eventStore?: EventStore): EventBus {
    const eventBus = new EventBus(eventStore);

    // Add default middleware
    eventBus.use(new EventValidationMiddleware());
    eventBus.use(new EventEnrichmentMiddleware());
    eventBus.use(new EventLoggingMiddleware());

    return eventBus;
  }

  static createWithInMemoryStore(): EventBus {
    const eventStore = new InMemoryEventStore();
    return EventBusFactory.create(eventStore);
  }
}