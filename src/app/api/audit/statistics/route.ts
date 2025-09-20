import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/audit/audit-service'
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
    const filters: any = {}

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branchId = searchParams.get('branchId')

    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (branchId) filters.branchId = branchId

    // Get statistics
    const statistics = await auditService.getStatistics(filters)

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Audit statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to get audit statistics' },
      { status: 500 }
    )
  }
}