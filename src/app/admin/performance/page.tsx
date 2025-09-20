import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PerformanceDashboard } from '@/components/admin/performance-dashboard'

export default function PerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground">
          Monitor Core Web Vitals and application performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LCP Score</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1s</div>
            <p className="text-xs text-muted-foreground">
              Largest Contentful Paint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FID Score</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">
              First Input Delay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CLS Score</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.12</div>
            <p className="text-xs text-muted-foreground">
              Cumulative Layout Shift
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94/100</div>
            <p className="text-xs text-muted-foreground">
              Lighthouse Performance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals Trends</CardTitle>
            <CardDescription>
              Performance metrics over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <PerformanceDashboard type="trends" />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>
              Percentage of good, needs improvement, and poor scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <PerformanceDashboard type="distribution" />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>
            Automated suggestions to improve Core Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <h4 className="font-medium">Image Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  All images are properly optimized and using next/image with WebP format
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <h4 className="font-medium">Bundle Size</h4>
                <p className="text-sm text-muted-foreground">
                  JavaScript bundle is optimized with code splitting and tree shaking
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
              <div>
                <h4 className="font-medium">Font Loading</h4>
                <p className="text-sm text-muted-foreground">
                  Consider using font-display: swap for better CLS scores
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <h4 className="font-medium">Caching Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  Proper cache headers are configured for static assets
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}