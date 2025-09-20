'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AuditEventType,
  AuditSeverity,
  type AuditSearchFilters
} from '@/lib/audit/audit-service'
import { format } from 'date-fns'
import {
  Download,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  Bug,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  User,
  Activity
} from 'lucide-react'

interface AuditEvent {
  id: string
  event_type: AuditEventType
  severity: AuditSeverity
  user_id?: string
  user?: {
    id: string
    email: string
    name: string
  }
  action: string
  entity_type?: string
  entity_id?: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface AuditStatistics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  topUsers: Array<{ userId: string; count: number }>
  securityEvents: number
  errorRate: number
  averageEventsPerDay: number
}

export function AuditLogViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<AuditSearchFilters>({
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSeverities, setSelectedSeverities] = useState<AuditSeverity[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<AuditEventType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 20),
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc',
      })

      if (selectedSeverities.length > 0) {
        params.append('severities', selectedSeverities.join(','))
      }

      if (selectedEventTypes.length > 0) {
        params.append('eventTypes', selectedEventTypes.join(','))
      }

      if (searchTerm) {
        params.append('searchTerm', searchTerm)
      }

      if (dateRange.start) {
        params.append('startDate', dateRange.start)
      }

      if (dateRange.end) {
        params.append('endDate', dateRange.end)
      }

      const response = await fetch(`/api/audit?${params}`)
      const data = await response.json()

      setEvents(data.events)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, selectedSeverities, selectedEventTypes, searchTerm, dateRange])

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const params = new URLSearchParams()

      if (dateRange.start) {
        params.append('startDate', dateRange.start)
      }

      if (dateRange.end) {
        params.append('endDate', dateRange.end)
      }

      const response = await fetch(`/api/audit/statistics?${params}`)
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAuditLogs()
    fetchStatistics()
  }, [fetchAuditLogs, fetchStatistics])

  // Export logs
  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filters).map(([k, v]) => [k, String(v)])
        ),
      })

      const response = await fetch(`/api/audit/export?${params}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export logs:', error)
    }
  }

  // Get severity icon and color
  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.DEBUG:
        return <Bug className="w-4 h-4 text-gray-500" />
      case AuditSeverity.INFO:
        return <Info className="w-4 h-4 text-blue-500" />
      case AuditSeverity.WARNING:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case AuditSeverity.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case AuditSeverity.CRITICAL:
        return <XCircle className="w-4 h-4 text-red-700" />
      default:
        return null
    }
  }

  // Get event type icon
  const getEventTypeIcon = (eventType: AuditEventType) => {
    if (eventType.startsWith('AUTH_')) return <Shield className="w-4 h-4" />
    if (eventType.startsWith('USER_')) return <User className="w-4 h-4" />
    if (eventType.startsWith('SECURITY_')) return <Shield className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{statistics.totalEvents.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">{statistics.securityEvents.toLocaleString()}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">{statistics.errorRate.toFixed(1)}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Events/Day</p>
                <p className="text-2xl font-bold">{Math.round(statistics.averageEventsPerDay)}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchAuditLogs()}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedSeverities.length > 0 || selectedEventTypes.length > 0) && (
              <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                {selectedSeverities.length + selectedEventTypes.length}
              </span>
            )}
          </button>

          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportLogs('json')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AuditSeverity).map((severity) => (
                  <label
                    key={severity}
                    className="flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSeverities.includes(severity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSeverities([...selectedSeverities, severity])
                        } else {
                          setSelectedSeverities(selectedSeverities.filter(s => s !== severity))
                        }
                      }}
                      className="rounded text-pink-500 focus:ring-pink-500"
                    />
                    <span className="flex items-center gap-1">
                      {getSeverityIcon(severity)}
                      {severity}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedSeverities([])
                  setSelectedEventTypes([])
                  setDateRange({})
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchAuditLogs}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(event.created_at), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {getSeverityIcon(event.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="flex items-center gap-1">
                        {getEventTypeIcon(event.event_type)}
                        <span className="text-gray-700">{event.event_type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {event.user ? (
                        <div>
                          <div className="font-medium">{event.user.name}</div>
                          <div className="text-xs text-gray-500">{event.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {event.action}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {event.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                        className="text-pink-500 hover:text-pink-600"
                      >
                        {expandedEvent === event.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Expanded Event Details */}
      {expandedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Event Details</h3>
              <button
                onClick={() => setExpandedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(
                events.find(e => e.id === expandedEvent),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}