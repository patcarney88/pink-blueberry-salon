import { prisma } from '@/lib/db/prisma'
import { createHash } from 'crypto'

export interface Experiment {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  type: 'A/B' | 'MULTIVARIATE' | 'SPLIT_URL'
  startDate: Date
  endDate?: Date
  targetAudience: {
    segments: string[]
    percentage: number
    criteria: Record<string, any>
  }
  variants: Variant[]
  metrics: ExperimentMetric[]
  results?: ExperimentResults
}

export interface Variant {
  id: string
  name: string
  description: string
  allocation: number // Percentage of traffic
  isControl: boolean
  configuration: Record<string, any>
  metrics?: VariantMetrics
}

export interface ExperimentMetric {
  name: string
  type: 'CONVERSION' | 'ENGAGEMENT' | 'REVENUE' | 'CUSTOM'
  goalValue?: number
  isPrimary: boolean
}

export interface VariantMetrics {
  impressions: number
  conversions: number
  conversionRate: number
  revenue: number
  averageOrderValue: number
  confidence: number
  uplift?: number
}

export interface ExperimentResults {
  winner?: string
  confidence: number
  significanceLevel: number
  sampleSize: number
  duration: number
  analysis: {
    statistical: StatisticalAnalysis
    practical: PracticalAnalysis
  }
}

export interface StatisticalAnalysis {
  pValue: number
  confidenceInterval: [number, number]
  effectSize: number
  power: number
}

export interface PracticalAnalysis {
  revenueImpact: number
  customerImpact: number
  operationalImpact: string
  recommendation: string
}

export interface UserAssignment {
  userId: string
  experimentId: string
  variantId: string
  assignedAt: Date
  converted: boolean
  conversionValue?: number
}

export class ABTestingService {
  /**
   * Create a new experiment
   */
  async createExperiment(
    experiment: Omit<Experiment, 'id' | 'results'>
  ): Promise<Experiment> {
    const experimentId = `exp_${Date.now()}`

    // Validate variant allocations sum to 100%
    const totalAllocation = experiment.variants.reduce(
      (sum, v) => sum + v.allocation,
      0
    )
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%')
    }

    // Store experiment configuration
    const savedExperiment = await prisma.experiment.create({
      data: {
        id: experimentId,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        type: experiment.type,
        start_date: experiment.startDate,
        end_date: experiment.endDate,
        configuration: {
          targetAudience: experiment.targetAudience,
          variants: experiment.variants,
          metrics: experiment.metrics,
        } as any,
      },
    })

