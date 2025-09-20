/**
 * E2E Tests for Complete Booking Flow
 * Tests the critical user journey of booking a salon appointment
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testCustomer = {
  name: 'Jane Smith',
  email: 'jane.smith@test.com',
  phone: '555-0123',
};

const testServices = {
  hairColor: {
    name: 'Hair Color',
    price: '$150',
    duration: '2 hours',
  },
  haircut: {
    name: 'Hair Cut',
    price: '$65',
    duration: '45 minutes',
  },
};

// Helper functions
async function selectService(page: Page, serviceName: string) {
  await page.click(`[data-testid="service-${serviceName.toLowerCase().replace(' ', '-')}"]`);
  await expect(page.locator('[data-testid="selected-service"]')).toContainText(serviceName);
}

async function selectStylist(page: Page, stylistName: string) {
  await page.click(`[data-testid="stylist-${stylistName.toLowerCase().replace(' ', '-')}"]`);
  await expect(page.locator('[data-testid="selected-stylist"]')).toContainText(stylistName);
}

async function selectDateTime(page: Page, date: string, time: string) {
  // Select date
  await page.click('[data-testid="date-picker"]');
  await page.click(`[data-date="${date}"]`);

  // Select time
  await page.click(`[data-time="${time}"]`);
  await expect(page.locator('[data-testid="selected-datetime"]')).toContainText(time);
}

async function fillContactInfo(page: Page, customer: typeof testCustomer) {
  await page.fill('[data-testid="input-name"]', customer.name);
  await page.fill('[data-testid="input-email"]', customer.email);
  await page.fill('[data-testid="input-phone"]', customer.phone);
}

// Main test suite
test.describe('Booking Flow - Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');

    // Wait for page to be ready
    await expect(page.locator('h1')).toContainText('Book Your Appointment');
  });

  test('Complete booking flow - single service', async ({ page }) => {
    // Step 1: Service Selection
    await test.step('Select service', async () => {
      await selectService(page, testServices.hairColor.name);
      await page.click('[data-testid="btn-continue"]');

      // Verify progression
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('data-step', '2');
    });

    // Step 2: Stylist Selection
    await test.step('Select stylist', async () => {
      await selectStylist(page, 'Beth Day');
      await page.click('[data-testid="btn-continue"]');

      // Verify progression
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('data-step', '3');
    });

    // Step 3: Date & Time Selection
    await test.step('Select date and time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await selectDateTime(page, dateStr, '14:00');
      await page.click('[data-testid="btn-continue"]');

      // Verify progression
      await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('data-step', '4');
    });

    // Step 4: Contact Information
    await test.step('Enter contact information', async () => {
      await fillContactInfo(page, testCustomer);

      // Verify form validation
      await expect(page.locator('[data-testid="btn-book"]')).toBeEnabled();

      // Submit booking
      await page.click('[data-testid="btn-book"]');
    });

    // Step 5: Confirmation
    await test.step('Verify confirmation', async () => {
      // Wait for confirmation page
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();

      // Verify booking details
      await expect(page.locator('[data-testid="confirmation-service"]')).toContainText(testServices.hairColor.name);
      await expect(page.locator('[data-testid="confirmation-stylist"]')).toContainText('Beth Day');
      await expect(page.locator('[data-testid="confirmation-customer"]')).toContainText(testCustomer.name);

      // Check for confirmation number
      const confirmationNumber = await page.locator('[data-testid="confirmation-number"]').textContent();
      expect(confirmationNumber).toMatch(/^[A-Z0-9]{8}$/);
    });
  });

  test('Book multiple services', async ({ page }) => {
    // Select multiple services
    await test.step('Select multiple services', async () => {
      await selectService(page, testServices.hairColor.name);
      await selectService(page, testServices.haircut.name);

      // Verify total duration and price
      await expect(page.locator('[data-testid="total-duration"]')).toContainText('2 hours 45 minutes');
      await expect(page.locator('[data-testid="total-price"]')).toContainText('$215');

      await page.click('[data-testid="btn-continue"]');
    });

    // Continue with rest of booking flow
    await selectStylist(page, 'Beth Day');
    await page.click('[data-testid="btn-continue"]');

    // Verify extended time slots are blocked
    const blockedSlots = await page.locator('[data-testid="time-slot"][data-available="false"]').count();
    expect(blockedSlots).toBeGreaterThan(0);
  });

  test('Handle unavailable time slot', async ({ page }) => {
    // Navigate through to time selection
    await selectService(page, testServices.hairColor.name);
    await page.click('[data-testid="btn-continue"]');

    await selectStylist(page, 'Beth Day');
    await page.click('[data-testid="btn-continue"]');

    // Try to select unavailable slot
    await page.click('[data-testid="date-picker"]');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);

    // Click on unavailable time
    const unavailableSlot = page.locator('[data-testid="time-slot"][data-available="false"]').first();
    await unavailableSlot.click();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('This time slot is not available');

    // Verify alternative suggestions
    await expect(page.locator('[data-testid="alternative-times"]')).toBeVisible();
    const alternatives = await page.locator('[data-testid="alternative-time"]').count();
    expect(alternatives).toBeGreaterThan(0);
  });

  test('Form validation - invalid inputs', async ({ page }) => {
    // Navigate to contact form
    await selectService(page, testServices.haircut.name);
    await page.click('[data-testid="btn-continue"]');

    await selectStylist(page, 'Beth Day');
    await page.click('[data-testid="btn-continue"]');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await selectDateTime(page, tomorrow.toISOString().split('T')[0], '10:00');
    await page.click('[data-testid="btn-continue"]');

    // Test invalid email
    await page.fill('[data-testid="input-email"]', 'invalid-email');
    await page.click('[data-testid="btn-book"]');
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Please enter a valid email');

    // Test invalid phone
    await page.fill('[data-testid="input-email"]', 'valid@email.com');
    await page.fill('[data-testid="input-phone"]', '123');
    await page.click('[data-testid="btn-book"]');
    await expect(page.locator('[data-testid="error-phone"]')).toContainText('Please enter a valid phone number');

    // Test missing required fields
    await page.fill('[data-testid="input-name"]', '');
    await page.fill('[data-testid="input-email"]', '');
    await page.fill('[data-testid="input-phone"]', '');
    await page.click('[data-testid="btn-book"]');

    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible();
  });

  test('Navigate back through steps', async ({ page }) => {
    // Progress to step 3
    await selectService(page, testServices.hairColor.name);
    await page.click('[data-testid="btn-continue"]');

    await selectStylist(page, 'Beth Day');
    await page.click('[data-testid="btn-continue"]');

    // Go back to stylist selection
    await page.click('[data-testid="btn-back"]');
    await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('data-step', '2');

    // Verify previous selection is retained
    await expect(page.locator('[data-testid="selected-stylist"]')).toContainText('Beth Day');

    // Go back to service selection
    await page.click('[data-testid="btn-back"]');
    await expect(page.locator('[data-testid="progress-indicator"]')).toHaveAttribute('data-step', '1');

    // Verify service selection is retained
    await expect(page.locator('[data-testid="selected-service"]')).toContainText(testServices.hairColor.name);
  });

  test('Handle network failure during submission', async ({ page, context }) => {
    // Complete booking flow up to submission
    await selectService(page, testServices.haircut.name);
    await page.click('[data-testid="btn-continue"]');

    await selectStylist(page, 'Beth Day');
    await page.click('[data-testid="btn-continue"]');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await selectDateTime(page, tomorrow.toISOString().split('T')[0], '15:00');
    await page.click('[data-testid="btn-continue"]');

    await fillContactInfo(page, testCustomer);

    // Simulate network failure
    await context.setOffline(true);

    // Try to submit
    await page.click('[data-testid="btn-book"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-banner"]')).toContainText('Connection error');
    await expect(page.locator('[data-testid="btn-retry"]')).toBeVisible();

    // Verify form data is preserved
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue(testCustomer.name);
    await expect(page.locator('[data-testid="input-email"]')).toHaveValue(testCustomer.email);
    await expect(page.locator('[data-testid="input-phone"]')).toHaveValue(testCustomer.phone);

    // Restore network and retry
    await context.setOffline(false);
    await page.click('[data-testid="btn-retry"]');

    // Should succeed now
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
  });
});

// Mobile-specific tests
test.describe('Booking Flow - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });

  test('Mobile booking flow with touch interactions', async ({ page }) => {
    await page.goto('/booking');

    // Test touch scrolling for service selection
    await page.locator('[data-testid="services-container"]').scrollIntoViewIfNeeded();
    await page.tap(`[data-testid="service-hair-color"]`);

    // Verify mobile-optimized continue button
    const continueBtn = page.locator('[data-testid="btn-continue-mobile"]');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toHaveCSS('position', 'fixed');
    await page.tap('[data-testid="btn-continue-mobile"]');

    // Test swipe gestures for calendar navigation (if implemented)
    const calendar = page.locator('[data-testid="calendar-mobile"]');
    if (await calendar.isVisible()) {
      // Swipe to next month
      await calendar.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 400 }] });
      await calendar.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 400 }] });
      await calendar.dispatchEvent('touchend');
    }
  });
});