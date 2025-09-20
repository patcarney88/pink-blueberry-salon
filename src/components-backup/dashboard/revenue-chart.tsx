'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { TrendingUp, Download, Calendar } from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns'

const generateDailyData = () => {
  const data = []
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i)
    data.push({
      date: format(date, 'MMM dd'),
      revenue: Math.floor(Math.random() * 5000) + 8000,
      bookings: Math.floor(Math.random() * 30) + 25,
      services: Math.floor(Math.random() * 20) + 15,
      products: Math.floor(Math.random() * 2000) + 1000
    })
  }
  return data
}

const generateWeeklyData = () => {
  const data = []
  for (let i = 11; i >= 0; i--) {
    const date = startOfWeek(subDays(new Date(), i * 7))
    data.push({
      week: format(date, 'MMM dd'),
      revenue: Math.floor(Math.random() * 35000) + 50000,
      bookings: Math.floor(Math.random() * 200) + 150,
      services: Math.floor(Math.random() * 150) + 100,
      products: Math.floor(Math.random() * 10000) + 5000
    })
  }
  return data
}

const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 50000) + 120000,
    bookings: Math.floor(Math.random() * 800) + 600,
    services: Math.floor(Math.random() * 600) + 400,
    products: Math.floor(Math.random() * 30000) + 20000,
    target: 145000
  }))
}

export function RevenueChart() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')

  const dailyData = generateDailyData()
  const weeklyData = generateWeeklyData()
  const monthlyData = generateMonthlyData()

  const getData = () => {
    switch (timeframe) {
      case 'daily': return dailyData
      case 'weekly': return weeklyData
      case 'monthly': return monthlyData
    }
  }

  const currentData = getData()
  const totalRevenue = currentData.reduce((sum, item) => sum + (item.revenue || 0), 0)
  const avgRevenue = Math.floor(totalRevenue / currentData.length)
  const growth = 12.5 // Mock growth percentage

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: currentData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    const xAxisKey = timeframe === 'daily' ? 'date' : timeframe === 'weekly' ? 'week' : 'month'

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={xAxisKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="services"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="products"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            {timeframe === 'monthly' && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={xAxisKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="services" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="products" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
          </BarChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={xAxisKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="services"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="products"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Track your salon's financial performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold">${totalRevenue.toLocaleString()}</span>
            <Badge variant="secondary" className="ml-2">
              +{growth}%
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Avg: ${avgRevenue.toLocaleString()} per {timeframe === 'daily' ? 'day' : timeframe === 'weekly' ? 'week' : 'month'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="daily" onClick={() => setTimeframe('daily')}>
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" onClick={() => setTimeframe('weekly')}>
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" onClick={() => setTimeframe('monthly')}>
                Monthly
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={chartType === 'line' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                Bar
              </Button>
              <Button
                variant={chartType === 'area' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
              >
                Area
              </Button>
            </div>
          </div>
          <TabsContent value={timeframe} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Add missing Badge component import
import { Badge } from '@/components/ui/badge'