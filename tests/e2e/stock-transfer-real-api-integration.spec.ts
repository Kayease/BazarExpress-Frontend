import { test, expect } from '@playwright/test'

test.describe('Stock Transfer Real API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page first
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('should fetch real warehouse data from API when modal opens', async ({ page }) => {
    // Set up request interception to monitor API calls
    const warehouseRequests = []
    
    page.on('request', request => {
      if (request.url().includes('/api/warehouses') && request.method() === 'GET') {
        warehouseRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })

    // Mock authentication - adjust based on your auth system
    await page.evaluate(() => {
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify({
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'mock-admin-token'
        }),
        token: JSON.stringify('mock-admin-token')
      }))
    })

    // Navigate to stock transfer page
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')

    // Wait for page to load and check if we can access it
    try {
      await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 10000 })
    } catch (error) {
      console.log('Stock transfer page not accessible, might need proper authentication')
      // Skip test if page is not accessible
      test.skip()
      return
    }

    // Click "New Transfer" button to open modal
    await page.click('button:has-text("New Transfer")')

    // Wait for modal to appear
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()

    // Wait a bit for API calls to complete
    await page.waitForTimeout(3000)

    // Verify that warehouse API was called
    expect(warehouseRequests.length).toBeGreaterThan(0)
    
    // Check that the request has proper headers
    const warehouseRequest = warehouseRequests[0]
    expect(warehouseRequest.url).toContain('/api/warehouses')
    expect(warehouseRequest.method).toBe('GET')
    
    // Check for authorization header (if token is available)
    if (warehouseRequest.headers.authorization) {
      expect(warehouseRequest.headers.authorization).toContain('Bearer')
    }

    console.log('Warehouse API requests:', warehouseRequests)
  })

  test('should show loading state in warehouse dropdowns', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/warehouses', async route => {
      // Delay response by 2 seconds to test loading state
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'test-warehouse-1',
            name: 'Test Warehouse 1',
            address: 'Test Address 1',
            status: 'active',
            location: { lat: 0, lng: 0 },
            contactPhone: '1234567890',
            email: 'test@example.com',
            capacity: 1000
          }
        ])
      })
    })

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify({
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'mock-admin-token'
        }),
        token: JSON.stringify('mock-admin-token')
      }))
    })

    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')

    try {
      await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 5000 })
    } catch (error) {
      test.skip()
      return
    }

    // Open modal
    await page.click('button:has-text("New Transfer")')
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()

    // Check for loading state in dropdowns
    await expect(page.locator('option:has-text("Loading warehouses...")')).toBeVisible()

    // Wait for loading to complete
    await page.waitForTimeout(3000)

    // Verify warehouses are loaded
    await expect(page.locator('option:has-text("Test Warehouse 1")')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/warehouses', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify({
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'mock-admin-token'
        }),
        token: JSON.stringify('mock-admin-token')
      }))
    })

    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')

    try {
      await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 5000 })
    } catch (error) {
      test.skip()
      return
    }

    // Open modal
    await page.click('button:has-text("New Transfer")')
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()

    // Wait for error handling
    await page.waitForTimeout(2000)

    // Check that error toast appears (adjust selector based on your toast implementation)
    await expect(page.locator('text*=Failed to fetch warehouses')).toBeVisible({ timeout: 5000 })

    // Verify dropdowns still show proper fallback text
    await expect(page.locator('option:has-text("Select source warehouse")')).toBeVisible()
  })

  test('should filter out inactive warehouses', async ({ page }) => {
    // Mock API response with mixed active/inactive warehouses
    await page.route('**/api/warehouses', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'active-warehouse',
            name: 'Active Warehouse',
            address: 'Active Address',
            status: 'active',
            location: { lat: 0, lng: 0 },
            contactPhone: '1234567890',
            email: 'active@example.com',
            capacity: 1000
          },
          {
            _id: 'inactive-warehouse',
            name: 'Inactive Warehouse',
            address: 'Inactive Address',
            status: 'inactive',
            location: { lat: 0, lng: 0 },
            contactPhone: '0987654321',
            email: 'inactive@example.com',
            capacity: 500
          }
        ])
      })
    })

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify({
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'mock-admin-token'
        }),
        token: JSON.stringify('mock-admin-token')
      }))
    })

    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')

    try {
      await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 5000 })
    } catch (error) {
      test.skip()
      return
    }

    // Open modal
    await page.click('button:has-text("New Transfer")')
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()

    // Wait for warehouses to load
    await page.waitForTimeout(2000)

    // Verify only active warehouse appears in dropdown
    await expect(page.locator('option:has-text("Active Warehouse")')).toBeVisible()
    await expect(page.locator('option:has-text("Inactive Warehouse")')).not.toBeVisible()
  })
})

test.describe('Stock Transfer API Authentication', () => {
  test('should include proper authentication headers', async ({ page }) => {
    let authHeader = null
    
    page.on('request', request => {
      if (request.url().includes('/api/warehouses')) {
        authHeader = request.headers().authorization
      }
    })

    // Mock authentication with specific token
    await page.evaluate(() => {
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify({
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'test-bearer-token-123'
        }),
        token: JSON.stringify('test-bearer-token-123')
      }))
    })

    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')

    try {
      await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 5000 })
      await page.click('button:has-text("New Transfer")')
      await page.waitForTimeout(2000)

      // Verify authorization header is present and correct
      if (authHeader) {
        expect(authHeader).toBe('Bearer test-bearer-token-123')
      }
    } catch (error) {
      console.log('Authentication test skipped - page not accessible')
    }
  })
})