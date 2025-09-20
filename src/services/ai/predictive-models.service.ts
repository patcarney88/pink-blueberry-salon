import { prisma } from '@/lib/db/prisma'
import * as tf from '@tensorflow/tfjs'
import { subDays, addDays, startOfDay, endOfDay, format } from 'date-fns'

export interface DemandForecast {
  service: string
  date: Date
  predictedDemand: number
  confidence: number
  factors: {
    seasonality: number
    trend: number
    events: number
    weather: number
  }
}

export interface ChurnPrediction {
  customerId: string
  churnProbability: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: {
    daysSinceLastVisit: number
    visitFrequency: number
    lifetimeValue: number
    satisfaction: number
  }
  recommendedActions: string[]
}

export interface RevenuePrediction {
  period: string
  predicted: number
  lower: number
  upper: number
  confidence: number
  drivers: {
    appointments: number
    averageTicket: number
    products: number
    subscriptions: number
  }
}

export interface StaffOptimization {
  date: Date
  recommendedStaff: number
  currentStaff: number
  predictedDemand: number
  utilizationTarget: number
  shifts: Array<{
    startTime: string
    endTime: string
    staffCount: number
    skills: string[]
  }>
}

export interface PricingOptimization {
  serviceId: string
  currentPrice: number
  optimalPrice: number
  elasticity: number
  expectedRevenueLift: number
  competitorPricing: number
  recommendation: 'INCREASE' | 'DECREASE' | 'MAINTAIN'
}

export class PredictiveModelsService {
  private revenueModel: tf.LayersModel | null = null
  private churnModel: tf.LayersModel | null = null
  private demandModel: tf.LayersModel | null = null

  constructor() {
    this.initializeModels()
  }

  private async initializeModels() {
    // In production, these would be pre-trained models
    // For now, we'll use rule-based predictions with simulated ML
  }

  /**
   * Predict service demand for upcoming period
   */
  async predictDemand(
    branchId: string,
    services: string[],
    daysAhead: number = 30
  ): Promise<DemandForecast[]> {
    const forecasts: DemandForecast[] = []

    // Get historical data
    const historicalData = await this.getHistoricalServiceData(branchId, 90)

    for (const service of services) {
      const serviceData = historicalData.filter(d => d.service === service)

      for (let day = 1; day <= daysAhead; day++) {
        const targetDate = addDays(new Date(), day)

        // Calculate factors
        const seasonality = this.calculateSeasonality(targetDate)
        const trend = this.calculateTrend(serviceData)
        const events = await this.getEventImpact(targetDate)
        const weather = this.getWeatherImpact(targetDate)

        // Combine factors for prediction
        const baseDemand = this.calculateBaseDemand(serviceData)
        const predictedDemand = Math.round(
          baseDemand * seasonality * trend * events * weather
        )

        // Calculate confidence based on data quality and forecast horizon
        const confidence = this.calculateConfidence(serviceData.length, day)

        forecasts.push({
          service,
          date: targetDate,
          predictedDemand,
          confidence,
          factors: {
            seasonality,
            trend,
            events,
            weather,
          },
        })
      }
    }

    return forecasts
  }

