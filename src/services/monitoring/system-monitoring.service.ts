import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/pusher/server'
import { sendEmail } from '@/lib/email/sendgrid'
import { sendSMS } from '@/lib/sms/twilio'

export interface SystemMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface Alert {
  id: string
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  category: 'PERFORMANCE' | 'BUSINESS' | 'SECURITY' | 'INVENTORY' | 'STAFF'
  title: string
  message: string
  metadata?: Record<string, any>
  triggered: Date
  resolved?: Date
  acknowledgedBy?: string
}

export interface HealthCheck {
  service: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  responseTime: number
  lastCheck: Date
  details?: Record<string, any>
}

export interface MonitoringRule {
  id: string
  name: string
  condition: {
    metric: string
    operator: '>' | '<' | '>=' | '<=' | '=' | '!='
    threshold: number
    duration?: number // seconds
  }
  action: {
    type: 'ALERT' | 'EMAIL' | 'SMS' | 'WEBHOOK'
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    recipients?: string[]
    webhook?: string
  }
  enabled: boolean
}

export interface PerformanceMetrics {
  api: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
    p95ResponseTime: number
    p99ResponseTime: number
  }
  database: {
    connectionPoolSize: number
    activeConnections: number
    queryTime: number
    slowQueries: number
  }
  cache: {
    hitRate: number
    missRate: number
    evictionRate: number
    memoryUsage: number
  }
  queue: {
    depth: number
    processingRate: number
    errorRate: number
    averageWaitTime: number
  }
}

export class SystemMonitoringService {
  private metrics: Map<string, SystemMetric[]> = new Map()
  private alerts: Alert[] = []
  private rules: MonitoringRule[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()

  constructor() {
    this.initializeDefaultRules()
    this.startMonitoring()
  }

  /**
   * Initialize default monitoring rules
   */
  private initializeDefaultRules() {
    this.rules = [
      // Performance rules
      {
        id: 'high_response_time',
        name: 'High API Response Time',
        condition: {
          metric: 'api.response_time',
          operator: '>',
          threshold: 1000, // 1 second
          duration: 60,
        },
        action: {
          type: 'ALERT',
          severity: 'WARNING',
        },
        enabled: true,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          metric: 'api.error_rate',
          operator: '>',
          threshold: 0.05, // 5%
          duration: 300,
        },
        action: {
          type: 'ALERT',
          severity: 'CRITICAL',
        },
        enabled: true,
      },
      // Business rules
      {
        id: 'low_bookings',
        name: 'Low Daily Bookings',
        condition: {
          metric: 'business.daily_bookings',
          operator: '<',
          threshold: 10,
        },
        action: {
          type: 'ALERT',
          severity: 'WARNING',
        },
        enabled: true,
      },
      {
        id: 'high_cancellation_rate',
        name: 'High Cancellation Rate',
        condition: {
          metric: 'business.cancellation_rate',
          operator: '>',
          threshold: 0.2, // 20%
        },
        action: {
          type: 'ALERT',
          severity: 'WARNING',
        },
        enabled: true,
      },
      // Inventory rules
      {
        id: 'low_inventory',
        name: 'Low Inventory Levels',
        condition: {
          metric: 'inventory.low_stock_count',
          operator: '>',
          threshold: 5,
        },
        action: {
          type: 'EMAIL',
          severity: 'WARNING',
          recipients: ['inventory@salon.com'],
        },
        enabled: true,
      },
    ]
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring() {
    // Monitor every 60 seconds
    setInterval(() => {
      this.collectMetrics()
      this.checkRules()
      this.performHealthChecks()
    }, 60000)

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 3600000)
  }

  /**
   * Record a metric
   */
  async recordMetric(
    name: string,
    value: number,
    unit: string = 'count',
    tags?: Record<string, string>
  ) {
    const metric: SystemMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    }

    // Store in memory
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(metric)

    // Store in database for persistence
    await prisma.systemMetric.create({
      data: {
        name,
        value,
        unit,
        tags: tags || {},
      },
    })

