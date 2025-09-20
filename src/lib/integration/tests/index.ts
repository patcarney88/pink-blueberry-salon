/**
 * Integration Tests Index
 *
 * Test framework and utilities for cross-team integration testing
 */

export * from './integration-test.framework';

// Test suite configurations for Pink Blueberry Salon teams
export const INTEGRATION_TEST_SUITES = {
  foundation_database: {
    id: 'foundation_database_integration',
    name: 'Foundation to Database Integration',
    description: 'Tests integration between Foundation team and Database team',
    teams: ['foundation', 'database'] as const,
    testCases: [
      {
        id: 'database_connection',
        name: 'Database Connection Test',
        description: 'Verify Foundation team can connect to database',
        type: 'integration' as const,
        priority: 'critical' as const,
        teams: ['foundation', 'database'] as const,
        steps: [
          {
            id: 'check_database_health',
            name: 'Check Database Health',
            type: 'action' as const,
            team: 'database' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/database/health',
              method: 'GET',
            },
            expectedResult: { status: 'healthy' },
            timeout: 30,
            retries: 3,
            continueOnFailure: false,
            dependencies: [],
          },
          {
            id: 'foundation_app_init',
            name: 'Foundation App Initialization',
            type: 'action' as const,
            team: 'foundation' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/foundation/init',
              method: 'POST',
              payload: { environment: 'test' },
            },
            expectedResult: { success: true },
            timeout: 60,
            retries: 2,
            continueOnFailure: false,
            dependencies: ['check_database_health'],
          },
        ],
        assertions: [
          {
            id: 'database_accessible',
            type: 'equals' as const,
            field: 'status',
            expected: 'healthy',
            message: 'Database should be healthy and accessible',
            critical: true,
          },
          {
            id: 'app_initialized',
            type: 'equals' as const,
            field: 'success',
            expected: true,
            message: 'Foundation app should initialize successfully',
            critical: true,
          },
        ],
        timeout: 120,
        retries: 1,
        tags: ['critical', 'foundation', 'database'],
        expectedDuration: 90,
      },
      {
        id: 'schema_migration',
        name: 'Schema Migration Test',
        description: 'Verify database schema migrations work correctly',
        type: 'integration' as const,
        priority: 'high' as const,
        teams: ['database'] as const,
        steps: [
          {
            id: 'run_migration',
            name: 'Run Database Migration',
            type: 'action' as const,
            team: 'database' as const,
            action: {
              type: 'database_query' as const,
              target: 'migration_runner',
              parameters: { environment: 'test' },
            },
            expectedResult: { success: true, tables_created: true },
            timeout: 180,
            retries: 1,
            continueOnFailure: false,
            dependencies: [],
          },
          {
            id: 'verify_schema',
            name: 'Verify Schema Structure',
            type: 'verification' as const,
            team: 'database' as const,
            action: {
              type: 'database_query' as const,
              target: 'schema_validator',
              parameters: { check_constraints: true },
            },
            expectedResult: { valid: true, tables: ['users', 'bookings', 'services'] },
            timeout: 30,
            retries: 2,
            continueOnFailure: false,
            dependencies: ['run_migration'],
          },
        ],
        assertions: [
          {
            id: 'migration_successful',
            type: 'equals' as const,
            field: 'success',
            expected: true,
            message: 'Database migration should complete successfully',
            critical: true,
          },
          {
            id: 'schema_valid',
            type: 'equals' as const,
            field: 'valid',
            expected: true,
            message: 'Database schema should be valid after migration',
            critical: true,
          },
        ],
        timeout: 240,
        retries: 1,
        tags: ['high', 'database', 'migration'],
        expectedDuration: 210,
      },
    ],
    setup: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'test_db_setup',
          parameters: { reset: true, seed_data: false },
        },
      ],
      timeout: 60,
      rollbackOnFailure: true,
    },
    teardown: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'test_db_cleanup',
          parameters: { drop_tables: true },
        },
      ],
      timeout: 30,
      force: true,
    },
    timeout: 600,
    retries: 0,
    parallel: false,
    tags: ['foundation', 'database', 'integration'],
    dependencies: [],
  },

  auth_database: {
    id: 'auth_database_integration',
    name: 'Auth to Database Integration',
    description: 'Tests authentication system integration with database',
    teams: ['auth', 'database'] as const,
    testCases: [
      {
        id: 'user_authentication',
        name: 'User Authentication Flow',
        description: 'Test complete user authentication with database',
        type: 'end_to_end' as const,
        priority: 'critical' as const,
        teams: ['auth', 'database'] as const,
        steps: [
          {
            id: 'create_test_user',
            name: 'Create Test User',
            type: 'setup' as const,
            team: 'database' as const,
            action: {
              type: 'database_query' as const,
              target: 'user_creation',
              payload: {
                email: 'test@pinkblueberry.com',
                password_hash: 'hashed_password',
                first_name: 'Test',
                last_name: 'User',
              },
            },
            expectedResult: { user_id: 'string', created: true },
            timeout: 30,
            retries: 1,
            continueOnFailure: false,
            dependencies: [],
          },
          {
            id: 'attempt_signin',
            name: 'Attempt User Sign In',
            type: 'action' as const,
            team: 'auth' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/auth/signin',
              method: 'POST',
              payload: {
                email: 'test@pinkblueberry.com',
                password: 'test_password',
              },
            },
            expectedResult: { success: true, token: 'string', user: 'object' },
            timeout: 60,
            retries: 2,
            continueOnFailure: false,
            dependencies: ['create_test_user'],
          },
          {
            id: 'verify_session',
            name: 'Verify Session Creation',
            type: 'verification' as const,
            team: 'database' as const,
            action: {
              type: 'database_query' as const,
              target: 'session_verification',
              parameters: { user_email: 'test@pinkblueberry.com' },
            },
            expectedResult: { session_exists: true, active: true },
            timeout: 30,
            retries: 1,
            continueOnFailure: false,
            dependencies: ['attempt_signin'],
          },
        ],
        assertions: [
          {
            id: 'user_created',
            type: 'equals' as const,
            field: 'created',
            expected: true,
            message: 'Test user should be created successfully',
            critical: true,
          },
          {
            id: 'signin_successful',
            type: 'equals' as const,
            field: 'success',
            expected: true,
            message: 'User sign-in should be successful',
            critical: true,
          },
          {
            id: 'session_active',
            type: 'equals' as const,
            field: 'active',
            expected: true,
            message: 'User session should be active after sign-in',
            critical: true,
          },
        ],
        timeout: 180,
        retries: 1,
        tags: ['critical', 'auth', 'database', 'e2e'],
        expectedDuration: 120,
      },
    ],
    setup: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'auth_schema_setup',
          parameters: { create_tables: ['users', 'sessions', 'permissions'] },
        },
      ],
      timeout: 60,
      rollbackOnFailure: true,
    },
    teardown: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'auth_cleanup',
          parameters: { delete_test_users: true, cleanup_sessions: true },
        },
      ],
      timeout: 30,
      force: true,
    },
    timeout: 300,
    retries: 0,
    parallel: false,
    tags: ['auth', 'database', 'integration'],
    dependencies: ['foundation_database_integration'],
  },

  booking_workflow: {
    id: 'booking_workflow_integration',
    name: 'End-to-End Booking Workflow',
    description: 'Tests complete booking workflow across multiple teams',
    teams: ['auth', 'booking', 'crm', 'database'] as const,
    testCases: [
      {
        id: 'complete_booking_flow',
        name: 'Complete Booking Flow',
        description: 'Test entire booking process from authentication to completion',
        type: 'end_to_end' as const,
        priority: 'critical' as const,
        teams: ['auth', 'booking', 'crm', 'database'] as const,
        steps: [
          {
            id: 'authenticate_customer',
            name: 'Authenticate Customer',
            type: 'action' as const,
            team: 'auth' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/auth/signin',
              method: 'POST',
              payload: { email: 'customer@test.com', password: 'password' },
            },
            expectedResult: { token: 'string', user_id: 'string' },
            timeout: 30,
            retries: 2,
            continueOnFailure: false,
            dependencies: [],
          },
          {
            id: 'get_available_services',
            name: 'Get Available Services',
            type: 'action' as const,
            team: 'booking' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/services',
              method: 'GET',
            },
            expectedResult: { services: 'array', count: 'number' },
            timeout: 30,
            retries: 1,
            continueOnFailure: false,
            dependencies: [],
          },
          {
            id: 'check_availability',
            name: 'Check Service Availability',
            type: 'action' as const,
            team: 'booking' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/booking/availability',
              method: 'GET',
              parameters: { service_id: 'test_service', date: '2024-02-01' },
            },
            expectedResult: { available_slots: 'array' },
            timeout: 30,
            retries: 1,
            continueOnFailure: false,
            dependencies: ['get_available_services'],
          },
          {
            id: 'create_booking',
            name: 'Create Booking',
            type: 'action' as const,
            team: 'booking' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/bookings',
              method: 'POST',
              payload: {
                service_id: 'test_service',
                staff_id: 'test_staff',
                time_slot: { start: '2024-02-01T10:00:00Z', end: '2024-02-01T11:00:00Z' },
              },
              headers: { Authorization: 'Bearer {token}' },
            },
            expectedResult: { booking_id: 'string', status: 'confirmed' },
            timeout: 60,
            retries: 1,
            continueOnFailure: false,
            dependencies: ['authenticate_customer', 'check_availability'],
          },
          {
            id: 'update_customer_profile',
            name: 'Update Customer Profile',
            type: 'action' as const,
            team: 'crm' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/customers/profile',
              method: 'PUT',
              payload: { last_booking: 'booking_id', total_bookings: 'increment' },
              headers: { Authorization: 'Bearer {token}' },
            },
            expectedResult: { updated: true },
            timeout: 30,
            retries: 1,
            continueOnFailure: false,
            dependencies: ['create_booking'],
          },
        ],
        assertions: [
          {
            id: 'customer_authenticated',
            type: 'exists' as const,
            field: 'token',
            expected: true,
            message: 'Customer should be authenticated with valid token',
            critical: true,
          },
          {
            id: 'services_available',
            type: 'greater_than' as const,
            field: 'count',
            expected: 0,
            message: 'Available services should be returned',
            critical: true,
          },
          {
            id: 'booking_created',
            type: 'equals' as const,
            field: 'status',
            expected: 'confirmed',
            message: 'Booking should be created with confirmed status',
            critical: true,
          },
          {
            id: 'customer_updated',
            type: 'equals' as const,
            field: 'updated',
            expected: true,
            message: 'Customer profile should be updated after booking',
            critical: false,
          },
        ],
        timeout: 300,
        retries: 1,
        tags: ['critical', 'e2e', 'booking', 'workflow'],
        expectedDuration: 240,
      },
    ],
    setup: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'booking_test_setup',
          parameters: {
            create_customer: { email: 'customer@test.com' },
            create_service: { id: 'test_service', name: 'Test Service' },
            create_staff: { id: 'test_staff', name: 'Test Staff' },
          },
        },
      ],
      timeout: 120,
      rollbackOnFailure: true,
    },
    teardown: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'booking_test_cleanup',
          parameters: { cleanup_test_data: true },
        },
      ],
      timeout: 60,
      force: true,
    },
    timeout: 600,
    retries: 0,
    parallel: false,
    tags: ['e2e', 'booking', 'workflow', 'integration'],
    dependencies: ['auth_database_integration'],
  },

  admin_dashboard: {
    id: 'admin_dashboard_integration',
    name: 'Admin Dashboard Integration',
    description: 'Tests admin dashboard integration with all backend teams',
    teams: ['admin', 'booking', 'ecommerce', 'crm', 'database'] as const,
    testCases: [
      {
        id: 'dashboard_data_aggregation',
        name: 'Dashboard Data Aggregation',
        description: 'Test admin dashboard can aggregate data from all teams',
        type: 'integration' as const,
        priority: 'high' as const,
        teams: ['admin', 'booking', 'ecommerce', 'crm'] as const,
        steps: [
          {
            id: 'get_booking_metrics',
            name: 'Get Booking Metrics',
            type: 'action' as const,
            team: 'booking' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/booking/metrics',
              method: 'GET',
              parameters: { period: '7d' },
            },
            expectedResult: { total_bookings: 'number', revenue: 'number' },
            timeout: 30,
            retries: 1,
            continueOnFailure: true,
            dependencies: [],
          },
          {
            id: 'get_ecommerce_metrics',
            name: 'Get E-commerce Metrics',
            type: 'action' as const,
            team: 'ecommerce' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/ecommerce/metrics',
              method: 'GET',
              parameters: { period: '7d' },
            },
            expectedResult: { total_orders: 'number', revenue: 'number' },
            timeout: 30,
            retries: 1,
            continueOnFailure: true,
            dependencies: [],
          },
          {
            id: 'get_customer_metrics',
            name: 'Get Customer Metrics',
            type: 'action' as const,
            team: 'crm' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/crm/metrics',
              method: 'GET',
              parameters: { period: '7d' },
            },
            expectedResult: { total_customers: 'number', new_customers: 'number' },
            timeout: 30,
            retries: 1,
            continueOnFailure: true,
            dependencies: [],
          },
          {
            id: 'aggregate_dashboard_data',
            name: 'Aggregate Dashboard Data',
            type: 'action' as const,
            team: 'admin' as const,
            action: {
              type: 'api_call' as const,
              target: '/api/admin/dashboard',
              method: 'GET',
              parameters: { period: '7d' },
            },
            expectedResult: {
              booking_data: 'object',
              ecommerce_data: 'object',
              customer_data: 'object',
              aggregated: true,
            },
            timeout: 60,
            retries: 1,
            continueOnFailure: false,
            dependencies: ['get_booking_metrics', 'get_ecommerce_metrics', 'get_customer_metrics'],
          },
        ],
        assertions: [
          {
            id: 'booking_metrics_available',
            type: 'exists' as const,
            field: 'total_bookings',
            expected: true,
            message: 'Booking metrics should be available',
            critical: false,
          },
          {
            id: 'ecommerce_metrics_available',
            type: 'exists' as const,
            field: 'total_orders',
            expected: true,
            message: 'E-commerce metrics should be available',
            critical: false,
          },
          {
            id: 'customer_metrics_available',
            type: 'exists' as const,
            field: 'total_customers',
            expected: true,
            message: 'Customer metrics should be available',
            critical: false,
          },
          {
            id: 'dashboard_aggregated',
            type: 'equals' as const,
            field: 'aggregated',
            expected: true,
            message: 'Dashboard should successfully aggregate data from all teams',
            critical: true,
          },
        ],
        timeout: 180,
        retries: 1,
        tags: ['high', 'admin', 'dashboard', 'integration'],
        expectedDuration: 150,
      },
    ],
    setup: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'admin_test_setup',
          parameters: { create_sample_data: true, period: '7d' },
        },
      ],
      timeout: 90,
      rollbackOnFailure: true,
    },
    teardown: {
      type: 'script' as const,
      actions: [
        {
          type: 'database_query' as const,
          target: 'admin_test_cleanup',
          parameters: { cleanup_sample_data: true },
        },
      ],
      timeout: 60,
      force: true,
    },
    timeout: 360,
    retries: 0,
    parallel: false,
    tags: ['admin', 'dashboard', 'integration'],
    dependencies: ['booking_workflow_integration'],
  },
} as const;

