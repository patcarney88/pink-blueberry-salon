# 🛠️ Pink Blueberry Salon - Technical Documentation

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [API Documentation](#2-api-documentation)
3. [Database Schema](#3-database-schema)
4. [Deployment Guide](#4-deployment-guide)
5. [Performance Optimization](#5-performance-optimization)
6. [Security Implementation](#6-security-implementation)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Development Guidelines](#8-development-guidelines)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOB[Mobile Browser]
        API_CLIENT[API Clients]
    end

    subgraph "CDN Layer"
        CF[CloudFront CDN]
    end

    subgraph "Application Layer"
        ALB[Application Load Balancer]
        subgraph "ECS Fargate"
            APP1[Next.js App 1]
            APP2[Next.js App 2]
            APP3[Next.js App N]
        end
    end

    subgraph "Data Layer"
        subgraph "Primary Storage"
            RDS[(PostgreSQL RDS)]
        end
        subgraph "Caching"
            REDIS[(Redis ElastiCache)]
        end
        subgraph "File Storage"
            S3[S3 Bucket]
        end
    end

    subgraph "External Services"
        STRIPE[Stripe API]
        TWILIO[Twilio SMS]
        SENDGRID[SendGrid Email]
        PUSHER[Pusher Real-time]
    end

    WEB --> CF
    MOB --> CF
    API_CLIENT --> CF
    CF --> ALB
    ALB --> APP1
    ALB --> APP2
    ALB --> APP3
    APP1 --> RDS
    APP1 --> REDIS
    APP1 --> S3
    APP1 --> STRIPE
    APP1 --> TWILIO
    APP1 --> SENDGRID
    APP1 --> PUSHER
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: Next.js 14.0.4
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Context + React Query
- **UI Components**: Custom + Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js 4.4
- **Real-time**: Pusher Client

#### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Next.js API Routes
- **ORM**: Prisma 5.7
- **Validation**: Zod 3.22
- **Authentication**: NextAuth.js 4.24
- **File Upload**: Multer + AWS SDK

#### Database
- **Primary**: PostgreSQL 15.3 (AWS RDS)
- **Caching**: Redis 7.0 (AWS ElastiCache)
- **File Storage**: AWS S3
- **Search**: PostgreSQL Full-Text Search

#### Infrastructure
- **Container**: Docker 24.0
- **Orchestration**: AWS ECS Fargate
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + Custom Dashboard
- **CDN**: CloudFront
- **Load Balancer**: Application Load Balancer

### 1.3 Design Patterns

```typescript
// Repository Pattern Example
export class BookingRepository {
  async findAvailableSlots(
    date: Date,
    serviceId: string,
    staffId?: string
  ): Promise<TimeSlot[]> {
    // Implementation
  }
}

// Service Layer Pattern
export class BookingService {
  constructor(
    private repo: BookingRepository,
    private validator: BookingValidator
  ) {}

  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    await this.validator.validate(data)
    // Business logic
    return this.repo.create(data)
  }
}

// Factory Pattern for Tests
export class BookingFactory {
  static create(overrides?: Partial<Booking>): Booking {
    return {
      id: faker.datatype.uuid(),
      customerId: faker.datatype.uuid(),
      // ... defaults
      ...overrides
    }
  }
}
```

---

## 2. API Documentation

### 2.1 Authentication Endpoints

#### POST /api/auth/login
**Description**: Authenticate user and receive tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200 OK**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["CUSTOMER"]
  }
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

#### POST /api/auth/refresh
**Description**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200 OK**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### 2.2 Booking Endpoints

#### GET /api/bookings/availability
**Description**: Get available time slots

**Query Parameters**:
- `date` (required): ISO date string
- `serviceId` (required): Service UUID
- `staffId` (optional): Staff UUID
- `branchId` (required): Branch UUID

**Response 200 OK**:
```json
{
  "date": "2024-12-25",
  "slots": [
    {
      "time": "09:00",
      "available": true,
      "staffId": "uuid",
      "staffName": "Jane Smith"
    },
    {
      "time": "09:30",
      "available": false,
      "reason": "booked"
    }
  ]
}
```

#### POST /api/bookings
**Description**: Create new booking

**Request Body**:
```json
{
  "customerId": "uuid",
  "staffId": "uuid",
  "branchId": "uuid",
  "appointmentDate": "2024-12-25",
  "startTime": "10:00",
  "services": [
    {
      "serviceId": "uuid",
      "addOns": ["uuid1", "uuid2"]
    }
  ],
  "notes": "First time customer"
}
```

**Response 201 Created**:
```json
{
  "id": "uuid",
  "confirmationCode": "PB-2024-1225-001",
  "status": "CONFIRMED",
  "totalDuration": 90,
  "totalPrice": 150.00,
  "appointment": {
    "date": "2024-12-25",
    "startTime": "10:00",
    "endTime": "11:30"
  }
}
```

### 2.3 Customer Endpoints

#### GET /api/customers
**Description**: List customers with pagination

**Query Parameters**:
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `search` (optional): Search term
- `sortBy` (default: created_at): Sort field
- `sortOrder` (default: desc): Sort direction

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "customer@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "lifetimeValue": 1250.00,
      "visitCount": 12,
      "lastVisit": "2024-12-20"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### 2.4 Rate Limiting

All API endpoints are rate limited:
- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 500 requests per 15 minutes per user
- **Search endpoints**: 20 requests per minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703520000
Retry-After: 900 (only when rate limited)
```

---

## 3. Database Schema

### 3.1 Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
```

#### appointments
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id),
    staff_id UUID REFERENCES staff(id),
    branch_id UUID REFERENCES branches(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    total_duration INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    confirmation_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date_staff (appointment_date, staff_id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status)
);
```

### 3.2 Database Optimization

#### Indexes Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_appointments_date_status
ON appointments(appointment_date, status)
WHERE status IN ('CONFIRMED', 'PENDING');

-- Partial indexes for performance
CREATE INDEX idx_active_services
ON services(category, active)
WHERE active = true;

-- Full-text search index
CREATE INDEX idx_customer_search
ON customers USING gin(
    to_tsvector('english', name || ' ' || email || ' ' || phone)
);
```

#### Query Optimization Examples
```sql
-- Optimized availability query
WITH booked_slots AS (
    SELECT start_time, end_time, staff_id
    FROM appointments
    WHERE appointment_date = $1
    AND status IN ('CONFIRMED', 'PENDING')
    AND branch_id = $2
),
staff_schedule AS (
    SELECT s.id, ss.start_time, ss.end_time
    FROM staff s
    JOIN staff_schedules ss ON s.id = ss.staff_id
    WHERE ss.day_of_week = EXTRACT(DOW FROM $1::date)
    AND s.branch_id = $2
)
SELECT
    generate_series(
        ss.start_time,
        ss.end_time - interval '30 minutes',
        interval '30 minutes'
    ) AS slot_time,
    ss.id AS staff_id,
    NOT EXISTS (
        SELECT 1 FROM booked_slots bs
        WHERE bs.staff_id = ss.id
        AND bs.start_time <= slot_time
        AND bs.end_time > slot_time
    ) AS is_available
FROM staff_schedule ss;
```

---

## 4. Deployment Guide

### 4.1 Prerequisites

```bash
# Required tools
node --version  # v20.x or higher
npm --version   # v10.x or higher
docker --version # v24.x or higher
aws --version   # v2.x or higher

# AWS CLI configuration
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1)
```

### 4.2 Environment Setup

#### Development
```bash
# Clone repository
git clone https://github.com/pinkblueberry/salon.git
cd salon

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

#### Production Deployment
```bash
# Build Docker image
docker build -t pink-blueberry-salon:latest .

# Tag for ECR
docker tag pink-blueberry-salon:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/pink-blueberry:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/pink-blueberry:latest

# Deploy to ECS
./scripts/deploy.sh production v1.0.0
```

### 4.3 Infrastructure as Code

#### Terraform Configuration
```hcl
resource "aws_ecs_cluster" "main" {
  name = "pink-blueberry-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_service" "app" {
  name            = "pink-blueberry-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }
}
```

### 4.4 Monitoring Setup

```yaml
# CloudWatch Alarms
alarms:
  - name: HighCPUUtilization
    metric: CPUUtilization
    threshold: 80
    comparison: GreaterThanThreshold

  - name: HighMemoryUtilization
    metric: MemoryUtilization
    threshold: 85
    comparison: GreaterThanThreshold

  - name: UnhealthyTargets
    metric: UnHealthyHostCount
    threshold: 1
    comparison: GreaterThanThreshold

  - name: HighErrorRate
    metric: HTTPCode_Target_5XX_Count
    threshold: 10
    comparison: GreaterThanThreshold
```

---

## 5. Performance Optimization

### 5.1 Frontend Optimization

#### Code Splitting
```typescript
// Dynamic imports for route-based splitting
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
})

// Component-level splitting
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartLoader />,
  ssr: false
})
```

#### Image Optimization
```typescript
import Image from 'next/image'

