# ADR-004: API Gateway Design and Implementation

## Status
Accepted

## Context
The system requires a unified entry point for all client requests with cross-cutting concerns like authentication, authorization, rate limiting, and request/response transformation. With multiple services and client types (web, mobile, POS), we need consistent API management and security policies.

## Decision
We will implement a comprehensive API Gateway pattern using Next.js middleware and edge functions with the following architecture:

### Gateway Responsibilities
- **Request Routing**: Dynamic routing to appropriate services
- **Authentication**: JWT token validation and user context
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Per-user and per-endpoint limits
- **Request/Response Transformation**: Data format standardization
- **Caching**: Intelligent response caching
- **Logging and Monitoring**: Centralized request tracking
- **Error Handling**: Consistent error responses

### Gateway Architecture
```typescript
interface ApiGateway {
  // Core routing
  registerRoute(route: ApiRoute): void;
  handle(request: NextRequest): Promise<NextResponse>;

  // Middleware chain
  use(middleware: GatewayMiddleware): void;

  // Service discovery
  findService(path: string): ServiceEndpoint;
}
```

## Route Configuration

### Route Definition Schema
```typescript
interface ApiRoute {
  path: string;                    // '/api/bookings/:id'
  method: string;                  // 'GET', 'POST', etc.
  service: string;                 // 'booking-service'
  handler: string;                 // 'getBooking'
  auth?: string[];                 // ['customer', 'staff', 'admin']
  rateLimit?: {
    requests: number;              // 100
    window: string;                // '1m', '1h', '1d'
  };
  cache?: {
    ttl: number;                   // Cache duration in seconds
    vary?: string[];               // Headers to vary cache by
  };
  validation?: RouteValidation;
  transformation?: RouteTransformation;
  audit?: boolean;                 // Log for compliance
  encryption?: 'required' | 'optional';
  timeout?: number;                // Request timeout in ms
}
```

### Example Route Configurations
```typescript
const routes: ApiRoute[] = [
  {
    path: '/api/bookings',
    method: 'POST',
    service: 'booking-service',
    handler: 'createBooking',
    auth: ['customer', 'staff', 'admin'],
    rateLimit: { requests: 10, window: '1m' },
    validation: {
      body: {
        branchId: 'required|uuid',
        scheduledAt: 'required|datetime',
        services: 'required|array'
      }
    },
    audit: true,
    timeout: 30000
  },
  {
    path: '/api/bookings/:id',
    method: 'GET',
    service: 'booking-service',
    handler: 'getBooking',
    auth: ['customer', 'staff', 'admin'],
    rateLimit: { requests: 100, window: '1m' },
    cache: { ttl: 300, vary: ['Authorization'] },
    timeout: 10000
  },
  {
    path: '/api/payments',
    method: 'POST',
    service: 'payment-service',
    handler: 'processPayment',
    auth: ['customer', 'staff', 'admin'],
    rateLimit: { requests: 5, window: '1m' },
    encryption: 'required',
    audit: true,
    timeout: 60000
  },
  {
    path: '/api/analytics/revenue',
    method: 'GET',
    service: 'analytics-service',
    handler: 'getRevenue',
    auth: ['admin', 'manager'],
    rateLimit: { requests: 30, window: '1m' },
    cache: { ttl: 600, vary: ['X-Tenant-ID'] },
    timeout: 15000
  }
];
```

## Middleware Pipeline

### Standard Middleware Chain
1. **Request Logging**: Log incoming requests
2. **Authentication**: Validate JWT tokens
3. **Tenant Resolution**: Extract tenant context
4. **Authorization**: Check user permissions
5. **Rate Limiting**: Enforce usage limits
6. **Request Validation**: Validate input data
7. **Request Transformation**: Normalize request format
8. **Service Routing**: Forward to appropriate service
9. **Response Transformation**: Normalize response format
10. **Response Caching**: Cache responses when appropriate
11. **Response Logging**: Log responses and metrics

### Middleware Implementation
```typescript
class AuthenticationMiddleware implements GatewayMiddleware {
  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { route } = context;

    // Skip if no auth required
    if (!route.auth || route.auth.length === 0) {
      return next();
    }

    const token = this.extractToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const user = await this.validateToken(token);
      context.user = user;
      return next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }
}
```

## Authentication and Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;                     // User ID
  email: string;                   // User email
  role: string;                    // Primary role
  permissions: string[];           // Specific permissions
  tenantId: string;                // Tenant context
  iat: number;                     // Issued at
  exp: number;                     // Expiration
  aud: string;                     // Audience
  iss: string;                     // Issuer
}
```

### Role-Based Access Control
```typescript
class RBAC {
  private static permissions = {
    customer: [
      'booking:create',
      'booking:read:own',
      'booking:update:own',
      'booking:cancel:own',
      'profile:read:own',
      'profile:update:own'
    ],
    staff: [
      'booking:read',
      'booking:create',
      'booking:update',
      'customer:read',
      'customer:create',
      'schedule:read',
      'schedule:update:own'
    ],
    manager: [
      'salon:read',
      'salon:update',
      'booking:*',
      'staff:*',
      'inventory:*',
      'reports:read'
    ],
    admin: ['*']
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
}
```

## Rate Limiting Strategy

### Multi-Tier Rate Limiting
```typescript
interface RateLimitConfig {
  global: { requests: 1000, window: '1h' };     // System-wide limits
  tenant: { requests: 500, window: '1h' };      // Per-tenant limits
  user: { requests: 100, window: '1h' };        // Per-user limits
  endpoint: { requests: 50, window: '1m' };     // Per-endpoint limits
  ip: { requests: 200, window: '1h' };          // Per-IP limits (anonymous)
}

class RateLimitingMiddleware {
  async execute(request: NextRequest, context: GatewayContext): Promise<void> {
    const checks = [
      this.checkGlobalLimit(),
      this.checkTenantLimit(context.tenant?.id),
      this.checkUserLimit(context.user?.id),
      this.checkEndpointLimit(context.route.path),
      this.checkIPLimit(request.ip)
    ];

    const results = await Promise.all(checks);
    const violated = results.find(result => !result.allowed);

    if (violated) {
      throw new RateLimitError(violated.resetTime);
    }
  }
}
```

### Rate Limiting Algorithms
- **Sliding Window**: Precise rate limiting with memory efficiency
- **Token Bucket**: Burst capacity with sustained rate limits
- **Fixed Window**: Simple implementation with reset intervals
- **Leaky Bucket**: Smooth rate limiting for consistent throughput

## Caching Strategy

### Multi-Level Caching
```typescript
interface CacheStrategy {
  // Edge caching (Vercel CDN)
  edge: {
    duration: '5m';
    vary: ['Authorization', 'X-Tenant-ID'];
    staleWhileRevalidate: '1m';
  };