// Test execution utilities
export function getTestSuiteById(suiteId: string) {
  return Object.values(INTEGRATION_TEST_SUITES).find(suite => suite.id === suiteId);
}

export function getTestSuitesByTeam(teamId: TeamId) {
  return Object.values(INTEGRATION_TEST_SUITES).filter(suite =>
    suite.teams.includes(teamId)
  );
}

export function getDependencyOrderedSuites() {
  const suites = Object.values(INTEGRATION_TEST_SUITES);
  const ordered = [];
  const visited = new Set();

  function visit(suite: typeof suites[0]) {
    if (visited.has(suite.id)) return;

    // Visit dependencies first
    for (const depId of suite.dependencies) {
      const depSuite = suites.find(s => s.id === depId);
      if (depSuite) visit(depSuite);
    }

    visited.add(suite.id);
    ordered.push(suite);
  }

  for (const suite of suites) {
    visit(suite);
  }

  return ordered;
}

export function getReadyTestSuites(completedSuites: string[]) {
  return Object.values(INTEGRATION_TEST_SUITES).filter(suite =>
    suite.dependencies.every(depId => completedSuites.includes(depId))
  );
}

// Type exports for external usage
export type {
  TestSuite,
  TestCase,
  TestStep,
  TestAction,
  TestAssertion,
  TestSuiteResult,
  TestCaseResult,
  TestStepResult,
  IntegrationTestFramework,
} from './integration-test.framework';

export type TeamId = 'foundation' | 'database' | 'auth' | 'booking' | 'ecommerce' | 'crm' | 'admin';