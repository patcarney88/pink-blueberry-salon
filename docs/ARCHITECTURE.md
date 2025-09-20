# Pink Blueberry Salon - Enterprise Architecture

## Executive Summary

Pink Blueberry Salon is an enterprise-grade SaaS platform for beauty and wellness businesses, built on Next.js 14, TypeScript, and deployed on Vercel's edge network. This document outlines the complete technical architecture, from system design to implementation strategies.

## 1. System Architecture

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile PWA]
        POS[POS Terminal]
    end

    subgraph "Edge Network - Vercel"
        CDN[Vercel CDN]
        EDGE[Edge Functions]
        MW[Middleware]
    end

    subgraph "API Gateway"
        GW[API Gateway]
        AUTH[Auth Service]
        RL[Rate Limiter]
    end

    subgraph "Application Services"
        BOOKING[Booking Service]
        SALON[Salon Service]
        PAYMENT[Payment Service]
        NOTIFY[Notification Service]
        ANALYTICS[Analytics Service]
        INVENTORY[Inventory Service]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[Object Storage]
        QUEUE[Message Queue]
    end

    subgraph "External Services"
        STRIPE[Stripe API]
        TWILIO[Twilio SMS]
        SENDGRID[SendGrid Email]
        MAPS[Google Maps]
    end

    WEB --> CDN
    MOBILE --> CDN
    POS --> CDN

    CDN --> EDGE
    EDGE --> MW
    MW --> GW

    GW --> AUTH
    GW --> RL

    GW --> BOOKING
    GW --> SALON
    GW --> PAYMENT
    GW --> NOTIFY
    GW --> ANALYTICS
    GW --> INVENTORY

    BOOKING --> PG
    BOOKING --> REDIS
    BOOKING --> QUEUE

    SALON --> PG
    PAYMENT --> STRIPE
    NOTIFY --> TWILIO
    NOTIFY --> SENDGRID
```

### 1.2 Microservices Architecture

#### Service Boundaries

```yaml
services:
  - name: Salon Service
    responsibilities:
      - Salon profile management
      - Multi-tenant configuration
      - Branch management
      - Service catalog
    bounded_context: Salon Management

  - name: Booking Service
    responsibilities:
      - Appointment scheduling
      - Real-time availability
      - Calendar management
      - Waitlist handling
    bounded_context: Booking & Scheduling

  - name: Customer Service
    responsibilities:
      - Customer profiles
      - Loyalty programs
      - Preferences
      - History tracking
    bounded_context: Customer Relationship

  - name: Staff Service
    responsibilities:
      - Staff profiles
      - Scheduling
      - Commissions
      - Performance tracking
    bounded_context: Human Resources

  - name: Inventory Service
    responsibilities:
      - Product tracking
      - Stock management
      - Reorder automation
      - Supplier management
    bounded_context: Inventory Management

  - name: Payment Service
    responsibilities:
      - Payment processing
      - Invoicing
      - Refunds
      - Financial reporting
    bounded_context: Financial Operations

  - name: Analytics Service
    responsibilities:
      - Business metrics
      - Reports generation
      - Insights
      - Forecasting
    bounded_context: Business Intelligence

  - name: Notification Service
    responsibilities:
      - Email notifications
      - SMS alerts
      - Push notifications
      - In-app messaging
    bounded_context: Communications
```

### 1.3 Event-Driven Architecture

```typescript
// Event Bus Implementation
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  payload: Record<string, any>;
  metadata: {
    userId?: string;
    tenantId: string;
    correlationId: string;
  };
}

// Core Events
enum EventTypes {
  // Booking Events
  BOOKING_CREATED = 'booking.created',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_COMPLETED = 'booking.completed',

  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_PROCESSED = 'payment.refunded',

  // Inventory Events
  INVENTORY_LOW = 'inventory.low',
  INVENTORY_RESTOCKED = 'inventory.restocked',
  PRODUCT_USED = 'inventory.product_used',

  // Customer Events
  CUSTOMER_REGISTERED = 'customer.registered',
  LOYALTY_POINTS_EARNED = 'customer.loyalty.earned',
  LOYALTY_REWARD_CLAIMED = 'customer.loyalty.claimed',

