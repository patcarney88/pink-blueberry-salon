import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.PUSHER_APP_ID = 'test-app-id'
process.env.PUSHER_KEY = 'test-key'
process.env.PUSHER_SECRET = 'test-secret'
process.env.SENDGRID_API_KEY = 'SG.test'
process.env.TWILIO_ACCOUNT_SID = 'ACtest'
process.env.TWILIO_AUTH_TOKEN = 'test-token'

// Setup global test utilities
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any
global.fetch = fetch as any

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staff: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inventory: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}))

// Mock external services
jest.mock('@/lib/pusher/server', () => ({
  pusher: {
    trigger: jest.fn(),
    triggerBatch: jest.fn(),
  },
}))

jest.mock('@/lib/stripe/client', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
  constructWebhookEvent: jest.fn(),
}))

jest.mock('@/lib/email/sendgrid', () => ({
  sendEmail: jest.fn(),
  sendBulkEmails: jest.fn(),
}))

jest.mock('@/lib/sms/twilio', () => ({
  sendSMS: jest.fn(),
  sendBulkSMS: jest.fn(),
}))

// Setup test database utilities
export const resetDatabase = async () => {
  // Reset all mocked functions
  jest.clearAllMocks()
}

// Test data factories
export const createTestCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  email: 'test@example.com',
  name: 'Test Customer',
  phone: '+1234567890',
  branch_id: 'test-branch-id',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

export const createTestAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  customer_id: 'test-customer-id',
  staff_id: 'test-staff-id',
  branch_id: 'test-branch-id',
  appointment_date: new Date(),
  start_time: new Date(),
  end_time: new Date(),
  status: 'CONFIRMED',
  total_duration: 60,
  total_price: 100,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

export const createTestService = (overrides = {}) => ({
  id: 'test-service-id',
  name: 'Test Service',
  description: 'Test service description',
  duration: 60,
  price: 100,
  category: 'HAIR',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

export const createTestStaff = (overrides = {}) => ({
  id: 'test-staff-id',
  user_id: 'test-user-id',
  specializations: ['HAIR', 'COLOR'],
  created_at: new Date(),
  updated_at: new Date(),
  user: {
    id: 'test-user-id',
    name: 'Test Staff',
    email: 'staff@example.com',
  },
  ...overrides,
})

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return {
    result,
    duration: end - start,
  }
}

// Security testing utilities
export const testSQLInjection = (input: string) => {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|INTO|LOAD_FILE|OUTFILE)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
  ]

  return sqlInjectionPatterns.some(pattern => pattern.test(input))
}

export const testXSS = (input: string) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

// API testing utilities
export const createMockRequest = (options: any = {}) => ({
  headers: new Headers(options.headers || {}),
  method: options.method || 'GET',
  body: options.body,
  query: options.query || {},
  cookies: options.cookies || {},
})

export const createMockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    setHeader: jest.fn(() => res),
  }
  return res
}

// Cleanup after tests
afterEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  jest.clearAllMocks()
})