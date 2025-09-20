import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { RateLimiter } from './rate-limiter'
import { SecurityHeaders } from './headers'
import { InputSanitizer } from './sanitizer'
import { CSRFProtection } from './csrf'
import { AuditLogger } from './audit'

// Initialize security components
const rateLimiter = new RateLimiter()
const securityHeaders = new SecurityHeaders()
const sanitizer = new InputSanitizer()
const csrfProtection = new CSRFProtection()
const auditLogger = new AuditLogger()

export interface SecurityConfig {
  rateLimit?: {
    windowMs?: number
    maxRequests?: number
    skipSuccessfulRequests?: boolean
  }
  csrf?: {
    enabled?: boolean
    excludePaths?: string[]
  }
  sanitization?: {
    enabled?: boolean
    strict?: boolean
  }
  audit?: {
    enabled?: boolean
    sensitiveFields?: string[]
  }
  headers?: {
    contentSecurityPolicy?: string
    strictTransportSecurity?: boolean
  }
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
    skipSuccessfulRequests: false,
  },
  csrf: {
    enabled: true,
    excludePaths: ['/api/stripe/webhook', '/api/health'],
  },
  sanitization: {
    enabled: true,
    strict: true,
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'secret', 'ssn', 'creditCard'],
  },
  headers: {
    strictTransportSecurity: true,
  },
}

export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig = defaultConfig
): Promise<NextResponse | null> {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname

  try {
    // 1. Apply security headers
    securityHeaders.apply(response, config.headers)

    // 2. Rate limiting
    if (config.rateLimit) {
      const identifier = getClientIdentifier(request)
      const rateLimitResult = await rateLimiter.check(
        identifier,
        path,
        config.rateLimit
      )

      if (!rateLimitResult.allowed) {
        await auditLogger.log({
          event: 'RATE_LIMIT_EXCEEDED',
          userId: identifier,
          path,
          metadata: { remaining: rateLimitResult.remaining },
        })

        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        })
      }

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    }

    // 3. CSRF protection for state-changing requests
    if (
      config.csrf?.enabled &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
      !config.csrf.excludePaths?.includes(path)
    ) {
      const csrfToken = request.headers.get('X-CSRF-Token')
      const sessionToken = request.cookies.get('session-token')?.value

      if (!csrfToken || !sessionToken) {
        await auditLogger.log({
          event: 'CSRF_TOKEN_MISSING',
          path,
          method: request.method,
        })

        return new NextResponse('CSRF token required', { status: 403 })
      }

      const isValid = await csrfProtection.verify(csrfToken, sessionToken)
      if (!isValid) {
        await auditLogger.log({
          event: 'CSRF_TOKEN_INVALID',
          path,
          method: request.method,
        })

        return new NextResponse('Invalid CSRF token', { status: 403 })
      }
    }

    // 4. Input sanitization
    if (config.sanitization?.enabled && request.body) {
      const contentType = request.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        try {
          const body = await request.json()
          const sanitized = sanitizer.sanitizeObject(body, config.sanitization.strict)

          // Check for potential attacks
          const threats = sanitizer.detectThreats(body)
          if (threats.length > 0) {
            await auditLogger.log({
              event: 'SECURITY_THREAT_DETECTED',
              path,
              method: request.method,
              threats,
            })

            return new NextResponse('Invalid input detected', { status: 400 })
          }

          // Replace request body with sanitized version
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitized),
          })

          Object.defineProperty(sanitizedRequest, 'cookies', {
            value: request.cookies,
            writable: false,
          })
        } catch (error) {
          // Invalid JSON
          return new NextResponse('Invalid request body', { status: 400 })
        }
      }
    }

    // 5. Authentication check for protected routes
    if (path.startsWith('/api/') && !isPublicEndpoint(path)) {
      const token = extractToken(request)

      if (!token) {
        return new NextResponse('Authentication required', { status: 401 })
      }

      try {
        const payload = await verifyToken(token)

        // Add user info to request headers for downstream use
        response.headers.set('X-User-Id', payload.userId)
        response.headers.set('X-User-Roles', JSON.stringify(payload.roles || []))
      } catch (error) {
        await auditLogger.log({
          event: 'INVALID_TOKEN',
          path,
          error: String(error),
        })

        return new NextResponse('Invalid token', { status: 401 })
      }
    }

    // 6. Audit logging for sensitive operations
    if (config.audit?.enabled) {
      await auditLogger.log({
        event: 'REQUEST',
        path,
        method: request.method,
        userId: request.headers.get('X-User-Id') || 'anonymous',
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
      })
    }

    return null // Continue to the route handler
  } catch (error) {
    console.error('Security middleware error:', error)

    await auditLogger.log({
      event: 'SECURITY_MIDDLEWARE_ERROR',
      path,
      error: String(error),
    })

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Helper functions

function getClientIdentifier(request: NextRequest): string {
  // Try to get authenticated user ID first
  const userId = request.headers.get('X-User-Id')
  if (userId) return `user:${userId}`

  // Fall back to IP address
  const ip = getClientIP(request)
  return `ip:${ip}`
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || real || '127.0.0.1'
  return ip.trim()
}

function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const tokenCookie = request.cookies.get('auth-token')
  if (tokenCookie) {
    return tokenCookie.value
  }

  return null
}

