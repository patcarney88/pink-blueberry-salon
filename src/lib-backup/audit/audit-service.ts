import { prisma } from '@/lib/db/prisma'
import { redis, cacheManager } from '@/lib/redis/client'
import { createHash } from 'crypto'
import { z } from 'zod'

// Audit event types
export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_TOKEN_REFRESH = 'AUTH_TOKEN_REFRESH',
  AUTH_PASSWORD_RESET = 'AUTH_PASSWORD_RESET',
  AUTH_MFA_ENABLED = 'AUTH_MFA_ENABLED',
  AUTH_MFA_DISABLED = 'AUTH_MFA_DISABLED',
  
  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSIONS_CHANGED = 'USER_PERMISSIONS_CHANGED',
  
  // Data access events
  DATA_READ = 'DATA_READ',
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  
  // Security events
  SECURITY_BREACH_ATTEMPT = 'SECURITY_BREACH_ATTEMPT',
  SECURITY_RATE_LIMIT = 'SECURITY_RATE_LIMIT',
  SECURITY_SQL_INJECTION = 'SECURITY_SQL_INJECTION',
  SECURITY_XSS_ATTEMPT = 'SECURITY_XSS_ATTEMPT',
  SECURITY_CSRF_VIOLATION = 'SECURITY_CSRF_VIOLATION',
  SECURITY_PERMISSION_DENIED = 'SECURITY_PERMISSION_DENIED',
  
  // System events
  SYSTEM_STARTUP = 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  SYSTEM_BACKUP_CREATED = 'SYSTEM_BACKUP_CREATED',
  SYSTEM_RESTORE_PERFORMED = 'SYSTEM_RESTORE_PERFORMED',
  
  // Business events
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  REPORT_GENERATED = 'REPORT_GENERATED',
}

// Audit event severity levels
export enum AuditSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Audit event schema
const auditEventSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  severity: z.nativeEnum(AuditSeverity),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  branchId: z.string().optional(),
})

export type AuditEvent = z.infer<typeof auditEventSchema>

// Audit search filters
export interface AuditSearchFilters {
  eventTypes?: AuditEventType[]
  severities?: AuditSeverity[]
  userId?: string
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  ipAddress?: string
  branchId?: string
  searchTerm?: string
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'severity' | 'event_type'
  sortOrder?: 'asc' | 'desc'
}

// Audit retention policy
export interface RetentionPolicy {
  retentionDays: number
  archiveAfterDays?: number
  deleteAfterDays: number
  compressArchives: boolean
}

// Default retention policies by severity
const DEFAULT_RETENTION_POLICIES: Record<AuditSeverity, RetentionPolicy> = {
  [AuditSeverity.DEBUG]: {
    retentionDays: 7,
    deleteAfterDays: 7,
    compressArchives: false,
  },
  [AuditSeverity.INFO]: {
    retentionDays: 30,
    archiveAfterDays: 30,
    deleteAfterDays: 90,
    compressArchives: true,
  },
  [AuditSeverity.WARNING]: {
    retentionDays: 90,
    archiveAfterDays: 90,
    deleteAfterDays: 365,
    compressArchives: true,
  },
  [AuditSeverity.ERROR]: {
    retentionDays: 365,
    archiveAfterDays: 365,
    deleteAfterDays: 1825, // 5 years
    compressArchives: true,
  },
  [AuditSeverity.CRITICAL]: {
    retentionDays: 2555, // 7 years
    archiveAfterDays: 365,
    deleteAfterDays: 2555,
    compressArchives: true,
  },
}

export class AuditService {
  private readonly batchSize = 100
  private eventQueue: AuditEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly flushInterval = 5000 // 5 seconds
  
