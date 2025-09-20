/**
 * Next.js Middleware for Pink Blueberry Salon
 * Handles authentication, authorization, and route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ExtendedJWT } from '@/lib/auth/config';

// Configuration for protected routes
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/staff',
  '/api/auth/protected',
  '/api/admin',
  '/api/staff',
  '/api/booking',
  '/api/customers',
  '/api/services',
  '/api/appointments',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify-request',
  '/auth/reset-password',
  '/api/auth',
  '/api/public',
];

// Role-based route protection
const roleProtectedRoutes = {
  '/admin': ['SUPER_ADMIN', 'TENANT_ADMIN'],
  '/dashboard/admin': ['SUPER_ADMIN', 'TENANT_ADMIN', 'SALON_MANAGER'],
  '/dashboard/staff': ['SUPER_ADMIN', 'TENANT_ADMIN', 'SALON_MANAGER', 'BRANCH_MANAGER', 'STAFF', 'RECEPTIONIST'],
  '/dashboard/analytics': ['SUPER_ADMIN', 'TENANT_ADMIN', 'SALON_MANAGER', 'BRANCH_MANAGER'],
  '/api/admin': ['SUPER_ADMIN', 'TENANT_ADMIN'],
  '/api/staff': ['SUPER_ADMIN', 'TENANT_ADMIN', 'SALON_MANAGER', 'BRANCH_MANAGER', 'STAFF'],
};

// API routes that require specific permissions
const permissionProtectedRoutes = {
  '/api/users': { resource: 'users', action: 'READ' },
  '/api/customers': { resource: 'customers', action: 'READ' },
  '/api/services': { resource: 'services', action: 'READ' },
  '/api/appointments': { resource: 'appointments', action: 'READ' },
  '/api/reports': { resource: 'reports', action: 'READ' },
  '/api/analytics': { resource: 'analytics', action: 'READ' },
};

// CORS configuration
const corsOptions = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Tenant-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add CORS headers
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Add security headers
  addSecurityHeaders(response);

  // Add request tracking
  const requestId = generateRequestId();
  response.headers.set('X-Request-ID', requestId);

  // Check if route is public
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Get authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  }) as ExtendedJWT | null;

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    if (!token) {
      return redirectToSignIn(request);
    }

    // Check if user is active
    if (!token.email) {
      return redirectToSignIn(request);
    }

    // Check email verification for sensitive routes
    if (requiresEmailVerification(pathname) && !token.emailVerified) {
      return NextResponse.redirect(new URL('/auth/verify-email', request.url));
    }

    // Check MFA for sensitive routes
    if (requiresMFA(pathname) && token.mfaEnabled && !token.mfaVerified) {
      return NextResponse.redirect(new URL('/auth/mfa', request.url));
    }

    // Check role-based access
    const roleCheckResult = await checkRoleAccess(pathname, token);
    if (!roleCheckResult.allowed) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    // Check permission-based access for API routes
    if (pathname.startsWith('/api/')) {
      const permissionCheckResult = await checkPermissionAccess(pathname, token);
      if (!permissionCheckResult.allowed) {
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Add user context to headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('X-User-ID', token.userId);
      response.headers.set('X-Tenant-ID', token.tenantId);
      response.headers.set('X-User-Role', token.role);
      response.headers.set('X-Request-ID', requestId);
    }
  }

  // Handle tenant routing for multi-tenant setup
  const tenantResponse = await handleTenantRouting(request, token, response);
  if (tenantResponse) {
    return tenantResponse;
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await checkRateLimit(request, token);
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }
  }

  // Log request for audit trail
  await logRequest(request, token, requestId);

  return response;
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Check if route requires email verification
 */