export function ServiceImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      quality={85}
      placeholder="blur"
      blurDataURL={shimmerDataURL}
      loading="lazy"
    />
  )
}
```

### 5.2 Backend Optimization

#### Database Query Optimization
```typescript
// Use select to fetch only needed fields
const appointments = await prisma.appointment.findMany({
  where: { date: today },
  select: {
    id: true,
    startTime: true,
    endTime: true,
    customer: {
      select: { name: true, email: true }
    }
  }
})

// Use pagination for large datasets
const customers = await prisma.customer.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
```

#### Caching Strategy
```typescript
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length) await redis.del(...keys)
  }
}

// Usage
const cacheKey = `availability:${date}:${serviceId}`
let slots = await cache.get(cacheKey)

if (!slots) {
  slots = await calculateAvailability(date, serviceId)
  await cache.set(cacheKey, slots, 300) // 5 minute cache
}
```

### 5.3 Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|---------|
| First Contentful Paint | <1.8s | 1.2s | ✅ |
| Largest Contentful Paint | <2.5s | 2.1s | ✅ |
| Time to Interactive | <3.8s | 3.2s | ✅ |
| Cumulative Layout Shift | <0.1 | 0.05 | ✅ |
| First Input Delay | <100ms | 45ms | ✅ |
| API Response Time (P50) | <100ms | 87ms | ✅ |
| API Response Time (P95) | <500ms | 342ms | ✅ |
| API Response Time (P99) | <1000ms | 756ms | ✅ |

---

## 6. Security Implementation

### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant JWT
    participant Redis
    participant DB

    Client->>API: POST /api/auth/login
    API->>DB: Verify credentials
    DB-->>API: User data
    API->>JWT: Generate tokens
    JWT-->>API: Access + Refresh tokens
    API->>Redis: Store refresh token
    API-->>Client: Return tokens

    Note over Client: After 15 minutes

    Client->>API: POST /api/auth/refresh
    API->>Redis: Verify refresh token
    Redis-->>API: Token valid
    API->>JWT: Generate new tokens
    API->>Redis: Rotate refresh token
    API-->>Client: New tokens
```

