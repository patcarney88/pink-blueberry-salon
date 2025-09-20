'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

interface PerformanceData {
  timestamp: string
  CLS?: {
    average: number
    count: number
    distribution: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
  LCP?: {
    average: number
    count: number
    distribution: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
  FID?: {
    average: number
    count: number
    distribution: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
  FCP?: {
    average: number
    count: number
    distribution: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
  TTFB?: {
    average: number
    count: number
    distribution: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
}

interface PerformanceDashboardProps {
  type: 'trends' | 'distribution'
}

const COLORS = {
  good: '#22c55e',
  needsImprovement: '#f59e0b',
  poor: '#ef4444',
}

export function PerformanceDashboard({ type }: PerformanceDashboardProps) {
  const [data, setData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/web-vitals?period=daily')
        if (!response.ok) {
          throw new Error('Failed to fetch performance data')
        }
        const result = await response.json()
        setData(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading performance data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No performance data available</div>
      </div>
    )
  }

  if (type === 'trends') {
    // Prepare data for trend chart
    const trendData = data.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      LCP: item.LCP?.average || 0,
      FID: item.FID?.average || 0,
      CLS: item.CLS ? item.CLS.average * 1000 : 0, // Convert to ms for better visualization
      FCP: item.FCP?.average || 0,
      TTFB: item.TTFB?.average || 0,
    }))

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <XAxis
            dataKey="date"
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="LCP"
            stroke="#8884d8"
            strokeWidth={2}
            name="LCP (ms)"
          />
          <Line
            type="monotone"
            dataKey="FID"
            stroke="#82ca9d"
            strokeWidth={2}
            name="FID (ms)"
          />
          <Line
            type="monotone"
            dataKey="CLS"
            stroke="#ffc658"
            strokeWidth={2}
            name="CLS (×1000)"
          />
          <Line
            type="monotone"
            dataKey="FCP"
            stroke="#ff7300"
            strokeWidth={2}
            name="FCP (ms)"
          />
          <Line
            type="monotone"
            dataKey="TTFB"
            stroke="#8dd1e1"
            strokeWidth={2}
            name="TTFB (ms)"
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'distribution') {
    // Calculate overall distribution across all metrics and days
    const overallDistribution = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
      total: 0,
    }

    data.forEach(item => {
      ['CLS', 'LCP', 'FID', 'FCP', 'TTFB'].forEach(metric => {
        const metricData = item[metric as keyof PerformanceData] as any
        if (metricData?.distribution) {
          overallDistribution.good += metricData.distribution.good * metricData.count / 100
          overallDistribution.needsImprovement += metricData.distribution.needsImprovement * metricData.count / 100
          overallDistribution.poor += metricData.distribution.poor * metricData.count / 100
          overallDistribution.total += metricData.count
        }
      })
    })

    const pieData = overallDistribution.total > 0 ? [
      {
        name: 'Good',
        value: Math.round((overallDistribution.good / overallDistribution.total) * 100),
        count: overallDistribution.good,
      },
      {
        name: 'Needs Improvement',
        value: Math.round((overallDistribution.needsImprovement / overallDistribution.total) * 100),
        count: overallDistribution.needsImprovement,
      },
      {
        name: 'Poor',
        value: Math.round((overallDistribution.poor / overallDistribution.total) * 100),
        count: overallDistribution.poor,
      },
    ] : []

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name.toLowerCase().replace(' ', '') as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value}% (${Math.round(props.payload.count)} samples)`,
              name
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return null
}