import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET admin dashboard stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Check admin role
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // Fetch statistics
    const [
      totalUsers,
      newUsersToday,
      totalAppointments,
      appointmentsToday,
      totalRevenue,
      revenueThisMonth,
      totalProducts,
      lowStockProducts,
      pendingAppointments,
      completedAppointments,
      totalOrders,
      processingOrders,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Appointment stats
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Revenue stats
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCEEDED' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCEEDED',
          createdAt: {
            gte: thisMonth,
            lt: nextMonth,
          },
        },
      }),

      // Product stats
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({
        where: {
          active: true,
          stock: { lt: 10 },
        },
      }),

      // Status counts
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
    ])

    // Top services
    const topServices = await prisma.appointment.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      orderBy: {
        _count: { serviceId: 'desc' },
      },
      take: 5,
    })

    const topServicesWithDetails = await Promise.all(
      topServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
        })
        return {
          service,
          count: item._count.serviceId,
        }
      })
    )

    // Recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true, email: true },
        },
        service: {
          select: { name: true },
        },
      },
    })

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    const stats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
      },
      appointments: {
        total: totalAppointments,
        today: appointmentsToday,
        pending: pendingAppointments,
        completed: completedAppointments,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      orders: {
        total: totalOrders,
        processing: processingOrders,
      },
      topServices: topServicesWithDetails,
      recentAppointments,
      recentOrders,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}