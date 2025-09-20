import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  scenarios: {
    // Smoke test - verify system works under minimal load
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      startTime: '0s',
      tags: { test_type: 'smoke' },
    },

    // Load test - assess performance under typical load
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 }, // Ramp up to 100 users
        { duration: '10m', target: 100 }, // Stay at 100 users
        { duration: '5m', target: 0 }, // Ramp down to 0 users
      ],
      startTime: '2m',
      tags: { test_type: 'load' },
    },

    // Stress test - find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 0 },
      ],
      startTime: '25m',
      tags: { test_type: 'stress' },
    },

    // Spike test - assess recovery from sudden load
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1000 }, // Spike to 1000 users
        { duration: '3m', target: 1000 },
        { duration: '10s', target: 100 }, // Back to normal
        { duration: '3m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      startTime: '70m',
      tags: { test_type: 'spike' },
    },

    // Soak test - verify stability over extended period
    soak_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2h',
      startTime: '80m',
      tags: { test_type: 'soak' },
    },
  },

  thresholds: {
    http_req_duration: [
      'p(50)<200', // 50% of requests must complete below 200ms
      'p(95)<500', // 95% of requests must complete below 500ms
      'p(99)<1000', // 99% of requests must complete below 1000ms
    ],
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'], // Custom error rate must be below 10%
  },
}

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token'

// Helper function to make authenticated requests
function makeRequest(method, endpoint, body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  }

  let response
  if (method === 'GET') {
    response = http.get(`${BASE_URL}${endpoint}`, params)
  } else if (method === 'POST') {
    response = http.post(`${BASE_URL}${endpoint}`, JSON.stringify(body), params)
  } else if (method === 'PUT') {
    response = http.put(`${BASE_URL}${endpoint}`, JSON.stringify(body), params)
  } else if (method === 'PATCH') {
    response = http.patch(`${BASE_URL}${endpoint}`, JSON.stringify(body), params)
  } else if (method === 'DELETE') {
    response = http.del(`${BASE_URL}${endpoint}`, null, params)
  }

  // Track errors
  errorRate.add(response.status >= 400)

  return response
}

