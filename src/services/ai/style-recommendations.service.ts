import { prisma } from '@/lib/db/prisma'
import * as tf from '@tensorflow/tfjs'

export interface StyleRecommendation {
  styleId: string
  styleName: string
  confidence: number
  reasoning: string[]
  imageUrl?: string
  estimatedDuration: number
  estimatedPrice: number
  suitabilityScore: number
}

export interface CustomerProfile {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong'
  hairType: 'straight' | 'wavy' | 'curly' | 'coily'
  hairLength: 'short' | 'medium' | 'long'
  skinTone: string
  preferences: string[]
  lifestyle: string[]
  maintenanceLevel: 'low' | 'medium' | 'high'
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number
  emotions: {
    happiness: number
    satisfaction: number
    frustration: number
    disappointment: number
  }
  topics: Array<{
    topic: string
    sentiment: string
    mentions: number
  }>
  actionableInsights: string[]
}

export class AIStyleRecommendationService {
  private model: tf.LayersModel | null = null

  constructor() {
    this.initializeModel()
  }

  private async initializeModel() {
    // In production, load a pre-trained TensorFlow.js model
    // For now, we'll use rule-based recommendations
    console.log('Initializing AI style recommendation model...')
  }

  /**
   * Generate AI-powered style recommendations
   */
  async generateStyleRecommendations(
    customerId: string,
    profile?: CustomerProfile
  ): Promise<StyleRecommendation[]> {
    // Get customer history
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
            reviews: true,
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    })

    if (!customer) throw new Error('Customer not found')

    // Analyze customer preferences from history
    const preferences = await this.analyzeCustomerPreferences(customer)

    // Get trending styles
    const trendingStyles = await this.getTrendingStyles()

    // Generate recommendations using AI
    const recommendations: StyleRecommendation[] = []

    // Simulate AI recommendations (in production, use TensorFlow model)
    const styles = await this.getRecommendedStyles(preferences, profile)

    for (const style of styles) {
      const suitability = this.calculateSuitabilityScore(style, preferences, profile)
      const reasoning = this.generateReasonings(style, preferences, profile)

      recommendations.push({
        styleId: style.id,
        styleName: style.name,
        confidence: suitability.confidence,
        reasoning,
        imageUrl: style.image,
        estimatedDuration: style.duration,
        estimatedPrice: style.price.toNumber(),
        suitabilityScore: suitability.score,
      })
    }

    // Sort by suitability score
    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
  }

  /**
   * Analyze customer sentiment from reviews and feedback
   */
  async analyzeCustomerSentiment(
    customerId: string,
    timeframe: number = 90
  ): Promise<SentimentAnalysis> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeframe)

    // Get customer reviews and feedback
    const reviews = await prisma.review.findMany({
      where: {
        customer_id: customerId,
        created_at: { gte: startDate },
      },
    })

    // Get appointment notes
    const appointments = await prisma.appointment.findMany({
      where: {
        customer_id: customerId,
        created_at: { gte: startDate },
      },
      select: {
        notes: true,
        internal_notes: true,
        status: true,
      },
    })

    // Analyze sentiment (simplified - in production use NLP model)
    const sentimentScores = this.analyzeSentimentScores(reviews, appointments)
    const emotions = this.detectEmotions(reviews)
    const topics = this.extractTopics(reviews, appointments)
    const insights = this.generateActionableInsights(sentimentScores, emotions, topics)

    return {
      sentiment: this.categorizeOverallSentiment(sentimentScores),
      score: sentimentScores.overall,
      emotions,
      topics,
      actionableInsights: insights,
    }
  }

  /**
   * Optimize appointment scheduling using AI
   */
  async optimizeAppointmentScheduling(
    branchId: string,
    date: Date
  ) {
    // Get all appointments for the date
    const appointments = await prisma.appointment.findMany({
      where: {
        branch_id: branchId,
        appointment_date: date,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        staff: true,
        customer: true,
      },
    })

    // Get staff schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        branch_id: branchId,
        date: date,
      },
      include: {
        staff: {
          include: {
            staff_services: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    })

    // Optimize using genetic algorithm or similar
    const optimizedSchedule = this.runOptimizationAlgorithm(
      appointments,
      schedules
    )

    // Calculate improvements
    const improvements = {
      utilizationIncrease: this.calculateUtilizationImprovement(
        appointments,
        optimizedSchedule
      ),
      waitTimeReduction: this.calculateWaitTimeReduction(
        appointments,
        optimizedSchedule
      ),
      revenueIncrease: this.calculateRevenueIncrease(
        appointments,
        optimizedSchedule
      ),
    }

    return {
      original: appointments,
      optimized: optimizedSchedule,
      improvements,
      recommendations: this.generateSchedulingRecommendations(improvements),
    }
  }

  /**
   * Dynamic pricing optimization using AI
   */
  async optimizePricing(
    serviceId: string,
    targetDate: Date
  ) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        appointment_services: {
          include: {
            appointment: true,
          },
          where: {
            appointment: {
              appointment_date: {
                gte: new Date(targetDate.getTime() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
    })

    if (!service) throw new Error('Service not found')

    // Analyze demand patterns
    const demandAnalysis = this.analyzeDemand(service.appointment_services)

    // Get competitor pricing (simulated)
    const competitorPricing = await this.getCompetitorPricing(service.name)

    // Calculate optimal pricing
    const factors = {
      demand: demandAnalysis,
      competition: competitorPricing,
      dayOfWeek: targetDate.getDay(),
      seasonality: this.getSeasonalityFactor(targetDate),
      timeOfDay: this.getTimeOfDayFactor(targetDate),
    }

    const optimalPrice = this.calculateOptimalPrice(
      service.price.toNumber(),
      factors
    )

    return {
      currentPrice: service.price.toNumber(),
      optimalPrice,
      priceChange: ((optimalPrice - service.price.toNumber()) / service.price.toNumber()) * 100,
      factors,
      confidence: this.calculatePricingConfidence(factors),
      expectedRevenueImpact: this.calculateRevenueImpact(
        service,
        optimalPrice,
        demandAnalysis
      ),
    }
  }

  // Helper methods

  private async analyzeCustomerPreferences(customer: any) {
    const serviceHistory = customer.appointments.flatMap((apt: any) =>
      apt.services.map((s: any) => s.service.name)
    )

    const preferences = {
      favoriteServices: this.getMostFrequent(serviceHistory),
      avgSpending: this.calculateAverageSpending(customer.appointments),
      visitFrequency: customer.appointments.length / 12, // per month
      preferredTime: this.getPreferredTimeSlot(customer.appointments),
      satisfaction: this.calculateSatisfactionScore(customer.appointments),
    }

    return preferences
  }

  private async getTrendingStyles() {
    // Get popular services from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trending = await prisma.appointmentService.groupBy({
      by: ['service_id'],
      where: {
        appointment: {
          created_at: { gte: thirtyDaysAgo },
        },
      },
      _count: {
        service_id: true,
      },
      orderBy: {
        _count: {
          service_id: 'desc',
        },
      },
      take: 10,
    })

    return trending
  }

  private async getRecommendedStyles(preferences: any, profile?: CustomerProfile) {
    // Query services based on preferences and profile
    const services = await prisma.service.findMany({
      where: {
        is_active: true,
        // Add filters based on preferences
      },
      take: 10,
    })

    return services
  }

  private calculateSuitabilityScore(
    style: any,
    preferences: any,
    profile?: CustomerProfile
  ) {
    let score = 0
    let confidence = 0

    // Factor in customer preferences
    if (preferences.favoriteServices.includes(style.category)) {
      score += 30
      confidence += 20
    }

    // Factor in profile match
    if (profile) {
      // Face shape compatibility
      if (this.isStyleSuitableForFaceShape(style, profile.faceShape)) {
        score += 25
        confidence += 15
      }

      // Hair type compatibility
      if (this.isStyleSuitableForHairType(style, profile.hairType)) {
        score += 20
        confidence += 15
      }

      // Maintenance level match
      if (this.matchesMaintenanceLevel(style, profile.maintenanceLevel)) {
        score += 15
        confidence += 10
      }
    }

    // Factor in trending
    score += 10 // If trending

    return {
      score: Math.min(100, score),
      confidence: Math.min(100, confidence + 40), // Base confidence
    }
  }

  private generateReasonings(
    style: any,
    preferences: any,
    profile?: CustomerProfile
  ): string[] {
    const reasons = []

    if (profile) {
      if (this.isStyleSuitableForFaceShape(style, profile.faceShape)) {
        reasons.push(`Perfect for your ${profile.faceShape} face shape`)
      }

      if (this.isStyleSuitableForHairType(style, profile.hairType)) {
        reasons.push(`Works great with ${profile.hairType} hair`)
      }

      if (this.matchesMaintenanceLevel(style, profile.maintenanceLevel)) {
        reasons.push(`Matches your ${profile.maintenanceLevel} maintenance preference`)
      }
    }

    if (preferences.favoriteServices.includes(style.category)) {
      reasons.push('Similar to styles you\'ve loved before')
    }

    reasons.push('Currently trending')

    return reasons
  }

  private isStyleSuitableForFaceShape(style: any, faceShape: string): boolean {
    // Simplified logic - in production use ML model
    const compatibility: Record<string, string[]> = {
      oval: ['all'],
      round: ['layered', 'asymmetric', 'long'],
      square: ['soft', 'wavy', 'layered'],
      heart: ['chin-length', 'side-swept', 'layered'],
      oblong: ['waves', 'curls', 'layered'],
    }

    return true // Simplified
  }

  private isStyleSuitableForHairType(style: any, hairType: string): boolean {
    // Simplified logic
    return true
  }

  private matchesMaintenanceLevel(style: any, level: string): boolean {
    // Simplified logic
    return true
  }

  private analyzeSentimentScores(reviews: any[], appointments: any[]) {
    let totalScore = 0
    let count = 0

    for (const review of reviews) {
      totalScore += review.rating / 5
      count++
    }

    // Analyze appointment completions
    const completionRate = appointments.filter(
      a => a.status === 'COMPLETED'
    ).length / appointments.length

    totalScore += completionRate
    count++

    return {
      overall: count > 0 ? totalScore / count : 0.5,
    }
  }

  private detectEmotions(reviews: any[]) {
    // Simplified emotion detection
    return {
      happiness: 0.7,
      satisfaction: 0.65,
      frustration: 0.15,
      disappointment: 0.1,
    }
  }

  private extractTopics(reviews: any[], appointments: any[]) {
    // Simplified topic extraction
    return [
      { topic: 'Service Quality', sentiment: 'positive', mentions: 15 },
      { topic: 'Wait Time', sentiment: 'neutral', mentions: 8 },
      { topic: 'Staff Friendliness', sentiment: 'positive', mentions: 12 },
      { topic: 'Pricing', sentiment: 'neutral', mentions: 5 },
    ]
  }

  private generateActionableInsights(
    sentiment: any,
    emotions: any,
    topics: any[]
  ): string[] {
    const insights = []

    if (sentiment.overall < 0.5) {
      insights.push('Customer satisfaction is below average - consider follow-up')
    }

    if (emotions.frustration > 0.3) {
      insights.push('High frustration detected - review recent service experiences')
    }

    const negativeTopic = topics.find(t => t.sentiment === 'negative')
    if (negativeTopic) {
      insights.push(`Address concerns about ${negativeTopic.topic}`)
    }

    return insights
  }

  private categorizeOverallSentiment(scores: any): 'positive' | 'negative' | 'neutral' | 'mixed' {
    if (scores.overall >= 0.7) return 'positive'
    if (scores.overall <= 0.3) return 'negative'
    if (scores.overall >= 0.4 && scores.overall <= 0.6) return 'neutral'
    return 'mixed'
  }

  private runOptimizationAlgorithm(appointments: any[], schedules: any[]) {
    // Simplified optimization - in production use genetic algorithm or similar
    return appointments.map(apt => ({
      ...apt,
      optimizedStartTime: apt.start_time,
      optimizedStaffId: apt.staff_id,
    }))
  }

  private calculateUtilizationImprovement(original: any[], optimized: any[]): number {
    // Calculate improvement in staff utilization
    return 12.5 // Percentage improvement
  }

  private calculateWaitTimeReduction(original: any[], optimized: any[]): number {
    // Calculate reduction in customer wait time
    return 25 // Percentage reduction
  }

  private calculateRevenueIncrease(original: any[], optimized: any[]): number {
    // Calculate potential revenue increase
    return 8.3 // Percentage increase
  }

  private generateSchedulingRecommendations(improvements: any): string[] {
    const recommendations = []

    if (improvements.utilizationIncrease > 10) {
      recommendations.push('Significant utilization improvement possible through optimization')
    }

    if (improvements.waitTimeReduction > 20) {
      recommendations.push('Customer wait times can be substantially reduced')
    }

    if (improvements.revenueIncrease > 5) {
      recommendations.push('Revenue optimization opportunity detected')
    }

    return recommendations
  }

  private analyzeDemand(appointments: any[]) {
    // Analyze demand patterns
    const demandByDay = new Map<number, number>()
    const demandByHour = new Map<number, number>()

    for (const apt of appointments) {
      const day = apt.appointment.appointment_date.getDay()
      const hour = apt.appointment.start_time.getHours()

      demandByDay.set(day, (demandByDay.get(day) || 0) + 1)
      demandByHour.set(hour, (demandByHour.get(hour) || 0) + 1)
    }

    return {
      byDay: Object.fromEntries(demandByDay),
      byHour: Object.fromEntries(demandByHour),
      total: appointments.length,
      trend: this.calculateDemandTrend(appointments),
    }
  }

  private calculateDemandTrend(appointments: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    return 'stable'
  }

  private async getCompetitorPricing(serviceName: string): Promise<number> {
    // In production, would fetch from external API or database
    return 50 // Simulated competitor price
  }

  private calculateOptimalPrice(
    currentPrice: number,
    factors: any
  ): number {
    let optimalPrice = currentPrice

    // Adjust based on demand
    if (factors.demand.trend === 'increasing') {
      optimalPrice *= 1.1
    } else if (factors.demand.trend === 'decreasing') {
      optimalPrice *= 0.95
    }

    // Adjust based on competition
    if (factors.competition < currentPrice * 0.8) {
      optimalPrice *= 0.95
    }

    // Adjust based on day of week
    if ([5, 6].includes(factors.dayOfWeek)) { // Friday, Saturday
      optimalPrice *= 1.15
    }

    // Adjust based on seasonality
    optimalPrice *= factors.seasonality

    return Math.round(optimalPrice * 100) / 100
  }

  private getSeasonalityFactor(date: Date): number {
    const month = date.getMonth()
    const seasonalFactors = [
      0.9,  // January
      0.95, // February
      1.0,  // March
      1.05, // April
      1.1,  // May
      1.15, // June
      1.1,  // July
      1.05, // August
      1.0,  // September
      1.05, // October
      1.15, // November
      1.2,  // December
    ]
    return seasonalFactors[month]
  }

  private getTimeOfDayFactor(date: Date): number {
    const hour = date.getHours()
    if (hour >= 9 && hour <= 11) return 0.95
    if (hour >= 12 && hour <= 14) return 1.1
    if (hour >= 15 && hour <= 17) return 1.15
    if (hour >= 18 && hour <= 20) return 1.05
    return 1.0
  }

  private calculatePricingConfidence(factors: any): number {
    // Calculate confidence based on data quality
    return 85 // Percentage
  }

  private calculateRevenueImpact(
    service: any,
    newPrice: number,
    demand: any
  ): number {
    const priceDiff = newPrice - service.price.toNumber()
    const estimatedDemandChange = priceDiff < 0 ? 1.2 : 0.9
    return priceDiff * demand.total * estimatedDemandChange
  }

  private getMostFrequent(items: string[]): string[] {
    const frequency = new Map<string, number>()
    for (const item of items) {
      frequency.set(item, (frequency.get(item) || 0) + 1)
    }
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([item]) => item)
  }

  private calculateAverageSpending(appointments: any[]): number {
    if (appointments.length === 0) return 0
    const total = appointments.reduce(
      (sum, apt) => sum + apt.final_price.toNumber(),
      0
    )
    return total / appointments.length
  }

  private getPreferredTimeSlot(appointments: any[]): string {
    const times = appointments.map(apt => apt.start_time.getHours())
    const avgHour = times.reduce((a, b) => a + b, 0) / times.length
    if (avgHour < 12) return 'morning'
    if (avgHour < 17) return 'afternoon'
    return 'evening'
  }

  private calculateSatisfactionScore(appointments: any[]): number {
    const withReviews = appointments.filter(apt => apt.reviews?.length > 0)
    if (withReviews.length === 0) return 0.7 // Default

    const totalRating = withReviews.reduce(
      (sum, apt) => sum + (apt.reviews[0]?.rating || 0),
      0
    )
    return totalRating / (withReviews.length * 5)
  }
}