function isPublicEndpoint(path: string): boolean {
  const publicEndpoints = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/callback',
    '/api/health',
    '/api/stripe/webhook',
  ]

  return publicEndpoints.some(endpoint => path.startsWith(endpoint))
}

// Export security utilities

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  async check(
    identifier: string,
    path: string,
    config: NonNullable<SecurityConfig['rateLimit']>
  ) {
    const key = `${identifier}:${path}`
    const now = Date.now()
    const windowMs = config.windowMs || 60000
    const maxRequests = config.maxRequests || 60

    let record = this.store.get(key)

    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    record.count++
    this.store.set(key, record)

    const allowed = record.count <= maxRequests
    const remaining = Math.max(0, maxRequests - record.count)

    return {
      allowed,
      remaining,
      limit: maxRequests,
      resetTime: record.resetTime,
      retryAfter: allowed ? 0 : Math.ceil((record.resetTime - now) / 1000),
    }
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

export class SecurityHeaders {
  apply(response: NextResponse, config?: SecurityConfig['headers']) {
    // Content Security Policy
    const csp = config?.contentSecurityPolicy || [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com wss://ws.pusher.com",
      "frame-ancestors 'none'",
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)

    // Other security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    if (config?.strictTransportSecurity) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }
  }
}

export class InputSanitizer {
  private readonly htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  sanitizeString(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '')

    // Escape HTML entities
    sanitized = sanitized.replace(/[&<>"'\/]/g, (match) => this.htmlEntities[match])

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    return sanitized.trim()
  }

  sanitizeObject(obj: any, strict: boolean = true): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, strict))
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue
        }

        // Sanitize key if strict mode
        const sanitizedKey = strict ? this.sanitizeString(key) : key

        sanitized[sanitizedKey] = this.sanitizeObject(value, strict)
      }
      return sanitized
    }

    return obj
  }

  detectThreats(input: any): string[] {
    const threats: string[] = []
    const stringInput = typeof input === 'string' ? input : JSON.stringify(input)

    // SQL Injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|INTO)\b)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    ]

    for (const pattern of sqlPatterns) {
      if (pattern.test(stringInput)) {
        threats.push('SQL_INJECTION')
        break
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ]

    for (const pattern of xssPatterns) {
      if (pattern.test(stringInput)) {
        threats.push('XSS')
        break
      }
    }

    // NoSQL Injection patterns
    if (stringInput.includes('$where') || stringInput.includes('$regex')) {
      threats.push('NOSQL_INJECTION')
    }

    // Command Injection patterns
    const cmdPatterns = [/[;&|`$()]/g]
    for (const pattern of cmdPatterns) {
      if (pattern.test(stringInput)) {
        threats.push('COMMAND_INJECTION')
        break
      }
    }

    // Path Traversal
    if (stringInput.includes('../') || stringInput.includes('..\\')) {
      threats.push('PATH_TRAVERSAL')
    }

    return threats
  }
}

export class CSRFProtection {
  async generate(sessionToken: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(sessionToken + process.env.NEXTAUTH_SECRET)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  async verify(csrfToken: string, sessionToken: string): Promise<boolean> {
    const expected = await this.generate(sessionToken)
    return csrfToken === expected
  }
}

export class AuditLogger {
  async log(entry: {
    event: string
    userId?: string
    path?: string
    method?: string
    ip?: string
    userAgent?: string | null
    metadata?: any
    error?: string
    threats?: string[]
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: entry.userId || 'system',
          action: entry.event,
          entity_type: 'Security',
          entity_id: entry.path || 'system',
          metadata: {
            ...entry.metadata,
            method: entry.method,
            ip: entry.ip,
            userAgent: entry.userAgent,
            error: entry.error,
            threats: entry.threats,
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      // Log to console if database fails
      console.error('Audit log error:', error, entry)
    }
  }
}