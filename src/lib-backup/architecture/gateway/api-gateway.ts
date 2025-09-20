/**
 * API Gateway Implementation for Pink Blueberry Salon
 * Handles routing, authentication, rate limiting, and request/response transformation
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route Configuration
 */
export interface ApiRoute {
  path: string;
  method: string;
  service: string;
  handler: string;
  auth?: string[];
  rateLimit?: {
    requests: number;
    window: string; // e.g., '1m', '1h', '1d'
  };
  cache?: {
    ttl: number;
    vary?: string[];
  };
  validation?: RouteValidation;
  transformation?: RouteTransformation;
  audit?: boolean;
  encryption?: 'required' | 'optional';
  timeout?: number; // milliseconds
}

/**
 * Route Validation Configuration
 */
export interface RouteValidation {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, any>;
}

/**
 * Route Transformation Configuration
 */
export interface RouteTransformation {
  request?: RequestTransformation;
  response?: ResponseTransformation;
}

export interface RequestTransformation {
  headers?: Record<string, string>;
  removeHeaders?: string[];
  addHeaders?: Record<string, string>;
}

export interface ResponseTransformation {
  headers?: Record<string, string>;
  removeHeaders?: string[];
  addHeaders?: Record<string, string>;
  statusCodeMappings?: Record<number, number>;
}

/**
 * Gateway Middleware Interface
 */
export interface GatewayMiddleware {
  name: string;
  execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse>;
}

/**
 * Gateway Context
 */
export interface GatewayContext {
  route: ApiRoute;
  user?: GatewayUser;
  tenant?: GatewayTenant;
  startTime: number;
  requestId: string;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface GatewayUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  tenantId: string;
}

export interface GatewayTenant {
  id: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, any>;
}

/**
 * Rate Limiter Interface
 */
export interface RateLimiter {
  checkLimit(
    key: string,
    limit: number,
    window: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }>;
}

/**
 * API Gateway Implementation
 */
export class ApiGateway {
  private routes: Map<string, ApiRoute> = new Map();
  private middleware: GatewayMiddleware[] = [];
  private rateLimiter?: RateLimiter;

