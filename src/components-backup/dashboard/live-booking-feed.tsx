'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, User, Scissors, Calendar } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Booking {
  id: string
  customerName: string
  customerImage?: string
  service: string
  staffName: string
  time: Date
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed' | 'cancelled'
  duration: number
  price: number
}

const mockBookings: Booking[] = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    service: 'Hair Cut & Style',
    staffName: 'Maria Rodriguez',
    time: new Date(Date.now() + 30 * 60000),
    status: 'confirmed',
    duration: 60,
    price: 85
  },
  {
    id: '2',
    customerName: 'Emily Davis',
    service: 'Color Treatment',
    staffName: 'John Smith',
    time: new Date(Date.now() + 60 * 60000),
    status: 'confirmed',
    duration: 120,
    price: 150
  },
  {
    id: '3',
    customerName: 'Michael Chen',
    service: 'Beard Trim',
    staffName: 'Carlos Martinez',
    time: new Date(Date.now() + 90 * 60000),
    status: 'pending',
    duration: 30,
    price: 35
  },
  {
    id: '4',
    customerName: 'Lisa Anderson',
    service: 'Full Highlights',
    staffName: 'Maria Rodriguez',
    time: new Date(Date.now() + 120 * 60000),
    status: 'confirmed',
    duration: 180,
    price: 220
  },
  {
    id: '5',
    customerName: 'Robert Taylor',
    service: 'Hair Cut',
    staffName: 'John Smith',
    time: new Date(Date.now() + 150 * 60000),
    status: 'confirmed',
    duration: 45,
    price: 55
  }
]

export function LiveBookingFeed() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings)
  const [newBooking, setNewBooking] = useState<string | null>(null)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a new booking
      if (Math.random() > 0.7) {
        const names = ['Jessica Brown', 'David Wilson', 'Amy Thompson', 'James Garcia']
        const services = ['Hair Cut', 'Color & Style', 'Facial Treatment', 'Manicure']
        const staff = ['Maria Rodriguez', 'John Smith', 'Carlos Martinez', 'Sophie Chen']

        const newBookingData: Booking = {
          id: Date.now().toString(),
          customerName: names[Math.floor(Math.random() * names.length)],
          service: services[Math.floor(Math.random() * services.length)],
          staffName: staff[Math.floor(Math.random() * staff.length)],
          time: new Date(Date.now() + Math.random() * 10800000), // Random time in next 3 hours
          status: 'confirmed',
          duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
          price: Math.floor(Math.random() * 200) + 30
        }

        setBookings(prev => [newBookingData, ...prev.slice(0, 9)])
        setNewBooking(newBookingData.id)

        setTimeout(() => setNewBooking(null), 3000)
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'in-progress': return 'bg-blue-500'
      case 'completed': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'in-progress': return 'default'
      case 'completed': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Live Bookings</CardTitle>
        <Badge variant="outline" className="gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6">
          <div className="space-y-4 pb-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-500 ${
                  newBooking === booking.id
                    ? 'bg-primary/5 border-primary animate-in slide-in-from-top-2'
                    : 'bg-card hover:bg-accent/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={booking.customerImage} />
                  <AvatarFallback>
                    {booking.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {booking.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.service}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {booking.staffName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(booking.time, 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(booking.time, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {booking.duration} min
                    </span>
                    <span className="text-sm font-medium">
                      ${booking.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}