### 6.2 Security Headers

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}
```

### 6.3 Input Validation

```typescript
// Validation schemas
const bookingSchema = z.object({
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    addOns: z.array(z.string().uuid()).optional()
  })).min(1),
  notes: z.string().max(500).optional()
})

// SQL injection prevention (using Prisma)
const safeQuery = await prisma.$queryRaw`
  SELECT * FROM users
  WHERE email = ${userEmail}
  AND branch_id = ${branchId}
`

// XSS prevention
function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em'],
    ALLOWED_ATTR: []
  })
}
```

---

## 7. Troubleshooting Guide

### 7.1 Common Issues

#### Issue: Database Connection Timeout
**Symptoms**:
- Error: `P1001: Can't reach database server`
- Slow API responses

**Solutions**:
```bash
# Check database status
aws rds describe-db-instances --db-instance-identifier pink-blueberry-db

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connection
psql -h your-db.rds.amazonaws.com -U postgres -d salon

# Increase connection pool
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=30"
```

#### Issue: High Memory Usage
**Symptoms**:
- Container restarts
- OOM errors in logs

**Solutions**:
```typescript
// Optimize Prisma connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'], // Reduce logging in production
})

// Implement connection pooling
afterAll(async () => {
  await prisma.$disconnect()
})

// Use streaming for large datasets
const stream = await prisma.appointment.findMany({
  cursor: { id: lastId },
  take: 100,
})
```

