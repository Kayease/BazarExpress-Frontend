import { test, expect } from '@playwright/test'

test.describe('OrdersTable TypeScript Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should load OrdersTable component without TypeScript errors', async ({ page }) => {
    // Check if the page loads successfully (no TypeScript compilation errors)
    await expect(page.locator('h2')).toContainText('All Orders')
    
    // Check if the table is rendered
    await expect(page.locator('table')).toBeVisible()
    
    // Check if column headers are present
    const expectedHeaders = [
      'Order ID',
      'Customer', 
      'Customer Address',
      'Amount',
      'Status',
      'Date',
      'Warehouse',
      'Assigned to',
      'Actions'
    ]

    for (const header of expectedHeaders) {
      await expect(page.locator('th').filter({ hasText: header })).toBeVisible()
    }
  })

  test('should handle delivery boy assignment without TypeScript errors', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Click on the first order's view button
    const viewButton = page.locator('table tbody tr:first-child td:last-child button')
    await viewButton.click()
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // Check if the modal opened successfully (indicates no TypeScript errors in component)
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Check if status dropdown is present
    await expect(page.locator('select').first()).toBeVisible()
    
    // Close modal
    await page.locator('button').filter({ hasText: 'Close' }).click()
  })

  test('should display delivery boy information correctly', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check the "Assigned to" column (8th column)
    const assignedCell = page.locator('table tbody tr:first-child td:nth-child(8)')
    
    // Should be visible (no TypeScript errors preventing rendering)
    await expect(assignedCell).toBeVisible()
    
    // Should contain either delivery boy info or "---"
    const cellText = await assignedCell.textContent()
    expect(cellText).toBeTruthy()
    
    // Should not be empty
    expect(cellText?.trim()).not.toBe('')
  })

  test('should handle customer address map functionality', async ({ page, context }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check if customer address column is clickable
    const addressButton = page.locator('table tbody tr:first-child td:nth-child(3) button')
    
    // Should be visible and clickable (no TypeScript errors)
    await expect(addressButton).toBeVisible()
    
    // Should have proper styling indicating it's clickable
    await expect(addressButton.locator('.text-blue-600')).toBeVisible()
    await expect(addressButton.locator('.underline')).toBeVisible()
  })

  test('should render orders page without errors', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the page loads successfully
    await expect(page.locator('h1')).toContainText('Assigned Orders')
    
    // Check if OrdersTable component is rendered
    await expect(page.locator('table')).toBeVisible()
    
    // Verify it's using the same column structure
    await expect(page.locator('th').filter({ hasText: 'Assigned to' })).toBeVisible()
  })
})