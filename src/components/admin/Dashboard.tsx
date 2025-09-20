'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts'
import {
  CalendarIcon, UsersIcon, DollarSignIcon, ShoppingBagIcon,
  TrendingUpIcon, TrendingDownIcon, ActivityIcon, ClockIcon,
  AlertCircle, CheckCircle, XCircle, RefreshCw
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher/client'

interface DashboardMetrics {
  revenue: {
    today: number
    week: number
    month: number
    trend: 'up' | 'down' | 'stable'
    percentage: number
  }
  appointments: {
    today: number
    week: number
    pending: number
    confirmed: number
    completed: number
  }
  customers: {
    total: number
    new: number
    returning: number
    vip: number
  }
  staff: {
    active: number
    onBreak: number
    offline: number
    utilization: number
  }
  products: {
    topSelling: Array<{ name: string; sales: number }>
    lowStock: Array<{ name: string; stock: number }>
    revenue: number
  }
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardMetrics()
    subscribeToRealtimeUpdates()

    const interval = setInterval(fetchDashboardMetrics, 60000) // Refresh every minute

    return () => {
      clearInterval(interval)
      unsubscribeFromRealtimeUpdates()
    }
  }, [selectedPeriod])

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard?period=${selectedPeriod}`)
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToRealtimeUpdates = () => {
    const channel = pusherClient.subscribe(CHANNELS.ADMIN_PRESENCE('tenant-id'))

    channel.bind(EVENTS.METRICS_UPDATE, (data: any) => {
      setRealtimeUpdates(prev => [data, ...prev].slice(0, 10))
      // Update specific metrics in real-time
      if (data.type === 'appointment') {
        setMetrics(prev => prev ? {
          ...prev,
          appointments: {
            ...prev.appointments,
            [data.status.toLowerCase()]: prev.appointments[data.status.toLowerCase()] + 1
          }
        } : null)
      }
    })
  }

  const unsubscribeFromRealtimeUpdates = () => {
    pusherClient.unsubscribe(CHANNELS.ADMIN_PRESENCE('tenant-id'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-pink-500" />
      </div>
    )
  }

  if (!metrics) return null

  // Sample data for charts
  const revenueData = [
    { name: 'Mon', revenue: 4500 },
    { name: 'Tue', revenue: 5200 },
    { name: 'Wed', revenue: 4800 },
    { name: 'Thu', revenue: 6100 },
    { name: 'Fri', revenue: 7200 },
    { name: 'Sat', revenue: 8500 },
    { name: 'Sun', revenue: 6900 },
  ]

  const appointmentStatusData = [
    { name: 'Confirmed', value: metrics.appointments.confirmed, color: '#10b981' },
    { name: 'Pending', value: metrics.appointments.pending, color: '#f59e0b' },
    { name: 'Completed', value: metrics.appointments.completed, color: '#3b82f6' },
  ]

  const customerSegmentData = [
    { name: 'New', value: metrics.customers.new, color: '#8b5cf6' },
    { name: 'Returning', value: metrics.customers.returning, color: '#ec4899' },
    { name: 'VIP', value: metrics.customers.vip, color: '#fbbf24' },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Real-time overview of your salon operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'day' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('day')}
          >
            Today
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
          >
            This Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenue.today.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenue.trend === 'up' ? (
                <TrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.revenue.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {metrics.revenue.percentage}%
              </span>
              <span className="ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.appointments.today}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {metrics.appointments.pending} pending
              </Badge>
              <Badge variant="default" className="text-xs">
                {metrics.appointments.confirmed} confirmed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customers.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-500">+{metrics.customers.new}</span>
              <span className="ml-1">new this {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.staff.utilization}%</div>
            <Progress value={metrics.staff.utilization} className="mt-2" />
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-500">{metrics.staff.active} active</span>
              <span className="text-yellow-500">{metrics.staff.onBreak} break</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ec4899"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>Current appointment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Upcoming appointments and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Sample appointment list */}
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">9:00 AM - Sarah Johnson</p>
                      <p className="text-sm text-gray-500">Hair Color & Cut</p>
                    </div>
                  </div>
                  <Badge variant="default">Confirmed</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">10:30 AM - Mike Smith</p>
                      <p className="text-sm text-gray-500">Men's Haircut</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Distribution of customer types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerSegmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.products.topSelling.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{product.name}</span>
                      <Badge>{product.sales} sold</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.products.lowStock.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{product.name}</span>
                      <Badge variant="destructive">{product.stock} left</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>Today's staff metrics and utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Emily Chen</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">8 appointments</span>
                    <Progress value={80} className="w-24" />
                    <span className="text-sm font-medium">80%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>David Park</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">6 appointments</span>
                    <Progress value={60} className="w-24" />
                    <span className="text-sm font-medium">60%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activity</CardTitle>
              <CardDescription>Live updates from your salon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realtimeUpdates.map((update, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    {update.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : update.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{update.message}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {format(new Date(update.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                ))}
                {realtimeUpdates.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Waiting for real-time updates...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}