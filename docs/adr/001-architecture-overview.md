# ADR-001: Overall System Architecture

## Status
Accepted

## Context
Pink Blueberry Salon requires an enterprise-grade SaaS platform for beauty and wellness businesses. The system must support multi-tenancy, real-time booking, payment processing, and scale to serve thousands of salons with millions of appointments.

## Decision
We will implement a microservices architecture using Domain-Driven Design (DDD) principles with the following key components:

### Architecture Style
- **Microservices Architecture**: Service boundaries aligned with business domains
- **Event-Driven Architecture**: Asynchronous communication between services
- **CQRS + Event Sourcing**: Separate read/write models with event store
- **API Gateway Pattern**: Centralized request routing and cross-cutting concerns

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript and Server Components
- **Backend**: Next.js API Routes with PostgreSQL
- **Database**: PostgreSQL (primary) with read replicas
- **Cache**: Redis for session and query caching
- **Events**: In-memory event bus with future message queue integration
- **Monitoring**: Custom observability framework
- **Deployment**: Vercel Edge Network

### Bounded Contexts
1. **Salon Management**: Salon profiles, branches, services, staff
2. **Booking & Scheduling**: Appointments, availability, calendar management
3. **Customer Relationship**: Customer profiles, preferences, loyalty
4. **Payment Processing**: Transactions, invoicing, refunds
5. **Inventory Management**: Product tracking, stock levels, reordering
6. **Analytics & Reporting**: Business metrics, insights, forecasting
7. **Communications**: Notifications, messaging, alerts

## Consequences

### Positive
- Clear separation of concerns along business boundaries
- Independent development and deployment of services
- Scalable architecture supporting high transaction volumes
- Event-driven design enables loose coupling
- Real-time capabilities through event streaming
- Multi-tenant architecture with data isolation

### Negative
- Increased complexity compared to monolithic architecture
- Need for distributed transaction management
- Network latency between service calls
- Operational overhead for monitoring multiple services
- Data consistency challenges across services

## Compliance
- **PostgreSQL Only**: Strictly using PostgreSQL for all data persistence
- **No Supabase**: Avoiding Supabase per project requirements
- **AWS Integration**: Using AWS services for infrastructure components