  // Staff Events
  STAFF_SCHEDULED = 'staff.scheduled',
  STAFF_CHECKED_IN = 'staff.checked_in',
  COMMISSION_CALCULATED = 'staff.commission.calculated'
}
```

### 1.4 API Gateway Pattern

```typescript
// API Gateway Configuration
export const apiGatewayConfig = {
  routes: [
    {
      path: '/api/bookings/*',
      service: 'booking-service',
      rateLimit: { requests: 100, window: '1m' },
      auth: ['customer', 'staff', 'admin'],
      cache: { ttl: 60, vary: ['Authorization', 'X-Tenant-ID'] }
    },
    {
      path: '/api/payments/*',
      service: 'payment-service',
      rateLimit: { requests: 50, window: '1m' },
      auth: ['customer', 'staff', 'admin'],
      encryption: 'required',
      audit: true
    },
    {
      path: '/api/analytics/*',
      service: 'analytics-service',
      rateLimit: { requests: 30, window: '1m' },
      auth: ['staff', 'admin'],
      cache: { ttl: 300, vary: ['X-Tenant-ID'] }
    }
  ],
  middleware: [
    'authentication',
    'tenant-resolution',
    'rate-limiting',
    'request-validation',
    'response-transformation',
    'error-handling',
    'logging'
  ]
};
```

## 2. Domain Model

### 2.1 Entity Relationship Diagram

```mermaid
erDiagram
    TENANT ||--o{ SALON : has
    SALON ||--o{ BRANCH : has
    BRANCH ||--o{ STAFF : employs
    BRANCH ||--o{ SERVICE : offers
    BRANCH ||--o{ RESOURCE : has

    CUSTOMER ||--o{ BOOKING : makes
    BOOKING ||--|| BRANCH : at
    BOOKING ||--o{ BOOKING_SERVICE : includes
    BOOKING_SERVICE }o--|| SERVICE : references
    BOOKING_SERVICE }o--|| STAFF : assigned_to

    BOOKING ||--o| PAYMENT : has
    PAYMENT ||--o{ PAYMENT_ITEM : contains

    CUSTOMER ||--o{ LOYALTY_ACCOUNT : has
    LOYALTY_ACCOUNT ||--o{ POINT_TRANSACTION : records
    LOYALTY_ACCOUNT ||--o{ REWARD_REDEMPTION : tracks

    BRANCH ||--o{ INVENTORY : maintains
    INVENTORY ||--o{ STOCK_MOVEMENT : tracks
    INVENTORY }o--|| PRODUCT : of

    STAFF ||--o{ SCHEDULE : has
    STAFF ||--o{ COMMISSION : earns

    SERVICE ||--o{ SERVICE_PRODUCT : uses
    SERVICE_PRODUCT }o--|| PRODUCT : requires
```

### 2.2 Domain Aggregates

```typescript
// Core Domain Aggregates

// Salon Aggregate
interface SalonAggregate {
  tenant: Tenant;
  salon: Salon;
  branches: Branch[];
  services: Service[];
  settings: SalonSettings;

  // Business Rules
  canAddBranch(): boolean;
  isWithinOperatingHours(date: Date): boolean;
  getAvailableServices(branchId: string): Service[];
}

// Booking Aggregate
interface BookingAggregate {
  booking: Booking;
  services: BookingService[];
  customer: Customer;
  payments: Payment[];

  // Business Rules
  canReschedule(): boolean;
  canCancel(): boolean;
  calculateTotalPrice(): Money;
  applyDiscounts(discounts: Discount[]): void;
}

// Staff Aggregate
interface StaffAggregate {
  staff: Staff;
  schedule: Schedule[];
  commissions: Commission[];
  performance: PerformanceMetrics;

  // Business Rules
  isAvailable(date: Date, duration: number): boolean;
  calculateCommission(booking: Booking): Money;
  canPerformService(service: Service): boolean;
}

// Inventory Aggregate
interface InventoryAggregate {
  product: Product;
  stock: StockLevel;
  movements: StockMovement[];
  reorderRules: ReorderRule;

  // Business Rules
  needsReorder(): boolean;
  canFulfillOrder(quantity: number): boolean;
  calculateReorderQuantity(): number;
}
```

### 2.3 Event Sourcing Strategy

```typescript
// Event Store Implementation
interface EventStore {
  append(streamId: string, events: DomainEvent[]): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null>;
  saveSnapshot(snapshot: AggregateSnapshot): Promise<void>;
}

// Aggregate Event Sourcing
abstract class EventSourcedAggregate {
  protected id: string;
  protected version: number = 0;
  protected uncommittedEvents: DomainEvent[] = [];

  protected apply(event: DomainEvent): void {
    this.playEvent(event);
    this.uncommittedEvents.push(event);
    this.version++;
  }

  protected abstract playEvent(event: DomainEvent): void;

  public getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  public loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => {
      this.playEvent(event);
      this.version++;
    });
  }
}

// Example: Booking Aggregate with Event Sourcing
class BookingAggregate extends EventSourcedAggregate {
  private status: BookingStatus;
  private services: BookingService[] = [];
  private totalAmount: Money;

  public static create(command: CreateBookingCommand): BookingAggregate {
    const aggregate = new BookingAggregate();
    aggregate.apply({
      id: generateId(),
      type: EventTypes.BOOKING_CREATED,
      aggregateId: command.bookingId,
      timestamp: new Date(),
      payload: {
        customerId: command.customerId,
        branchId: command.branchId,
        services: command.services,
        scheduledAt: command.scheduledAt
      },
      metadata: {
        userId: command.userId,
        tenantId: command.tenantId,
        correlationId: command.correlationId
      }
    });
    return aggregate;
  }

  protected playEvent(event: DomainEvent): void {
    switch (event.type) {
      case EventTypes.BOOKING_CREATED:
        this.id = event.aggregateId;
        this.status = BookingStatus.PENDING;
        this.services = event.payload.services;
        break;
      case EventTypes.BOOKING_CONFIRMED:
        this.status = BookingStatus.CONFIRMED;
        break;
      case EventTypes.BOOKING_CANCELLED:
        this.status = BookingStatus.CANCELLED;
        break;
    }
  }
}
```

### 2.4 CQRS Implementation

```typescript
// Command Side
interface CommandHandler<TCommand, TResult> {
  handle(command: TCommand): Promise<TResult>;
}

class CreateBookingCommandHandler implements CommandHandler<CreateBookingCommand, string> {
  constructor(
    private eventStore: EventStore,
    private eventBus: EventBus
  ) {}

  async handle(command: CreateBookingCommand): Promise<string> {
    // Validate command
    await this.validate(command);

    // Create aggregate
    const aggregate = BookingAggregate.create(command);

    // Get uncommitted events
    const events = aggregate.getUncommittedEvents();

    // Store events
    await this.eventStore.append(aggregate.id, events);

    // Publish events
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return aggregate.id;
  }

  private async validate(command: CreateBookingCommand): Promise<void> {
    // Business validation logic
  }
}

// Query Side
interface QueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

class GetAvailableSlotsQueryHandler implements QueryHandler<GetAvailableSlotsQuery, TimeSlot[]> {
  constructor(private readModel: BookingReadModel) {}

  async handle(query: GetAvailableSlotsQuery): Promise<TimeSlot[]> {
    return this.readModel.getAvailableSlots(
      query.branchId,
      query.serviceId,
      query.date,
      query.staffId
    );
  }
}

// Read Model Projection
class BookingReadModelProjection {
  constructor(
    private db: Database,
    private cache: Cache
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    switch (event.type) {
      case EventTypes.BOOKING_CREATED:
        await this.handleBookingCreated(event);
        break;
      case EventTypes.BOOKING_CONFIRMED:
        await this.handleBookingConfirmed(event);
        break;
    }

    // Invalidate cache
    await this.cache.invalidate(`bookings:${event.metadata.tenantId}`);
  }

  private async handleBookingCreated(event: DomainEvent): Promise<void> {
    await this.db.bookingReadModel.create({
      id: event.aggregateId,
      customerId: event.payload.customerId,
      branchId: event.payload.branchId,
      status: 'pending',
      scheduledAt: event.payload.scheduledAt,
      createdAt: event.timestamp
    });
  }
}
```

## 3. Technical Architecture

### 3.1 Frontend Architecture (Next.js 14 App Router)

```typescript
// App Directory Structure
src/
  app/
    (auth)/
      login/
      register/
      forgot-password/
    (dashboard)/
      layout.tsx          # Dashboard layout with sidebar
      dashboard/
        page.tsx         # Main dashboard
        analytics/
        reports/
    (booking)/
      book/
        [salonId]/
          page.tsx       # Service selection
          [serviceId]/
            page.tsx     # Time slot selection
            confirm/
              page.tsx   # Booking confirmation
    (admin)/
      admin/
        salons/
        staff/
        inventory/
        settings/
    api/                 # API routes
      auth/
      bookings/
      payments/
      webhooks/
    components/
      ui/                # Reusable UI components
      features/          # Feature-specific components
      layouts/           # Layout components
    hooks/               # Custom React hooks
    lib/                 # Utility functions
    stores/              # Zustand stores
    types/               # TypeScript types

// Server Components Pattern
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { DashboardMetrics } from '@/components/features/dashboard/metrics';
import { RecentBookings } from '@/components/features/dashboard/recent-bookings';
import { LoadingDashboard } from '@/components/features/dashboard/loading';

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Suspense fallback={<LoadingDashboard type="metrics" />}>
        <DashboardMetrics />
      </Suspense>

      <Suspense fallback={<LoadingDashboard type="bookings" />}>
        <RecentBookings />
      </Suspense>
    </div>
  );
}

// Parallel Data Fetching
// components/features/dashboard/metrics.tsx
import { getMetrics } from '@/lib/api/metrics';
import { MetricCard } from '@/components/ui/metric-card';

export async function DashboardMetrics() {
  const metrics = await getMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        title="Today's Revenue"
        value={metrics.todayRevenue}
        change={metrics.revenueChange}
      />
      <MetricCard
        title="Bookings"
        value={metrics.bookingsCount}
        change={metrics.bookingsChange}
      />
      <MetricCard
        title="New Customers"
        value={metrics.newCustomers}
        change={metrics.customersChange}
      />
      <MetricCard
        title="Utilization Rate"
        value={metrics.utilizationRate}
        change={metrics.utilizationChange}
      />
    </div>
  );
}
```

### 3.2 State Management

```typescript
// Zustand Store with TypeScript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface BookingState {
  selectedSalon: Salon | null;
  selectedServices: Service[];
  selectedStaff: Staff | null;
  selectedDateTime: Date | null;
  customerInfo: CustomerInfo | null;

  // Actions
  selectSalon: (salon: Salon) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  selectStaff: (staff: Staff) => void;
  selectDateTime: (dateTime: Date) => void;
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void;
  resetBooking: () => void;

  // Computed
  getTotalPrice: () => number;
  getTotalDuration: () => number;
}

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        selectedSalon: null,
        selectedServices: [],
        selectedStaff: null,
        selectedDateTime: null,
        customerInfo: null,

        selectSalon: (salon) => set((state) => {
          state.selectedSalon = salon;
          state.selectedServices = [];
          state.selectedStaff = null;
        }),

        addService: (service) => set((state) => {
          if (!state.selectedServices.find(s => s.id === service.id)) {
            state.selectedServices.push(service);
          }
        }),

        removeService: (serviceId) => set((state) => {
          state.selectedServices = state.selectedServices.filter(
            s => s.id !== serviceId
          );
        }),

        selectStaff: (staff) => set((state) => {
          state.selectedStaff = staff;
        }),

        selectDateTime: (dateTime) => set((state) => {
          state.selectedDateTime = dateTime;
        }),

        updateCustomerInfo: (info) => set((state) => {
          state.customerInfo = { ...state.customerInfo, ...info };
        }),

        resetBooking: () => set((state) => {
          state.selectedSalon = null;
          state.selectedServices = [];
          state.selectedStaff = null;
          state.selectedDateTime = null;
          state.customerInfo = null;
        }),

        getTotalPrice: () => {
          const state = get();
          return state.selectedServices.reduce(
            (total, service) => total + service.price,
            0
          );
        },

        getTotalDuration: () => {
          const state = get();
          return state.selectedServices.reduce(
            (total, service) => total + service.duration,
            0
          );
        }
      })),
      {
        name: 'booking-storage',
        partialize: (state) => ({
          selectedSalon: state.selectedSalon,
          selectedServices: state.selectedServices
        })
      }
    )
  )
);
```

### 3.3 API Routes (Next.js 14)

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';
import { createBooking, getBookings } from '@/lib/services/booking';
import { rateLimit } from '@/lib/rate-limit';
import { withTenant } from '@/lib/middleware/tenant';

const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  services: z.array(z.object({
    id: z.string().uuid(),
    staffId: z.string().uuid().optional()
  })),
  scheduledAt: z.string().datetime(),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string()
  }),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Authentication
    const session = await authenticate(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Tenant resolution
    const tenant = await withTenant(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Create booking
    const booking = await createBooking({
      ...validatedData,
      customerId: session.userId,
      tenantId: tenant.id
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await authenticate(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Get bookings
    const bookings = await getBookings({
      customerId: session.userId,
      page,
      limit,
      status
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.4 Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol", "fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Multi-tenancy
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        Plan     @default(BASIC)
  status      TenantStatus @default(ACTIVE)
  settings    Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  salons      Salon[]
  users       User[]

  @@index([slug])
  @@index([status])
}

model Salon {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  logo        String?
  settings    Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  branches    Branch[]
  services    Service[]

  @@index([tenantId])
}

model Branch {
  id          String   @id @default(cuid())
  salonId     String
  name        String
  address     String
  city        String
  state       String
  zipCode     String
  country     String
  phone       String
  email       String
  timezone    String
  coordinates Json     // { lat: number, lng: number }
  operatingHours Json  // { [day: string]: { open: string, close: string } }
  settings    Json
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  salon       Salon    @relation(fields: [salonId], references: [id])
  staff       Staff[]
  bookings    Booking[]
  inventory   Inventory[]
  resources   Resource[]

  @@index([salonId])
  @@index([isActive])
}

model Service {
  id          String   @id @default(cuid())
  salonId     String
  name        String
  description String?
  category    String
  duration    Int      // in minutes
  price       Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  isActive    Boolean  @default(true)
  requiresDeposit Boolean @default(false)
  depositAmount Decimal? @db.Decimal(10, 2)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  salon       Salon    @relation(fields: [salonId], references: [id])
  bookingServices BookingService[]
  serviceProducts ServiceProduct[]
  staffServices StaffService[]

  @@index([salonId, isActive])
  @@index([category])
}

model Staff {
  id          String   @id @default(cuid())
  branchId    String
  userId      String?
  name        String
  email       String   @unique
  phone       String
  role        StaffRole
  specialties String[]
  commissionRate Decimal @db.Decimal(5, 2)
  isActive    Boolean  @default(true)
  avatar      String?
  bio         String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  branch      Branch   @relation(fields: [branchId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
  schedules   Schedule[]
  bookingServices BookingService[]
  commissions Commission[]
  staffServices StaffService[]

  @@index([branchId, isActive])
  @@index([email])
}

model Customer {
  id          String   @id @default(cuid())
  userId      String?
  email       String   @unique
  name        String
  phone       String
  dateOfBirth DateTime?
  gender      Gender?
  address     String?
  city        String?
  state       String?
  zipCode     String?
  country     String?
  preferences Json?
  notes       String?
  tags        String[]
  isVip       Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User?    @relation(fields: [userId], references: [id])
  bookings    Booking[]
  loyaltyAccount LoyaltyAccount?
  reviews     Review[]

  @@index([email])
  @@index([phone])
}

model Booking {
  id          String   @id @default(cuid())
  branchId    String
  customerId  String
  status      BookingStatus
  scheduledAt DateTime
  duration    Int      // Total duration in minutes
  totalAmount Decimal  @db.Decimal(10, 2)
  depositPaid Decimal  @db.Decimal(10, 2) @default(0)
  currency    String   @default("USD")
  notes       String?
  source      BookingSource @default(WEB)
  metadata    Json?
  confirmedAt DateTime?
  completedAt DateTime?
  cancelledAt DateTime?
  cancellationReason String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  branch      Branch   @relation(fields: [branchId], references: [id])
  customer    Customer @relation(fields: [customerId], references: [id])
  services    BookingService[]
  payment     Payment?
  review      Review?

  @@index([branchId, status])
  @@index([customerId])
  @@index([scheduledAt])
  @@index([status])
}

model BookingService {
  id          String   @id @default(cuid())
  bookingId   String
  serviceId   String
  staffId     String?
  startTime   DateTime
  duration    Int      // in minutes
  price       Decimal  @db.Decimal(10, 2)
  discount    Decimal  @db.Decimal(10, 2) @default(0)
  status      ServiceStatus @default(PENDING)

  booking     Booking  @relation(fields: [bookingId], references: [id])
  service     Service  @relation(fields: [serviceId], references: [id])
  staff       Staff?   @relation(fields: [staffId], references: [id])

  @@index([bookingId])
  @@index([staffId, startTime])
}

model Payment {
  id          String   @id @default(cuid())
  bookingId   String   @unique
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  method      PaymentMethod
  status      PaymentStatus
  stripePaymentId String?
  stripeChargeId String?
  refundAmount Decimal? @db.Decimal(10, 2)
  refundedAt  DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  booking     Booking  @relation(fields: [bookingId], references: [id])

  @@index([status])
  @@index([stripePaymentId])
}

model LoyaltyAccount {
  id          String   @id @default(cuid())
  customerId  String   @unique
  points      Int      @default(0)
  tier        LoyaltyTier @default(BRONZE)
  totalEarned Int      @default(0)
  totalSpent  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  customer    Customer @relation(fields: [customerId], references: [id])
  transactions PointTransaction[]
  redemptions RewardRedemption[]

  @@index([tier])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  brand       String
  category    String
  sku         String   @unique
  barcode     String?
  unit        String
  cost        Decimal  @db.Decimal(10, 2)
  retailPrice Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventory   Inventory[]
  serviceProducts ServiceProduct[]

  @@index([sku])
  @@index([category])
}

model Inventory {
  id          String   @id @default(cuid())
  branchId    String
  productId   String
  quantity    Int
  minQuantity Int
  maxQuantity Int
  reorderPoint Int
  location    String?
  lastRestocked DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  branch      Branch   @relation(fields: [branchId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
  movements   StockMovement[]

  @@unique([branchId, productId])
  @@index([branchId])
  @@index([quantity])
}

// Enums
enum Plan {
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum StaffRole {
  ADMIN
  MANAGER
  STYLIST
  RECEPTIONIST
  ASSISTANT
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum BookingSource {
  WEB
  MOBILE
  PHONE
  WALK_IN
  ADMIN
}

enum ServiceStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentMethod {
  CARD
  CASH
  BANK_TRANSFER
  WALLET
  GIFT_CARD
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

### 3.5 Caching Strategy

```typescript
// Multi-layer Caching Architecture
import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