  // Application caching (Redis)
  application: {
    duration: '15m';
    patterns: {
      'salon-data': '1h';
      'availability': '1m';
      'user-profile': '30m';
    };
  };

  // Database query caching
  database: {
    duration: '5m';
    skipCache: ['write-operations'];
  };
}
```

### Cache Invalidation
```typescript
class CacheInvalidationHandler extends BaseEventHandler {
  protected eventTypes = [
    'booking.created',
    'booking.updated',
    'salon.updated',
    'staff.updated'
  ];

  async handle(event: DomainEvent): Promise<void> {
    const patterns = this.getInvalidationPatterns(event);

    for (const pattern of patterns) {
      await this.cacheManager.invalidate(pattern);
    }
  }

  private getInvalidationPatterns(event: DomainEvent): string[] {
    switch (event.type) {
      case 'booking.created':
      case 'booking.updated':
        return [
          `availability:${event.payload.branchId}`,
          `bookings:${event.metadata.tenantId}`,
          `customer:${event.payload.customerId}`
        ];

      case 'salon.updated':
        return [
          `salon:${event.aggregateId}`,
          `services:${event.aggregateId}`
        ];

      default:
        return [];
    }
  }
}
```

## Error Handling and Resilience

### Standardized Error Responses
```typescript
interface ErrorResponse {
  error: {
    code: string;                  // Machine-readable error code
    message: string;               // Human-readable message
    details?: any;                 // Additional error context
    timestamp: string;             // ISO timestamp
    requestId: string;             // Request correlation ID
    documentation?: string;        // Link to error documentation
  };
}

class ErrorHandler {
  handle(error: any, context: GatewayContext): NextResponse {
    const errorResponse: ErrorResponse = {
      error: {
        code: this.getErrorCode(error),
        message: this.getErrorMessage(error),
        details: this.getErrorDetails(error),
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        documentation: this.getDocumentationUrl(error)
      }
    };

    return NextResponse.json(
      errorResponse,
      { status: this.getStatusCode(error) }
    );
  }
}
```

### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Monitoring and Observability

### Gateway Metrics
```typescript
class GatewayMetrics {
  // Request metrics
  trackRequest(method: string, path: string, status: number, duration: number): void;
  trackRateLimit(endpoint: string, userId?: string): void;
  trackCacheHit(key: string): void;
  trackCacheMiss(key: string): void;

  // Performance metrics
  trackLatency(operation: string, duration: number): void;
  trackThroughput(endpoint: string, count: number): void;

  // Error metrics
  trackError(error: string, endpoint: string): void;
  trackTimeout(endpoint: string): void;

  // Business metrics
  trackAuthentication(success: boolean, method: string): void;
  trackAuthorization(success: boolean, resource: string): void;
}
```

### Health Checks
```typescript
class GatewayHealthCheck {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkAuthentication(),
      this.checkRateLimit(),
      this.checkCache(),
      this.checkDownstreamServices()
    ]);

    return {
      status: this.aggregateStatus(checks),
      timestamp: new Date().toISOString(),
      checks: this.formatChecks(checks)
    };
  }
}
```

## Security Considerations

### Request Security
- **Input Validation**: Strict validation of all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Output encoding and CSP headers
- **CSRF Protection**: Token validation for state-changing operations
- **Request Size Limits**: Prevent DoS through large payloads

### Response Security
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Consequences

### Positive
- **Centralized Cross-Cutting Concerns**: Single place for auth, logging, etc.
- **Consistent API Experience**: Unified interface for all clients
- **Security**: Centralized security policies and enforcement
- **Performance**: Intelligent caching and request optimization
- **Monitoring**: Comprehensive observability across all APIs
- **Flexibility**: Easy to add new services and modify routing

### Negative
- **Single Point of Failure**: Gateway availability affects entire system
- **Performance Bottleneck**: All requests pass through gateway
- **Complexity**: Additional layer increases system complexity
- **Latency**: Additional hop adds request latency
- **Operational Overhead**: Gateway maintenance and monitoring

## Testing Strategy
- **Unit Tests**: Individual middleware components
- **Integration Tests**: End-to-end request flows
- **Performance Tests**: Load testing gateway throughput
- **Security Tests**: Penetration testing and vulnerability scans
- **Chaos Testing**: Gateway resilience under failure conditions

## Deployment and Scaling
- **Edge Deployment**: Deploy on Vercel edge network
- **Auto-scaling**: Automatic scaling based on request volume
- **Blue-Green Deployment**: Zero-downtime gateway updates
- **Canary Releases**: Gradual rollout of gateway changes
- **Geographic Distribution**: Multi-region deployment for low latency