  constructor(rateLimiter?: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Register API routes
   */
  registerRoute(route: ApiRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  /**
   * Register multiple routes
   */
  registerRoutes(routes: ApiRoute[]): void {
    routes.forEach(route => this.registerRoute(route));
  }

  /**
   * Add middleware to the gateway
   */
  use(middleware: GatewayMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Handle incoming requests
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const context = await this.createContext(request);

    try {
      // Find matching route
      const route = this.findRoute(request);
      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      context.route = route;

      // Execute middleware chain
      let middlewareIndex = 0;
      const executeNext = async (): Promise<NextResponse> => {
        if (middlewareIndex < this.middleware.length) {
          const middleware = this.middleware[middlewareIndex++];
          return middleware.execute(request, context, executeNext);
        }
        return this.executeRoute(request, context);
      };

      return await executeNext();
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Create gateway context
   */
  private async createContext(request: NextRequest): Promise<GatewayContext> {
    return {
      route: {} as ApiRoute, // Will be set when route is found
      startTime: Date.now(),
      requestId: crypto.randomUUID(),
      correlationId: request.headers.get('x-correlation-id') || crypto.randomUUID(),
      metadata: {},
    };
  }

  /**
   * Find matching route
   */
  private findRoute(request: NextRequest): ApiRoute | null {
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // Try exact match first
    const exactKey = `${method}:${pathname}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // Try pattern matching
    for (const [key, route] of this.routes.entries()) {
      const [routeMethod, routePath] = key.split(':');
      if (routeMethod === method && this.matchesPattern(pathname, routePath)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Check if path matches route pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Convert pattern to regex (e.g., /api/bookings/:id -> /api/bookings/[^/]+)
    const regexPattern = pattern
      .replace(/:\w+/g, '[^/]+')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Execute the actual route handler
   */
  private async executeRoute(
    request: NextRequest,
    context: GatewayContext
  ): Promise<NextResponse> {
    // This would typically delegate to the actual service
    // For now, return a placeholder response
    return NextResponse.json({
      message: 'Route executed successfully',
      service: context.route.service,
      handler: context.route.handler,
      requestId: context.requestId,
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: any, context: GatewayContext): NextResponse {
    console.error('Gateway error:', {
      error: error.message,
      requestId: context.requestId,
      route: context.route?.path,
    });

    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.details },
        { status: 400 }
      );
    }

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Authentication Middleware
 */
export class AuthenticationMiddleware implements GatewayMiddleware {
  name = 'authentication';

  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { route } = context;

    // Skip authentication if not required
    if (!route.auth || route.auth.length === 0) {
      return next();
    }

    const token = this.extractToken(request);
    if (!token) {
      throw { name: 'AuthenticationError', message: 'No token provided' };
    }

    try {
      const user = await this.validateToken(token);
      context.user = user;
      return next();
    } catch (error) {
      throw { name: 'AuthenticationError', message: 'Invalid token' };
    }
  }

  private extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private async validateToken(token: string): Promise<GatewayUser> {
    // This would integrate with your authentication service
    // For now, return a mock user
    return {
      id: 'user-123',
      email: 'user@example.com',
      role: 'customer',
      permissions: ['booking:create', 'booking:read'],
      tenantId: 'tenant-123',
    };
  }
}

/**
 * Authorization Middleware
 */
export class AuthorizationMiddleware implements GatewayMiddleware {
  name = 'authorization';

  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { route, user } = context;

    // Skip authorization if no auth required or no user
    if (!route.auth || !user) {
      return next();
    }

    // Check if user has required roles
    const hasRequiredRole = route.auth.some(role => user.role === role);
    if (!hasRequiredRole) {
      throw {
        name: 'AuthorizationError',
        message: 'Insufficient permissions',
      };
    }

    return next();
  }
}

/**
 * Rate Limiting Middleware
 */
export class RateLimitingMiddleware implements GatewayMiddleware {
  name = 'rate-limiting';

  constructor(private rateLimiter: RateLimiter) {}

  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { route, user } = context;

    if (!route.rateLimit) {
      return next();
    }

    const key = this.getRateLimitKey(request, user);
    const result = await this.rateLimiter.checkLimit(
      key,
      route.rateLimit.requests,
      route.rateLimit.window
    );

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );

      response.headers.set('X-RateLimit-Limit', route.rateLimit.requests.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return response;
    }

    const response = await next();
    response.headers.set('X-RateLimit-Limit', route.rateLimit.requests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return response;
  }

  private getRateLimitKey(request: NextRequest, user?: GatewayUser): string {
    if (user) {
      return `user:${user.id}`;
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    return `ip:${ip}`;
  }
}

/**
 * Request Validation Middleware
 */
export class RequestValidationMiddleware implements GatewayMiddleware {
  name = 'request-validation';

  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { route } = context;

    if (!route.validation) {
      return next();
    }

    try {
      await this.validateRequest(request, route.validation);
      return next();
    } catch (error) {
      throw {
        name: 'ValidationError',
        message: 'Request validation failed',
        details: error.details,
      };
    }
  }

  private async validateRequest(
    request: NextRequest,
    validation: RouteValidation
  ): Promise<void> {
    // Validate headers
    if (validation.headers) {
      for (const [header, pattern] of Object.entries(validation.headers)) {
        const value = request.headers.get(header);
        if (!value || !new RegExp(pattern).test(value)) {
          throw {
            details: { [header]: [`Header ${header} is invalid`] },
          };
        }
      }
    }

    // Validate query parameters
    if (validation.query) {
      const url = new URL(request.url);
      for (const [param, pattern] of Object.entries(validation.query)) {
        const value = url.searchParams.get(param);
        if (!value || !new RegExp(pattern).test(value)) {
          throw {
            details: { [param]: [`Query parameter ${param} is invalid`] },
          };
        }
      }
    }

    // Validate request body
    if (validation.body && request.method !== 'GET') {
      try {
        const body = await request.json();
        // Body validation would use a schema validation library like Zod
        // For now, just check if it's valid JSON
      } catch (error) {
        throw {
          details: { body: ['Invalid JSON body'] },
        };
      }
    }
  }
}

/**
 * Logging Middleware
 */
export class LoggingMiddleware implements GatewayMiddleware {
  name = 'logging';

  async execute(
    request: NextRequest,
    context: GatewayContext,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const start = Date.now();

    console.log('[Gateway] Request started', {
      method: request.method,
      url: request.url,
      requestId: context.requestId,
      userAgent: request.headers.get('user-agent'),
      userId: context.user?.id,
    });

    try {
      const response = await next();
      const duration = Date.now() - start;

      console.log('[Gateway] Request completed', {
        method: request.method,
        url: request.url,
        requestId: context.requestId,
        status: response.status,
        duration: `${duration}ms`,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      console.error('[Gateway] Request failed', {
        method: request.method,
        url: request.url,
        requestId: context.requestId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}

/**
 * In-Memory Rate Limiter Implementation
 */
export class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  async checkLimit(
    key: string,
    limit: number,
    window: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const windowMs = this.parseWindow(window);
    const now = Date.now();
    const resetTime = now + windowMs;

    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: limit - existing.count,
      resetTime: existing.resetTime,
    };
  }

  private parseWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid window format: ${window}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Invalid time unit: ${unit}`);
    }
  }
}

/**
 * Gateway Factory
 */
export class ApiGatewayFactory {
  static create(): ApiGateway {
    const rateLimiter = new InMemoryRateLimiter();
    const gateway = new ApiGateway(rateLimiter);

    // Add default middleware
    gateway.use(new LoggingMiddleware());
    gateway.use(new AuthenticationMiddleware());
    gateway.use(new AuthorizationMiddleware());
    gateway.use(new RateLimitingMiddleware(rateLimiter));
    gateway.use(new RequestValidationMiddleware());

    return gateway;
  }
}