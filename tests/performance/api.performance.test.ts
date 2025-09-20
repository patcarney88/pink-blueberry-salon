import { performance } from 'perf_hooks'
import { measurePerformance } from '../setup'

describe('API Performance Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'
  const PERFORMANCE_THRESHOLDS = {
    p50: 100,  // 50th percentile should be under 100ms
    p95: 500,  // 95th percentile should be under 500ms
    p99: 1000, // 99th percentile should be under 1000ms
  }

  describe('Appointment Endpoints', () => {
    test('GET /appointments should respond within threshold', async () => {
      const results: number[] = []

      // Run 100 requests to get performance distribution
      for (let i = 0; i < 100; i++) {
        const { duration } = await measurePerformance(async () => {
          const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
          })
          await response.json()
        })

        results.push(duration)
      }

      // Calculate percentiles
      results.sort((a, b) => a - b)
      const p50 = results[Math.floor(results.length * 0.5)]
      const p95 = results[Math.floor(results.length * 0.95)]
      const p99 = results[Math.floor(results.length * 0.99)]

      console.log(`Performance Results:
        P50: ${p50.toFixed(2)}ms
        P95: ${p95.toFixed(2)}ms
        P99: ${p99.toFixed(2)}ms
      `)

      expect(p50).toBeLessThan(PERFORMANCE_THRESHOLDS.p50)
      expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.p95)
      expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.p99)
    })

    test('POST /appointments should handle concurrent requests', async () => {
      const concurrentRequests = 10
      const promises = []

      const appointmentData = {
        branchId: 'branch-1',
        customerId: 'customer-1',
        staffId: 'staff-1',
        appointmentDate: new Date().toISOString(),
        startTime: new Date().toISOString(),
        services: [{ serviceId: 'service-1' }],
      }

      const startTime = performance.now()

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
            body: JSON.stringify({
              ...appointmentData,
              startTime: new Date(Date.now() + i * 3600000).toISOString(), // Offset by hours
            }),
          })
        )
      }

      const responses = await Promise.all(promises)
      const endTime = performance.now()

      const totalDuration = endTime - startTime
      const avgDuration = totalDuration / concurrentRequests

      console.log(`Concurrent Request Performance:
        Total Time: ${totalDuration.toFixed(2)}ms
        Average per Request: ${avgDuration.toFixed(2)}ms
      `)

      // All requests should complete
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500) // No server errors
      })

      // Average time should still be reasonable
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.p95)
    })
  })

  describe('Database Query Performance', () => {
    test('Complex availability query should be optimized', async () => {
      const { duration } = await measurePerformance(async () => {
        const response = await fetch(
          `${API_BASE_URL}/availability?` +
          `branchId=branch-1&` +
          `serviceId=service-1&` +
          `date=${new Date().toISOString()}&` +
          `staffId=staff-1`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
          }
        )
        await response.json()
      })

      console.log(`Availability Query: ${duration.toFixed(2)}ms`)

      // Complex queries should still be fast
      expect(duration).toBeLessThan(200)
    })

    test('Analytics aggregation should be performant', async () => {
      const { duration } = await measurePerformance(async () => {
        const response = await fetch(
          `${API_BASE_URL}/analytics/revenue?` +
          `branchId=branch-1&` +
          `startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&` +
          `endDate=${new Date().toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
          }
        )
        await response.json()
      })

      console.log(`Analytics Aggregation: ${duration.toFixed(2)}ms`)

      // Aggregations should complete within reasonable time
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Search Performance', () => {
    test('Customer search should use indexes effectively', async () => {
      const searchQueries = ['John', 'john@example.com', '+1234567890']
      const results: number[] = []

      for (const query of searchQueries) {
        const { duration } = await measurePerformance(async () => {
          const response = await fetch(
            `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
              },
            }
          )
          await response.json()
        })

        results.push(duration)
      }

      const avgSearchTime = results.reduce((a, b) => a + b, 0) / results.length

      console.log(`Search Performance:
        Queries: ${searchQueries.join(', ')}
        Average Time: ${avgSearchTime.toFixed(2)}ms
      `)

      // Search should be fast with indexes
      expect(avgSearchTime).toBeLessThan(50)
    })

    test('Product catalog search with filters', async () => {
      const { duration } = await measurePerformance(async () => {
        const response = await fetch(
          `${API_BASE_URL}/products?` +
          `category=HAIR&` +
          `minPrice=10&` +
          `maxPrice=100&` +
          `inStock=true&` +
          `search=shampoo`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
          }
        )
        await response.json()
      })

      console.log(`Product Search with Filters: ${duration.toFixed(2)}ms`)

      expect(duration).toBeLessThan(150)
    })
  })

  describe('Real-time Features Performance', () => {
    test('WebSocket connection establishment time', async () => {
      const { duration } = await measurePerformance(async () => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://localhost:3000/ws')
          ws.onopen = () => {
            ws.close()
            resolve(undefined)
          }
        })
      })

      console.log(`WebSocket Connection: ${duration.toFixed(2)}ms`)

      // Connection should be fast
      expect(duration).toBeLessThan(100)
    })

    test('Message broadcast latency', async () => {
      const latencies: number[] = []
      const messageCount = 50

      // Simulate Pusher message latency test
      for (let i = 0; i < messageCount; i++) {
        const startTime = Date.now()

        // Mock Pusher trigger
        const { duration } = await measurePerformance(async () => {
          const response = await fetch(`${API_BASE_URL}/messaging/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
            body: JSON.stringify({
              channel: 'test-channel',
              event: 'test-event',
              data: { message: `Test ${i}`, timestamp: startTime },
            }),
          })
          await response.json()
        })

        latencies.push(duration)
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const maxLatency = Math.max(...latencies)

      console.log(`Message Broadcast Performance:
        Average Latency: ${avgLatency.toFixed(2)}ms
        Max Latency: ${maxLatency.toFixed(2)}ms
      `)

      expect(avgLatency).toBeLessThan(50)
      expect(maxLatency).toBeLessThan(200)
    })
  })

  describe('Memory Performance', () => {
    test('Memory usage should be stable under load', async () => {
      const initialMemory = process.memoryUsage()

      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
          },
        })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()

      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024

      console.log(`Memory Performance:
        Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Increase: ${memoryIncrease.toFixed(2)}MB
      `)

      // Memory increase should be reasonable (less than 100MB for 1000 requests)
      expect(memoryIncrease).toBeLessThan(100)
    })
  })

  describe('Cache Performance', () => {
    test('Cached responses should be significantly faster', async () => {
      const endpoint = `${API_BASE_URL}/services`

      // First request (cache miss)
      const { duration: coldDuration } = await measurePerformance(async () => {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
          },
        })
        await response.json()
      })

      // Second request (cache hit)
      const { duration: warmDuration } = await measurePerformance(async () => {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
          },
        })
        await response.json()
      })

      const speedup = coldDuration / warmDuration

      console.log(`Cache Performance:
        Cold Request: ${coldDuration.toFixed(2)}ms
        Warm Request: ${warmDuration.toFixed(2)}ms
        Speedup: ${speedup.toFixed(2)}x
      `)

      // Cached request should be at least 2x faster
      expect(speedup).toBeGreaterThan(2)
    })
  })

  describe('Batch Operations Performance', () => {
    test('Bulk insert performance', async () => {
      const batchSizes = [10, 50, 100, 500]
      const results: Record<number, number> = {}

      for (const size of batchSizes) {
        const customers = Array.from({ length: size }, (_, i) => ({
          name: `Test Customer ${i}`,
          email: `test${i}@example.com`,
          phone: `+123456789${i}`,
          branchId: 'branch-1',
        }))

        const { duration } = await measurePerformance(async () => {
          const response = await fetch(`${API_BASE_URL}/customers/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
            },
            body: JSON.stringify({ customers }),
          })
          await response.json()
        })

        results[size] = duration
      }

      console.log('Bulk Insert Performance:')
      Object.entries(results).forEach(([size, duration]) => {
        const perRecord = duration / parseInt(size)
        console.log(`  ${size} records: ${duration.toFixed(2)}ms (${perRecord.toFixed(2)}ms per record)`)
      })

      // Performance should scale sub-linearly
      const scalingFactor = results[500] / results[10]
      expect(scalingFactor).toBeLessThan(30) // Should be less than 30x for 50x more records
    })
  })
})