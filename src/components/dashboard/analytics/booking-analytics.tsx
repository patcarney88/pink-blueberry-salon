'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const peakHoursData = [
  { hour: '9AM', bookings: 12 },
  { hour: '10AM', bookings: 25 },
  { hour: '11AM', bookings: 32 },
  { hour: '12PM', bookings: 28 },
  { hour: '1PM', bookings: 35 },
  { hour: '2PM', bookings: 42 },
  { hour: '3PM', bookings: 38 },
  { hour: '4PM', bookings: 45 },
  { hour: '5PM', bookings: 48 },
  { hour: '6PM', bookings: 40 },
  { hour: '7PM', bookings: 22 },
  { hour: '8PM', bookings: 15 }
]

const weekdayDistribution = [
  { day: 'Mon', bookings: 65, capacity: 80 },
  { day: 'Tue', bookings: 72, capacity: 80 },
  { day: 'Wed', bookings: 78, capacity: 80 },
  { day: 'Thu', bookings: 82, capacity: 90 },
  { day: 'Fri', bookings: 95, capacity: 100 },
  { day: 'Sat', bookings: 98, capacity: 100 },
  { day: 'Sun', bookings: 45, capacity: 60 }
]

const servicePopularity = [
  { service: 'Hair Cut', bookings: 450, avgDuration: 45 },
  { service: 'Color', bookings: 280, avgDuration: 120 },
  { service: 'Highlights', bookings: 195, avgDuration: 150 },
  { service: 'Blowout', bookings: 320, avgDuration: 30 },
  { service: 'Treatment', bookings: 180, avgDuration: 60 },
  { service: 'Extensions', bookings: 85, avgDuration: 180 }
]

const bookingMetrics = {
  totalBookings: 1842,
  avgBookingsPerDay: 61,
  peakDay: 'Friday',
  peakHour: '5PM',
  cancellationRate: 5.2,
  noShowRate: 2.1,
  rebookingRate: 78,
  avgLeadTime: 3.5
}

export function BookingAnalytics() {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Booking Analytics</CardTitle>
            <CardDescription>
              Appointment patterns and peak times analysis
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {bookingMetrics.totalBookings} bookings
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              Daily Avg
            </div>
            <p className="text-xl font-bold">{bookingMetrics.avgBookingsPerDay}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              Peak Day
            </div>
            <p className="text-xl font-bold">{bookingMetrics.peakDay}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Peak Hour
            </div>
            <p className="text-xl font-bold">{bookingMetrics.peakHour}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Rebook Rate
            </div>
            <p className="text-xl font-bold">{bookingMetrics.rebookingRate}%</p>
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div>
          <h3 className="text-sm font-medium mb-3">Peak Hours Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="bookings"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekday Capacity */}
        <div>
          <h3 className="text-sm font-medium mb-3">Weekly Capacity Utilization</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekdayDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="capacity"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Popularity */}
        <div>
          <h3 className="text-sm font-medium mb-3">Popular Services</h3>
          <div className="space-y-2">
            {servicePopularity.slice(0, 5).map((service, index) => (
              <div key={service.service} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{service.service}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.avgDuration} min avg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{service.bookings}</p>
                  <p className="text-xs text-muted-foreground">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Health Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-muted-foreground">Cancellation</p>
            <p className="text-lg font-bold text-red-600">{bookingMetrics.cancellationRate}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <p className="text-xs text-muted-foreground">No-Show</p>
            <p className="text-lg font-bold text-orange-600">{bookingMetrics.noShowRate}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <p className="text-xs text-muted-foreground">Lead Time</p>
            <p className="text-lg font-bold text-green-600">{bookingMetrics.avgLeadTime}d</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}