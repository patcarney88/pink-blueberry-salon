import { AvailabilityService } from '@/services/booking/availability.service'
import { prisma } from '@/lib/db/prisma'
import { createTestAppointment, createTestStaff, createTestService } from '../../setup'

jest.mock('@/lib/db/prisma')

describe('AvailabilityService', () => {
  let service: AvailabilityService
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    service = new AvailabilityService()
    jest.clearAllMocks()
  })

  describe('getAvailableSlots', () => {
    it('should return available time slots for a given date', async () => {
      const testDate = new Date('2024-01-15')
      const branchId = 'test-branch-id'
      const serviceId = 'test-service-id'

      mockPrisma.branch.findUnique = jest.fn().mockResolvedValue({
        id: branchId,
        business_hours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: null, close: null },
        },
      })

      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService({ id: serviceId, duration: 60 })
      )

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.staffSchedule.findMany = jest.fn().mockResolvedValue([
        {
          staff_id: 'staff-1',
          date: testDate,
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T18:00:00'),
        },
      ])

      const slots = await service.getAvailableSlots({
        branchId,
        serviceId,
        date: testDate,
        staffId: 'staff-1',
      })

      expect(slots).toBeDefined()
      expect(slots.length).toBeGreaterThan(0)
      expect(slots[0]).toHaveProperty('startTime')
      expect(slots[0]).toHaveProperty('endTime')
      expect(slots[0]).toHaveProperty('available')
    })

    it('should exclude slots with existing appointments', async () => {
      const testDate = new Date('2024-01-15')

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([
        createTestAppointment({
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
        }),
      ])

      mockPrisma.branch.findUnique = jest.fn().mockResolvedValue({
        id: 'test-branch',
        business_hours: {
          monday: { open: '09:00', close: '18:00' },
        },
      })

      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService({ duration: 60 })
      )

      mockPrisma.staffSchedule.findMany = jest.fn().mockResolvedValue([
        {
          staff_id: 'staff-1',
          date: testDate,
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T18:00:00'),
        },
      ])

      const slots = await service.getAvailableSlots({
        branchId: 'test-branch',
        serviceId: 'test-service',
        date: testDate,
        staffId: 'staff-1',
      })

      const bookedSlot = slots.find(
        s => s.startTime.getHours() === 10 && s.startTime.getMinutes() === 0
      )

      expect(bookedSlot?.available).toBe(false)
    })

    it('should handle buffer times correctly', async () => {
      const service = new AvailabilityService()

      mockPrisma.service.findUnique = jest.fn().mockResolvedValue(
        createTestService({ duration: 60, buffer_time: 15 })
      )

      mockPrisma.branch.findUnique = jest.fn().mockResolvedValue({
        id: 'test-branch',
        business_hours: {
          monday: { open: '09:00', close: '12:00' },
        },
      })

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([])
      mockPrisma.staffSchedule.findMany = jest.fn().mockResolvedValue([
        {
          staff_id: 'staff-1',
          date: new Date('2024-01-15'),
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T12:00:00'),
        },
      ])

      const slots = await service.getAvailableSlots({
        branchId: 'test-branch',
        serviceId: 'test-service',
        date: new Date('2024-01-15'),
        staffId: 'staff-1',
      })

      // With 60 min service + 15 min buffer, should have fewer slots
      expect(slots.length).toBeLessThan(4)
    })
  })

  describe('isSlotAvailable', () => {
    it('should return true for available slot', async () => {
      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.staffSchedule.findFirst = jest.fn().mockResolvedValue({
        staff_id: 'staff-1',
        date: new Date('2024-01-15'),
        start_time: new Date('2024-01-15T09:00:00'),
        end_time: new Date('2024-01-15T18:00:00'),
      })

      const isAvailable = await service.isSlotAvailable(
        'branch-1',
        'staff-1',
        'service-1',
        new Date('2024-01-15T10:00:00'),
        60
      )

      expect(isAvailable).toBe(true)
    })

    it('should return false for conflicting slot', async () => {
      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(
        createTestAppointment()
      )

      const isAvailable = await service.isSlotAvailable(
        'branch-1',
        'staff-1',
        'service-1',
        new Date('2024-01-15T10:00:00'),
        60
      )

      expect(isAvailable).toBe(false)
    })

    it('should check staff availability', async () => {
      mockPrisma.appointment.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.staffSchedule.findFirst = jest.fn().mockResolvedValue(null)

      const isAvailable = await service.isSlotAvailable(
        'branch-1',
        'staff-1',
        'service-1',
        new Date('2024-01-15T10:00:00'),
        60
      )

      expect(isAvailable).toBe(false)
      expect(mockPrisma.staffSchedule.findFirst).toHaveBeenCalled()
    })
  })

  describe('detectConflicts', () => {
    it('should detect scheduling conflicts', async () => {
      const appointmentId = 'appt-1'

      mockPrisma.appointment.findUnique = jest.fn().mockResolvedValue(
        createTestAppointment({
          id: appointmentId,
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
          staff_id: 'staff-1',
        })
      )

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([
        createTestAppointment({
          id: 'appt-2',
          start_time: new Date('2024-01-15T10:30:00'),
          end_time: new Date('2024-01-15T11:30:00'),
          staff_id: 'staff-1',
        }),
      ])

      mockPrisma.appointmentConflict.create = jest.fn()

      await service.detectConflicts(appointmentId)

      expect(mockPrisma.appointmentConflict.create).toHaveBeenCalled()
    })

    it('should not create conflict for non-overlapping appointments', async () => {
      mockPrisma.appointment.findUnique = jest.fn().mockResolvedValue(
        createTestAppointment({
          id: 'appt-1',
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
        })
      )

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([
        createTestAppointment({
          id: 'appt-2',
          start_time: new Date('2024-01-15T11:00:00'),
          end_time: new Date('2024-01-15T12:00:00'),
        }),
      ])

      mockPrisma.appointmentConflict.create = jest.fn()

      await service.detectConflicts('appt-1')

      expect(mockPrisma.appointmentConflict.create).not.toHaveBeenCalled()
    })
  })

  describe('optimizeSchedule', () => {
    it('should optimize staff schedule for efficiency', async () => {
      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([
        createTestAppointment({
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T10:00:00'),
        }),
        createTestAppointment({
          start_time: new Date('2024-01-15T14:00:00'),
          end_time: new Date('2024-01-15T15:00:00'),
        }),
      ])

      const optimization = await service.optimizeSchedule(
        'branch-1',
        new Date('2024-01-15')
      )

      expect(optimization).toBeDefined()
      expect(optimization.suggestions).toBeInstanceOf(Array)
    })
  })

  describe('calculateOccupancy', () => {
    it('should calculate correct occupancy rate', async () => {
      mockPrisma.staffSchedule.findMany = jest.fn().mockResolvedValue([
        {
          staff_id: 'staff-1',
          date: new Date('2024-01-15'),
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T18:00:00'),
        },
      ])

      mockPrisma.appointment.findMany = jest.fn().mockResolvedValue([
        createTestAppointment({
          start_time: new Date('2024-01-15T09:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
          total_duration: 120,
        }),
        createTestAppointment({
          start_time: new Date('2024-01-15T14:00:00'),
          end_time: new Date('2024-01-15T16:00:00'),
          total_duration: 120,
        }),
      ])

      const occupancy = await service.calculateOccupancy(
        'branch-1',
        new Date('2024-01-15')
      )

      // 4 hours booked out of 9 hours available = 44.4%
      expect(occupancy).toBeCloseTo(44.4, 1)
    })
  })
})