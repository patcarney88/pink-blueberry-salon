import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns'

export interface RevenueMetrics {
  total: number
  growth: number
  byService: Record<string, number>
  byProduct: Record<string, number>
  byStaff: Record<string, number>
  projectedRevenue: number
  averageTransactionValue: number
}

export interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  churnRate: number
  retentionRate: number
  lifetimeValue: number
  satisfactionScore: number
}

export interface StaffMetrics {
  totalStaff: number
  utilizationRate: number
  performanceScores: Record<string, number>
  topPerformers: Array<{
    staffId: string
    name: string
    revenue: number
    appointments: number
    rating: number
  }>
  trainingNeeds: Array<{
    staffId: string
    skill: string
    score: number
  }>
}

export interface OperationalMetrics {
  appointmentMetrics: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    averageDuration: number
  }
  inventoryMetrics: {
    totalValue: number
    turnoverRate: number
    lowStockItems: number
    expiringItems: number
  }
  efficiencyMetrics: {
    averageWaitTime: number
    chairTime: number
    serviceEfficiency: number
  }
}

export interface PredictiveInsights {
  revenueForecasts: Array<{
    date: string
    predicted: number
    confidence: number
  }>
  demandPatterns: Array<{
    service: string
    peakTimes: string[]
    seasonality: number
  }>
  customerBehavior: {
    nextVisitPrediction: Record<string, Date>
    churnRisk: Array<{
      customerId: string
      riskScore: number
      reason: string
    }>
  }
}

