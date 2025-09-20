import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const role = (session.user as any).role

    let appointments

    if (role === 'ADMIN' || role === 'STAFF') {
      // Staff and admin can see all appointments
      appointments = await prisma.appointment.findMany({
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          staff: {
            select: { id: true, name: true },
          },
          service: true,
        },
        orderBy: { date: 'asc' },
      })
    } else {
      // Customers only see their own appointments
      appointments = await prisma.appointment.findMany({
        where: { customerId: userId },
        include: {
          staff: {
            select: { id: true, name: true },
          },
          service: true,
        },
        orderBy: { date: 'asc' },
      })
    }

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { serviceId, staffId, date, notes } = data
    const customerId = (session.user as any).id

    // Validation
    if (!serviceId || !staffId || !date) {
      return NextResponse.json(
        { error: 'Service, staff, and date are required' },
        { status: 400 }
      )
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check for appointment conflicts
    const appointmentDate = new Date(date)
    const endTime = new Date(appointmentDate.getTime() + service.duration * 60000)

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { date: { lte: appointmentDate } },
              { date: { gte: appointmentDate } },
            ],
          },
          {
            AND: [
              { date: { lte: endTime } },
              { date: { gte: appointmentDate } },
            ],
          },
        ],
      },
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Time slot not available' },
        { status: 409 }
      )
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        staffId,
        serviceId,
        date: appointmentDate,
        notes,
        price: service.price,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        staff: {
          select: { id: true, name: true },
        },
        service: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Appointment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}