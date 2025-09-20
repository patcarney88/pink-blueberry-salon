import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

// Rate limiting for analytics
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // per IP
}

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  url: string
  userAgent: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'anonymous'
    const rateLimitKey = `rate_limit:web_vitals:${ip}`

    if (redis) {
      const current = await redis.incr(rateLimitKey)
      if (current === 1) {
        await redis.expire(rateLimitKey, Math.ceil(RATE_LIMIT.windowMs / 1000))
      }
      if (current > RATE_LIMIT.maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
    }

    const metric: WebVitalMetric = await request.json()

    // Validate required fields
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    // Store in Redis for real-time monitoring
    if (redis) {
      const metricsKey = 'web_vitals:metrics'
      const hourlyKey = `web_vitals:hourly:${new Date().toISOString().slice(0, 13)}`

      // Store individual metric
      await redis.lpush(metricsKey, JSON.stringify({
        ...metric,
        ip: ip.substring(0, 8), // Partial IP for privacy
      }))

      // Keep only last 1000 metrics
      await redis.ltrim(metricsKey, 0, 999)

      // Store hourly aggregates
      await redis.hincrby(hourlyKey, `${metric.name}:count`, 1)
      await redis.hincrby(hourlyKey, `${metric.name}:sum`, Math.round(metric.value))
      await redis.hincrby(hourlyKey, `${metric.name}:${metric.rating}`, 1)
      await redis.expire(hourlyKey, 7 * 24 * 60 * 60) // Keep for 7 days

      // Store daily aggregates
      const dailyKey = `web_vitals:daily:${new Date().toISOString().slice(0, 10)}`
      await redis.hincrby(dailyKey, `${metric.name}:count`, 1)
      await redis.hincrby(dailyKey, `${metric.name}:sum`, Math.round(metric.value))
      await redis.hincrby(dailyKey, `${metric.name}:${metric.rating}`, 1)
      await redis.expire(dailyKey, 30 * 24 * 60 * 60) // Keep for 30 days
    }

    // In a production environment, you might also want to:
    // 1. Send to external analytics (Google Analytics, DataDog, etc.)
    // 2. Trigger alerts for poor performance
    // 3. Store in a time-series database

    // Example: Trigger alert for poor Core Web Vitals
    if (metric.rating === 'poor' && ['CLS', 'LCP', 'FID'].includes(metric.name)) {
      console.warn(`Poor ${metric.name} detected: ${metric.value} on ${metric.url}`)

      // Here you could send to alerting system:
      // await sendAlert({
      //   type: 'performance',
      //   severity: 'warning',
      //   metric: metric.name,
      //   value: metric.value,
      //   url: metric.url,
      // })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error storing web vitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // hourly, daily
    const metric = searchParams.get('metric') // specific metric filter

    if (!redis) {
      return NextResponse.json(
        { error: 'Analytics not available' },
        { status: 503 }
      )
    }

    const now = new Date()
    const keys: string[] = []

    // Generate keys for the requested period
    if (period === 'hourly') {
      // Last 24 hours
      for (let i = 0; i < 24; i++) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000)
        keys.push(`web_vitals:hourly:${date.toISOString().slice(0, 13)}`)
      }
    } else {
      // Last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        keys.push(`web_vitals:daily:${date.toISOString().slice(0, 10)}`)
      }
    }

    const pipeline = redis.pipeline()
    keys.forEach(key => pipeline.hgetall(key))
    const results = await pipeline.exec()

    const aggregatedData = keys.map((key, index) => {
      const data = results?.[index]?.[1] as Record<string, string> || {}
      const timestamp = period === 'hourly'
        ? key.split(':')[2] + ':00:00.000Z'
        : key.split(':')[2] + 'T00:00:00.000Z'

      const metrics: Record<string, any> = { timestamp }

      // Process each metric
      ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].forEach(metricName => {
        if (metric && metric !== metricName) return

        const count = parseInt(data[`${metricName}:count`] || '0')
        const sum = parseInt(data[`${metricName}:sum`] || '0')
        const good = parseInt(data[`${metricName}:good`] || '0')
        const needsImprovement = parseInt(data[`${metricName}:needs-improvement`] || '0')
        const poor = parseInt(data[`${metricName}:poor`] || '0')

        if (count > 0) {
          metrics[metricName] = {
            average: Math.round(sum / count),
            count,
            distribution: {
              good: Math.round((good / count) * 100),
              needsImprovement: Math.round((needsImprovement / count) * 100),
              poor: Math.round((poor / count) * 100),
            }
          }
        }
      })

      return metrics
    }).filter(data => Object.keys(data).length > 1) // Filter out empty periods

    return NextResponse.json({
      period,
      data: aggregatedData.reverse(), // Oldest first
    })

  } catch (error) {
    console.error('Error retrieving web vitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}