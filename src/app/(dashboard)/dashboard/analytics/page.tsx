import { Suspense } from 'react'
import { FinancialAnalytics } from '@/components/dashboard/analytics/financial-analytics'
import { BookingAnalytics } from '@/components/dashboard/analytics/booking-analytics'
import { CustomerAnalytics } from '@/components/dashboard/analytics/customer-analytics'
import { StaffAnalytics } from '@/components/dashboard/analytics/staff-analytics'
import { ProductAnalytics } from '@/components/dashboard/analytics/product-analytics'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your salon's performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Analytics */}
      <Suspense fallback={<DashboardSkeleton type="chart" />}>
        <FinancialAnalytics />
      </Suspense>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Analytics */}
        <Suspense fallback={<DashboardSkeleton type="chart" />}>
          <BookingAnalytics />
        </Suspense>

        {/* Customer Analytics */}
        <Suspense fallback={<DashboardSkeleton type="chart" />}>
          <CustomerAnalytics />
        </Suspense>

        {/* Staff Analytics */}
        <Suspense fallback={<DashboardSkeleton type="chart" />}>
          <StaffAnalytics />
        </Suspense>

        {/* Product Analytics */}
        <Suspense fallback={<DashboardSkeleton type="chart" />}>
          <ProductAnalytics />
        </Suspense>
      </div>
    </div>
  )
}