  /**
   * Predict customer churn risk
   */
  async predictChurn(
    branchId: string,
    customerId?: string
  ): Promise<ChurnPrediction[]> {
    const predictions: ChurnPrediction[] = []

    // Get customers to analyze
    const customers = customerId
      ? await prisma.customer.findMany({
          where: { id: customerId, branch_id: branchId },
          include: {
            appointments: {
              orderBy: { appointment_date: 'desc' },
              take: 10,
            },
            reviews: true,
            orders: true,
          },
        })
      : await prisma.customer.findMany({
          where: { branch_id: branchId },
          include: {
            appointments: {
              orderBy: { appointment_date: 'desc' },
              take: 10,
            },
            reviews: true,
            orders: true,
          },
          take: 100, // Analyze top customers
        })

    for (const customer of customers) {
      // Calculate churn factors
      const lastVisit = customer.appointments[0]?.appointment_date || customer.created_at
      const daysSinceLastVisit = Math.floor(
        (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      )

      const visitFrequency = this.calculateVisitFrequency(customer.appointments)
      const lifetimeValue = await this.calculateCustomerLTV(customer)
      const satisfaction = this.calculateSatisfaction(customer.reviews)

      // Churn probability calculation (simulated ML model)
      const churnProbability = this.calculateChurnProbability({
        daysSinceLastVisit,
        visitFrequency,
        lifetimeValue,
        satisfaction,
      })

      // Determine risk level
      const riskLevel = this.determineRiskLevel(churnProbability)

      // Generate recommended actions
      const recommendedActions = this.generateChurnPreventionActions(
        churnProbability,
        { daysSinceLastVisit, visitFrequency, lifetimeValue, satisfaction }
      )

      predictions.push({
        customerId: customer.id,
        churnProbability,
        riskLevel,
        factors: {
          daysSinceLastVisit,
          visitFrequency,
          lifetimeValue,
          satisfaction,
        },
        recommendedActions,
      })
    }

    return predictions.sort((a, b) => b.churnProbability - a.churnProbability)
  }

  /**
   * Predict revenue for future periods
   */
  async predictRevenue(
    branchId: string,
    periods: number = 12
  ): Promise<RevenuePrediction[]> {
    const predictions: RevenuePrediction[] = []

    // Get historical revenue data
    const historicalRevenue = await this.getHistoricalRevenue(branchId, 365)

    for (let period = 1; period <= periods; period++) {
      const startDate = addDays(new Date(), (period - 1) * 30)
      const endDate = addDays(startDate, 30)

      // Decompose revenue into components
      const appointmentRevenue = await this.predictAppointmentRevenue(
        branchId,
        startDate,
        endDate,
        historicalRevenue
      )
      const productRevenue = await this.predictProductRevenue(
        branchId,
        startDate,
        endDate
      )
      const subscriptionRevenue = await this.predictSubscriptionRevenue(
        branchId,
        startDate,
        endDate
      )

      const totalPredicted = appointmentRevenue + productRevenue + subscriptionRevenue

      // Calculate confidence intervals
      const confidence = 0.95 - (period * 0.05) // Decreases with time
      const margin = totalPredicted * (1 - confidence) * 0.2
      const lower = totalPredicted - margin
      const upper = totalPredicted + margin

      predictions.push({
        period: format(startDate, 'MMM yyyy'),
        predicted: Math.round(totalPredicted),
        lower: Math.round(lower),
        upper: Math.round(upper),
        confidence,
        drivers: {
          appointments: Math.round(appointmentRevenue),
          averageTicket: Math.round(appointmentRevenue / 100), // Simplified
          products: Math.round(productRevenue),
          subscriptions: Math.round(subscriptionRevenue),
        },
      })
    }

    return predictions
  }

  /**
   * Optimize staff scheduling based on predicted demand
   */
  async optimizeStaffing(
    branchId: string,
    targetDate: Date
  ): Promise<StaffOptimization> {
    // Get predicted demand for the date
    const demandPrediction = await this.predictDailyDemand(branchId, targetDate)

    // Get current staff schedule
    const currentStaff = await prisma.staff.count({
      where: {
        branches: {
          some: { branch_id: branchId },
        },
        schedules: {
          some: {
            date: targetDate,
            status: 'CONFIRMED',
          },
        },
      },
    })

    // Calculate optimal staffing
    const utilizationTarget = 0.85 // 85% utilization target
    const avgAppointmentDuration = 60 // minutes
    const workingHours = 8

    const staffCapacity = workingHours * 60 / avgAppointmentDuration
    const recommendedStaff = Math.ceil(
      demandPrediction / (staffCapacity * utilizationTarget)
    )

    // Generate optimal shift patterns
    const shifts = this.generateOptimalShifts(demandPrediction, recommendedStaff)

    return {
      date: targetDate,
      recommendedStaff,
      currentStaff,
      predictedDemand: demandPrediction,
      utilizationTarget,
      shifts,
    }
  }

  /**
   * Optimize pricing using demand elasticity
   */
  async optimizePricing(
    serviceId: string,
    targetDate?: Date
  ): Promise<PricingOptimization> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        appointment_services: {
          include: {
            appointment: true,
          },
          take: 100,
        },
      },
    })

    if (!service) {
      throw new Error('Service not found')
    }

    const currentPrice = service.price.toNumber()

    // Calculate price elasticity
    const elasticity = await this.calculatePriceElasticity(serviceId)

    // Get competitor pricing (simulated)
    const competitorPricing = currentPrice * (0.9 + Math.random() * 0.3)

    // Calculate optimal price
    const demandFactor = targetDate
      ? await this.getDemandFactor(serviceId, targetDate)
      : 1

    const optimalPrice = this.calculateOptimalPrice(
      currentPrice,
      elasticity,
      competitorPricing,
      demandFactor
    )

    // Calculate expected revenue lift
    const expectedRevenueLift = this.calculateRevenueLift(
      currentPrice,
      optimalPrice,
      elasticity
    )

    // Determine recommendation
    const priceDiff = optimalPrice - currentPrice
    const recommendation = priceDiff > currentPrice * 0.05
      ? 'INCREASE'
      : priceDiff < -currentPrice * 0.05
      ? 'DECREASE'
      : 'MAINTAIN'

    return {
      serviceId,
      currentPrice,
      optimalPrice: Math.round(optimalPrice * 100) / 100,
      elasticity,
      expectedRevenueLift,
      competitorPricing,
      recommendation,
    }
  }

  /**
   * Predict customer lifetime value
   */
  async predictCustomerLTV(
    customerId: string
  ): Promise<{
    currentLTV: number
    predictedLTV: number
    confidence: number
    breakdown: {
      services: number
      products: number
      subscriptions: number
    }
  }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          include: {
            payment: {
              where: { status: 'COMPLETED' },
            },
          },
        },
        orders: {
          where: { payment_status: 'COMPLETED' },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Calculate current LTV
    const currentServiceRevenue = customer.appointments.reduce(
      (sum, a) => sum + (a.payment?.amount.toNumber() || 0),
      0
    )
    const currentProductRevenue = customer.orders.reduce(
      (sum, o) => sum + o.total_amount.toNumber(),
      0
    )
    const currentSubscriptionRevenue = customer.subscriptions.reduce(
      (sum, s) => sum + (s.total_revenue?.toNumber() || 0),
      0
    )

    const currentLTV = currentServiceRevenue + currentProductRevenue + currentSubscriptionRevenue

    // Predict future LTV (next 2 years)
    const customerAge = Math.floor(
      (Date.now() - customer.created_at.getTime()) / (1000 * 60 * 60 * 24 * 365)
    )
    const retentionProbability = this.calculateRetentionProbability(customer)
    const predictedYears = 2

    const avgAnnualSpend = currentLTV / Math.max(customerAge, 1)
    const predictedFutureValue = avgAnnualSpend * predictedYears * retentionProbability

    const predictedLTV = currentLTV + predictedFutureValue

    return {
      currentLTV,
      predictedLTV,
      confidence: retentionProbability,
      breakdown: {
        services: currentServiceRevenue + (predictedFutureValue * 0.7),
        products: currentProductRevenue + (predictedFutureValue * 0.2),
        subscriptions: currentSubscriptionRevenue + (predictedFutureValue * 0.1),
      },
    }
  }

  /**
   * Generate business growth scenarios
   */
  async generateGrowthScenarios(
    branchId: string
  ): Promise<{
    conservative: RevenuePrediction[]
    moderate: RevenuePrediction[]
    aggressive: RevenuePrediction[]
  }> {
    const baselineRevenue = await this.predictRevenue(branchId, 12)

    // Conservative scenario (5% growth)
    const conservative = baselineRevenue.map(r => ({
      ...r,
      predicted: r.predicted * 1.05,
      lower: r.lower * 1.05,
      upper: r.upper * 1.05,
    }))

    // Moderate scenario (15% growth)
    const moderate = baselineRevenue.map(r => ({
      ...r,
      predicted: r.predicted * 1.15,
      lower: r.lower * 1.15,
      upper: r.upper * 1.15,
    }))

    // Aggressive scenario (30% growth)
    const aggressive = baselineRevenue.map(r => ({
      ...r,
      predicted: r.predicted * 1.30,
      lower: r.lower * 1.30,
      upper: r.upper * 1.30,
    }))

    return {
      conservative,
      moderate,
      aggressive,
    }
  }

  // Helper methods

  private async getHistoricalServiceData(branchId: string, days: number) {
    const startDate = subDays(new Date(), days)

    const appointments = await prisma.appointmentService.findMany({
      where: {
        appointment: {
          branch_id: branchId,
          appointment_date: {
            gte: startDate,
          },
        },
      },
      include: {
        service: true,
        appointment: true,
      },
    })

    const serviceData: any[] = []
    appointments.forEach(as => {
      serviceData.push({
        service: as.service.name,
        date: as.appointment.appointment_date,
        count: 1,
      })
    })

    return serviceData
  }

  private calculateSeasonality(date: Date): number {
    const month = date.getMonth()
    const dayOfWeek = date.getDay()

    // Monthly seasonality
    const monthFactors = [
      0.8, 0.85, 0.9, 0.95, 1.1, 1.2,
      1.15, 1.1, 1.0, 0.95, 1.1, 1.3
    ]

    // Day of week seasonality
    const dayFactors = [0.7, 0.9, 0.95, 1.0, 1.2, 1.5, 1.3]

    return monthFactors[month] * dayFactors[dayOfWeek]
  }

  private calculateTrend(data: any[]): number {
    if (data.length < 10) return 1.0

    // Simple linear trend
    const recentAvg = data.slice(-10).length / 10
    const olderAvg = data.slice(-20, -10).length / 10

    return olderAvg > 0 ? recentAvg / olderAvg : 1.0
  }

  private async getEventImpact(date: Date): Promise<number> {
    // Check for holidays, special events
    const isHoliday = false // Would check actual holiday calendar
    const hasPromotion = Math.random() > 0.8

    let impact = 1.0
    if (isHoliday) impact *= 1.3
    if (hasPromotion) impact *= 1.2

    return impact
  }

  private getWeatherImpact(date: Date): number {
    // Simplified weather impact
    return 0.9 + Math.random() * 0.2
  }

  private calculateBaseDemand(data: any[]): number {
    if (data.length === 0) return 10

    const avgDemand = data.length / 90 * 30 // Convert to monthly
    return avgDemand
  }

  private calculateConfidence(dataPoints: number, daysAhead: number): number {
    const dataConfidence = Math.min(dataPoints / 100, 1)
    const timeConfidence = Math.max(1 - (daysAhead / 60), 0.5)

    return dataConfidence * timeConfidence
  }

  private calculateVisitFrequency(appointments: any[]): number {
    if (appointments.length < 2) return 0

    const intervals: number[] = []
    for (let i = 1; i < appointments.length; i++) {
      const interval = appointments[i-1].appointment_date.getTime() -
                       appointments[i].appointment_date.getTime()
      intervals.push(interval / (1000 * 60 * 60 * 24))
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return avgInterval > 0 ? 30 / avgInterval : 0 // Visits per month
  }

  private async calculateCustomerLTV(customer: any): Promise<number> {
    const appointmentRevenue = customer.appointments.reduce(
      (sum: number, a: any) => sum + (a.payment?.amount?.toNumber() || 0),
      0
    )
    const orderRevenue = customer.orders.reduce(
      (sum: number, o: any) => sum + (o.total_amount?.toNumber() || 0),
      0
    )

    return appointmentRevenue + orderRevenue
  }

  private calculateSatisfaction(reviews: any[]): number {
    if (reviews.length === 0) return 0.7 // Default neutral

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return avgRating / 5
  }

  private calculateChurnProbability(factors: any): number {
    const weights = {
      daysSinceLastVisit: 0.4,
      visitFrequency: -0.3,
      lifetimeValue: -0.2,
      satisfaction: -0.3,
    }

    let score = 0
    score += Math.min(factors.daysSinceLastVisit / 180, 1) * weights.daysSinceLastVisit
    score += (1 - Math.min(factors.visitFrequency / 2, 1)) * Math.abs(weights.visitFrequency)
    score += (1 - Math.min(factors.lifetimeValue / 5000, 1)) * Math.abs(weights.lifetimeValue)
    score += (1 - factors.satisfaction) * Math.abs(weights.satisfaction)

    return Math.min(Math.max(score, 0), 1)
  }

  private determineRiskLevel(probability: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (probability >= 0.8) return 'CRITICAL'
    if (probability >= 0.6) return 'HIGH'
    if (probability >= 0.4) return 'MEDIUM'
    return 'LOW'
  }

  private generateChurnPreventionActions(probability: number, factors: any): string[] {
    const actions: string[] = []

    if (factors.daysSinceLastVisit > 60) {
      actions.push('Send personalized re-engagement email')
      actions.push('Offer comeback discount (20% off next service)')
    }

    if (factors.visitFrequency < 0.5) {
      actions.push('Enroll in loyalty program')
      actions.push('Create subscription package offer')
    }

    if (factors.satisfaction < 0.7) {
      actions.push('Personal outreach from manager')
      actions.push('Service recovery offer')
    }

    if (probability > 0.7) {
      actions.push('VIP treatment on next visit')
      actions.push('Exclusive preview of new services')
    }

    return actions
  }

  private async getHistoricalRevenue(branchId: string, days: number) {
    const startDate = subDays(new Date(), days)

    const payments = await prisma.payment.aggregate({
      where: {
        appointment: {
          branch_id: branchId,
        },
        paid_at: {
          gte: startDate,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })

    return payments._sum.amount?.toNumber() || 0
  }

  private async predictAppointmentRevenue(
    branchId: string,
    startDate: Date,
    endDate: Date,
    historicalRevenue: number
  ): Promise<number> {
    // Simplified prediction based on historical average
    const dailyAvg = historicalRevenue / 365
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    return dailyAvg * days * 1.05 // 5% growth factor
  }

  private async predictProductRevenue(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Simplified - would use actual ML model
    return 5000 * (1 + Math.random() * 0.2)
  }

  private async predictSubscriptionRevenue(
    branchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        customer: {
          branch_id: branchId,
        },
        status: 'ACTIVE',
      },
    })

    return activeSubscriptions * 99 // Assuming $99/month average
  }

  private async predictDailyDemand(branchId: string, date: Date): Promise<number> {
    const dayOfWeek = date.getDay()
    const baseDemand = 20

    // Day of week factors
    const dayFactors = [0.6, 0.8, 0.9, 1.0, 1.3, 1.5, 1.2]

    return Math.round(baseDemand * dayFactors[dayOfWeek])
  }

  private generateOptimalShifts(demand: number, staffCount: number) {
    const shifts = []

    // Morning shift (higher staff)
    shifts.push({
      startTime: '09:00',
      endTime: '14:00',
      staffCount: Math.ceil(staffCount * 0.6),
      skills: ['Hair Styling', 'Color'],
    })

    // Afternoon/Evening shift
    shifts.push({
      startTime: '14:00',
      endTime: '21:00',
      staffCount: Math.ceil(staffCount * 0.4),
      skills: ['Hair Styling', 'Treatments'],
    })

    return shifts
  }

  private async calculatePriceElasticity(serviceId: string): Promise<number> {
    // Simplified elasticity calculation
    // In production, would analyze historical price changes vs demand
    return -1.2 // Typical service elasticity
  }

  private async getDemandFactor(serviceId: string, date: Date): Promise<number> {
    const seasonality = this.calculateSeasonality(date)
    const dayOfWeek = date.getDay()

    // Weekend premium
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1.0

    return seasonality * weekendFactor
  }

  private calculateOptimalPrice(
    currentPrice: number,
    elasticity: number,
    competitorPrice: number,
    demandFactor: number
  ): number {
    // Price optimization formula
    const marginTarget = 0.6 // 60% margin target
    const competitiveWeight = 0.3

    const demandAdjusted = currentPrice * demandFactor
    const competitiveAdjusted = competitorPrice * (1 + competitiveWeight)

    const optimal = (demandAdjusted + competitiveAdjusted) / 2

    // Apply elasticity constraints
    const maxIncrease = currentPrice * 1.2
    const maxDecrease = currentPrice * 0.8

    return Math.min(Math.max(optimal, maxDecrease), maxIncrease)
  }

  private calculateRevenueLift(
    currentPrice: number,
    newPrice: number,
    elasticity: number
  ): number {
    const priceChange = (newPrice - currentPrice) / currentPrice
    const quantityChange = priceChange * elasticity

    const newRevenue = newPrice * (1 + quantityChange)
    const currentRevenue = currentPrice

    return ((newRevenue - currentRevenue) / currentRevenue) * 100
  }

  private calculateRetentionProbability(customer: any): number {
    const appointmentCount = customer.appointments.length
    const accountAge = Math.floor(
      (Date.now() - customer.created_at.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Simple retention model
    const frequencyScore = Math.min(appointmentCount / 10, 1)
    const tenureScore = Math.min(accountAge / 365, 1)

    return (frequencyScore + tenureScore) / 2
  }
}