class CacheManager {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;
  private readonly TTL_SHORT = 60; // 1 minute
  private readonly TTL_MEDIUM = 300; // 5 minutes
  private readonly TTL_LONG = 3600; // 1 hour

  constructor() {
    // Redis for distributed cache
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    // In-memory cache for hot data
    this.memoryCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60, // 1 minute default
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
  }

  // Cache key patterns
  private getCacheKey(namespace: string, id: string, tenantId?: string): string {
    if (tenantId) {
      return `${tenantId}:${namespace}:${id}`;
    }
    return `${namespace}:${id}`;
  }

  // Multi-layer get
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult !== undefined) {
      return memoryResult;
    }

    // Check Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      // Populate memory cache
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  // Multi-layer set
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in both caches
    this.memoryCache.set(key, value, { ttl: (ttl || this.TTL_MEDIUM) * 1000 });

    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.setex(key, this.TTL_MEDIUM, serialized);
    }
  }

  // Invalidation
  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from Redis
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache-aside pattern implementation
  async cacheable<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await factory();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  // Specific cache strategies
  async cacheBookingSlots(
    branchId: string,
    date: string,
    serviceId?: string
  ): Promise<TimeSlot[]> {
    const key = this.getCacheKey('slots', `${branchId}:${date}:${serviceId || 'all'}`);

    return this.cacheable(
      key,
      async () => {
        // Fetch available slots from database
        return await this.fetchAvailableSlots(branchId, date, serviceId);
      },
      this.TTL_SHORT // Short TTL for real-time availability
    );
  }

  async cacheSalonServices(salonId: string, tenantId: string): Promise<Service[]> {
    const key = this.getCacheKey('services', salonId, tenantId);

    return this.cacheable(
      key,
      async () => {
        // Fetch services from database
        return await this.fetchSalonServices(salonId);
      },
      this.TTL_LONG // Long TTL for relatively static data
    );
  }
}

