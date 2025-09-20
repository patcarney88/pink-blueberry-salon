/**
 * Jest Test Setup Configuration
 * Sets up the testing environment for all unit and integration tests
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { cleanup } from '@testing-library/react';

// Polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock fetch for API calls
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Custom test utilities
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
};

export const waitForAsync = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Test data factories
export const createMockService = (overrides = {}) => ({
  id: '1',
  name: 'Hair Color',
  description: 'Full color service',
  duration: 120,
  price: 150,
  category: 'Hair',
  ...overrides,
});

export const createMockStylist = (overrides = {}) => ({
  id: '1',
  name: 'Beth Day',
  title: 'Master Stylist',
  specialties: ['Color', 'Cuts'],
  availability: {},
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: '1',
  service: createMockService(),
  stylist: createMockStylist(),
  date: '2024-12-15',
  time: '14:00',
  customer: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0123',
  },
  status: 'confirmed',
  ...overrides,
});

// Performance testing utilities
export const measureRenderTime = async (callback: () => void) => {
  const start = performance.now();
  await callback();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkA11y = (container: HTMLElement) => {
  const errors: string[] = [];

  // Check for images without alt text
  const images = container.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    errors.push(`${images.length} images without alt text`);
  }

  // Check for buttons without accessible text
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      errors.push('Button without accessible text');
    }
  });

  // Check for form inputs without labels
  const inputs = container.querySelectorAll('input:not([type="hidden"])');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    if (!id || !container.querySelector(`label[for="${id}"]`)) {
      if (!input.getAttribute('aria-label')) {
        errors.push('Input without label');
      }
    }
  });

  return errors;
};