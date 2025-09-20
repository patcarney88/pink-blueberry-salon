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

    // Parse filters
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
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

    // Search audit logs
    const result = await auditService.search(filters)

    // Log this access
    await auditService.log({
      eventType: AuditEventType.DATA_READ,
      severity: AuditSeverity.INFO,
      userId: authResult.user.id,
      action: 'View audit logs',
      metadata: { filters },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Audit search error:', error)
    return NextResponse.json(
      { error: 'Failed to search audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Log the audit event
    await auditService.log({
      ...body,
      userId: body.userId || authResult.user?.id,
      ipAddress: body.ipAddress || request.ip,
      userAgent: body.userAgent || request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json(
      { error: 'Failed to log audit event' },
      { status: 500 }
    )
  }
}