/**
 * Pink Blueberry Salon - Enterprise Architecture Entry Point
 *
 * This file exports the core architecture components for the salon management system.
 * The architecture follows Domain-Driven Design (DDD) principles with microservices
 * patterns, event-driven communication, and CQRS implementation.
 */

// Domain Entities and Base Classes
export * from './domain/entities/base';
export * from './domain/entities/salon';
export * from './domain/entities/booking';

// Domain Events
export * from './domain/events/salon-events';
export * from './domain/events/booking-events';

// Domain Services
export * from './domain/services/booking-domain-service';

// Architecture Patterns
export * from './architecture/cqrs/command-bus';
export * from './architecture/cqrs/query-bus';
export * from './architecture/events/event-bus';
export * from './architecture/gateway/api-gateway';

// Infrastructure Components
export * from './infrastructure/database/database-manager';
export * from './infrastructure/monitoring/observability';

/**
 * Architecture Overview
 *
 * This system implements a comprehensive enterprise architecture with the following
 * key components:
 *
 * 1. Domain Model (DDD)
 *    - Entities with strong business rules
 *    - Value objects for immutable data
 *    - Aggregate roots for consistency boundaries
 *    - Domain events for business event tracking
 *
 * 2. CQRS (Command Query Responsibility Segregation)
 *    - Command bus for write operations
 *    - Query bus for read operations
 *    - Separate read and write models
 *    - Middleware pipeline for cross-cutting concerns
 *
 * 3. Event-Driven Architecture
 *    - Event bus for asynchronous communication
 *    - Event handlers for business logic
 *    - Event store for audit and replay capabilities
 *    - Saga pattern for complex workflows
 *
 * 4. API Gateway
 *    - Centralized request routing
 *    - Authentication and authorization
 *    - Rate limiting and caching
 *    - Request/response transformation
 *
 * 5. Infrastructure
 *    - PostgreSQL database management
 *    - Monitoring and observability
 *    - Security and compliance
 *    - Performance optimization
 *
 * Bounded Contexts:
 * - Salon Management: Salon profiles, branches, services, staff
 * - Booking & Scheduling: Appointments, availability, calendar
 * - Customer Relationship: Customer profiles, preferences, loyalty
 * - Payment Processing: Transactions, invoicing, refunds
 * - Inventory Management: Product tracking, stock levels
 * - Analytics & Reporting: Business metrics, insights
 * - Communications: Notifications, messaging, alerts
 */

/**
 * Quick Start Guide
 *
 * 1. Initialize the system components:
 * ```typescript
 * import {
 *   CommandBusFactory,
 *   QueryBusFactory,
 *   EventBusFactory,
 *   ApiGatewayFactory,
 *   DatabaseManagerFactory,
 *   globalObservability
 * } from './lib';
 *
 * // Initialize core components
 * const commandBus = CommandBusFactory.create();
 * const queryBus = QueryBusFactory.createWithInMemoryCache();
 * const eventBus = EventBusFactory.createWithInMemoryStore();
 * const apiGateway = ApiGatewayFactory.create();
 * const dbManager = DatabaseManagerFactory.create();
 * ```
 *
 * 2. Register command handlers:
 * ```typescript
 * import { CreateBookingCommand, CreateBookingCommandHandler } from './lib';
 *
 * commandBus.register(
 *   'CreateBookingCommand',
 *   new CreateBookingCommandHandler(eventBus, dbManager)
 * );
 * ```
 *
 * 3. Register event handlers:
 * ```typescript
 * import { BookingNotificationHandler } from './lib';
 *
 * eventBus.subscribe('booking.created', new BookingNotificationHandler());
 * ```
 *
 * 4. Configure API routes:
 * ```typescript
 * apiGateway.registerRoutes([
 *   {
 *     path: '/api/bookings',
 *     method: 'POST',
 *     service: 'booking-service',
 *     handler: 'createBooking',
 *     auth: ['customer', 'staff'],
 *     rateLimit: { requests: 10, window: '1m' }
 *   }
 * ]);
 * ```
 */

/**
 * Architecture Principles
 *
 * 1. Domain-Driven Design
 *    - Business logic in domain entities
 *    - Clear bounded contexts
 *    - Ubiquitous language
 *
 * 2. Event-Driven Architecture
 *    - Loose coupling between services
 *    - Asynchronous processing
 *    - Event sourcing for audit trail
 *
 * 3. CQRS
 *    - Separate read and write models
 *    - Optimized queries
 *    - Command validation
 *
 * 4. Microservices
 *    - Service autonomy
 *    - Technology diversity
 *    - Independent deployment
 *
 * 5. Security by Design
 *    - Defense in depth
 *    - Zero trust architecture
 *    - Privacy by design
 *
 * 6. Observability
 *    - Comprehensive monitoring
 *    - Distributed tracing
 *    - Business metrics
 */

/**
 * Technology Stack
 *
 * Frontend:
 * - Next.js 15 with App Router
 * - TypeScript for type safety
 * - Server Components for performance
 * - TailwindCSS for styling
 *
 * Backend:
 * - Next.js API Routes
 * - PostgreSQL for data persistence
 * - Redis for caching
 * - Event-driven architecture
 *
 * Infrastructure:
 * - Vercel for deployment
 * - AWS for additional services
 * - Monitoring and observability
 * - Security and compliance tools
 */

/**
 * Development Guidelines
 *
 * 1. Always use TypeScript for type safety
 * 2. Follow domain-driven design principles
 * 3. Implement comprehensive error handling
 * 4. Add monitoring and observability
 * 5. Write tests for all critical paths
 * 6. Document architectural decisions
 * 7. Follow security best practices
 * 8. Maintain backward compatibility
 */

// Factory functions for easy initialization
export const ArchitectureFactory = {
  createCommandBus: () => {
    const CommandBusFactory = require('./architecture/cqrs/command-bus').CommandBusFactory;
    return CommandBusFactory.create();
  },

  createQueryBus: () => {
    const QueryBusFactory = require('./architecture/cqrs/query-bus').QueryBusFactory;
    return QueryBusFactory.createWithInMemoryCache();
  },

  createEventBus: () => {
    const EventBusFactory = require('./architecture/events/event-bus').EventBusFactory;
    return EventBusFactory.createWithInMemoryStore();
  },

  createApiGateway: () => {
    const ApiGatewayFactory = require('./architecture/gateway/api-gateway').ApiGatewayFactory;
    return ApiGatewayFactory.create();
  },

  createDatabaseManager: () => {
    const DatabaseManagerFactory = require('./infrastructure/database/database-manager').DatabaseManagerFactory;
    return DatabaseManagerFactory.create();
  },

  createCompleteSystem: () => {
    return {
      commandBus: ArchitectureFactory.createCommandBus(),
      queryBus: ArchitectureFactory.createQueryBus(),
      eventBus: ArchitectureFactory.createEventBus(),
      apiGateway: ArchitectureFactory.createApiGateway(),
      databaseManager: ArchitectureFactory.createDatabaseManager(),
    };
  }
};