    return {
      ...experiment,
      id: experimentId,
    }
  }

  /**
   * Get variant assignment for a user
   */
  async getVariantAssignment(
    userId: string,
    experimentId: string
  ): Promise<Variant | null> {
    // Check if experiment is active
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    })

    if (!experiment || experiment.status !== 'RUNNING') {
      return null
    }

    const config = experiment.configuration as any

    // Check if user is in target audience
    if (!this.isUserInTargetAudience(userId, config.targetAudience)) {
      return null
    }

    // Check for existing assignment
    let assignment = await prisma.experimentAssignment.findUnique({
      where: {
        user_id_experiment_id: {
          user_id: userId,
          experiment_id: experimentId,
        },
      },
    })

    // If no assignment, create one
    if (!assignment) {
      const variant = this.selectVariant(userId, experimentId, config.variants)

      assignment = await prisma.experimentAssignment.create({
        data: {
          user_id: userId,
          experiment_id: experimentId,
          variant_id: variant.id,
          variant_name: variant.name,
        },
      })

      // Track impression
      await this.trackImpression(experimentId, variant.id)
    }

    // Return the assigned variant
    return config.variants.find((v: Variant) => v.id === assignment!.variant_id)
  }

  /**
   * Track conversion event
   */
  async trackConversion(
    userId: string,
    experimentId: string,
    value?: number,
    eventName?: string
  ): Promise<void> {
    const assignment = await prisma.experimentAssignment.findUnique({
      where: {
        user_id_experiment_id: {
          user_id: userId,
          experiment_id: experimentId,
        },
      },
    })

    if (!assignment) {
      return // User not in experiment
    }

    // Update assignment with conversion
    await prisma.experimentAssignment.update({
      where: {
        user_id_experiment_id: {
          user_id: userId,
          experiment_id: experimentId,
        },
      },
      data: {
        converted: true,
        conversion_value: value,
        converted_at: new Date(),
      },
    })

    // Track conversion event
    await prisma.experimentEvent.create({
      data: {
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        user_id: userId,
        event_type: 'CONVERSION',
        event_name: eventName || 'conversion',
        event_value: value,
      },
    })
  }

  /**
   * Track custom event
   */
  async trackEvent(
    userId: string,
    experimentId: string,
    eventName: string,
    eventValue?: any
  ): Promise<void> {
    const assignment = await prisma.experimentAssignment.findUnique({
      where: {
        user_id_experiment_id: {
          user_id: userId,
          experiment_id: experimentId,
        },
      },
    })

    if (!assignment) {
      return
    }

    await prisma.experimentEvent.create({
      data: {
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        user_id: userId,
        event_type: 'CUSTOM',
        event_name: eventName,
        event_value: eventValue,
      },
    })
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResults> {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        assignments: true,
        events: true,
      },
    })

    if (!experiment) {
      throw new Error('Experiment not found')
    }

    const config = experiment.configuration as any
    const variants = config.variants as Variant[]

    // Calculate metrics for each variant
    const variantMetrics: Map<string, VariantMetrics> = new Map()

    for (const variant of variants) {
      const assignments = experiment.assignments.filter(
        a => a.variant_id === variant.id
      )
      const conversions = assignments.filter(a => a.converted)

      const metrics: VariantMetrics = {
        impressions: assignments.length,
        conversions: conversions.length,
        conversionRate: assignments.length > 0
          ? conversions.length / assignments.length
          : 0,
        revenue: conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0),
        averageOrderValue: conversions.length > 0
          ? conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0) / conversions.length
          : 0,
        confidence: 0,
        uplift: 0,
      }

      variantMetrics.set(variant.id, metrics)
    }

    // Find control variant
    const controlVariant = variants.find(v => v.isControl)
    if (!controlVariant) {
      throw new Error('No control variant found')
    }

    const controlMetrics = variantMetrics.get(controlVariant.id)!

    // Calculate statistical significance
    let winner: string | undefined
    let maxUplift = 0
    let winnerConfidence = 0

    for (const variant of variants) {
      if (variant.isControl) continue

      const metrics = variantMetrics.get(variant.id)!

      // Calculate uplift
      metrics.uplift = controlMetrics.conversionRate > 0
        ? ((metrics.conversionRate - controlMetrics.conversionRate) / controlMetrics.conversionRate) * 100
        : 0

      // Calculate statistical significance (simplified)
      const significance = this.calculateSignificance(
        controlMetrics.impressions,
        controlMetrics.conversions,
        metrics.impressions,
        metrics.conversions
      )

      metrics.confidence = significance.confidence

      if (significance.confidence > 0.95 && metrics.uplift! > maxUplift) {
        winner = variant.id
        maxUplift = metrics.uplift!
        winnerConfidence = significance.confidence
      }
    }

    // Statistical analysis
    const statistical: StatisticalAnalysis = {
      pValue: winner ? 1 - winnerConfidence : 1,
      confidenceInterval: this.calculateConfidenceInterval(variantMetrics),
      effectSize: this.calculateEffectSize(variantMetrics),
      power: this.calculateStatisticalPower(experiment.assignments.length),
    }

    // Practical analysis
    const practical: PracticalAnalysis = {
      revenueImpact: this.calculateRevenueImpact(variantMetrics),
      customerImpact: experiment.assignments.length,
      operationalImpact: this.assessOperationalImpact(maxUplift),
      recommendation: this.generateRecommendation(winner, winnerConfidence, maxUplift),
    }

    return {
      winner,
      confidence: winnerConfidence,
      significanceLevel: 0.95,
      sampleSize: experiment.assignments.length,
      duration: experiment.end_date
        ? Math.ceil((experiment.end_date.getTime() - experiment.start_date.getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((Date.now() - experiment.start_date.getTime()) / (1000 * 60 * 60 * 24)),
      analysis: {
        statistical,
        practical,
      },
    }
  }

  /**
   * Run automatic experiment optimization
   */
  async optimizeExperiment(experimentId: string): Promise<void> {
    const results = await this.getExperimentResults(experimentId)

    // Multi-armed bandit optimization
    if (results.sampleSize > 1000 && results.winner) {
      const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
      })

      if (!experiment) return

      const config = experiment.configuration as any
      const variants = config.variants as Variant[]

      // Adjust allocations based on performance
      const winner = variants.find(v => v.id === results.winner)
      if (winner) {
        // Increase winner allocation
        winner.allocation = Math.min(winner.allocation + 10, 80)

        // Decrease others proportionally
        const others = variants.filter(v => v.id !== results.winner)
        const reduction = 10 / others.length

        others.forEach(v => {
          v.allocation = Math.max(v.allocation - reduction, 10)
        })

        // Update experiment configuration
        await prisma.experiment.update({
          where: { id: experimentId },
          data: {
            configuration: {
              ...config,
              variants,
            } as any,
          },
        })
      }
    }
  }

  /**
   * Get personalization recommendations
   */
  async getPersonalizationRecommendations(
    userId: string
  ): Promise<{
    segments: string[]
    preferences: Record<string, any>
    recommendedExperiments: string[]
  }> {
    // Get user's experiment history
    const assignments = await prisma.experimentAssignment.findMany({
      where: {
        user_id: userId,
        converted: true,
      },
      include: {
        experiment: true,
      },
    })

    // Analyze conversion patterns
    const conversionPatterns = this.analyzeConversionPatterns(assignments)

    // Determine user segments
    const segments = await this.determineUserSegments(userId, conversionPatterns)

    // Extract preferences
    const preferences = this.extractPreferences(assignments)

    // Recommend relevant experiments
    const recommendedExperiments = await this.recommendExperiments(
      segments,
      preferences
    )

    return {
      segments,
      preferences,
      recommendedExperiments,
    }
  }

  /**
   * Generate experiment insights
   */
  async generateInsights(experimentId: string): Promise<{
    keyFindings: string[]
    recommendations: string[]
    nextSteps: string[]
  }> {
    const results = await this.getExperimentResults(experimentId)
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    })

    if (!experiment) {
      throw new Error('Experiment not found')
    }

    const config = experiment.configuration as any
    const keyFindings: string[] = []
    const recommendations: string[] = []
    const nextSteps: string[] = []

    // Key findings
    if (results.winner) {
      keyFindings.push(
        `Variant "${results.winner}" showed ${results.analysis.practical.revenueImpact.toFixed(1)}% revenue lift`
      )
    }

    if (results.confidence < 0.95) {
      keyFindings.push('Results are not yet statistically significant')
      nextSteps.push('Continue running experiment for more data')
    }

    if (results.sampleSize < 1000) {
      keyFindings.push('Sample size is small, results may not be reliable')
      nextSteps.push('Increase traffic allocation or extend duration')
    }

    // Recommendations
    if (results.winner && results.confidence > 0.95) {
      recommendations.push(`Implement "${results.winner}" variant to all users`)
      recommendations.push('Document learnings for future experiments')
    }

    if (results.analysis.statistical.power < 0.8) {
      recommendations.push('Increase sample size for better statistical power')
    }

    // Next steps based on results
    if (results.winner) {
      nextSteps.push('Create follow-up experiment to optimize further')
      nextSteps.push('Apply learnings to similar features')
    }

    return {
      keyFindings,
      recommendations,
      nextSteps,
    }
  }

  // Helper methods

  private isUserInTargetAudience(
    userId: string,
    targetAudience: any
  ): boolean {
    // Random sampling based on percentage
    const hash = createHash('md5').update(userId).digest('hex')
    const hashValue = parseInt(hash.substring(0, 8), 16)
    const userPercentile = (hashValue % 100) / 100

    return userPercentile < targetAudience.percentage / 100
  }

  private selectVariant(
    userId: string,
    experimentId: string,
    variants: Variant[]
  ): Variant {
    // Deterministic assignment based on user ID
    const hash = createHash('md5')
      .update(`${userId}-${experimentId}`)
      .digest('hex')
    const hashValue = parseInt(hash.substring(0, 8), 16)
    const randomValue = (hashValue % 100) / 100

    let cumulative = 0
    for (const variant of variants) {
      cumulative += variant.allocation / 100
      if (randomValue < cumulative) {
        return variant
      }
    }

    return variants[variants.length - 1]
  }

  private async trackImpression(experimentId: string, variantId: string) {
    await prisma.experimentEvent.create({
      data: {
        experiment_id: experimentId,
        variant_id: variantId,
        event_type: 'IMPRESSION',
        event_name: 'variant_shown',
      },
    })
  }

  private calculateSignificance(
    controlImpressions: number,
    controlConversions: number,
    variantImpressions: number,
    variantConversions: number
  ): { confidence: number; significant: boolean } {
    if (controlImpressions === 0 || variantImpressions === 0) {
      return { confidence: 0, significant: false }
    }

    const controlRate = controlConversions / controlImpressions
    const variantRate = variantConversions / variantImpressions

    // Simplified z-test
    const pooledRate = (controlConversions + variantConversions) /
                      (controlImpressions + variantImpressions)

    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1/controlImpressions + 1/variantImpressions)
    )

    if (standardError === 0) {
      return { confidence: 0, significant: false }
    }

    const zScore = Math.abs(variantRate - controlRate) / standardError

    // Convert z-score to confidence (simplified)
    const confidence = Math.min(0.99, Math.max(0, (zScore - 1) / 3))

    return {
      confidence,
      significant: confidence > 0.95,
    }
  }

  private calculateConfidenceInterval(
    metrics: Map<string, VariantMetrics>
  ): [number, number] {
    const rates = Array.from(metrics.values()).map(m => m.conversionRate)
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length
    const stdDev = Math.sqrt(
      rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length
    )

    const marginOfError = 1.96 * stdDev / Math.sqrt(rates.length)

    return [mean - marginOfError, mean + marginOfError]
  }

  private calculateEffectSize(metrics: Map<string, VariantMetrics>): number {
    const rates = Array.from(metrics.values()).map(m => m.conversionRate)
    if (rates.length < 2) return 0

    const control = rates[0]
    const variant = rates[1]

    const pooledStdDev = Math.sqrt((control * (1 - control) + variant * (1 - variant)) / 2)

    return pooledStdDev > 0 ? (variant - control) / pooledStdDev : 0
  }

  private calculateStatisticalPower(sampleSize: number): number {
    // Simplified power calculation
    const effectSize = 0.2 // Small effect size
    const alpha = 0.05

    const power = Math.min(0.99, sampleSize / (1000 / effectSize))
    return power
  }

  private calculateRevenueImpact(metrics: Map<string, VariantMetrics>): number {
    const control = Array.from(metrics.values())[0]
    let maxRevenueLift = 0

    metrics.forEach((variant, id) => {
      if (variant !== control) {
        const lift = control.revenue > 0
          ? ((variant.revenue - control.revenue) / control.revenue) * 100
          : 0
        maxRevenueLift = Math.max(maxRevenueLift, lift)
      }
    })

    return maxRevenueLift
  }

  private assessOperationalImpact(uplift: number): string {
    if (uplift > 20) return 'High positive impact'
    if (uplift > 10) return 'Moderate positive impact'
    if (uplift > 5) return 'Small positive impact'
    if (uplift > -5) return 'Minimal impact'
    return 'Negative impact'
  }

  private generateRecommendation(
    winner: string | undefined,
    confidence: number,
    uplift: number
  ): string {
    if (!winner) {
      return 'Continue experiment to gather more data'
    }

    if (confidence < 0.95) {
      return 'Results promising but not conclusive. Extend experiment duration.'
    }

    if (uplift > 10) {
      return `Strong recommendation to implement variant "${winner}"`
    }

    if (uplift > 5) {
      return `Moderate recommendation to implement variant "${winner}"`
    }

    return 'Consider running follow-up experiments to validate findings'
  }

  private analyzeConversionPatterns(assignments: any[]): Record<string, any> {
    const patterns: Record<string, any> = {
      conversionRate: assignments.filter(a => a.converted).length / assignments.length,
      averageValue: assignments.reduce((sum, a) => sum + (a.conversion_value || 0), 0) / assignments.length,
      experimentTypes: new Set(assignments.map(a => a.experiment.type)),
    }

    return patterns
  }

  private async determineUserSegments(
    userId: string,
    patterns: Record<string, any>
  ): Promise<string[]> {
    const segments: string[] = []

    if (patterns.conversionRate > 0.3) segments.push('high_converter')
    if (patterns.averageValue > 100) segments.push('high_value')
    if (patterns.experimentTypes.has('MULTIVARIATE')) segments.push('early_adopter')

    return segments
  }

  private extractPreferences(assignments: any[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    assignments.forEach(assignment => {
      const config = assignment.experiment.configuration as any
      const variant = config.variants.find((v: Variant) => v.id === assignment.variant_id)

      if (variant && assignment.converted) {
        Object.entries(variant.configuration).forEach(([key, value]) => {
          preferences[key] = value
        })
      }
    })

    return preferences
  }

  private async recommendExperiments(
    segments: string[],
    preferences: Record<string, any>
  ): Promise<string[]> {
    const experiments = await prisma.experiment.findMany({
      where: {
        status: 'RUNNING',
      },
    })

    const recommendations: string[] = []

    experiments.forEach(exp => {
      const config = exp.configuration as any

      // Check if experiment targets user's segments
      const targetSegments = config.targetAudience?.segments || []
      const hasMatchingSegment = segments.some(s => targetSegments.includes(s))

      if (hasMatchingSegment) {
        recommendations.push(exp.id)
      }
    })

    return recommendations.slice(0, 5)
  }
}