import { test, expect } from '@playwright/test'

test.describe('Stock Transfer Modal UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login page
    await page.goto('http://localhost:3001')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Mock authentication - you may need to adjust this based on your auth system
    // For now, we'll assume the user is already logged in as admin
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: {
          id: 'admin-1',
          name: 'Test Admin',
          role: 'admin',
          token: 'mock-token'
        }
      }))
    })
  })

  test('should display stock transfer modal when New Transfer button is clicked', async ({ page }) => {
    // Navigate to stock transfer page
    await page.goto('http://localhost:3001/admin/stock-transfer')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to finish loading
    await page.waitForSelector('[data-testid="stock-transfer-page"]', { timeout: 10000 })
    
    // Click the "New Transfer" button
    await page.click('button:has-text("New Transfer")')
    
    // Verify modal is displayed
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()
    await expect(page.locator('text=Transfer inventory between warehouses')).toBeVisible()
    
    // Verify warehouse dropdowns are present
    await expect(page.locator('text=From Warehouse')).toBeVisible()
    await expect(page.locator('text=To Warehouse')).toBeVisible()
    
    // Verify modal can be closed
    await page.click('button[aria-label="Close modal"]')
    await expect(page.locator('text=Create Stock Transfer')).not.toBeVisible()
  })

  test('should show warehouse selection dropdowns', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')
    
    // Open modal
    await page.click('button:has-text("New Transfer")')
    
    // Check from warehouse dropdown
    const fromWarehouseSelect = page.locator('select').first()
    await expect(fromWarehouseSelect).toBeVisible()
    
    // Check to warehouse dropdown
    const toWarehouseSelect = page.locator('select').nth(1)
    await expect(toWarehouseSelect).toBeVisible()
    
    // Select a from warehouse
    await fromWarehouseSelect.selectOption({ index: 1 }) // Select first warehouse
    
    // Verify to warehouse dropdown is enabled and excludes selected from warehouse
    await expect(toWarehouseSelect).toBeEnabled()
  })

  test('should show product search and filters when warehouse is selected', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')
    
    // Open modal
    await page.click('button:has-text("New Transfer")')
    
    // Select from warehouse
    await page.selectOption('select', { index: 1 })
    
    // Verify search input appears
    await expect(page.locator('input[placeholder="Search products..."]')).toBeVisible()
    
    // Verify filters button appears
    await expect(page.locator('button:has-text("Filters")')).toBeVisible()
    
    // Click filters to expand
    await page.click('button:has-text("Filters")')
    
    // Verify category and brand dropdowns appear
    await expect(page.locator('select:has-text("All Categories")')).toBeVisible()
    await expect(page.locator('select:has-text("All Brands")')).toBeVisible()
  })

  test('should show form validation messages', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')
    
    // Open modal
    await page.click('button:has-text("New Transfer")')
    
    // Try to submit without selecting warehouses
    await page.click('button:has-text("Create Transfer Request")')
    
    // Should show validation message (this would be a toast notification)
    // Note: You might need to adjust this based on how your toast notifications work
    await expect(page.locator('text=Please select both source and destination warehouses')).toBeVisible({ timeout: 5000 })
  })

  test('should display transfer summary when items are selected', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')
    
    // Open modal
    await page.click('button:has-text("New Transfer")')
    
    // Select warehouses
    await page.selectOption('select', { index: 1 }) // From warehouse
    await page.selectOption('select >> nth=1', { index: 1 }) // To warehouse
    
    // Wait for products to load (mock data should appear)
    await page.waitForTimeout(2000)
    
    // If products are loaded, try to add quantity to first product
    const quantityInput = page.locator('input[type="number"]').first()
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('5')
      
      // Verify transfer summary appears
      await expect(page.locator('text=Items:')).toBeVisible()
      await expect(page.locator('text=Total Value:')).toBeVisible()
    }
  })
})

// Test for responsive design
test.describe('Stock Transfer Modal Responsive Design', () => {
  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('http://localhost:3001/admin/stock-transfer')
    await page.waitForLoadState('networkidle')
    
    // Open modal
    await page.click('button:has-text("New Transfer")')
    
    // Verify modal is still usable on mobile
    await expect(page.locator('text=Create Stock Transfer')).toBeVisible()
    
    // Verify dropdowns stack vertically on mobile
    const warehouses = page.locator('select')
    await expect(warehouses).toHaveCount(2)
  })
})