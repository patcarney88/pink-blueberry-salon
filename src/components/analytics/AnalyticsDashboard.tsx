'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Calendar,
  ShoppingCart, Star, Clock, BarChart3, Activity
} from 'lucide-react'
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
  Filler
} from 'chart.js'

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

interface Metric {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
}

interface ChartData {
  labels: string[]
  datasets: any[]
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      title: 'Total Revenue',
      value: '$12,450',
      change: 15.3,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'New Customers',
      value: 248,
      change: 8.5,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Appointments',
      value: 142,
      change: -3.2,
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Avg Rating',
      value: 4.8,
      change: 2.1,
      icon: <Star className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-600'
    }
  ])

  // Revenue chart data
  const revenueData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 1500, 2100, 2400, 3200, 2800],
        fill: true,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      }
    ]
  }

  // Service popularity data
  const servicesData: ChartData = {
    labels: ['Hair Styling', 'Coloring', 'Nails', 'Spa', 'Makeup'],
    datasets: [
      {
        label: 'Bookings',
        data: [42, 38, 28, 25, 19],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ]
      }
    ]
  }

  // Customer distribution data
  const customerData: ChartData = {
    labels: ['New', 'Regular', 'VIP'],
    datasets: [
      {
        data: [35, 45, 20],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        change: metric.change + (Math.random() - 0.5) * 2
      })))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time business insights and performance metrics</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(['day', 'week', 'month', 'year'] as const).map(range => (
          <button
            key={range}
            onClick={() => {
              setTimeRange(range)
              setIsLoading(true)
              setTimeout(() => setIsLoading(false), 500)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              timeRange === range
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.title}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center text-white`}>
                {metric.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                metric.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metric.change).toFixed(1)}%
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
            </div>
            
            {/* Mini sparkline */}
            <div className="mt-4 h-8">
              <svg className="w-full h-full" viewBox="0 0 100 32">
                <polyline
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  points="0,20 20,15 40,18 60,10 80,14 100,8"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isLoading ? 0.5 : 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Revenue Trend
            </h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="h-64">
            <Line data={revenueData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Customer Distribution */}
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isLoading ? 0.5 : 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Types
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={customerData} options={{ ...chartOptions, maintainAspectRatio: true }} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {customerData.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: customerData.datasets[0].backgroundColor[i] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                </div>
                <span className="font-semibold">{customerData.datasets[0].data[i]}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Service Popularity */}
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-pink-600" />
          Popular Services
        </h3>
        <div className="h-64">
          <Bar data={servicesData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div
        className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Live Activity Feed
        </h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'New booking', user: 'Sarah J.', service: 'Hair Coloring' },
            { time: '5 min ago', action: 'Review posted', user: 'Mike D.', rating: '5★' },
            { time: '12 min ago', action: 'Product purchased', user: 'Emma L.', amount: '$89' },
            { time: '18 min ago', action: 'Loyalty points earned', user: 'Lisa K.', points: '+150' },
            { time: '25 min ago', action: 'New customer signup', user: 'Alex M.', source: 'Instagram' },
          ].map((activity, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action} - <span className="text-purple-600">{activity.user}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.service || activity.rating || activity.amount || activity.points || activity.source}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}