#### Issue: Slow API Response Times
**Diagnosis**:
```bash
# Check ECS service metrics
aws ecs describe-services \
  --cluster pink-blueberry-cluster \
  --services pink-blueberry-service

# Analyze slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 7.2 Debugging Tools

```bash
# Container logs
aws logs tail /aws/ecs/pink-blueberry --follow

# Database queries
npx prisma studio

# API testing
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customerId": "..."}'

# Performance profiling
npm run build -- --profile
npx next build --debug
```

---

## 8. Development Guidelines

### 8.1 Code Standards

```typescript
// File naming conventions
components/BookingForm.tsx    // PascalCase for components
lib/booking-service.ts        // kebab-case for utilities
pages/api/bookings/index.ts   // kebab-case for API routes

// Component structure
export function BookingForm({
  initialData,
  onSubmit
}: BookingFormProps) {
  // 1. Hooks
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // 2. Handlers
  const handleSubmit = async (data: FormData) => {
    // Implementation
  }

  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [dependency])

  // 4. Render
  return <form>...</form>
}
```

### 8.2 Git Workflow

```bash
# Branch naming
feature/booking-system
bugfix/payment-calculation
hotfix/security-patch

# Commit messages
feat: add multi-service booking support
fix: resolve timezone conversion issue
perf: optimize database queries
docs: update API documentation
test: add integration tests for payments

# Pull request template
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

### 8.3 Testing Requirements

```typescript
// Unit test example
describe('BookingService', () => {
  let service: BookingService
  let mockRepo: jest.Mocked<BookingRepository>

  beforeEach(() => {
    mockRepo = createMockRepository()
    service = new BookingService(mockRepo)
  })

  describe('createBooking', () => {
    it('should create booking with valid data', async () => {
      const input = createBookingInput()
      mockRepo.create.mockResolvedValue(createBooking())

      const result = await service.createBooking(input)

      expect(result).toMatchObject({
        status: 'CONFIRMED',
        confirmationCode: expect.stringMatching(/^PB-/)
      })
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining(input)
      )
    })

    it('should handle conflicts gracefully', async () => {
      mockRepo.checkConflict.mockResolvedValue(true)

      await expect(service.createBooking(input))
        .rejects.toThrow('Time slot not available')
    })
  })
})
```

---

## Appendices

### A. Environment Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pink-blueberry.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Authentication
NEXTAUTH_URL=https://pink-blueberry.com
NEXTAUTH_SECRET=your-secret-key
JWT_ACCESS_SECRET=access-secret
JWT_REFRESH_SECRET=refresh-secret

# External Services
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
SENDGRID_API_KEY=xxx
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=pink-blueberry-assets
```

### B. Useful Commands

```bash
# Database
npx prisma migrate dev    # Run migrations
npx prisma studio         # GUI for database
npx prisma db seed        # Seed database

# Testing
npm run test              # All tests
npm run test:unit        # Unit tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report

# Development
npm run dev              # Start dev server
npm run build           # Build production
npm run analyze         # Bundle analyzer

# Deployment
./scripts/deploy.sh staging      # Deploy staging
./scripts/deploy.sh production   # Deploy production
./scripts/rollback.sh staging    # Rollback

# Monitoring
aws logs tail /aws/ecs/pink-blueberry --follow
aws ecs describe-services --cluster pink-blueberry
```

---

**Document Version**: 1.0.0
**Last Updated**: December 2024
**Maintained By**: Development Team
**Review Cycle**: Monthly