  constructor() {
    // Start periodic flush
    this.startPeriodicFlush()
    
    // Handle graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('SIGINT', () => this.shutdown())
      process.on('SIGTERM', () => this.shutdown())
    }
  }
  
  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      // Validate event
      const validatedEvent = auditEventSchema.parse(event)
      
      // Add timestamp and hash
      const auditEntry = {
        ...validatedEvent,
        timestamp: new Date(),
        hash: this.generateEventHash(validatedEvent),
      }
      
      // Add to queue
      this.eventQueue.push(auditEntry)
      
      // Flush if batch size reached
      if (this.eventQueue.length >= this.batchSize) {
        await this.flush()
      }
      
      // Store critical events immediately
      if (validatedEvent.severity === AuditSeverity.CRITICAL) {
        await this.flush()
      }
      
      // Real-time alerts for security events
      if (this.isSecurityEvent(validatedEvent.eventType)) {
        await this.sendSecurityAlert(auditEntry)
      }
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Fallback to console logging for audit trail integrity
      console.log('AUDIT_FALLBACK:', JSON.stringify(event))
    }
  }
  
  /**
   * Search audit logs
   */
  async search(filters: AuditSearchFilters): Promise<{
    events: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const page = filters.page || 1
    const limit = filters.limit || 50
    const offset = (page - 1) * limit
    
    // Build query conditions
    const where: any = {}
    
    if (filters.eventTypes?.length) {
      where.event_type = { in: filters.eventTypes }
    }
    
    if (filters.severities?.length) {
      where.severity = { in: filters.severities }
    }
    
    if (filters.userId) {
      where.user_id = filters.userId
    }
    
    if (filters.entityType) {
      where.entity_type = filters.entityType
    }
    
    if (filters.entityId) {
      where.entity_id = filters.entityId
    }
    
    if (filters.ipAddress) {
      where.ip_address = filters.ipAddress
    }
    
    if (filters.branchId) {
      where.branch_id = filters.branchId
    }
    
    if (filters.startDate || filters.endDate) {
      where.created_at = {}
      if (filters.startDate) {
        where.created_at.gte = filters.startDate
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate
      }
    }
    
    if (filters.searchTerm) {
      where.OR = [
        { action: { contains: filters.searchTerm, mode: 'insensitive' } },
        { metadata: { path: ['$'], string_contains: filters.searchTerm } },
      ]
    }
    
    // Execute query
    const [events, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          [filters.sortBy || 'created_at']: filters.sortOrder || 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])
    
    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }
  
  /**
   * Get audit statistics
   */
  async getStatistics(filters?: {
    startDate?: Date
    endDate?: Date
    branchId?: string
  }): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    securityEvents: number
    errorRate: number
    averageEventsPerDay: number
  }> {
    const where: any = {}
    
    if (filters?.startDate || filters?.endDate) {
      where.created_at = {}
      if (filters.startDate) {
        where.created_at.gte = filters.startDate
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate
      }
    }
    
    if (filters?.branchId) {
      where.branch_id = filters.branchId
    }
    
    // Get aggregated data
    const [totalEvents, eventsByType, eventsBySeverity, topUsers, securityEvents] = await Promise.all([
      prisma.auditLog.count({ where }),
      
      prisma.auditLog.groupBy({
        by: ['event_type'],
        where,
        _count: true,
      }),
      
      prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      
      prisma.auditLog.groupBy({
        by: ['user_id'],
        where: {
          ...where,
          user_id: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            user_id: 'desc',
          },
        },
        take: 10,
      }),
      
      prisma.auditLog.count({
        where: {
          ...where,
          event_type: {
            in: [
              AuditEventType.SECURITY_BREACH_ATTEMPT,
              AuditEventType.SECURITY_RATE_LIMIT,
              AuditEventType.SECURITY_SQL_INJECTION,
              AuditEventType.SECURITY_XSS_ATTEMPT,
              AuditEventType.SECURITY_CSRF_VIOLATION,
              AuditEventType.SECURITY_PERMISSION_DENIED,
            ],
          },
        },
      }),
    ])
    
    // Calculate error rate
    const errorEvents = await prisma.auditLog.count({
      where: {
        ...where,
        severity: { in: [AuditSeverity.ERROR, AuditSeverity.CRITICAL] },
      },
    })
    
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
    
    // Calculate average events per day
    let averageEventsPerDay = 0
    if (filters?.startDate && filters?.endDate) {
      const days = Math.ceil(
        (filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      averageEventsPerDay = days > 0 ? totalEvents / days : 0
    }
    
    return {
      totalEvents,
      eventsByType: Object.fromEntries(
        eventsByType.map(item => [item.event_type, item._count])
      ),
      eventsBySeverity: Object.fromEntries(
        eventsBySeverity.map(item => [item.severity, item._count])
      ),
      topUsers: topUsers.map(item => ({
        userId: item.user_id!,
        count: item._count,
      })),
      securityEvents,
      errorRate,
      averageEventsPerDay,
    }
  }
  
  /**
   * Export audit logs
   */
  async export(filters: AuditSearchFilters, format: 'json' | 'csv' = 'json'): Promise<string> {
    // Get all matching events
    const allFilters = { ...filters, limit: 10000 } // Max export size
    const { events } = await this.search(allFilters)
    
    if (format === 'json') {
      return JSON.stringify(events, null, 2)
    } else {
      // CSV export
      const headers = [
        'timestamp',
        'event_type',
        'severity',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'ip_address',
        'user_agent',
      ]
      
      const rows = events.map(event => [
        event.created_at,
        event.event_type,
        event.severity,
        event.user_id || '',
        event.action,
        event.entity_type || '',
        event.entity_id || '',
        event.ip_address || '',
        event.user_agent || '',
      ])
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      return csv
    }
  }
  
  /**
   * Apply retention policies
   */
  async applyRetentionPolicies(): Promise<{
    archived: number
    deleted: number
  }> {
    let archived = 0
    let deleted = 0
    
    for (const [severity, policy] of Object.entries(DEFAULT_RETENTION_POLICIES)) {
      const now = new Date()
      
      // Delete old events
      const deleteDate = new Date(now.getTime() - policy.deleteAfterDays * 24 * 60 * 60 * 1000)
      const deleteResult = await prisma.auditLog.deleteMany({
        where: {
          severity: severity as AuditSeverity,
          created_at: { lt: deleteDate },
        },
      })
      deleted += deleteResult.count
      
      // Archive events if policy specifies
      if (policy.archiveAfterDays) {
        const archiveDate = new Date(now.getTime() - policy.archiveAfterDays * 24 * 60 * 60 * 1000)
        const eventsToArchive = await prisma.auditLog.findMany({
          where: {
            severity: severity as AuditSeverity,
            created_at: {
              lt: archiveDate,
              gte: deleteDate,
            },
            archived: false,
          },
        })
        
        if (eventsToArchive.length > 0) {
          // Archive to S3 or external storage
          await this.archiveEvents(eventsToArchive, policy.compressArchives)
          
          // Mark as archived
          await prisma.auditLog.updateMany({
            where: {
              id: { in: eventsToArchive.map(e => e.id) },
            },
            data: {
              archived: true,
            },
          })
          
          archived += eventsToArchive.length
        }
      }
    }
    
    return { archived, deleted }
  }
  
  // Private methods
  
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush().catch(console.error)
      }
    }, this.flushInterval)
  }
  
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return
    
    const events = [...this.eventQueue]
    this.eventQueue = []
    
    try {
      // Batch insert
      await prisma.auditLog.createMany({
        data: events.map(event => ({
          event_type: event.eventType,
          severity: event.severity,
          user_id: event.userId,
          session_id: event.sessionId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          action: event.action,
          metadata: event.metadata || {},
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          request_id: event.requestId,
          correlation_id: event.correlationId,
          branch_id: event.branchId,
          hash: event.hash,
        })),
      })
    } catch (error) {
      console.error('Failed to flush audit events:', error)
      // Re-add to queue for retry
      this.eventQueue.unshift(...events)
    }
  }
  
  private generateEventHash(event: AuditEvent): string {
    const data = JSON.stringify({
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      action: event.action,
      timestamp: new Date().toISOString(),
    })
    
    return createHash('sha256').update(data).digest('hex')
  }
  
  private isSecurityEvent(eventType: AuditEventType): boolean {
    return eventType.startsWith('SECURITY_') || 
           eventType.startsWith('AUTH_FAILED')
  }
  
  private async sendSecurityAlert(event: any): Promise<void> {
    try {
      // Store in Redis for real-time monitoring
      await redis.publish('security:alerts', JSON.stringify(event))
      
      // Cache for dashboard
      await cacheManager.set(
        `security:alert:${event.hash}`,
        event,
        300 // 5 minutes
      )
      
      // Send to monitoring service
      // This would integrate with your alerting system
      console.log('Security alert:', event)
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }
  
  private async archiveEvents(events: any[], compress: boolean): Promise<void> {
    // This would implement archival to S3 or other storage
    // For now, just log
    console.log(`Archiving ${events.length} events (compress: ${compress})`)
  }
  
  private async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    // Final flush
    await this.flush()
    
    console.log('Audit service shutdown complete')
  }
}

// Singleton instance
export const auditService = new AuditService()

// Audit middleware helper
export function auditMiddleware(
  eventType: AuditEventType,
  severity: AuditSeverity = AuditSeverity.INFO
) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    // Capture original end method
    const originalEnd = res.end
    
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime
      
      // Log audit event
      auditService.log({
        eventType,
        severity: res.statusCode >= 400 ? AuditSeverity.ERROR : severity,
        userId: req.user?.id,
        sessionId: req.session?.id,
        action: `${req.method} ${req.path}`,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          query: req.query,
          params: req.params,
        },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        branchId: req.headers['x-branch-id'],
      }).catch(console.error)
      
      // Call original end
      originalEnd.apply(res, args)
    }
    
    next()
  }
}