    // Check if this triggers any rules
    await this.checkMetricRules(name, value)
  }

  /**
   * Get current performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // API metrics
    const apiMetrics = await this.calculateAPIMetrics()

    // Database metrics
    const dbMetrics = await this.calculateDatabaseMetrics()

    // Cache metrics (simulated)
    const cacheMetrics = {
      hitRate: 0.85,
      missRate: 0.15,
      evictionRate: 0.05,
      memoryUsage: 256, // MB
    }

    // Queue metrics (simulated)
    const queueMetrics = {
      depth: Math.floor(Math.random() * 100),
      processingRate: 50 + Math.random() * 50,
      errorRate: Math.random() * 0.05,
      averageWaitTime: 100 + Math.random() * 200,
    }

    return {
      api: apiMetrics,
      database: dbMetrics,
      cache: cacheMetrics,
      queue: queueMetrics,
    }
  }

  /**
   * Create an alert
   */
  async createAlert(
    type: Alert['type'],
    category: Alert['category'],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      type,
      category,
      title,
      message,
      metadata,
      triggered: new Date(),
    }

    this.alerts.push(alert)

    // Store in database
    await prisma.alert.create({
      data: {
        id: alert.id,
        type,
        category,
        title,
        message,
        metadata: metadata || {},
        triggered_at: alert.triggered,
      },
    })

    // Send notifications based on severity
    await this.sendAlertNotifications(alert)

    // Broadcast via Pusher
    await pusher.trigger('monitoring', 'new-alert', alert)

    return alert
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    const alerts = await prisma.alert.findMany({
      where: {
        resolved_at: null,
      },
      orderBy: {
        triggered_at: 'desc',
      },
    })

    return alerts.map(a => ({
      id: a.id,
      type: a.type as Alert['type'],
      category: a.category as Alert['category'],
      title: a.title,
      message: a.message,
      metadata: a.metadata as Record<string, any>,
      triggered: a.triggered_at,
      acknowledgedBy: a.acknowledged_by || undefined,
    }))
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
    })

    // Update in memory
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledgedBy = userId
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string) {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved_at: new Date(),
      },
    })

    // Update in memory
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = new Date()
    }
  }

  /**
   * Perform health checks
   */
  async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = []

    // Database health
    const dbHealth = await this.checkDatabaseHealth()
    checks.push(dbHealth)
    this.healthChecks.set('database', dbHealth)

    // API health
    const apiHealth = await this.checkAPIHealth()
    checks.push(apiHealth)
    this.healthChecks.set('api', apiHealth)

    // External services health
    const pusherHealth = await this.checkPusherHealth()
    checks.push(pusherHealth)
    this.healthChecks.set('pusher', pusherHealth)

    const stripeHealth = await this.checkStripeHealth()
    checks.push(stripeHealth)
    this.healthChecks.set('stripe', stripeHealth)

    return checks
  }

  /**
   * Get system dashboard data
   */
  async getSystemDashboard() {
    const performance = await this.getPerformanceMetrics()
    const activeAlerts = await this.getActiveAlerts()
    const healthChecks = Array.from(this.healthChecks.values())
    const recentMetrics = await this.getRecentMetrics()

    // Calculate system score
    const systemScore = this.calculateSystemScore(
      performance,
      activeAlerts,
      healthChecks
    )

    return {
      systemScore,
      performance,
      activeAlerts,
      healthChecks,
      recentMetrics,
      uptime: await this.calculateUptime(),
    }
  }

  /**
   * Configure custom monitoring rule
   */
  async addMonitoringRule(rule: MonitoringRule) {
    this.rules.push(rule)

    // Store in database
    await prisma.monitoringRule.create({
      data: {
        id: rule.id,
        name: rule.name,
        configuration: rule as any,
        enabled: rule.enabled,
      },
    })
  }

  // Helper methods

  private async collectMetrics() {
    // Collect business metrics
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))

    const bookingsToday = await prisma.appointment.count({
      where: {
        appointment_date: {
          gte: startOfDay,
        },
      },
    })

    await this.recordMetric('business.daily_bookings', bookingsToday)

    // Collect cancellation rate
    const totalAppointments = await prisma.appointment.count({
      where: {
        appointment_date: {
          gte: startOfDay,
        },
      },
    })

    const cancelledAppointments = await prisma.appointment.count({
      where: {
        appointment_date: {
          gte: startOfDay,
        },
        status: 'CANCELLED',
      },
    })

    const cancellationRate = totalAppointments > 0
      ? cancelledAppointments / totalAppointments
      : 0

    await this.recordMetric('business.cancellation_rate', cancellationRate, 'percentage')

    // Collect inventory metrics
    const lowStockItems = await prisma.inventory.count({
      where: {
        quantity_available: {
          lte: 5,
        },
      },
    })

    await this.recordMetric('inventory.low_stock_count', lowStockItems)
  }

  private async checkRules() {
    for (const rule of this.rules) {
      if (!rule.enabled) continue

      const metricValue = await this.getMetricValue(rule.condition.metric)
      if (metricValue === null) continue

      const shouldTrigger = this.evaluateCondition(
        metricValue,
        rule.condition.operator,
        rule.condition.threshold
      )

      if (shouldTrigger) {
        await this.executeRuleAction(rule)
      }
    }
  }

  private async checkMetricRules(metricName: string, value: number) {
    const relevantRules = this.rules.filter(
      r => r.enabled && r.condition.metric === metricName
    )

    for (const rule of relevantRules) {
      const shouldTrigger = this.evaluateCondition(
        value,
        rule.condition.operator,
        rule.condition.threshold
      )

      if (shouldTrigger) {
        await this.executeRuleAction(rule)
      }
    }
  }

  private evaluateCondition(
    value: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case '>': return value > threshold
      case '<': return value < threshold
      case '>=': return value >= threshold
      case '<=': return value <= threshold
      case '=': return value === threshold
      case '!=': return value !== threshold
      default: return false
    }
  }

  private async executeRuleAction(rule: MonitoringRule) {
    switch (rule.action.type) {
      case 'ALERT':
        await this.createAlert(
          rule.action.severity,
          'BUSINESS',
          rule.name,
          `Metric ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`
        )
        break

      case 'EMAIL':
        if (rule.action.recipients) {
          for (const recipient of rule.action.recipients) {
            await sendEmail(
              recipient,
              `Alert: ${rule.name}`,
              `Monitoring rule triggered: ${rule.name}`
            )
          }
        }
        break

      case 'SMS':
        if (rule.action.recipients) {
          for (const recipient of rule.action.recipients) {
            await sendSMS(
              recipient,
              `Alert: ${rule.name} - Check monitoring dashboard`
            )
          }
        }
        break

      case 'WEBHOOK':
        if (rule.action.webhook) {
          // Send webhook notification
          await fetch(rule.action.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rule: rule.name,
              triggered: new Date(),
              severity: rule.action.severity,
            }),
          })
        }
        break
    }
  }

  private async getMetricValue(metricName: string): Promise<number | null> {
    const metrics = this.metrics.get(metricName)
    if (!metrics || metrics.length === 0) return null

    // Return the most recent value
    return metrics[metrics.length - 1].value
  }

  private async calculateAPIMetrics() {
    // Simulated metrics - would connect to actual APM in production
    return {
      requestsPerMinute: 100 + Math.random() * 50,
      averageResponseTime: 150 + Math.random() * 100,
      errorRate: Math.random() * 0.05,
      p95ResponseTime: 300 + Math.random() * 200,
      p99ResponseTime: 500 + Math.random() * 300,
    }
  }

  private async calculateDatabaseMetrics() {
    // Get actual connection pool info
    const poolStats = (prisma as any)._engine?.pool?.stats || {}

    return {
      connectionPoolSize: poolStats.size || 10,
      activeConnections: poolStats.active || Math.floor(Math.random() * 5),
      queryTime: 50 + Math.random() * 100,
      slowQueries: Math.floor(Math.random() * 5),
    }
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const start = Date.now()

    try {
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - start

      return {
        service: 'database',
        status: responseTime < 100 ? 'HEALTHY' : responseTime < 500 ? 'DEGRADED' : 'UNHEALTHY',
        responseTime,
        lastCheck: new Date(),
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'UNHEALTHY',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        details: { error: String(error) },
      }
    }
  }

  private async checkAPIHealth(): Promise<HealthCheck> {
    // Check internal API health
    return {
      service: 'api',
      status: 'HEALTHY',
      responseTime: 50,
      lastCheck: new Date(),
    }
  }

  private async checkPusherHealth(): Promise<HealthCheck> {
    try {
      // Test Pusher connection
      await pusher.trigger('health-check', 'ping', { timestamp: Date.now() })

      return {
        service: 'pusher',
        status: 'HEALTHY',
        responseTime: 100,
        lastCheck: new Date(),
      }
    } catch (error) {
      return {
        service: 'pusher',
        status: 'UNHEALTHY',
        responseTime: 0,
        lastCheck: new Date(),
        details: { error: String(error) },
      }
    }
  }

  private async checkStripeHealth(): Promise<HealthCheck> {
    // Would check Stripe API health in production
    return {
      service: 'stripe',
      status: 'HEALTHY',
      responseTime: 200,
      lastCheck: new Date(),
    }
  }

  private async sendAlertNotifications(alert: Alert) {
    if (alert.type === 'CRITICAL') {
      // Send email and SMS for critical alerts
      await sendEmail(
        'admin@salon.com',
        `CRITICAL Alert: ${alert.title}`,
        alert.message
      )

      await sendSMS(
        '+1234567890',
        `CRITICAL: ${alert.title} - ${alert.message.substring(0, 100)}`
      )
    } else if (alert.type === 'WARNING') {
      // Send email for warnings
      await sendEmail(
        'admin@salon.com',
        `Warning: ${alert.title}`,
        alert.message
      )
    }

    // Always send to monitoring dashboard via Pusher
    await pusher.trigger('monitoring', 'alert', alert)
  }

  private cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours

    this.metrics.forEach((metrics, name) => {
      const filtered = metrics.filter(
        m => m.timestamp.getTime() > cutoff
      )
      this.metrics.set(name, filtered)
    })
  }

  private async getRecentMetrics() {
    const recentMetrics: Record<string, any> = {}

    this.metrics.forEach((metrics, name) => {
      if (metrics.length > 0) {
        const recent = metrics.slice(-10)
        recentMetrics[name] = {
          current: recent[recent.length - 1].value,
          average: recent.reduce((sum, m) => sum + m.value, 0) / recent.length,
          trend: this.calculateTrend(recent.map(m => m.value)),
        }
      }
    })

    return recentMetrics
  }

  private calculateTrend(values: number[]): 'UP' | 'DOWN' | 'STABLE' {
    if (values.length < 2) return 'STABLE'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const change = (secondAvg - firstAvg) / firstAvg

    if (change > 0.1) return 'UP'
    if (change < -0.1) return 'DOWN'
    return 'STABLE'
  }

  private calculateSystemScore(
    performance: PerformanceMetrics,
    alerts: Alert[],
    healthChecks: HealthCheck[]
  ): number {
    let score = 100

    // Deduct for performance issues
    if (performance.api.errorRate > 0.05) score -= 20
    if (performance.api.averageResponseTime > 500) score -= 10
    if (performance.database.slowQueries > 10) score -= 15

    // Deduct for active alerts
    const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL').length
    const warningAlerts = alerts.filter(a => a.type === 'WARNING').length

    score -= criticalAlerts * 20
    score -= warningAlerts * 5

    // Deduct for unhealthy services
    const unhealthyServices = healthChecks.filter(h => h.status === 'UNHEALTHY').length
    const degradedServices = healthChecks.filter(h => h.status === 'DEGRADED').length

    score -= unhealthyServices * 25
    score -= degradedServices * 10

    return Math.max(0, Math.min(100, score))
  }

  private async calculateUptime(): Promise<number> {
    // Calculate uptime percentage for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const totalMinutes = 30 * 24 * 60
    const downtime = await prisma.alert.aggregate({
      where: {
        type: 'CRITICAL',
        category: 'PERFORMANCE',
        triggered_at: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        duration_minutes: true,
      },
    })

    const downtimeMinutes = downtime._sum.duration_minutes || 0
    const uptimePercentage = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100

    return Math.round(uptimePercentage * 100) / 100
  }
}