function requiresEmailVerification(pathname: string): boolean {
  const sensitiveRoutes = ['/admin', '/dashboard/admin', '/api/admin'];
  return sensitiveRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if route requires MFA
 */
function requiresMFA(pathname: string): boolean {
  const mfaRequiredRoutes = ['/admin', '/api/admin', '/dashboard/admin'];
  return mfaRequiredRoutes.some(route => pathname.startsWith(route));
}

/**
 * Redirect to sign in page
 */
function redirectToSignIn(request: NextRequest): NextResponse {
  const signInUrl = new URL('/auth/signin', request.url);
  signInUrl.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(signInUrl);
}

/**
 * Check role-based access
 */
async function checkRoleAccess(
  pathname: string,
  token: ExtendedJWT
): Promise<{ allowed: boolean; reason?: string }> {
  // Find matching role-protected route
  const matchingRoute = Object.keys(roleProtectedRoutes).find(route =>
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    return { allowed: true };
  }

  const allowedRoles = roleProtectedRoutes[matchingRoute as keyof typeof roleProtectedRoutes];
  const userRole = token.role;

  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role ${userRole} not allowed for route ${pathname}`,
    };
  }

  return { allowed: true };
}

/**
 * Check permission-based access
 */
async function checkPermissionAccess(
  pathname: string,
  token: ExtendedJWT
): Promise<{ allowed: boolean; reason?: string }> {
  // Find matching permission-protected route
  const matchingRoute = Object.keys(permissionProtectedRoutes).find(route =>
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    return { allowed: true };
  }

  const requiredPermission = permissionProtectedRoutes[matchingRoute as keyof typeof permissionProtectedRoutes];
  const userPermissions = token.permissions || [];

  const hasPermission = userPermissions.some(permission => {
    const [resource, action] = permission.split(':');
    return resource === requiredPermission.resource &&
           (action === requiredPermission.action || action === 'MANAGE');
  });

  if (!hasPermission) {
    return {
      allowed: false,
      reason: `Missing permission ${requiredPermission.resource}:${requiredPermission.action}`,
    };
  }

  return { allowed: true };
}

/**
 * Handle tenant routing
 */
async function handleTenantRouting(
  request: NextRequest,
  token: ExtendedJWT | null,
  response: NextResponse
): Promise<NextResponse | null> {
  // Extract tenant from subdomain or header
  const host = request.headers.get('host') || '';
  const tenantFromSubdomain = extractTenantFromSubdomain(host);
  const tenantFromHeader = request.headers.get('X-Tenant-ID');

  const tenantId = tenantFromSubdomain || tenantFromHeader;

  // If user is authenticated and tenant doesn't match
  if (token && tenantId && token.tenantId !== tenantId) {
    // Only super admins can access other tenants
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  // Add tenant context to response headers
  if (tenantId) {
    response.headers.set('X-Current-Tenant', tenantId);
  }

  return null;
}

/**
 * Extract tenant from subdomain
 */
function extractTenantFromSubdomain(host: string): string | null {
  // Skip for localhost development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return null;
  }

  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Skip common subdomains
    if (!['www', 'api', 'admin'].includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
  request: NextRequest,
  token: ExtendedJWT | null
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Simple rate limiting implementation
  // In production, use Redis or similar for distributed rate limiting

  const identifier = token?.userId || request.ip || 'anonymous';
  const key = `rate_limit:${identifier}`;

  // Different limits for different user types
  const limits = {
    SUPER_ADMIN: 1000, // requests per minute
    TENANT_ADMIN: 500,
    SALON_MANAGER: 300,
    STAFF: 200,
    CUSTOMER: 100,
    anonymous: 50,
  };

  const userRole = token?.role || 'anonymous';
  const limit = limits[userRole as keyof typeof limits] || limits.anonymous;

  // This is a simplified implementation
  // In production, implement proper sliding window rate limiting
  return { allowed: true };
}

/**
 * Add security headers
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log request for audit trail
 */
async function logRequest(
  request: NextRequest,
  token: ExtendedJWT | null,
  requestId: string
): Promise<void> {
  try {
    // In production, send to logging service
    const logData = {
      requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      userId: token?.userId,
      tenantId: token?.tenantId,
      role: token?.role,
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request logged:', logData);
    }

    // In production, implement proper logging
    // await sendToLoggingService(logData);
  } catch (error) {
    console.error('Request logging error:', error);
  }
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};