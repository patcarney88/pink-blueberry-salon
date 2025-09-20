import { NextRequest, NextResponse } from 'next/server'
import { auditService, AuditEventType, AuditSeverity } from '@/lib/audit/audit-service'
import { authMiddleware } from '@/lib/security/middleware'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request)
    if (!authResult.authorized || !authResult.user?.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') as 'json' | 'csv' || 'json'

    // Parse filters
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10000'),
      sortBy: searchParams.get('sortBy') as any || 'created_at',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      searchTerm: searchParams.get('searchTerm') || undefined,
      userId: searchParams.get('userId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
      branchId: searchParams.get('branchId') || undefined,
    }

    // Parse date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    // Parse severities
    const severitiesParam = searchParams.get('severities')
    if (severitiesParam) {
      filters.severities = severitiesParam.split(',') as AuditSeverity[]
    }

    // Parse event types
    const eventTypesParam = searchParams.get('eventTypes')
    if (eventTypesParam) {
      filters.eventTypes = eventTypesParam.split(',') as AuditEventType[]
    }

    // Export audit logs
    const exportData = await auditService.export(filters, format)

    // Log this export
    await auditService.log({
      eventType: AuditEventType.DATA_EXPORTED,
      severity: AuditSeverity.INFO,
      userId: authResult.user.id,
      action: 'Export audit logs',
      metadata: { format, filters },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    // Set appropriate headers
    const headers = new Headers()
    if (format === 'json') {
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', 'attachment; filename="audit-logs.json"')
    } else {
      headers.set('Content-Type', 'text/csv')
      headers.set('Content-Disposition', 'attachment; filename="audit-logs.csv"')
    }

    return new NextResponse(exportData, { headers })
  } catch (error) {
    console.error('Audit export error:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}