// Test data generators
function generateCustomer() {
  return {
    email: `user${randomString(10)}@example.com`,
    name: `Test User ${randomString(5)}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    branchId: 'branch-1',
  }
}

function generateAppointment() {
  const tomorrow = new Date(Date.now() + 86400000)
  const startTime = new Date(tomorrow)
  startTime.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0)

  return {
    branchId: 'branch-1',
    customerId: 'customer-1',
    staffId: 'staff-1',
    appointmentDate: tomorrow.toISOString(),
    startTime: startTime.toISOString(),
    services: [
      {
        serviceId: 'service-1',
        addOns: [],
      },
    ],
    notes: 'Load test appointment',
  }
}

// Test scenarios
export default function () {
  const scenario = __ENV.K6_SCENARIO || 'mixed'

  switch (scenario) {
    case 'booking':
      bookingFlowTest()
      break
    case 'search':
      searchTest()
      break
    case 'analytics':
      analyticsTest()
      break
    case 'mixed':
    default:
      mixedLoadTest()
      break
  }
}

// Booking flow test - simulates real user booking appointments
function bookingFlowTest() {
  // Step 1: Get available services
  let response = makeRequest('GET', '/api/services?active=true')
  check(response, {
    'services loaded': (r) => r.status === 200,
    'has services': (r) => JSON.parse(r.body).length > 0,
  })
  sleep(1)

  // Step 2: Get available staff
  response = makeRequest('GET', '/api/staff?available=true')
  check(response, {
    'staff loaded': (r) => r.status === 200,
    'has staff': (r) => JSON.parse(r.body).length > 0,
  })
  sleep(1)

  // Step 3: Check availability
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  response = makeRequest('GET', `/api/availability?date=${tomorrow}&serviceId=service-1&staffId=staff-1`)
  check(response, {
    'availability loaded': (r) => r.status === 200,
    'has slots': (r) => JSON.parse(r.body).slots?.length > 0,
  })
  sleep(2)

  // Step 4: Create appointment
  const appointment = generateAppointment()
  response = makeRequest('POST', '/api/appointments', appointment)
  check(response, {
    'appointment created': (r) => r.status === 201 || r.status === 400, // May fail due to conflicts
  })
  sleep(1)

  // Step 5: If appointment created, check status
  if (response.status === 201) {
    const appointmentId = JSON.parse(response.body).id
    response = makeRequest('GET', `/api/appointments/${appointmentId}`)
    check(response, {
      'appointment retrieved': (r) => r.status === 200,
    })
  }
}

// Search test - simulates users searching for customers, services, and products
function searchTest() {
  // Customer search
  const searchTerms = ['john', 'smith', 'test', 'mary', 'david']
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]

  let response = makeRequest('GET', `/api/customers/search?q=${searchTerm}`)
  check(response, {
    'customer search works': (r) => r.status === 200,
    'search returns array': (r) => Array.isArray(JSON.parse(r.body)),
  })
  sleep(0.5)

  // Service search
  const categories = ['HAIR', 'NAILS', 'FACIAL', 'MASSAGE', 'MAKEUP']
  const category = categories[Math.floor(Math.random() * categories.length)]

  response = makeRequest('GET', `/api/services?category=${category}`)
  check(response, {
    'service search works': (r) => r.status === 200,
  })
  sleep(0.5)

  // Product search with filters
  const minPrice = Math.floor(Math.random() * 50)
  const maxPrice = minPrice + 100

  response = makeRequest('GET', `/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}&inStock=true`)
  check(response, {
    'product search works': (r) => r.status === 200,
  })
  sleep(0.5)
}

// Analytics test - simulates dashboard and reporting loads
function analyticsTest() {
  const endDate = new Date().toISOString()
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Revenue analytics
  let response = makeRequest('GET', `/api/analytics/revenue?startDate=${startDate}&endDate=${endDate}`)
  check(response, {
    'revenue analytics loads': (r) => r.status === 200,
    'has revenue data': (r) => JSON.parse(r.body).total !== undefined,
  })
  sleep(1)

  // Customer analytics
  response = makeRequest('GET', `/api/analytics/customers?startDate=${startDate}&endDate=${endDate}`)
  check(response, {
    'customer analytics loads': (r) => r.status === 200,
  })
  sleep(1)

  // Staff performance
  response = makeRequest('GET', `/api/analytics/staff?startDate=${startDate}&endDate=${endDate}`)
  check(response, {
    'staff analytics loads': (r) => r.status === 200,
  })
  sleep(1)

  // Real-time dashboard
  response = makeRequest('GET', '/api/analytics/dashboard')
  check(response, {
    'dashboard loads': (r) => r.status === 200,
    'has real-time data': (r) => JSON.parse(r.body).today !== undefined,
  })
  sleep(0.5)
}

// Mixed load test - simulates realistic user behavior
function mixedLoadTest() {
  const operations = [
    { weight: 30, fn: () => makeRequest('GET', '/api/appointments') },
    { weight: 20, fn: () => makeRequest('GET', '/api/customers') },
    { weight: 15, fn: () => makeRequest('GET', '/api/services') },
    { weight: 10, fn: () => bookingFlowTest() },
    { weight: 10, fn: () => searchTest() },
    { weight: 5, fn: () => analyticsTest() },
    { weight: 5, fn: () => makeRequest('GET', '/api/products') },
    { weight: 5, fn: () => {
      const customer = generateCustomer()
      makeRequest('POST', '/api/customers', customer)
    }},
  ]

  // Calculate cumulative weights
  let totalWeight = 0
  const cumulativeWeights = operations.map(op => {
    totalWeight += op.weight
    return { ...op, cumulative: totalWeight }
  })

  // Select random operation based on weights
  const random = Math.random() * totalWeight
  const operation = cumulativeWeights.find(op => random <= op.cumulative)

  if (operation) {
    operation.fn()
  }

  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1)
}

// Handle test lifecycle
export function setup() {
  console.log('🚀 Starting load test...')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Scenario: ${__ENV.K6_SCENARIO || 'mixed'}`)

  // Verify API is accessible
  const response = http.get(`${BASE_URL}/api/health`)
  if (response.status !== 200) {
    throw new Error('API is not accessible')
  }

  return {
    startTime: new Date().toISOString(),
  }
}

export function teardown(data) {
  console.log('✅ Load test completed')
  console.log(`Started at: ${data.startTime}`)
  console.log(`Ended at: ${new Date().toISOString()}`)
}

// Custom summary for better reporting
export function handleSummary(data) {
  const summary = {
    'Total Requests': data.metrics.http_reqs?.values?.count || 0,
    'Failed Requests': data.metrics.http_req_failed?.values?.passes || 0,
    'Avg Response Time': `${Math.round(data.metrics.http_req_duration?.values?.avg || 0)}ms`,
    'P95 Response Time': `${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms`,
    'P99 Response Time': `${Math.round(data.metrics.http_req_duration?.values?.['p(99)'] || 0)}ms`,
    'Error Rate': `${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%`,
    'RPS': Math.round(data.metrics.http_reqs?.values?.rate || 0),
  }

  console.log('\n📊 Load Test Summary:')
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  }
}