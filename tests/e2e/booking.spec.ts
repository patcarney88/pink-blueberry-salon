import { test, expect } from '@playwright/test'

test.describe('Booking Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking')
  })

  test('should complete full booking flow', async ({ page }) => {
    // Step 1: Select service
    await test.step('Select service', async () => {
      await page.click('[data-testid="service-category-hair"]')
      await page.click('[data-testid="service-haircut"]')
      expect(await page.locator('.selected-service').count()).toBe(1)
    })

    // Step 2: Select staff member
    await test.step('Select staff member', async () => {
      await page.click('[data-testid="staff-member-1"]')
      expect(await page.locator('.selected-staff').count()).toBe(1)
    })

    // Step 3: Select date and time
    await test.step('Select date and time', async () => {
      // Select tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`)

      // Wait for available slots to load
      await page.waitForSelector('[data-testid="time-slot"]')

      // Select first available slot
      await page.click('[data-testid="time-slot"]:first-child')

      expect(await page.locator('.selected-time').count()).toBe(1)
    })

    // Step 4: Fill customer information
    await test.step('Fill customer information', async () => {
      await page.fill('[data-testid="customer-name"]', 'John Doe')
      await page.fill('[data-testid="customer-email"]', 'john@example.com')
      await page.fill('[data-testid="customer-phone"]', '+1234567890')
      await page.fill('[data-testid="notes"]', 'First time customer')
    })

    // Step 5: Confirm booking
    await test.step('Confirm booking', async () => {
      await page.click('[data-testid="confirm-booking"]')

      // Wait for confirmation
      await page.waitForURL('**/booking/confirmation')

      // Verify confirmation page
      await expect(page.locator('h1')).toContainText('Booking Confirmed')
      await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible()
    })
  })

  test('should show availability calendar', async ({ page }) => {
    await page.click('[data-testid="service-haircut"]')
    await page.click('[data-testid="staff-member-1"]')

    // Check calendar is visible
    await expect(page.locator('[data-testid="availability-calendar"]')).toBeVisible()

    // Check that some dates are available (not disabled)
    const availableDates = await page.locator('[data-testid="date-available"]').count()
    expect(availableDates).toBeGreaterThan(0)

    // Check that past dates are disabled
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pastDate = page.locator(`[data-date="${yesterday.toISOString().split('T')[0]}"]`)
    await expect(pastDate).toHaveAttribute('disabled', '')
  })

  test('should handle booking conflicts', async ({ page }) => {
    // Select service and staff
    await page.click('[data-testid="service-haircut"]')
    await page.click('[data-testid="staff-member-1"]')

    // Try to book an unavailable slot
    await page.click('[data-testid="date-today"]')
    await page.click('[data-testid="time-slot-unavailable"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('not available')
  })

  test('should calculate pricing correctly', async ({ page }) => {
    // Select expensive service
    await page.click('[data-testid="service-color"]')
    const basePrice = await page.locator('[data-testid="service-price"]').textContent()

    // Add an add-on
    await page.click('[data-testid="addon-treatment"]')
    const addOnPrice = await page.locator('[data-testid="addon-price"]').textContent()

    // Check total price
    await page.waitForSelector('[data-testid="total-price"]')
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent()

    // Verify calculation
    const base = parseFloat(basePrice?.replace('$', '') || '0')
    const addon = parseFloat(addOnPrice?.replace('$', '') || '0')
    const total = parseFloat(totalPrice?.replace('$', '') || '0')

    expect(total).toBe(base + addon)
  })

  test('should validate customer information', async ({ page }) => {
    // Try to book without filling required fields
    await page.click('[data-testid="service-haircut"]')
    await page.click('[data-testid="staff-member-1"]')
    await page.click('[data-testid="time-slot"]:first-child')

    // Try to submit without customer info
    await page.click('[data-testid="confirm-booking"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="error-name"]')).toContainText('required')
    await expect(page.locator('[data-testid="error-email"]')).toContainText('required')
    await expect(page.locator('[data-testid="error-phone"]')).toContainText('required')

    // Test email validation
    await page.fill('[data-testid="customer-email"]', 'invalid-email')
    await page.click('[data-testid="confirm-booking"]')
    await expect(page.locator('[data-testid="error-email"]')).toContainText('valid email')
  })

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/api/appointments', route => route.abort())

    // Try to complete booking
    await page.click('[data-testid="service-haircut"]')
    await page.click('[data-testid="staff-member-1"]')
    await page.click('[data-testid="time-slot"]:first-child')

    await page.fill('[data-testid="customer-name"]', 'John Doe')
    await page.fill('[data-testid="customer-email"]', 'john@example.com')
    await page.fill('[data-testid="customer-phone"]', '+1234567890')

    await page.click('[data-testid="confirm-booking"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-banner"]')).toContainText('error occurred')
  })
})

test.describe('Mobile Booking', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/booking')

    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Check that layout is mobile-friendly
    const serviceCards = page.locator('[data-testid="service-card"]')
    const firstCard = await serviceCards.first().boundingBox()

    // Cards should be full width on mobile
    expect(firstCard?.width).toBeGreaterThan(300)

    // Check touch interactions
    await page.tap('[data-testid="service-haircut"]')
    await expect(page.locator('.selected-service')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/booking')

    // Tab through services
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // Select service

    await expect(page.locator('.selected-service')).toBeVisible()

    // Tab to staff selection
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space') // Select staff

    await expect(page.locator('.selected-staff')).toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/booking')

    // Check main elements have ARIA labels
    await expect(page.locator('[aria-label="Select a service"]')).toBeVisible()
    await expect(page.locator('[aria-label="Select staff member"]')).toBeVisible()
    await expect(page.locator('[aria-label="Select date and time"]')).toBeVisible()

    // Check form fields have labels
    const nameInput = page.locator('[data-testid="customer-name"]')
    await expect(nameInput).toHaveAttribute('aria-label', 'Full name')
  })

  test('should announce changes to screen readers', async ({ page }) => {
    await page.goto('/booking')

    // Check live regions exist
    await expect(page.locator('[aria-live="polite"]')).toBeVisible()

    // Select service and check announcement
    await page.click('[data-testid="service-haircut"]')

    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toContainText('Haircut selected')
  })
})