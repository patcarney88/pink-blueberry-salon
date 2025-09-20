'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Award,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface StaffMember {
  id: string
  name: string
  role: string
  image?: string
  rating: number
  bookings: number
  revenue: number
  utilization: number
  trend: 'up' | 'down' | 'stable'
  status: 'active' | 'break' | 'offline'
  todayBookings: number
  completedServices: number
  avgServiceTime: number
  customerSatisfaction: number
}

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Maria Rodriguez',
    role: 'Senior Stylist',
    rating: 4.9,
    bookings: 142,
    revenue: 18500,
    utilization: 92,
    trend: 'up',
    status: 'active',
    todayBookings: 8,
    completedServices: 6,
    avgServiceTime: 55,
    customerSatisfaction: 98
  },
  {
    id: '2',
    name: 'John Smith',
    role: 'Hair Colorist',
    rating: 4.8,
    bookings: 128,
    revenue: 16200,
    utilization: 88,
    trend: 'up',
    status: 'active',
    todayBookings: 7,
    completedServices: 5,
    avgServiceTime: 75,
    customerSatisfaction: 96
  },
  {
    id: '3',
    name: 'Sophie Chen',
    role: 'Nail Technician',
    rating: 4.7,
    bookings: 156,
    revenue: 12400,
    utilization: 85,
    trend: 'stable',
    status: 'break',
    todayBookings: 9,
    completedServices: 7,
    avgServiceTime: 45,
    customerSatisfaction: 94
  },
  {
    id: '4',
    name: 'Carlos Martinez',
    role: 'Barber',
    rating: 4.9,
    bookings: 134,
    revenue: 14300,
    utilization: 90,
    trend: 'up',
    status: 'active',
    todayBookings: 10,
    completedServices: 8,
    avgServiceTime: 35,
    customerSatisfaction: 97
  },
  {
    id: '5',
    name: 'Emma Wilson',
    role: 'Esthetician',
    rating: 4.6,
    bookings: 98,
    revenue: 11200,
    utilization: 78,
    trend: 'down',
    status: 'offline',
    todayBookings: 6,
    completedServices: 4,
    avgServiceTime: 60,
    customerSatisfaction: 92
  }
]

export function StaffPerformance() {
  const [staff] = useState<StaffMember[]>(mockStaff)
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'rating'>('revenue')

  const sortedStaff = [...staff].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return b.revenue - a.revenue
      case 'bookings': return b.bookings - a.bookings
      case 'rating': return b.rating - a.rating
      default: return 0
    }
  })

  const getStatusColor = (status: StaffMember['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'break': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: StaffMember['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
      case 'stable': return <div className="h-3 w-3 bg-gray-400 rounded-full" />
    }
  }

  const topPerformer = sortedStaff[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>
              Monitor your team's productivity and customer satisfaction
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Award className="h-3 w-3" />
              Top: {topPerformer.name}
            </Badge>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Today</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Utilization</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.image} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(member.status)}`} />
                      <span className="text-sm capitalize">{member.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {member.completedServices}/{member.todayBookings}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {member.avgServiceTime}m
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{member.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {member.customerSatisfaction}% satisfied
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Progress value={member.utilization} className="w-16 h-2" />
                      <span className="text-sm font-medium">{member.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium">
                        ${member.revenue.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.bookings} bookings
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(member.trend)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Schedule</DropdownMenuItem>
                        <DropdownMenuItem>Performance Report</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}