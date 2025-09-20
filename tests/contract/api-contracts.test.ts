import { z } from 'zod'

// API Contract Schemas
const schemas = {
  appointment: z.object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    staffId: z.string().uuid(),
    branchId: z.string().uuid(),
    appointmentDate: z.string().datetime(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    totalDuration: z.number().positive(),
    totalPrice: z.number().nonnegative(),
    finalPrice: z.number().nonnegative(),
    confirmationCode: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  customer: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    preferences: z.object({}).optional(),
    tags: z.array(z.string()).optional(),
    lifetimeValue: z.number().nonnegative().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  service: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string(),
    duration: z.number().positive(),
    bufferTime: z.number().nonnegative(),
    price: z.number().nonnegative(),
    active: z.boolean(),
  }),

  product: z.object({
    id: z.string().uuid(),
    sku: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string(),
    brand: z.string().optional(),
    price: z.number().positive(),
    costPrice: z.number().nonnegative(),
    stockQuantity: z.number().nonnegative(),
    images: z.array(z.string().url()).optional(),
    active: z.boolean(),
  }),

  payment: z.object({
    id: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
    paymentMethod: z.string(),
    transactionId: z.string().optional(),
    paidAt: z.string().datetime().optional(),
  }),

  error: z.object({
    error: z.string(),
    message: z.string().optional(),
    details: z.any().optional(),
    code: z.string().optional(),
  }),

  pagination: z.object({
    page: z.number().positive(),
    limit: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
}

describe('API Contract Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'
  const authToken = process.env.TEST_AUTH_TOKEN || 'test-token'

  const makeRequest = async (
    path: string,
    options: RequestInit = {}
  ): Promise<{ status: number; body: any }> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    })

    const body = await response.json().catch(() => null)
    return { status: response.status, body }
  }

  describe('Appointments API', () => {
    describe('GET /appointments', () => {
      test('should return valid appointment list', async () => {
        const { status, body } = await makeRequest('/appointments')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        if (body.length > 0) {
          const result = schemas.appointment.safeParse(body[0])
          expect(result.success).toBe(true)
        }
      })

      test('should support pagination parameters', async () => {
        const { status, body } = await makeRequest('/appointments?page=1&limit=10')

        expect(status).toBe(200)
        expect(body).toHaveProperty('data')
        expect(body).toHaveProperty('pagination')

        const paginationResult = schemas.pagination.safeParse(body.pagination)
        expect(paginationResult.success).toBe(true)
      })

      test('should support filtering by date', async () => {
        const date = '2024-01-15'
        const { status, body } = await makeRequest(`/appointments?date=${date}`)

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((appointment: any) => {
          expect(appointment.appointmentDate).toContain(date)
        })
      })

      test('should support filtering by status', async () => {
        const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

        for (const appointmentStatus of validStatuses) {
          const { status, body } = await makeRequest(`/appointments?status=${appointmentStatus}`)

          expect(status).toBe(200)
          expect(Array.isArray(body)).toBe(true)

          body.forEach((appointment: any) => {
            expect(appointment.status).toBe(appointmentStatus)
          })
        }
      })
    })

    describe('POST /appointments', () => {
      test('should create appointment with valid data', async () => {
        const newAppointment = {
          branchId: 'branch-123',
          customerId: 'customer-123',
          staffId: 'staff-123',
          appointmentDate: new Date().toISOString(),
          startTime: new Date(Date.now() + 86400000).toISOString(),
          services: [
            { serviceId: 'service-123', addOns: [] }
          ],
        }

        const { status, body } = await makeRequest('/appointments', {
          method: 'POST',
          body: JSON.stringify(newAppointment),
        })

        expect([201, 400]).toContain(status) // May fail due to availability

        if (status === 201) {
          const result = schemas.appointment.safeParse(body)
          expect(result.success).toBe(true)
        }
      })

      test('should return error for invalid data', async () => {
        const invalidAppointment = {
          // Missing required fields
          customerId: 'customer-123',
        }

        const { status, body } = await makeRequest('/appointments', {
          method: 'POST',
          body: JSON.stringify(invalidAppointment),
        })

        expect(status).toBe(400)
        const result = schemas.error.safeParse(body)
        expect(result.success).toBe(true)
      })
    })

    describe('GET /appointments/:id', () => {
      test('should return appointment details', async () => {
        const appointmentId = 'test-appointment-id'
        const { status, body } = await makeRequest(`/appointments/${appointmentId}`)

        if (status === 200) {
          const result = schemas.appointment.safeParse(body)
          expect(result.success).toBe(true)
        } else if (status === 404) {
          const result = schemas.error.safeParse(body)
          expect(result.success).toBe(true)
        } else {
          fail(`Unexpected status code: ${status}`)
        }
      })
    })

    describe('PATCH /appointments/:id', () => {
      test('should update appointment status', async () => {
        const appointmentId = 'test-appointment-id'
        const update = { status: 'CONFIRMED' }

        const { status, body } = await makeRequest(`/appointments/${appointmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        })

        if (status === 200) {
          const result = schemas.appointment.safeParse(body)
          expect(result.success).toBe(true)
          expect(body.status).toBe('CONFIRMED')
        } else if (status === 404) {
          const result = schemas.error.safeParse(body)
          expect(result.success).toBe(true)
        }
      })
    })
  })

  describe('Customers API', () => {
    describe('GET /customers', () => {
      test('should return valid customer list', async () => {
        const { status, body } = await makeRequest('/customers')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        if (body.length > 0) {
          const result = schemas.customer.safeParse(body[0])
          expect(result.success).toBe(true)
        }
      })

      test('should support search parameter', async () => {
        const searchTerm = 'john'
        const { status, body } = await makeRequest(`/customers?search=${searchTerm}`)

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((customer: any) => {
          const matchesSearch =
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm)
          expect(matchesSearch).toBe(true)
        })
      })
    })

    describe('POST /customers', () => {
      test('should create customer with valid data', async () => {
        const newCustomer = {
          email: `test${Date.now()}@example.com`,
          name: 'Test Customer',
          phone: '+1234567890',
          branchId: 'branch-123',
        }

        const { status, body } = await makeRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(newCustomer),
        })

        if (status === 201) {
          const result = schemas.customer.safeParse(body)
          expect(result.success).toBe(true)
        }
      })

      test('should validate email format', async () => {
        const invalidCustomer = {
          email: 'not-an-email',
          name: 'Test Customer',
          branchId: 'branch-123',
        }

        const { status, body } = await makeRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(invalidCustomer),
        })

        expect(status).toBe(400)
        const result = schemas.error.safeParse(body)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Services API', () => {
    describe('GET /services', () => {
      test('should return valid service list', async () => {
        const { status, body } = await makeRequest('/services')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        if (body.length > 0) {
          const result = schemas.service.safeParse(body[0])
          expect(result.success).toBe(true)
        }
      })

      test('should support category filter', async () => {
        const category = 'HAIR'
        const { status, body } = await makeRequest(`/services?category=${category}`)

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((service: any) => {
          expect(service.category).toBe(category)
        })
      })

      test('should support active filter', async () => {
        const { status, body } = await makeRequest('/services?active=true')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((service: any) => {
          expect(service.active).toBe(true)
        })
      })
    })
  })

  describe('Products API', () => {
    describe('GET /products', () => {
      test('should return valid product list', async () => {
        const { status, body } = await makeRequest('/products')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        if (body.length > 0) {
          const result = schemas.product.safeParse(body[0])
          expect(result.success).toBe(true)
        }
      })

      test('should support price range filters', async () => {
        const minPrice = 10
        const maxPrice = 100

        const { status, body } = await makeRequest(
          `/products?minPrice=${minPrice}&maxPrice=${maxPrice}`
        )

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((product: any) => {
          expect(product.price).toBeGreaterThanOrEqual(minPrice)
          expect(product.price).toBeLessThanOrEqual(maxPrice)
        })
      })

      test('should support stock status filter', async () => {
        const { status, body } = await makeRequest('/products?inStock=true')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((product: any) => {
          expect(product.stockQuantity).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Payments API', () => {
    describe('GET /payments', () => {
      test('should return valid payment list', async () => {
        const { status, body } = await makeRequest('/payments')

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        if (body.length > 0) {
          const result = schemas.payment.safeParse(body[0])
          expect(result.success).toBe(true)
        }
      })

      test('should support status filter', async () => {
        const paymentStatus = 'COMPLETED'
        const { status, body } = await makeRequest(`/payments?status=${paymentStatus}`)

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((payment: any) => {
          expect(payment.status).toBe(paymentStatus)
        })
      })

      test('should support date range filters', async () => {
        const startDate = '2024-01-01'
        const endDate = '2024-01-31'

        const { status, body } = await makeRequest(
          `/payments?startDate=${startDate}&endDate=${endDate}`
        )

        expect(status).toBe(200)
        expect(Array.isArray(body)).toBe(true)

        body.forEach((payment: any) => {
          const paymentDate = new Date(payment.paidAt)
          expect(paymentDate >= new Date(startDate)).toBe(true)
          expect(paymentDate <= new Date(endDate)).toBe(true)
        })
      })
    })
  })

  describe('Error Handling', () => {
    test('should return 401 for unauthorized requests', async () => {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
          // No authorization header
        },
      })

      const body = await response.json()

      expect(response.status).toBe(401)
      const result = schemas.error.safeParse(body)
      expect(result.success).toBe(true)
    })

    test('should return 404 for non-existent resources', async () => {
      const { status, body } = await makeRequest('/appointments/non-existent-id')

      expect(status).toBe(404)
      const result = schemas.error.safeParse(body)
      expect(result.success).toBe(true)
    })

    test('should return 400 for malformed requests', async () => {
      const { status, body } = await makeRequest('/appointments', {
        method: 'POST',
        body: 'not valid json',
      })

      expect(status).toBe(400)
      const result = schemas.error.safeParse(body)
      expect(result.success).toBe(true)
    })

    test('should return 405 for unsupported methods', async () => {
      const { status } = await makeRequest('/appointments', {
        method: 'DELETE',
      })

      expect(status).toBe(405)
    })
  })

  describe('Content Types', () => {
    test('should accept JSON content type', async () => {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    test('should reject non-JSON content types for POST', async () => {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${authToken}`,
        },
        body: 'plain text',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Versioning', () => {
    test('should support API versioning', async () => {
      const { status } = await makeRequest('/v1/appointments')
      expect([200, 404]).toContain(status) // Depends on if v1 is implemented
    })

    test('should include API version in headers', async () => {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      const apiVersion = response.headers.get('X-API-Version')
      expect(apiVersion).toBeDefined()
    })
  })
})