// Edge caching with Vercel
export const config = {
  runtime: 'edge',
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const salonId = url.searchParams.get('salonId');

  // Use Vercel Edge Cache
  return new Response(
    JSON.stringify(await fetchSalonData(salonId)),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes, revalidate in background
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        // Vary cache by these headers
        'Vary': 'Authorization, X-Tenant-ID'
      }
    }
  );
}
```

## 4. Key Features Architecture

### 4.1 Real-time Booking System

```typescript
// WebSocket implementation for real-time updates
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

class RealtimeBookingService {
  private io: Server;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true
      }
    });

    // Redis adapter for scaling
    this.pubClient = new Redis(process.env.REDIS_URL);
    this.subClient = this.pubClient.duplicate();
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Join tenant room
      socket.on('join:tenant', (tenantId: string) => {
        socket.join(`tenant:${tenantId}`);
      });

      // Join branch room for staff
      socket.on('join:branch', (branchId: string) => {
        socket.join(`branch:${branchId}`);
      });

      // Subscribe to booking updates
      socket.on('subscribe:bookings', (filters: any) => {
        socket.join(`bookings:${filters.date}:${filters.branchId}`);
      });
    });
  }

  // Emit booking created event
  async notifyBookingCreated(booking: Booking) {
    // Notify branch staff
    this.io.to(`branch:${booking.branchId}`).emit('booking:created', {
      booking,
      timestamp: new Date()
    });

    // Update availability for subscribers
    this.io.to(`bookings:${booking.date}:${booking.branchId}`).emit('availability:updated', {
      date: booking.date,
      slots: await this.getUpdatedSlots(booking.branchId, booking.date)
    });
  }

  // Emit slot availability changes
  async notifyAvailabilityChange(branchId: string, date: string) {
    const room = `bookings:${date}:${branchId}`;
    const slots = await this.getUpdatedSlots(branchId, date);

    this.io.to(room).emit('availability:updated', {
      date,
      slots,
      timestamp: new Date()
    });
  }
}

