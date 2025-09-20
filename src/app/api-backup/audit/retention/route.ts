import { NextRequest, NextResponse } from 'next/server'
import { auditService, AuditEventType, AuditSeverity } from '@/lib/audit/audit-service'
import { authMiddleware } from '@/lib/security/middleware'

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or admin only
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Check if it's a cron job
    const isCronJob = authHeader === `Bearer ${cronSecret}`

    if (!isCronJob) {
      // Check admin authentication
      const authResult = await authMiddleware(request)
      if (!authResult.authorized || !authResult.user?.roles?.includes('ADMIN')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Apply retention policies
    const result = await auditService.applyRetentionPolicies()

    // Log this maintenance task
    await auditService.log({
      eventType: AuditEventType.SYSTEM_CONFIG_CHANGED,
      severity: AuditSeverity.INFO,
      action: 'Applied audit retention policies',
      metadata: result,
      userId: isCronJob ? undefined : request.headers.get('x-user-id') || undefined,
    })

    return NextResponse.json({
      success: true,
      archived: result.archived,
      deleted: result.deleted,
    })
  } catch (error) {
    console.error('Retention policy error:', error)

    // Log the error
    await auditService.log({
      eventType: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.ERROR,
      action: 'Failed to apply retention policies',
      metadata: { error: error.message },
    })

    return NextResponse.json(
      { error: 'Failed to apply retention policies' },
      { status: 500 }
    )
  }
}