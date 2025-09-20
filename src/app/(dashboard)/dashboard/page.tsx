import { Suspense } from 'react'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { LiveBookingFeed } from '@/components/dashboard/live-booking-feed'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StaffPerformance } from '@/components/dashboard/staff-performance'
import { CustomerSatisfaction } from '@/components/dashboard/customer-satisfaction'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your salon today.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<DashboardSkeleton type="kpi" />}>
        <KPICards />
      </Suspense>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<DashboardSkeleton type="chart" />}>
            <RevenueChart />
          </Suspense>
        </div>

        {/* Live Booking Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <Suspense fallback={<DashboardSkeleton type="feed" />}>
            <LiveBookingFeed />
          </Suspense>
        </div>

        {/* Staff Performance - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<DashboardSkeleton type="table" />}>
            <StaffPerformance />
          </Suspense>
        </div>

        {/* Customer Satisfaction - Takes 1 column */}
        <div className="lg:col-span-1">
          <Suspense fallback={<DashboardSkeleton type="chart" />}>
            <CustomerSatisfaction />
          </Suspense>
        </div>
      </div>
    </div>
  )
}