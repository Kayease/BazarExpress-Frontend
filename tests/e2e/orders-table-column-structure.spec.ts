import { test, expect } from '@playwright/test'

test.describe('OrdersTable Column Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display correct column headers', async ({ page }) => {
    // Check if all required column headers are present
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

  test('should display order ID with items count', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check first order row
    const firstOrderCell = page.locator('table tbody tr:first-child td:first-child')
    
    // Should contain order ID
    await expect(firstOrderCell.locator('p:first-child')).toContainText(/^[A-Z0-9]+/)
    
    // Should contain items count
    await expect(firstOrderCell.locator('p:last-child')).toContainText(/\d+ items/)
  })

  test('should display customer information', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check customer column (2nd column)
    const customerCell = page.locator('table tbody tr:first-child td:nth-child(2)')
    
    // Should contain customer name
    await expect(customerCell.locator('p:first-child')).toBeVisible()
    
    // Should contain email
    await expect(customerCell.locator('p:nth-child(2)')).toContainText('@')
    
    // Should contain phone
    await expect(customerCell.locator('p:last-child')).toBeVisible()
  })

  test('should make customer address clickable for map', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check customer address column (3rd column)
    const addressCell = page.locator('table tbody tr:first-child td:nth-child(3)')
    
    // Should be a clickable button
    await expect(addressCell.locator('button')).toBeVisible()
    
    // Should have blue text indicating it's a link
    await expect(addressCell.locator('button .text-blue-600')).toBeVisible()
    
    // Should have underline to indicate it's clickable
    await expect(addressCell.locator('button .underline')).toBeVisible()
  })

  test('should display amount with payment status', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column (4th column)
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    
    // Should contain price with rupee symbol
    await expect(amountCell.locator('p:first-child')).toContainText('₹')
    
    // Should contain payment method (COD or Online)
    await expect(amountCell.locator('p:nth-child(2)')).toContainText(/COD|Online/)
    
    // Should contain payment status
    await expect(amountCell.locator('p:last-child')).toBeVisible()
  })

  test('should display warehouse information', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check warehouse column (7th column)
    const warehouseCell = page.locator('table tbody tr:first-child td:nth-child(7)')
    
    // Should contain warehouse name
    await expect(warehouseCell).toBeVisible()
    await expect(warehouseCell).not.toBeEmpty()
  })

  test('should display assigned delivery boy or "---"', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check assigned to column (8th column)
    const assignedCell = page.locator('table tbody tr:first-child td:nth-child(8)')
    
    // Should either show delivery boy info or "---"
    const cellContent = await assignedCell.textContent()
    
    if (cellContent?.includes('---')) {
      // Not assigned case
      await expect(assignedCell.locator('span')).toContainText('---')
    } else {
      // Assigned case - should have name and phone
      await expect(assignedCell.locator('p:first-child')).toBeVisible() // Name
      await expect(assignedCell.locator('p:last-child')).toBeVisible() // Phone
    }
  })

  test('should have view action button', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check actions column (9th column)
    const actionsCell = page.locator('table tbody tr:first-child td:nth-child(9)')
    
    // Should contain View button
    const viewButton = actionsCell.locator('button')
    await expect(viewButton).toBeVisible()
    await expect(viewButton).toContainText('View')
    
    // Should have eye icon
    await expect(viewButton.locator('svg')).toBeVisible()
  })

  test('should open map when customer address is clicked', async ({ page, context }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Listen for new page/tab opening
    const pagePromise = context.waitForEvent('page')
    
    // Click on customer address
    const addressButton = page.locator('table tbody tr:first-child td:nth-child(3) button')
    await addressButton.click()
    
    // Wait for new page to open
    const newPage = await pagePromise
    
    // Should open Google Maps
    await expect(newPage.url()).toContain('google.com/maps')
    
    // Close the new page
    await newPage.close()
  })
})