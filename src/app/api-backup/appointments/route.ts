import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { AvailabilityService } from '@/services/booking/availability.service'
import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'
import { nanoid } from 'nanoid'
import { notifyAppointmentChange } from '@/lib/pusher/server'

const createAppointmentSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  appointmentDate: z.string().datetime(),
  startTime: z.string().datetime(),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    addOns: z.array(z.string().uuid()).optional(),
  })),
  notes: z.string().optional(),
  source: z.enum(['ONLINE', 'PHONE', 'WALK_IN']).default('ONLINE'),
})

const availabilityService = new AvailabilityService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const staffId = searchParams.get('staffId')
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    // Build query
    const where: any = {
      deleted_at: null,
    }

    if (customerId) where.customer_id = customerId
    if (staffId) where.staff_id = staffId
    if (branchId) where.branch_id = branchId
    if (status) where.status = status as AppointmentStatus
    if (date) {
      const appointmentDate = new Date(date)
      where.appointment_date = {
        gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        lte: new Date(appointmentDate.setHours(23, 59, 59, 999)),
      }
    }

    // Check permissions
    if (!session.user.roles?.includes('SUPER_ADMIN')) {
      // Regular users can only see their own appointments
      if (session.user.id !== customerId && !session.user.roles?.includes('STAFF')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        branch: true,
        services: {
          include: {
            service: true,
          },
        },
        add_ons: {
          include: {
            add_on: true,
          },
        },
        payment: true,
      },
      orderBy: {
        appointment_date: 'desc',
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // Check availability
    const isAvailable = await availabilityService.isSlotAvailable(
      validatedData.branchId,
      validatedData.staffId,
      validatedData.services[0].serviceId,
      new Date(validatedData.startTime),
      60 // Default duration, should calculate based on services
    )

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 400 }
      )
    }

    // Calculate total duration and price
    let totalDuration = 0
    let totalPrice = 0

    const serviceDetails = await Promise.all(
      validatedData.services.map(async (s) => {
        const service = await prisma.service.findUnique({
          where: { id: s.serviceId },
        })
        if (!service) throw new Error(`Service ${s.serviceId} not found`)

        totalDuration += service.duration + service.buffer_time
        totalPrice += service.price.toNumber()

        return {
          service,
          addOns: s.addOns ? await prisma.serviceAddOn.findMany({
            where: { id: { in: s.addOns } },
          }) : [],
        }
      })
    )

    // Calculate add-on prices
    for (const detail of serviceDetails) {
      for (const addOn of detail.addOns) {
        totalPrice += addOn.price.toNumber()
        totalDuration += addOn.duration
      }
    }

    const endTime = new Date(validatedData.startTime)
    endTime.setMinutes(endTime.getMinutes() + totalDuration)

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        branch_id: validatedData.branchId,
        customer_id: validatedData.customerId,
        staff_id: validatedData.staffId,
        appointment_date: new Date(validatedData.appointmentDate),
        start_time: new Date(validatedData.startTime),
        end_time: endTime,
        status: AppointmentStatus.PENDING,
        total_duration: totalDuration,
        total_price: totalPrice,
        final_price: totalPrice,
        notes: validatedData.notes,
        source: validatedData.source,
        confirmation_code: nanoid(8).toUpperCase(),
        created_by: session.user.id,
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
    })

    // Create appointment services
    for (const service of validatedData.services) {
      const serviceData = serviceDetails.find(s => s.service.id === service.serviceId)
      if (!serviceData) continue

      await prisma.appointmentService.create({
        data: {
          appointment_id: appointment.id,
          service_id: service.serviceId,
          price: serviceData.service.price,
          duration: serviceData.service.duration,
        },
      })

      // Create appointment add-ons
      if (service.addOns) {
        for (const addOnId of service.addOns) {
          const addOn = serviceData.addOns.find(a => a.id === addOnId)
          if (!addOn) continue

          await prisma.appointmentAddOn.create({
            data: {
              appointment_id: appointment.id,
              add_on_id: addOnId,
              price: addOn.price,
            },
          })
        }
      }
    }

    // Detect conflicts
    await availabilityService.detectConflicts(appointment.id)

    // Send real-time notification
    await notifyAppointmentChange(appointment, 'created')

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'CREATE',
        entity_type: 'Appointment',
        entity_id: appointment.id,
        metadata: {
          appointment,
        },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}