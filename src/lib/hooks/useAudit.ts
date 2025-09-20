'use client'

import { useCallback } from 'react'
import { AuditEventType, AuditSeverity } from '@/lib/audit/audit-service'

interface AuditHookOptions {
  entityType?: string
  entityId?: string
  branchId?: string
}

export function useAudit(options?: AuditHookOptions) {
  const logAudit = useCallback(async (
    eventType: AuditEventType,
    action: string,
    metadata?: any,
    severity: AuditSeverity = AuditSeverity.INFO
  ) => {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          severity,
          action,
          metadata,
          entityType: options?.entityType,
          entityId: options?.entityId,
          branchId: options?.branchId,
        }),
      })

      if (!response.ok) {
        console.error('Failed to log audit event')
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }, [options])

  const logSuccess = useCallback((action: string, metadata?: any) => {
    return logAudit(AuditEventType.DATA_UPDATED, action, metadata, AuditSeverity.INFO)
  }, [logAudit])

  const logError = useCallback((action: string, error: any) => {
    return logAudit(
      AuditEventType.SYSTEM_ERROR,
      action,
      { error: error.message || error },
      AuditSeverity.ERROR
    )
  }, [logAudit])

  const logSecurity = useCallback((
    securityType: 'breach' | 'rate_limit' | 'permission_denied',
    details: any
  ) => {
    const eventTypeMap = {
      breach: AuditEventType.SECURITY_BREACH_ATTEMPT,
      rate_limit: AuditEventType.SECURITY_RATE_LIMIT,
      permission_denied: AuditEventType.SECURITY_PERMISSION_DENIED,
    }

    return logAudit(
      eventTypeMap[securityType],
      `Security event: ${securityType}`,
      details,
      AuditSeverity.WARNING
    )
  }, [logAudit])

  const logDataAccess = useCallback((
    operation: 'read' | 'create' | 'update' | 'delete',
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    const eventTypeMap = {
      read: AuditEventType.DATA_READ,
      create: AuditEventType.DATA_CREATED,
      update: AuditEventType.DATA_UPDATED,
      delete: AuditEventType.DATA_DELETED,
    }

    return logAudit(
      eventTypeMap[operation],
      `${operation} ${entityType}`,
      { entityType, entityId, ...details },
      AuditSeverity.INFO
    )
  }, [logAudit])

  return {
    logAudit,
    logSuccess,
    logError,
    logSecurity,
    logDataAccess,
  }
}