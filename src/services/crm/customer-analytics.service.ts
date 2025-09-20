import { prisma } from '@/lib/db/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export interface CustomerMetrics {
  customerId: string
  lifetimeValue: number
  totalVisits: number
  averageSpending: number
  frequencyScore: number
  recencyScore: number
  monetaryScore: number
  rfmScore: number
  churnProbability: number
  nextVisitPrediction?: Date
  preferredServices: string[]
  preferredStaff: string[]
  preferredTimeSlots: string[]
}

export interface SegmentCriteria {
  minLifetimeValue?: number
  maxLifetimeValue?: number
  minVisits?: number
  maxVisits?: number
  lastVisitDays?: number
  tags?: string[]
  isVip?: boolean
  hasActiveSubscription?: boolean
}

export class CustomerAnalyticsService {
  /**
   * Calculate comprehensive metrics for a customer
   */
  async calculateCustomerMetrics(customerId: string): Promise<CustomerMetrics> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
            staff: true,
            payment: true,
          },
          orderBy: {
            appointment_date: 'desc',
          },
        },
        orders: {
          include: {
            items: true,
          },
        },
        loyalty_points: true,
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Calculate lifetime value
    const lifetimeValue = this.calculateLifetimeValue(customer)

    // Calculate RFM scores
    const rfmScores = this.calculateRFMScores(customer)

    // Calculate churn probability
    const churnProbability = await this.predictChurn(customer)

    // Predict next visit
    const nextVisitPrediction = this.predictNextVisit(customer)

    // Analyze preferences
    const preferences = this.analyzePreferences(customer)

    // Update customer record with latest metrics
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        lifetime_value: lifetimeValue,
        total_visits: customer.appointments.length,
        last_visit: customer.appointments[0]?.appointment_date || null,
      },
    })

    return {
      customerId,
      lifetimeValue,
      totalVisits: customer.appointments.length,
      averageSpending: lifetimeValue / Math.max(customer.appointments.length, 1),
      frequencyScore: rfmScores.frequency,
      recencyScore: rfmScores.recency,
      monetaryScore: rfmScores.monetary,
      rfmScore: rfmScores.total,
      churnProbability,
      nextVisitPrediction,
      ...preferences,
    }
  }

  /**
   * Segment customers based on criteria
   */
  async segmentCustomers(
    tenantId: string,
    criteria: SegmentCriteria
  ) {
    const whereClause: any = {
      tenant_id: tenantId,
      deleted_at: null,
    }

    if (criteria.minLifetimeValue !== undefined) {
      whereClause.lifetime_value = {
        ...whereClause.lifetime_value,
        gte: criteria.minLifetimeValue,
      }
    }

    if (criteria.maxLifetimeValue !== undefined) {
      whereClause.lifetime_value = {
        ...whereClause.lifetime_value,
        lte: criteria.maxLifetimeValue,
      }
    }

    if (criteria.minVisits !== undefined) {
      whereClause.total_visits = {
        ...whereClause.total_visits,
        gte: criteria.minVisits,
      }
    }

    if (criteria.maxVisits !== undefined) {
      whereClause.total_visits = {
        ...whereClause.total_visits,
        lte: criteria.maxVisits,
      }
    }

    if (criteria.lastVisitDays !== undefined) {
      const cutoffDate = subDays(new Date(), criteria.lastVisitDays)
      whereClause.last_visit = {
        gte: cutoffDate,
      }
    }

    if (criteria.tags && criteria.tags.length > 0) {
      whereClause.tags = {
        hasSome: criteria.tags,
      }
    }

    if (criteria.isVip !== undefined) {
      whereClause.is_vip = criteria.isVip
    }

    if (criteria.hasActiveSubscription !== undefined) {
      whereClause.subscriptions = criteria.hasActiveSubscription
        ? { some: { status: 'ACTIVE' } }
        : { none: { status: 'ACTIVE' } }
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        appointments: {
          take: 1,
          orderBy: {
            appointment_date: 'desc',
          },
        },
      },
    })

    return customers
  }

  /**
   * Get customer cohort analysis
   */
  async getCohortAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get customers grouped by signup month
    const customers = await prisma.customer.findMany({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        appointments: {
          select: {
            appointment_date: true,
            final_price: true,
          },
        },
      },
    })

    // Group by cohort (signup month)
    const cohorts = new Map<string, any>()

    for (const customer of customers) {
      const cohortKey = customer.created_at.toISOString().substring(0, 7) // YYYY-MM

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          month: cohortKey,
          customers: [],
          retention: {},
          revenue: {},
        })
      }

      const cohort = cohorts.get(cohortKey)
      cohort.customers.push(customer)
    }

    // Calculate retention and revenue for each cohort
    for (const [cohortKey, cohort] of cohorts) {
      const cohortDate = new Date(cohortKey + '-01')

      for (let monthOffset = 0; monthOffset <= 12; monthOffset++) {
        const periodStart = new Date(cohortDate)
        periodStart.setMonth(periodStart.getMonth() + monthOffset)
        const periodEnd = new Date(periodStart)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        let activeCustomers = 0
        let periodRevenue = 0

        for (const customer of cohort.customers) {
          const periodAppointments = customer.appointments.filter(
            (apt: any) =>
              apt.appointment_date >= periodStart &&
              apt.appointment_date < periodEnd
          )

          if (periodAppointments.length > 0) {
            activeCustomers++
            periodRevenue += periodAppointments.reduce(
              (sum: number, apt: any) => sum + parseFloat(apt.final_price),
              0
            )
          }
        }

        cohort.retention[`month_${monthOffset}`] =
          (activeCustomers / cohort.customers.length) * 100
        cohort.revenue[`month_${monthOffset}`] = periodRevenue
      }
    }

    return Array.from(cohorts.values())
  }

  /**
   * Calculate customer acquisition cost (CAC)
   */
  async calculateCAC(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get marketing spend (from campaigns)
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate total marketing spend (simplified - you'd have actual spend data)
    const totalMarketingSpend = campaigns.length * 500 // Placeholder

    // Get new customers acquired
    const newCustomers = await prisma.customer.count({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const cac = newCustomers > 0 ? totalMarketingSpend / newCustomers : 0

    return {
      totalMarketingSpend,
      newCustomers,
      cac,
      period: {
        start: startDate,
        end: endDate,
      },
    }
  }

  /**
   * Get customer engagement metrics
   */
  async getEngagementMetrics(
    customerId: string,
    days: number = 90
  ) {
    const startDate = subDays(new Date(), days)

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        customer_id: customerId,
        appointment_date: {
          gte: startDate,
        },
      },
      include: {
        services: true,
      },
    })

    // Get reviews
    const reviews = await prisma.review.findMany({
      where: {
        customer_id: customerId,
        created_at: {
          gte: startDate,
        },
      },
    })

    // Get product views
    const productViews = await prisma.productView.count({
      where: {
        customer_id: customerId,
        created_at: {
          gte: startDate,
        },
      },
    })

    // Get email engagement (opens, clicks)
    const notifications = await prisma.notification.findMany({
      where: {
        customer_id: customerId,
        sent_at: {
          gte: startDate,
        },
      },
    })

    const emailOpens = notifications.filter(n => n.read_at).length
    const emailClicks = notifications.filter(n => n.data?.clicked).length

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore({
      appointments: appointments.length,
      reviews: reviews.length,
      productViews,
      emailOpens,
      emailClicks,
    })

    return {
      period: days,
      appointments: appointments.length,
      reviews: reviews.length,
      productViews,
      emailEngagement: {
        sent: notifications.length,
        opens: emailOpens,
        clicks: emailClicks,
        openRate: notifications.length > 0 ? (emailOpens / notifications.length) * 100 : 0,
        clickRate: emailOpens > 0 ? (emailClicks / emailOpens) * 100 : 0,
      },
      engagementScore,
      trend: await this.calculateEngagementTrend(customerId, days),
    }
  }

  // Helper methods

  private calculateLifetimeValue(customer: any): number {
    let totalValue = 0

    // Sum appointment values
    for (const appointment of customer.appointments) {
      if (appointment.payment?.status === 'COMPLETED') {
        totalValue += parseFloat(appointment.final_price.toString())
      }
    }

    // Sum order values
    for (const order of customer.orders) {
      if (order.status === 'DELIVERED') {
        totalValue += parseFloat(order.total_amount.toString())
      }
    }

    // Add subscription values
    for (const subscription of customer.subscriptions) {
      totalValue += parseFloat(subscription.total_revenue?.toString() || '0')
    }

    return totalValue
  }

  private calculateRFMScores(customer: any) {
    // Recency: Days since last visit
    const lastVisit = customer.appointments[0]?.appointment_date
    const daysSinceLastVisit = lastVisit
      ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 365

    // Frequency: Number of visits
    const visitCount = customer.appointments.length

    // Monetary: Total spending
    const totalSpending = this.calculateLifetimeValue(customer)

    // Score each dimension (1-5)
    const recencyScore = this.scoreRecency(daysSinceLastVisit)
    const frequencyScore = this.scoreFrequency(visitCount)
    const monetaryScore = this.scoreMonetary(totalSpending)

    return {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      total: recencyScore + frequencyScore + monetaryScore,
    }
  }

  private scoreRecency(days: number): number {
    if (days <= 7) return 5
    if (days <= 30) return 4
    if (days <= 60) return 3
    if (days <= 90) return 2
    return 1
  }

  private scoreFrequency(visits: number): number {
    if (visits >= 20) return 5
    if (visits >= 10) return 4
    if (visits >= 5) return 3
    if (visits >= 2) return 2
    return 1
  }

  private scoreMonetary(value: number): number {
    if (value >= 5000) return 5
    if (value >= 2000) return 4
    if (value >= 1000) return 3
    if (value >= 500) return 2
    return 1
  }

  private async predictChurn(customer: any): Promise<number> {
    // Simple churn prediction based on patterns
    const daysSinceLastVisit = customer.appointments[0]?.appointment_date
      ? Math.floor((Date.now() - customer.appointments[0].appointment_date.getTime()) / (1000 * 60 * 60 * 24))
      : 365

    const avgDaysBetweenVisits = this.calculateAvgDaysBetweenVisits(customer.appointments)

    // Factors that increase churn probability
    let churnScore = 0

    // Long time since last visit
    if (daysSinceLastVisit > avgDaysBetweenVisits * 2) {
      churnScore += 0.3
    }

    // Declining visit frequency
    if (customer.appointments.length < 3) {
      churnScore += 0.2
    }

    // No active subscription
    if (customer.subscriptions.length === 0) {
      churnScore += 0.1
    }

    // Low engagement
    if (!customer.accepts_marketing) {
      churnScore += 0.1
    }

    // No loyalty points
    if (!customer.loyalty_points || customer.loyalty_points.length === 0) {
      churnScore += 0.1
    }

    return Math.min(churnScore, 1)
  }

  private predictNextVisit(customer: any): Date | undefined {
    if (customer.appointments.length < 2) return undefined

    // Calculate average days between visits
    const avgDays = this.calculateAvgDaysBetweenVisits(customer.appointments)

    // Predict next visit
    const lastVisit = customer.appointments[0]?.appointment_date
    if (lastVisit) {
      const nextVisit = new Date(lastVisit)
      nextVisit.setDate(nextVisit.getDate() + avgDays)
      return nextVisit
    }

    return undefined
  }

  private calculateAvgDaysBetweenVisits(appointments: any[]): number {
    if (appointments.length < 2) return 30 // Default

    let totalDays = 0
    for (let i = 0; i < appointments.length - 1; i++) {
      const days = Math.floor(
        (appointments[i].appointment_date.getTime() - appointments[i + 1].appointment_date.getTime()) /
        (1000 * 60 * 60 * 24)
      )
      totalDays += days
    }

    return Math.floor(totalDays / (appointments.length - 1))
  }

  private analyzePreferences(customer: any) {
    // Analyze preferred services
    const serviceCounts = new Map<string, number>()
    for (const appointment of customer.appointments) {
      for (const service of appointment.services) {
        const count = serviceCounts.get(service.service.name) || 0
        serviceCounts.set(service.service.name, count + 1)
      }
    }

    // Analyze preferred staff
    const staffCounts = new Map<string, number>()
    for (const appointment of customer.appointments) {
      if (appointment.staff) {
        const staffName = `${appointment.staff.user.first_name} ${appointment.staff.user.last_name}`
        const count = staffCounts.get(staffName) || 0
        staffCounts.set(staffName, count + 1)
      }
    }

    // Analyze preferred time slots
    const timeSlotCounts = new Map<string, number>()
    for (const appointment of customer.appointments) {
      const hour = appointment.start_time.getHours()
      const timeSlot = this.categorizeTimeSlot(hour)
      const count = timeSlotCounts.get(timeSlot) || 0
      timeSlotCounts.set(timeSlot, count + 1)
    }

    return {
      preferredServices: Array.from(serviceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([service]) => service),
      preferredStaff: Array.from(staffCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([staff]) => staff),
      preferredTimeSlots: Array.from(timeSlotCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([slot]) => slot),
    }
  }

  private categorizeTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Morning'
    if (hour >= 12 && hour < 17) return 'Afternoon'
    if (hour >= 17 && hour < 21) return 'Evening'
    return 'Night'
  }

  private calculateEngagementScore(metrics: any): number {
    const weights = {
      appointments: 0.4,
      reviews: 0.2,
      productViews: 0.15,
      emailOpens: 0.15,
      emailClicks: 0.1,
    }

    let score = 0
    score += Math.min(metrics.appointments / 10, 1) * weights.appointments * 100
    score += Math.min(metrics.reviews / 5, 1) * weights.reviews * 100
    score += Math.min(metrics.productViews / 50, 1) * weights.productViews * 100
    score += Math.min(metrics.emailOpens / 20, 1) * weights.emailOpens * 100
    score += Math.min(metrics.emailClicks / 10, 1) * weights.emailClicks * 100

    return Math.round(score)
  }

  private async calculateEngagementTrend(customerId: string, days: number): Promise<string> {
    const midPoint = Math.floor(days / 2)
    const firstHalfStart = subDays(new Date(), days)
    const secondHalfStart = subDays(new Date(), midPoint)

    const firstHalfCount = await prisma.appointment.count({
      where: {
        customer_id: customerId,
        appointment_date: {
          gte: firstHalfStart,
          lt: secondHalfStart,
        },
      },
    })

    const secondHalfCount = await prisma.appointment.count({
      where: {
        customer_id: customerId,
        appointment_date: {
          gte: secondHalfStart,
        },
      },
    })

    if (secondHalfCount > firstHalfCount * 1.2) return 'increasing'
    if (secondHalfCount < firstHalfCount * 0.8) return 'decreasing'
    return 'stable'
  }
}