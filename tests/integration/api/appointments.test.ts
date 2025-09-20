import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/appointments/route'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { createTestAppointment, createTestCustomer, createTestService } from '../../setup'

jest.mock('next-auth')
jest.mock('@/lib/db/prisma')
jest.mock('@/lib/pusher/server')

describe('Appointments API Integration', () => {
  const mockGetServerSession = getServerSession as jest.Mock
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          roles: ['CUSTOMER'],
        },
      })

      const testAppointments = [
        createTestAppointment({ id: 'apt-1' }),
        createTestAppointment({ id: 'apt-2' }),
      ]

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue(testAppointments)

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(mockPrisma.appointment.findMany).toHaveBeenCalled()
    })

    it('should filter appointments by date', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['STAFF'] },
      })

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/appointments?date=2024-01-15',
        { method: 'GET' }
      )

      await GET(request)

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appointment_date: expect.any(Object),
          }),
        })
      )
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should respect role-based access control', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['CUSTOMER'] },
      })

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/appointments?customerId=other-user',
        { method: 'GET' }
      )

      const response = await GET(request)
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/appointments', () => {
    it('should create appointment with valid data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['CUSTOMER'] },
      })

      const appointmentData = {
        branchId: 'branch-1',
        customerId: 'customer-1',
        staffId: 'staff-1',
        appointmentDate: '2024-01-15T00:00:00Z',
        startTime: '2024-01-15T10:00:00Z',
        services: [
          { serviceId: 'service-1', addOns: [] },
        ],
      }

      // Mock service lookup
      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService({
          id: 'service-1',
          price: 100,
          duration: 60,
          buffer_time: 0,
        })
      )

      // Mock availability check dependencies
      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.staffSchedule.findFirst = jest.fn().mockResolvedValue({
        staff_id: 'staff-1',
        date: new Date('2024-01-15'),
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T18:00:00Z'),
      })

      // Mock appointment creation
      const createdAppointment = createTestAppointment({
        ...appointmentData,
        id: 'new-apt-1',
      })

      mockPrisma.appointment.create = jest.fn().mockResolvedValue(createdAppointment)
      mockPrisma.appointmentService.create = jest.fn()
      mockPrisma.appointmentConflict.create = jest.fn()
      mockPrisma.auditLog.create = jest.fn()

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-apt-1')
      expect(mockPrisma.appointment.create).toHaveBeenCalled()
      expect(mockPrisma.appointmentService.create).toHaveBeenCalled()
      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['CUSTOMER'] },
      })

      const invalidData = {
        branchId: 'branch-1',
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.details).toBeDefined()
    })

    it('should check slot availability', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['CUSTOMER'] },
      })

      // Mock unavailable slot
      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(
        createTestAppointment()
      )

      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService()
      )

      const appointmentData = {
        branchId: 'branch-1',
        customerId: 'customer-1',
        staffId: 'staff-1',
        appointmentDate: '2024-01-15T00:00:00Z',
        startTime: '2024-01-15T10:00:00Z',
        services: [{ serviceId: 'service-1' }],
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not available')
    })

    it('should calculate total price correctly', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', roles: ['CUSTOMER'] },
      })

      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService({
          id: 'service-1',
          price: 100,
          duration: 60,
          buffer_time: 0,
        })
      )

      mockPrisma.serviceAddOn.findMany = jest.fn().mockResolvedValue([
        { id: 'addon-1', price: 20, duration: 15 },
      ])

      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.staffSchedule.findFirst = jest.fn().mockResolvedValue({
        staff_id: 'staff-1',
        date: new Date('2024-01-15'),
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T18:00:00Z'),
      })

      mockPrisma.appointment.create = jest.fn().mockImplementation((data) => ({
        ...data.data,
        id: 'new-apt-1',
        customer: createTestCustomer(),
        staff: { user: { name: 'Test Staff' } },
        branch: { name: 'Test Branch' },
      }))

      mockPrisma.appointmentService.create = jest.fn()
      mockPrisma.appointmentAddOn.create = jest.fn()
      mockPrisma.appointmentConflict.create = jest.fn()
      mockPrisma.auditLog.create = jest.fn()

      const appointmentData = {
        branchId: 'branch-1',
        customerId: 'customer-1',
        staffId: 'staff-1',
        appointmentDate: '2024-01-15T00:00:00Z',
        startTime: '2024-01-15T10:00:00Z',
        services: [
          { serviceId: 'service-1', addOns: ['addon-1'] },
        ],
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total_price: 120, // 100 + 20
            total_duration: 75, // 60 + 15
          }),
        })
      )
    })
  })
})