export class BusinessAnalyticsService {
  /**
   * Get comprehensive revenue analytics
   */
  async getRevenueAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueMetrics> {
    // Get all payments in date range
    const payments = await prisma.payment.findMany({
      where: {
        appointment: {
          branch_id: branchId,
        },
        paid_at: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        appointment: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    // Get e-commerce orders
    const orders = await prisma.ecommerceOrder.findMany({
      where: {
        customer: {
          branch_id: branchId,
        },
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment_status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Calculate total revenue
    const appointmentRevenue = payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    )
    const orderRevenue = orders.reduce(
      (sum, o) => sum + o.total_amount.toNumber(),
      0
    )
    const totalRevenue = appointmentRevenue + orderRevenue

    // Calculate growth
    const previousPeriod = await this.getPreviousPeriodRevenue(
      branchId,
      startDate,
      endDate
    )
    const growth = previousPeriod > 0
      ? ((totalRevenue - previousPeriod) / previousPeriod) * 100
      : 0

    // Revenue by service
    const revenueByService: Record<string, number> = {}
    payments.forEach(payment => {
      payment.appointment.services.forEach(as => {
        const serviceName = as.service.name
        revenueByService[serviceName] =
          (revenueByService[serviceName] || 0) + as.price.toNumber()
      })
    })

    // Revenue by product
    const revenueByProduct: Record<string, number> = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.product.name
        revenueByProduct[productName] =
          (revenueByProduct[productName] || 0) + item.subtotal.toNumber()
      })
    })

    // Revenue by staff
    const revenueByStaff: Record<string, number> = {}
    payments.forEach(payment => {
      const staffName = payment.appointment.staff?.user.name || 'Unassigned'
      revenueByStaff[staffName] =
        (revenueByStaff[staffName] || 0) + payment.amount.toNumber()
    })

    // Calculate projections
    const projectedRevenue = await this.projectRevenue(
      branchId,
      totalRevenue,
      startDate,
      endDate
    )

    // Average transaction value
    const totalTransactions = payments.length + orders.length
    const averageTransactionValue = totalTransactions > 0
      ? totalRevenue / totalTransactions
      : 0

    return {
      total: totalRevenue,
      growth,
      byService: revenueByService,
      byProduct: revenueByProduct,
      byStaff: revenueByStaff,
      projectedRevenue,
      averageTransactionValue,
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CustomerMetrics> {
    // Total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        branch_id: branchId,
        deleted_at: null,
      },
    })

    // New customers in period
    const newCustomers = await prisma.customer.count({
      where: {
        branch_id: branchId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Returning customers
    const returningCustomers = await prisma.appointment.groupBy({
      by: ['customer_id'],
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      having: {
        customer_id: {
          _count: {
            gt: 1,
          },
        },
      },
    })

    // Churn rate calculation
    const activeCustomersBefore = await prisma.customer.count({
      where: {
        branch_id: branchId,
        created_at: {
          lt: startDate,
        },
        appointments: {
          some: {
            appointment_date: {
              gte: subDays(startDate, 90),
              lt: startDate,
            },
          },
        },
      },
    })

    const stillActive = await prisma.customer.count({
      where: {
        branch_id: branchId,
        created_at: {
          lt: startDate,
        },
        appointments: {
          some: {
            appointment_date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    })

    const churnRate = activeCustomersBefore > 0
      ? ((activeCustomersBefore - stillActive) / activeCustomersBefore) * 100
      : 0

    const retentionRate = 100 - churnRate

    // Average lifetime value
    const lifetimeValue = await this.calculateAverageLifetimeValue(branchId)

    // Satisfaction score from reviews
    const reviews = await prisma.review.aggregate({
      where: {
        customer: {
          branch_id: branchId,
        },
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        rating: true,
      },
    })

    const satisfactionScore = (reviews._avg.rating || 0) * 20 // Convert to percentage

    return {
      totalCustomers,
      newCustomers,
      returningCustomers: returningCustomers.length,
      churnRate,
      retentionRate,
      lifetimeValue,
      satisfactionScore,
    }
  }

  /**
   * Get staff performance analytics
   */
  async getStaffAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StaffMetrics> {
    // Get all staff
    const staff = await prisma.staff.findMany({
      where: {
        branches: {
          some: {
            branch_id: branchId,
          },
        },
        deleted_at: null,
      },
      include: {
        user: true,
        appointments: {
          where: {
            appointment_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            payment: true,
            reviews: true,
          },
        },
      },
    })

    const totalStaff = staff.length

    // Calculate utilization rate
    const totalAvailableHours = totalStaff * 8 * 30 // Assuming 8 hours/day, 30 days
    const totalBookedHours = staff.reduce(
      (sum, s) => sum + s.appointments.reduce(
        (appointmentSum, a) => appointmentSum + (a.total_duration || 0) / 60,
        0
      ),
      0
    )
    const utilizationRate = (totalBookedHours / totalAvailableHours) * 100

    // Performance scores
    const performanceScores: Record<string, number> = {}
    const topPerformers: any[] = []

    staff.forEach(staffMember => {
      const revenue = staffMember.appointments.reduce(
        (sum, a) => sum + (a.payment?.amount.toNumber() || 0),
        0
      )

      const avgRating = staffMember.appointments.reduce(
        (sum, a) => {
          const appointmentRating = a.reviews.reduce(
            (rSum, r) => rSum + r.rating,
            0
          ) / (a.reviews.length || 1)
          return sum + appointmentRating
        },
        0
      ) / (staffMember.appointments.length || 1)

      const score = (revenue / 1000) * 0.7 + (avgRating * 20) * 0.3

      performanceScores[staffMember.user.name] = score

      topPerformers.push({
        staffId: staffMember.id,
        name: staffMember.user.name,
        revenue,
        appointments: staffMember.appointments.length,
        rating: avgRating,
      })
    })

    // Sort and get top 5 performers
    topPerformers.sort((a, b) => b.revenue - a.revenue)
    const top5Performers = topPerformers.slice(0, 5)

    // Identify training needs (simplified - would use ML in production)
    const trainingNeeds: any[] = []
    staff.forEach(staffMember => {
      if (performanceScores[staffMember.user.name] < 50) {
        trainingNeeds.push({
          staffId: staffMember.id,
          skill: 'Customer Service',
          score: performanceScores[staffMember.user.name],
        })
      }
    })

    return {
      totalStaff,
      utilizationRate,
      performanceScores,
      topPerformers: top5Performers,
      trainingNeeds,
    }
  }

  /**
   * Get operational metrics
   */
  async getOperationalMetrics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OperationalMetrics> {
    // Appointment metrics
    const appointments = await prisma.appointment.findMany({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const appointmentMetrics = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      averageDuration: appointments.reduce((sum, a) => sum + (a.total_duration || 0), 0) /
        (appointments.length || 1),
    }

    // Inventory metrics
    const inventory = await prisma.inventory.findMany({
      where: {
        branch_id: branchId,
      },
      include: {
        product: true,
      },
    })

    const inventoryValue = inventory.reduce(
      (sum, item) => sum + (item.quantity_on_hand * item.product.cost_price.toNumber()),
      0
    )

    const lowStockItems = inventory.filter(
      item => item.quantity_available <= (item.product.min_stock_level || 0)
    ).length

    const expiringItems = inventory.filter(item => {
      if (item.product.metadata?.expiryDate) {
        const expiryDate = new Date(item.product.metadata.expiryDate as string)
        const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return daysUntilExpiry <= 30
      }
      return false
    }).length

    // Calculate inventory turnover
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventory: {
          branch_id: branchId,
        },
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        movement_type: 'OUT',
      },
    })

    const totalSold = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    const avgInventory = inventory.reduce((sum, i) => sum + i.quantity_on_hand, 0) / 2
    const turnoverRate = avgInventory > 0 ? totalSold / avgInventory : 0

    const inventoryMetrics = {
      totalValue: inventoryValue,
      turnoverRate,
      lowStockItems,
      expiringItems,
    }

    // Efficiency metrics
    const efficiencyMetrics = {
      averageWaitTime: 15, // Would calculate from actual wait time data
      chairTime: appointmentMetrics.averageDuration,
      serviceEfficiency: appointmentMetrics.completed / appointmentMetrics.total * 100,
    }

    return {
      appointmentMetrics,
      inventoryMetrics,
      efficiencyMetrics,
    }
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(
    branchId: string
  ): Promise<PredictiveInsights> {
    // Revenue forecasts
    const revenueForecasts = await this.generateRevenueForecasts(branchId)

    // Demand patterns
    const demandPatterns = await this.analyzeDemandPatterns(branchId)

    // Customer behavior predictions
    const customerBehavior = await this.predictCustomerBehavior(branchId)

    return {
      revenueForecasts,
      demandPatterns,
      customerBehavior,
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeDashboard(branchId: string) {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    // Today's revenue
    const todayPayments = await prisma.payment.aggregate({
      where: {
        appointment: {
          branch_id: branchId,
        },
        paid_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })

    // Active staff
    const activeStaff = await prisma.staff.count({
      where: {
        branches: {
          some: {
            branch_id: branchId,
          },
        },
        appointments: {
          some: {
            appointment_date: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        },
      },
    })

    // Current occupancy
    const currentHour = new Date().getHours()
    const currentAppointments = await prisma.appointment.count({
      where: {
        branch_id: branchId,
        start_time: {
          lte: new Date(),
        },
        end_time: {
          gte: new Date(),
        },
      },
    })

    const totalChairs = 10 // Would get from branch configuration
    const occupancyRate = (currentAppointments / totalChairs) * 100

    // Next available slot
    const nextSlot = await this.findNextAvailableSlot(branchId)

    return {
      today: {
        appointments: todayAppointments,
        revenue: todayPayments._sum.amount?.toNumber() || 0,
        activeStaff,
        occupancyRate,
        nextAvailableSlot: nextSlot,
      },
      alerts: await this.getActiveAlerts(branchId),
      trends: await this.getRecentTrends(branchId),
    }
  }

  // Helper methods

  private async getPreviousPeriodRevenue(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStart = new Date(startDate.getTime() - periodLength)
    const previousEnd = new Date(startDate.getTime())

    const payments = await prisma.payment.aggregate({
      where: {
        appointment: {
          branch_id: branchId,
        },
        paid_at: {
          gte: previousStart,
          lte: previousEnd,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })

    return payments._sum.amount?.toNumber() || 0
  }

  private async projectRevenue(
    branchId: string,
    currentRevenue: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Simplified projection - would use ML models in production
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dailyRevenue = currentRevenue / days
    const growthRate = 1.05 // 5% growth assumption

    return dailyRevenue * 30 * growthRate // Next 30 days projection
  }

  private async calculateAverageLifetimeValue(branchId: string): Promise<number> {
    const customers = await prisma.customer.findMany({
      where: {
        branch_id: branchId,
      },
      include: {
        appointments: {
          include: {
            payment: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
        orders: {
          where: {
            payment_status: 'COMPLETED',
          },
        },
      },
      take: 100, // Sample for calculation
    })

    const totalValue = customers.reduce((sum, customer) => {
      const appointmentValue = customer.appointments.reduce(
        (aSum, a) => aSum + (a.payment?.amount.toNumber() || 0),
        0
      )
      const orderValue = customer.orders.reduce(
        (oSum, o) => oSum + o.total_amount.toNumber(),
        0
      )
      return sum + appointmentValue + orderValue
    }, 0)

    return customers.length > 0 ? totalValue / customers.length : 0
  }

  private async generateRevenueForecasts(branchId: string) {
    // Simplified forecast - would use time series analysis in production
    const forecasts = []
    const baseRevenue = 5000

    for (let i = 1; i <= 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      const seasonalFactor = 1 + (Math.sin(i / 7) * 0.2) // Weekly pattern
      const predicted = baseRevenue * seasonalFactor * (1 + Math.random() * 0.1)
      const confidence = 0.85 - (i * 0.01) // Confidence decreases with time

      forecasts.push({
        date: format(date, 'yyyy-MM-dd'),
        predicted: Math.round(predicted),
        confidence: Math.round(confidence * 100) / 100,
      })
    }

    return forecasts
  }

  private async analyzeDemandPatterns(branchId: string) {
    const services = await prisma.service.findMany({
      where: {
        branches: {
          some: {
            branch_id: branchId,
          },
        },
      },
      include: {
        appointment_services: {
          include: {
            appointment: true,
          },
        },
      },
    })

    return services.map(service => ({
      service: service.name,
      peakTimes: ['10:00 AM', '2:00 PM', '6:00 PM'], // Simplified
      seasonality: Math.random() * 0.3 + 0.7, // Random factor for demo
    }))
  }

  private async predictCustomerBehavior(branchId: string) {
    const customers = await prisma.customer.findMany({
      where: {
        branch_id: branchId,
      },
      include: {
        appointments: {
          orderBy: {
            appointment_date: 'desc',
          },
          take: 1,
        },
      },
      take: 50,
    })

    const nextVisitPrediction: Record<string, Date> = {}
    const churnRisk: any[] = []

    customers.forEach(customer => {
      if (customer.appointments.length > 0) {
        const lastVisit = customer.appointments[0].appointment_date
        const daysSinceVisit = Math.ceil(
          (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Predict next visit
        const avgDaysBetweenVisits = 30 // Simplified
        const nextVisit = new Date()
        nextVisit.setDate(nextVisit.getDate() + (avgDaysBetweenVisits - daysSinceVisit))
        nextVisitPrediction[customer.id] = nextVisit

        // Assess churn risk
        if (daysSinceVisit > 60) {
          churnRisk.push({
            customerId: customer.id,
            riskScore: Math.min(daysSinceVisit / 100, 1),
            reason: 'Long absence',
          })
        }
      }
    })

    return {
      nextVisitPrediction,
      churnRisk: churnRisk.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10),
    }
  }

  private async findNextAvailableSlot(branchId: string) {
    // Simplified - would use actual availability service
    const nextSlot = new Date()
    nextSlot.setHours(nextSlot.getHours() + 1, 0, 0, 0)
    return nextSlot
  }

  private async getActiveAlerts(branchId: string) {
    const alerts = []

    // Low inventory alert
    const lowStock = await prisma.inventory.count({
      where: {
        branch_id: branchId,
        quantity_available: {
          lte: 5,
        },
      },
    })

    if (lowStock > 0) {
      alerts.push({
        type: 'WARNING',
        message: `${lowStock} products are low in stock`,
        timestamp: new Date(),
      })
    }

    // High demand alert
    const todayAppointments = await prisma.appointment.count({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    })

    if (todayAppointments > 20) {
      alerts.push({
        type: 'INFO',
        message: 'High booking volume today',
        timestamp: new Date(),
      })
    }

    return alerts
  }

  private async getRecentTrends(branchId: string) {
    const last7Days = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i)
        return this.getDayMetrics(branchId, date)
      })
    )

    return {
      revenue: last7Days.map(d => ({ date: d.date, value: d.revenue })),
      appointments: last7Days.map(d => ({ date: d.date, value: d.appointments })),
      customers: last7Days.map(d => ({ date: d.date, value: d.customers })),
    }
  }

  private async getDayMetrics(branchId: string, date: Date) {
    const start = startOfDay(date)
    const end = endOfDay(date)

    const revenue = await prisma.payment.aggregate({
      where: {
        appointment: {
          branch_id: branchId,
        },
        paid_at: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })

    const appointments = await prisma.appointment.count({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: start,
          lte: end,
        },
      },
    })

    const customers = await prisma.appointment.findMany({
      where: {
        branch_id: branchId,
        appointment_date: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['customer_id'],
    })

    return {
      date: format(date, 'yyyy-MM-dd'),
      revenue: revenue._sum.amount?.toNumber() || 0,
      appointments,
      customers: customers.length,
    }
  }
}