// Client-side real-time hook
export function useRealtimeBookings(branchId: string, date: string) {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token: getAuthToken()
      }
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe:bookings', { branchId, date });
    });

    socket.on('availability:updated', (data) => {
      if (data.date === date) {
        setAvailability(data.slots);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [branchId, date]);

  return { availability, isConnected };
}
```

### 4.2 Payment Processing (Stripe)

```typescript
// Payment service with Stripe integration
import Stripe from 'stripe';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  // Create payment intent for booking
  async createPaymentIntent(
    booking: Booking,
    customerId?: string
  ): Promise<Stripe.PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: booking.currency.toLowerCase(),
      customer: customerId,
      metadata: {
        bookingId: booking.id,
        tenantId: booking.tenantId,
        branchId: booking.branchId
      },
      automatic_payment_methods: {
        enabled: true
      },
      capture_method: 'automatic'
    });

    // Store payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentId: intent.id
      }
    });

    return intent;
  }

  // Handle webhook events
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
    }
  }

  private async handlePaymentSuccess(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata.bookingId;

    // Update payment status
    await prisma.payment.update({
      where: { stripePaymentId: intent.id },
      data: {
        status: PaymentStatus.COMPLETED,
        stripeChargeId: intent.latest_charge as string
      }
    });

    // Confirm booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date()
      }
    });

    // Send confirmation email
    await this.notificationService.sendBookingConfirmation(bookingId);
  }

  // Process refund
  async processRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment || !payment.stripeChargeId) {
      throw new Error('Payment not found or not completed');
    }

    const refund = await this.stripe.refunds.create({
      charge: payment.stripeChargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: 'requested_by_customer',
      metadata: {
        paymentId: payment.id,
        reason: reason || 'Customer requested'
      }
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: amount && amount < payment.amount
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED,
        refundAmount: amount || payment.amount,
        refundedAt: new Date()
      }
    });

    return refund;
  }
}
```

### 4.3 Analytics Dashboard

```typescript
// Analytics service with aggregation pipelines
class AnalyticsService {
  // Revenue analytics
  async getRevenueMetrics(
    tenantId: string,
    branchId?: string,
    dateRange: DateRange
  ): Promise<RevenueMetrics> {
    const where = {
      branch: { salon: { tenantId } },
      ...(branchId && { branchId }),
      status: BookingStatus.COMPLETED,
      completedAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    };

    const [current, previous, byDay] = await Promise.all([
      // Current period revenue
      prisma.booking.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
        _avg: { totalAmount: true }
      }),

      // Previous period for comparison
      prisma.booking.aggregate({
        where: {
          ...where,
          completedAt: {
            gte: this.getPreviousPeriod(dateRange).start,
            lte: this.getPreviousPeriod(dateRange).end
          }
        },
        _sum: { totalAmount: true }
      }),

      // Daily breakdown
      prisma.$queryRaw<DailyRevenue[]>`
        SELECT
          DATE(completed_at) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as bookings
        FROM bookings b
        JOIN branches br ON b.branch_id = br.id
        JOIN salons s ON br.salon_id = s.id
        WHERE
          s.tenant_id = ${tenantId}
          ${branchId ? Prisma.sql`AND b.branch_id = ${branchId}` : Prisma.empty}
          AND b.status = 'COMPLETED'
          AND b.completed_at BETWEEN ${dateRange.start} AND ${dateRange.end}
        GROUP BY DATE(completed_at)
        ORDER BY date
      `
    ]);

    return {
      total: current._sum.totalAmount || 0,
      count: current._count,
      average: current._avg.totalAmount || 0,
      growth: this.calculateGrowth(
        current._sum.totalAmount || 0,
        previous._sum.totalAmount || 0
      ),
      daily: byDay
    };
  }

  // Customer analytics
  async getCustomerMetrics(
    tenantId: string,
    dateRange: DateRange
  ): Promise<CustomerMetrics> {
    const [newCustomers, returningRate, topCustomers] = await Promise.all([
      // New customers
      prisma.customer.count({
        where: {
          bookings: {
            some: {
              branch: { salon: { tenantId } }
            }
          },
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),

      // Returning customer rate
      prisma.$queryRaw<{ rate: number }[]>`
        WITH customer_bookings AS (
          SELECT
            c.id,
            COUNT(DISTINCT DATE_TRUNC('month', b.created_at)) as booking_months
          FROM customers c
          JOIN bookings b ON c.id = b.customer_id
          JOIN branches br ON b.branch_id = br.id
          JOIN salons s ON br.salon_id = s.id
          WHERE
            s.tenant_id = ${tenantId}
            AND b.status = 'COMPLETED'
            AND b.created_at BETWEEN ${dateRange.start} AND ${dateRange.end}
          GROUP BY c.id
        )
        SELECT
          AVG(CASE WHEN booking_months > 1 THEN 1 ELSE 0 END) * 100 as rate
        FROM customer_bookings
      `,

      // Top customers by revenue
      prisma.$queryRaw<TopCustomer[]>`
        SELECT
          c.id,
          c.name,
          c.email,
          COUNT(b.id) as booking_count,
          SUM(b.total_amount) as total_spent,
          MAX(b.created_at) as last_visit
        FROM customers c
        JOIN bookings b ON c.id = b.customer_id
        JOIN branches br ON b.branch_id = br.id
        JOIN salons s ON br.salon_id = s.id
        WHERE
          s.tenant_id = ${tenantId}
          AND b.status = 'COMPLETED'
          AND b.completed_at BETWEEN ${dateRange.start} AND ${dateRange.end}
        GROUP BY c.id, c.name, c.email
        ORDER BY total_spent DESC
        LIMIT 10
      `
    ]);

    return {
      newCustomers,
      returningRate: returningRate[0]?.rate || 0,
      topCustomers
    };
  }

  // Service performance
  async getServicePerformance(
    tenantId: string,
    dateRange: DateRange
  ): Promise<ServicePerformance[]> {
    return prisma.$queryRaw`
      SELECT
        s.id,
        s.name,
        s.category,
        COUNT(bs.id) as bookings,
        SUM(bs.price - bs.discount) as revenue,
        AVG(bs.price - bs.discount) as avg_price,
        AVG(r.rating) as avg_rating,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bs.duration) as median_duration
      FROM services s
      LEFT JOIN booking_services bs ON s.id = bs.service_id
      LEFT JOIN bookings b ON bs.booking_id = b.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      JOIN salons sal ON s.salon_id = sal.id
      WHERE
        sal.tenant_id = ${tenantId}
        AND b.completed_at BETWEEN ${dateRange.start} AND ${dateRange.end}
      GROUP BY s.id, s.name, s.category
      ORDER BY revenue DESC
    `;
  }
}
```

## 5. Infrastructure

### 5.1 Vercel Deployment Configuration

```typescript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["iad1", "sfo1", "sin1"],
  "functions": {
    "app/api/bookings/availability/route.ts": {
      "maxDuration": 10,
      "memory": 1024
    },
    "app/api/payments/webhook/route.ts": {
      "maxDuration": 30,
      "memory": 512
    },
    "app/api/reports/generate/route.ts": {
      "maxDuration": 60,
      "memory": 3008
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-reports",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/inventory-check",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/reminder-notifications",
      "schedule": "*/15 * * * *"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "REDIS_URL": "@redis-url",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
    dynamicIO: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/pink-blueberry/**'
      },
      {
        protocol: 'https',
        hostname: '*.stripe.com'
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/socket/:path*',
        destination: process.env.SOCKET_SERVER_URL + '/:path*'
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
```

### 5.2 CDN & Edge Computing

```typescript
// Edge Middleware for request routing
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Geolocation-based routing
  const country = request.geo?.country || 'US';
  const city = request.geo?.city || 'Unknown';

  // Set geo headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-geo-country', country);
  requestHeaders.set('x-geo-city', city);

  // Multi-tenant resolution
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    requestHeaders.set('x-tenant-slug', subdomain);
  }

  // Authentication check for protected routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifyToken(token);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `rate-limit:${ip}:${pathname}`;

  // Check rate limit (implement with Redis/Upstash)
  const isRateLimited = await checkRateLimit(rateLimitKey);
  if (isRateLimited) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 5.3 Database Scaling Strategy

```typescript
// Database connection with read replicas
import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private writeDb: PrismaClient;
  private readDbs: PrismaClient[];
  private currentReadIndex: number = 0;

  constructor() {
    // Write database (primary)
    this.writeDb = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: ['error', 'warn']
    });

    // Read replicas
    const readReplicaUrls = process.env.READ_REPLICA_URLS?.split(',') || [];
    this.readDbs = readReplicaUrls.map(url =>
      new PrismaClient({
        datasources: {
          db: { url }
        },
        log: ['error']
      })
    );

    // Fallback to write DB if no read replicas
    if (this.readDbs.length === 0) {
      this.readDbs = [this.writeDb];
    }
  }

  // Get write connection
  get write(): PrismaClient {
    return this.writeDb;
  }

  // Get read connection (round-robin)
  get read(): PrismaClient {
    const db = this.readDbs[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readDbs.length;
    return db;
  }

  // Connection pooling configuration
  async optimizeConnections() {
    const poolConfig = {
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    };

    // Apply to all connections
    [this.writeDb, ...this.readDbs].forEach(db => {
      // Prisma handles pooling internally, but we can set via URL params
      // postgresql://user:pass@host:5432/db?pool_timeout=30&connection_limit=10
    });
  }

  // Sharding strategy for multi-tenant data
  getTenantShard(tenantId: string): string {
    // Simple hash-based sharding
    const hash = this.hashCode(tenantId);
    const shardCount = parseInt(process.env.SHARD_COUNT || '1');
    const shardIndex = Math.abs(hash) % shardCount;
    return `shard_${shardIndex}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

// Usage
const db = new DatabaseManager();

// Write operations
await db.write.booking.create({ data: bookingData });

// Read operations
const bookings = await db.read.booking.findMany({ where: criteria });
```

### 5.4 Monitoring & Observability

```typescript
// Monitoring setup with OpenTelemetry
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize telemetry
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'pink-blueberry-salon',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Custom metrics
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('pink-blueberry-salon');

// Business metrics
const bookingCounter = meter.createCounter('bookings.created', {
  description: 'Number of bookings created',
  unit: 'bookings',
});

const revenueHistogram = meter.createHistogram('revenue.amount', {
  description: 'Revenue amount distribution',
  unit: 'USD',
});

const activeUsersGauge = meter.createObservableGauge('users.active', {
  description: 'Number of active users',
});

// Performance monitoring
class PerformanceMonitor {
  private timings: Map<string, number> = new Map();

  startTimer(operation: string): void {
    this.timings.set(operation, Date.now());
  }

  endTimer(operation: string, metadata?: Record<string, any>): void {
    const start = this.timings.get(operation);
    if (!start) return;

    const duration = Date.now() - start;
    this.timings.delete(operation);

    // Log to monitoring service
    meter.createHistogram(`operation.duration.${operation}`).record(duration, metadata);

    // Alert on slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
      // Send alert to monitoring service
    }
  }

  recordError(error: Error, context?: Record<string, any>): void {
    meter.createCounter('errors.total').add(1, {
      error_type: error.constructor.name,
      error_message: error.message,
      ...context
    });

    // Log to error tracking service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context });
    }
  }
}

// Health check endpoint
export async function GET(request: Request) {
  const health = await performHealthCheck();

  return NextResponse.json({
    status: health.status,
    timestamp: new Date().toISOString(),
    checks: {
      database: health.database,
      redis: health.redis,
      stripe: health.stripe,
      storage: health.storage
    }
  }, {
    status: health.status === 'healthy' ? 200 : 503
  });
}

async function performHealthCheck() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkStorage()
  ]);

  const results = {
    database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    stripe: checks[2].status === 'fulfilled' ? 'healthy' : 'degraded',
    storage: checks[3].status === 'fulfilled' ? 'healthy' : 'degraded'
  };

  const status = Object.values(results).every(s => s === 'healthy')
    ? 'healthy'
    : Object.values(results).some(s => s === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  return { status, ...results };
}
```

## 6. Security Architecture

### 6.1 Authentication & Authorization (NextAuth)

```typescript
// auth.config.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenant: true,
            staff: true
          }
        });

        if (!user || !user.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          staffId: user.staff?.id
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.staffId = user.staffId;
      }

      // Refresh token rotation
      if (account && account.type === 'oauth') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at;
      }

      // Check if access token needs refresh
      if (Date.now() > (token.accessTokenExpires as number)) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.staffId = token.staffId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  }
};

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);

// Role-based access control
export class RBAC {
  private static permissions = {
    admin: ['*'],
    manager: [
      'salon:read',
      'salon:update',
      'booking:*',
      'staff:*',
      'inventory:*',
      'reports:*'
    ],
    staff: [
      'salon:read',
      'booking:read',
      'booking:create',
      'booking:update',
      'customer:read',
      'customer:create'
    ],
    customer: [
      'booking:create',
      'booking:read:own',
      'booking:update:own',
      'booking:delete:own',
      'profile:read:own',
      'profile:update:own'
    ]
  };

  static hasPermission(
    userRole: string,
    resource: string,
    action: string,
    ownership?: boolean
  ): boolean {
    const permission = `${resource}:${action}${ownership ? ':own' : ''}`;
    const rolePermissions = this.permissions[userRole] || [];

    return rolePermissions.includes('*') ||
           rolePermissions.includes(`${resource}:*`) ||
           rolePermissions.includes(permission);
  }

  static authorize(
    requiredPermission: string,
    ownership?: boolean
  ) {
    return async (req: Request, { params }: any) => {
      const session = await auth();

      if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
      }

      const [resource, action] = requiredPermission.split(':');

      if (!this.hasPermission(session.user.role, resource, action, ownership)) {
        return new Response('Forbidden', { status: 403 });
      }

      return null; // Continue to route handler
    };
  }
}
```

### 6.2 Data Encryption

```typescript
// Encryption service
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyDerivationIterations = 100000;

  // Field-level encryption for sensitive data
  encrypt(text: string, masterKey: string): EncryptedData {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.keyDerivationIterations,
      32,
      'sha256'
    );

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData, masterKey: string): string {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.keyDerivationIterations,
      32,
      'sha256'
    );

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Tokenization for payment data
  tokenize(sensitiveData: string): string {
    const token = crypto.randomBytes(32).toString('hex');

    // Store mapping in secure vault (e.g., HashiCorp Vault)
    // await vault.store(token, sensitiveData);

    return token;
  }

  // Data masking for logs and display
  mask(data: string, type: 'email' | 'phone' | 'card'): string {
    switch (type) {
      case 'email':
        const [username, domain] = data.split('@');
        return `${username[0]}${'*'.repeat(username.length - 2)}${username.slice(-1)}@${domain}`;
      case 'phone':
        return `${'*'.repeat(data.length - 4)}${data.slice(-4)}`;
      case 'card':
        return `****-****-****-${data.slice(-4)}`;
      default:
        return '***';
    }
  }
}

// Encrypted model fields
interface EncryptedCustomer extends Customer {
  encryptedFields: {
    ssn?: EncryptedData;
    driverLicense?: EncryptedData;
    medicalInfo?: EncryptedData;
  };
}
```

### 6.3 API Security

```typescript
// API security middleware
import { createHash, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';

class APISecurityService {
  // Request signing for webhook validation
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = createHash('sha256')
      .update(`${secret}${payload}`)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // API key management
  async generateAPIKey(tenantId: string, name: string): Promise<APIKey> {
    const key = crypto.randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(key, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        name,
        key: hashedKey,
        lastUsedAt: null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    return {
      id: apiKey.id,
      key: `pb_${apiKey.id}_${key}`, // Prefixed for identification
      name: apiKey.name,
      createdAt: apiKey.createdAt
    };
  }

  // Rate limiting with sliding window
  async checkRateLimit(
    identifier: string,
    limit: number = 100,
    window: number = 60
  ): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (window * 1000);

    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in window
    const count = await redis.zcard(key);

    if (count >= limit) {
      return false;
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, window);

    return true;
  }

  // CORS configuration
  getCORSOptions(): CORSOptions {
    return {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Tenant-ID'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 86400
    };
  }

  // Input validation and sanitization
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential XSS vectors
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }
}
```

### 6.4 Compliance Implementation

```typescript
// GDPR & HIPAA Compliance
class ComplianceService {
  // Data retention policies
  async enforceDataRetention(): Promise<void> {
    const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years for financial data
    const cutoffDate = new Date(Date.now() - retentionPeriod);

    // Archive old bookings
    const oldBookings = await prisma.booking.findMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    for (const booking of oldBookings) {
      // Archive to cold storage
      await this.archiveToS3(booking);

      // Delete from hot database
      await prisma.booking.delete({
        where: { id: booking.id }
      });
    }
  }

  // GDPR data export
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, customer, bookings, reviews] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.customer.findFirst({ where: { userId } }),
      prisma.booking.findMany({ where: { customer: { userId } } }),
      prisma.review.findMany({ where: { customer: { userId } } })
    ]);

    return {
      personalData: {
        user: this.sanitizeUserData(user),
        customer: this.sanitizeCustomerData(customer)
      },
      activityData: {
        bookings: bookings.map(b => this.sanitizeBookingData(b)),
        reviews: reviews.map(r => this.sanitizeReviewData(r))
      },
      exportedAt: new Date(),
      format: 'json'
    };
  }

  // GDPR data deletion (right to be forgotten)
  async deleteUserData(userId: string): Promise<void> {
    // Soft delete with anonymization
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@example.com`,
          name: 'Deleted User',
          hashedPassword: null,
          deletedAt: new Date()
        }
      }),
      prisma.customer.updateMany({
        where: { userId },
        data: {
          email: `deleted-${userId}@example.com`,
          name: 'Deleted Customer',
          phone: '0000000000',
          dateOfBirth: null,
          address: null,
          notes: null
        }
      })
    ]);
  }

  // Audit logging for compliance
  async logAuditEvent(event: AuditEvent): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date()
      }
    });
  }

  // PCI DSS compliance for payment data
  async tokenizePaymentData(cardData: CardData): Promise<string> {
    // Never store card data directly
    // Use Stripe's tokenization
    const token = await stripe.tokens.create({
      card: {
        number: cardData.number,
        exp_month: cardData.expMonth,
        exp_year: cardData.expYear,
        cvc: cardData.cvc
      }
    });

    return token.id;
  }

  // HIPAA compliance for health information
  encryptHealthData(data: any): EncryptedData {
    const masterKey = process.env.HIPAA_MASTER_KEY!;
    return this.encryptionService.encrypt(JSON.stringify(data), masterKey);
  }
}
```

## Implementation Recommendations

### Phase 1: Foundation (Weeks 1-4)
1. Set up Next.js 14 project with TypeScript
2. Configure Vercel deployment pipeline
3. Set up PostgreSQL with Prisma
4. Implement authentication with NextAuth
5. Create base UI components library
6. Set up monitoring and error tracking

### Phase 2: Core Features (Weeks 5-12)
1. Implement multi-tenant architecture
2. Build salon and branch management
3. Create booking system with real-time availability
4. Integrate Stripe payment processing
5. Develop customer management and CRM
6. Implement staff scheduling system

### Phase 3: Advanced Features (Weeks 13-20)
1. Build analytics dashboard
2. Implement inventory management
3. Create loyalty program system
4. Add notification service (email/SMS)
5. Develop reporting engine
6. Implement review and rating system

### Phase 4: Optimization (Weeks 21-24)
1. Performance optimization and caching
2. Security hardening and compliance
3. A/B testing framework
4. Advanced analytics and ML insights
5. Mobile app development (PWA/React Native)
6. Integration with third-party services

### Key Success Metrics
- Page Load Time: <1s (p75)
- API Response Time: <200ms (p95)
- System Uptime: 99.9%
- Booking Conversion Rate: >40%
- Customer Retention: >60%
- Revenue Per User: Track monthly growth

### Technology Stack Summary
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Zustand
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Infrastructure**: Vercel, AWS S3, Redis, Cloudflare
- **Payments**: Stripe
- **Communications**: Twilio, SendGrid
- **Monitoring**: Datadog, Sentry, Google Analytics
- **Testing**: Jest, Playwright, React Testing Library

This architecture provides a scalable, secure, and performant foundation for the Pink Blueberry Salon platform while maintaining flexibility for future growth and feature additions.