import { NextRequest, NextResponse } from 'next/server'

// Mock appointment data for demonstration
const mockAppointments = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    service: 'Hair Cut & Style',
    stylist: 'Emma Wilson',
    date: '2024-01-20',
    time: '10:00',
    duration: 90,
    status: 'confirmed',
    price: 85.00
  },
  {
    id: '2',
    clientName: 'Michael Chen',
    service: 'Hair Color',
    stylist: 'Lisa Davis',
    date: '2024-01-20',
    time: '14:30',
    duration: 120,
    status: 'pending',
    price: 150.00
  },
  {
    id: '3',
    clientName: 'Amanda Rodriguez',
    service: 'Manicure & Pedicure',
    stylist: 'Sophie Brown',
    date: '2024-01-21',
    time: '11:00',
    duration: 60,
    status: 'confirmed',
    price: 65.00
  }
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const stylist = searchParams.get('stylist')

  let filteredAppointments = mockAppointments

  if (date) {
    filteredAppointments = filteredAppointments.filter(apt => apt.date === date)
  }

  if (stylist) {
    filteredAppointments = filteredAppointments.filter(apt =>
      apt.stylist.toLowerCase().includes(stylist.toLowerCase())
    )
  }

  return NextResponse.json({
    appointments: filteredAppointments,
    total: filteredAppointments.length,
    filters: { date, stylist }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic validation
    const required = ['clientName', 'service', 'stylist', 'date', 'time']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const newAppointment = {
      id: (mockAppointments.length + 1).toString(),
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    mockAppointments.push(newAppointment)

    return NextResponse.json(
      {
        message: 'Appointment created successfully',
        appointment: newAppointment
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}