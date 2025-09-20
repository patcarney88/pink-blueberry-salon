'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPIData {
  revenue: {
    value: number
    change: number
    period: 'daily' | 'weekly' | 'monthly'
  }
  bookings: {
    value: number
    change: number
    upcoming: number
  }
  customers: {
    total: number
    new: number
    change: number
  }
  staff: {
    active: number
    utilization: number
    change: number
  }
}

export function KPICards() {
  const [data, setData] = useState<KPIData>({
    revenue: { value: 12847, change: 12.5, period: 'daily' },
    bookings: { value: 47, change: 8.2, upcoming: 23 },
    customers: { total: 1284, new: 42, change: 5.7 },
    staff: { active: 8, utilization: 87, change: 3.2 }
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          value: prev.revenue.value + Math.floor(Math.random() * 100 - 30)
        },
        bookings: {
          ...prev.bookings,
          value: prev.bookings.value + Math.floor(Math.random() * 3 - 1)
        }
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      title: "Today's Revenue",
      value: `$${data.revenue.value.toLocaleString()}`,
      change: data.revenue.change,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `+${data.revenue.change}% from yesterday`
    },
    {
      title: 'Total Bookings',
      value: data.bookings.value,
      change: data.bookings.change,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${data.bookings.upcoming} upcoming today`
    },
    {
      title: 'Active Customers',
      value: data.customers.total.toLocaleString(),
      change: data.customers.change,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `${data.customers.new} new this month`
    },
    {
      title: 'Staff Utilization',
      value: `${data.staff.utilization}%`,
      change: data.staff.change,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `${data.staff.active} staff active`
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isPositive = card.change >= 0
        const TrendIcon = isPositive ? TrendingUp : TrendingDown

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={cn(
                  'flex items-center gap-1',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(card.change)}%</span>
                </div>
                <span>{card.subtitle}</span>
              </div>
            </CardContent>
            {/* Animated background effect */}
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse" />
          </Card>
        )
      })}
    </div>
  )
}