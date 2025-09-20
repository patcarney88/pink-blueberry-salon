'use client'

import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { pusher } from '@/lib/pusher/client'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Server,
  TrendingUp,
  Users,
  Zap,
  Shield,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SystemMetrics {
  systemScore: number
  performance: {
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
  activeAlerts: Alert[]
  healthChecks: HealthCheck[]
  recentMetrics: Record<string, any>
  uptime: number
}

interface Alert {
  id: string
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  category: string
  title: string
  message: string
  triggered: string
  acknowledgedBy?: string
}

interface HealthCheck {
  service: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  responseTime: number
  lastCheck: string
}

export default function SystemDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    // Initial load
    fetchMetrics()

    // Set up auto-refresh
    const interval = autoRefresh ? setInterval(fetchMetrics, 30000) : null

    // Subscribe to real-time updates
    const channel = pusher.subscribe('monitoring')

    channel.bind('metrics-update', (data: SystemMetrics) => {
      setMetrics(data)
      setLastUpdated(new Date())
    })

    channel.bind('new-alert', (alert: Alert) => {
      setMetrics(prev => {
        if (!prev) return prev
        return {
          ...prev,
          activeAlerts: [alert, ...prev.activeAlerts],
        }
      })
    })

    return () => {
      if (interval) clearInterval(interval)
      pusher.unsubscribe('monitoring')
    }
  }, [autoRefresh])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard')
      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())

      // Fetch historical data
      const histResponse = await fetch(
        `/api/monitoring/metrics/history?range=${selectedTimeRange}`
      )
      const histData = await histResponse.json()
      setHistoricalData(histData)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      })
      fetchMetrics()
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const systemScoreColor =
    metrics.systemScore >= 80 ? 'text-green-500' :
    metrics.systemScore >= 60 ? 'text-yellow-500' :
    'text-red-500'

  const responseTimeData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'P50',
        data: historicalData.map(d => d.p50),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
      },
      {
        label: 'P95',
        data: historicalData.map(d => d.p95),
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        tension: 0.1,
      },
      {
        label: 'P99',
        data: historicalData.map(d => d.p99),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const requestVolumeData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Requests/min',
        data: historicalData.map(d => d.requestsPerMinute),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  }

  const errorRateData = {
    labels: ['Success', 'Errors'],
    datasets: [
      {
        data: [
          100 - metrics.performance.api.errorRate * 100,
          metrics.performance.api.errorRate * 100,
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)'],
        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto Refresh</span>
          </button>
        </div>
      </div>

      {/* System Health Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">System Health</h2>
            <p className={`text-5xl font-bold ${systemScoreColor} mt-2`}>
              {metrics.systemScore}%
            </p>
          </div>
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${metrics.systemScore * 3.51} 351.86`}
                className={systemScoreColor.replace('text-', 'text-')}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="API Performance"
          value={`${metrics.performance.api.averageResponseTime.toFixed(0)}ms`}
          subtitle="Avg Response Time"
          icon={<Zap className="w-6 h-6" />}
          trend={metrics.performance.api.averageResponseTime < 200 ? 'up' : 'down'}
        />
        <MetricCard
          title="Request Volume"
          value={metrics.performance.api.requestsPerMinute.toFixed(0)}
          subtitle="Requests/min"
          icon={<Activity className="w-6 h-6" />}
          trend="neutral"
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics.performance.api.errorRate * 100).toFixed(2)}%`}
          subtitle="Failed Requests"
          icon={<AlertTriangle className="w-6 h-6" />}
          trend={metrics.performance.api.errorRate < 0.01 ? 'up' : 'down'}
        />
        <MetricCard
          title="Uptime"
          value={`${metrics.uptime.toFixed(2)}%`}
          subtitle="Last 30 Days"
          icon={<CheckCircle className="w-6 h-6" />}
          trend={metrics.uptime > 99.9 ? 'up' : 'down'}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Response Times</h3>
          <Line
            data={responseTimeData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Time (ms)' },
                },
              },
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
          <Bar
            data={requestVolumeData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Requests' },
                },
              },
            }}
          />
        </div>
      </div>

      {/* System Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Database</h3>
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <MetricRow
              label="Active Connections"
              value={`${metrics.performance.database.activeConnections}/${metrics.performance.database.connectionPoolSize}`}
            />
            <MetricRow
              label="Query Time"
              value={`${metrics.performance.database.queryTime.toFixed(0)}ms`}
            />
            <MetricRow
              label="Slow Queries"
              value={metrics.performance.database.slowQueries}
              isWarning={metrics.performance.database.slowQueries > 10}
            />
          </div>
        </div>

        {/* Cache Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cache</h3>
            <HardDrive className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <MetricRow
              label="Hit Rate"
              value={`${(metrics.performance.cache.hitRate * 100).toFixed(1)}%`}
              isGood={metrics.performance.cache.hitRate > 0.8}
            />
            <MetricRow
              label="Memory Usage"
              value={`${metrics.performance.cache.memoryUsage}MB`}
            />
            <MetricRow
              label="Eviction Rate"
              value={`${(metrics.performance.cache.evictionRate * 100).toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Queue Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Queue</h3>
            <Server className="w-6 h-6 text-purple-500" />
          </div>
          <div className="space-y-3">
            <MetricRow
              label="Queue Depth"
              value={metrics.performance.queue.depth}
              isWarning={metrics.performance.queue.depth > 100}
            />
            <MetricRow
              label="Processing Rate"
              value={`${metrics.performance.queue.processingRate.toFixed(0)}/min`}
            />
            <MetricRow
              label="Avg Wait Time"
              value={`${metrics.performance.queue.averageWaitTime.toFixed(0)}ms`}
            />
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Service Health</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.healthChecks.map((check) => (
            <HealthCheckCard key={check.service} check={check} />
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      {metrics.activeAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              {metrics.activeAlerts.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {metrics.activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledgeAlert(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Rate Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
        <div className="w-64 mx-auto">
          <Doughnut
            data={errorRateData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' as const },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Component helpers
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
}) {
  const trendColor =
    trend === 'up' ? 'text-green-500' :
    trend === 'down' ? 'text-red-500' :
    'text-gray-500'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={trendColor}>{icon}</div>
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  isGood,
  isWarning,
}: {
  label: string
  value: string | number
  isGood?: boolean
  isWarning?: boolean
}) {
  const valueColor = isGood ? 'text-green-600' : isWarning ? 'text-red-600' : 'text-gray-900'

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}

function HealthCheckCard({ check }: { check: HealthCheck }) {
  const statusColor =
    check.status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
    check.status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'

  const Icon =
    check.status === 'HEALTHY' ? CheckCircle :
    check.status === 'DEGRADED' ? AlertCircle :
    AlertTriangle

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium">{check.service}</p>
        <p className="text-xs text-gray-500">{check.responseTime}ms</p>
      </div>
      <div className={`p-2 rounded-full ${statusColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  )
}

function AlertCard({
  alert,
  onAcknowledge,
}: {
  alert: Alert
  onAcknowledge: () => void
}) {
  const typeColor =
    alert.type === 'CRITICAL' ? 'border-red-500 bg-red-50' :
    alert.type === 'WARNING' ? 'border-yellow-500 bg-yellow-50' :
    'border-blue-500 bg-blue-50'

  const Icon =
    alert.type === 'CRITICAL' ? AlertTriangle :
    alert.type === 'WARNING' ? AlertCircle :
    Shield

  return (
    <div className={`border-l-4 p-4 ${typeColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.triggered).toLocaleString()}
            </p>
          </div>
        </div>
        {!alert.acknowledgedBy && (
          <button
            onClick={onAcknowledge}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  )
}