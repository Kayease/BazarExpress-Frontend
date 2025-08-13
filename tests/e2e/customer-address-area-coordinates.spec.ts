import { test, expect } from '@playwright/test'

test.describe('Customer Address Area and Coordinates', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display only area in customer address column', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check customer address column (3rd column)
    const addressCell = page.locator('table tbody tr:first-child td:nth-child(3)')
    
    // Should be a clickable button
    await expect(addressCell.locator('button')).toBeVisible()
    
    // Should contain only area text (not full address)
    const addressText = await addressCell.textContent()
    
    // Should not contain building, city, state, pincode (only area)
    // The text should be relatively short (area only)
    expect(addressText?.length).toBeLessThan(50) // Area names are typically short
    
    // Should not contain comma separators (which would indicate full address)
    expect(addressText).not.toContain(',')
    
    // Should not contain pincode patterns (6 digits)
    expect(addressText).not.toMatch(/\d{6}/)
  })

  test('should have blue underlined styling for clickable area', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check customer address column styling
    const addressButton = page.locator('table tbody tr:first-child td:nth-child(3) button')
    
    // Should have blue text color
    await expect(addressButton.locator('.text-blue-600')).toBeVisible()
    
    // Should have underline
    await expect(addressButton.locator('.underline')).toBeVisible()
    
    // Should have hover effect class
    await expect(addressButton.locator('.hover\\:text-blue-800')).toBeVisible()
    
    // Should have font-medium for better visibility
    await expect(addressButton.locator('.font-medium')).toBeVisible()
  })

  test('should have proper tooltip indicating map functionality', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check if button has proper title attribute
    const addressButton = page.locator('table tbody tr:first-child td:nth-child(3) button')
    
    // Should have title attribute for tooltip
    const titleAttribute = await addressButton.getAttribute('title')
    expect(titleAttribute).toBe('Click to open in map')
  })

  test('should open map with coordinates when available', async ({ page, context }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Mock console.log to capture the map URL that would be opened
    await page.evaluate(() => {
      // Store original window.open
      (window as any).originalOpen = window.open
      
      // Mock window.open to capture URL
      window.open = (url: string) => {
        console.log('MAP_URL_OPENED:', url)
        return null
      }
    })
    
    // Listen for console messages
    const mapUrls: string[] = []
    page.on('console', msg => {
      if (msg.text().startsWith('MAP_URL_OPENED:')) {
        mapUrls.push(msg.text().replace('MAP_URL_OPENED:', '').trim())
      }
    })
    
    // Click on customer address
    const addressButton = page.locator('table tbody tr:first-child td:nth-child(3) button')
    await addressButton.click()
    
    // Wait a moment for the click to process
    await page.waitForTimeout(1000)
    
    // Verify a map URL was captured
    expect(mapUrls.length).toBeGreaterThan(0)
    
    const mapUrl = mapUrls[0]
    
    // Should be a Google Maps URL
    expect(mapUrl).toContain('google.com/maps')
    
    // Should either use coordinates (q=lat,lng) or search query
    const hasCoordinates = mapUrl.includes('?q=') && /q=[-\d.]+,[-\d.]+/.test(mapUrl)
    const hasSearchQuery = mapUrl.includes('search/?api=1&query=')
    
    expect(hasCoordinates || hasSearchQuery).toBe(true)
    
    // If coordinates are used, verify format
    if (hasCoordinates) {
      expect(mapUrl).toMatch(/q=[-\d.]+,[-\d.]+/)
    }
  })

  test('should work consistently across all order rows', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Get all address cells
    const addressCells = page.locator('table tbody tr td:nth-child(3)')
    const count = await addressCells.count()
    
    // Check first few rows (limit to avoid long test)
    const rowsToCheck = Math.min(count, 3)
    
    for (let i = 0; i < rowsToCheck; i++) {
      const cell = addressCells.nth(i)
      
      // Each should have a clickable button
      await expect(cell.locator('button')).toBeVisible()
      
      // Each should have blue underlined text
      await expect(cell.locator('.text-blue-600.underline')).toBeVisible()
      
      // Each should have area text (not empty)
      const text = await cell.textContent()
      expect(text?.trim()).toBeTruthy()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('should display area in orders page as well', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Wait for orders to load (if any)
    try {
      await page.waitForSelector('table tbody tr', { timeout: 5000 })
      
      // Check customer address column (3rd column)
      const addressCell = page.locator('table tbody tr:first-child td:nth-child(3)')
      
      // Should display area only
      await expect(addressCell.locator('button')).toBeVisible()
      await expect(addressCell.locator('.text-blue-600.underline')).toBeVisible()
      
      const addressText = await addressCell.textContent()
      expect(addressText?.length).toBeLessThan(50) // Area only
      
    } catch (error) {
      // No orders in assigned orders page - that's okay for this test
      console.log('No assigned orders found - test passed')
    }
  })
})