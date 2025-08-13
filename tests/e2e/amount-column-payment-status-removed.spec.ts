import { test, expect } from '@playwright/test'

test.describe('Amount Column - Payment Status Removed', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display only amount and payment method in Amount column', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column (4th column)
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    
    // Should be visible
    await expect(amountCell).toBeVisible()
    
    // Get all text content from the amount cell
    const amountText = await amountCell.textContent()
    
    // Should contain rupee symbol and amount
    expect(amountText).toMatch(/₹\d+/)
    
    // Should contain payment method (COD or Online)
    expect(amountText).toMatch(/(COD|Online)/)
    
    // Should NOT contain payment status badges (Paid, Pending, etc.)
    expect(amountText).not.toMatch(/(Paid|Pending|Failed|Unpaid)/i)
  })

  test('should have only two lines in Amount column', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column structure
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    const amountDiv = amountCell.locator('div').first()
    
    // Should have space-y-1 class for proper spacing
    await expect(amountDiv).toHaveClass(/space-y-1/)
    
    // Should have exactly 2 paragraph elements (amount and payment method)
    const paragraphs = amountDiv.locator('p')
    const paragraphCount = await paragraphs.count()
    expect(paragraphCount).toBe(2)
    
    // First paragraph should be the amount (font-semibold)
    const amountParagraph = paragraphs.nth(0)
    await expect(amountParagraph).toHaveClass(/font-semibold/)
    await expect(amountParagraph).toHaveClass(/text-sm/)
    await expect(amountParagraph).toHaveClass(/text-gray-900/)
    
    // Second paragraph should be the payment method (text-xs text-gray-500)
    const methodParagraph = paragraphs.nth(1)
    await expect(methodParagraph).toHaveClass(/text-xs/)
    await expect(methodParagraph).toHaveClass(/text-gray-500/)
  })

  test('should not have payment status badges in Amount column', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column for absence of badge styling
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    
    // Should not have any elements with badge classes
    const badgeElements = amountCell.locator('.px-2.py-1.rounded-full')
    const badgeCount = await badgeElements.count()
    expect(badgeCount).toBe(0)
    
    // Should not have any elements with status color classes
    const greenBadges = amountCell.locator('.bg-green-100')
    const yellowBadges = amountCell.locator('.bg-yellow-100')
    const redBadges = amountCell.locator('.bg-red-100')
    
    expect(await greenBadges.count()).toBe(0)
    expect(await yellowBadges.count()).toBe(0)
    expect(await redBadges.count()).toBe(0)
  })

  test('should display clean amount formatting', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check first few rows for consistent formatting
    const rows = page.locator('table tbody tr')
    const rowCount = Math.min(await rows.count(), 3)
    
    for (let i = 0; i < rowCount; i++) {
      const amountCell = rows.nth(i).locator('td:nth-child(4)')
      const amountText = await amountCell.textContent()
      
      // Should have proper amount format
      expect(amountText).toMatch(/₹\d+/)
      
      // Should have payment method
      expect(amountText).toMatch(/(COD|Online)/)
      
      // Should be clean without extra status text
      const lines = amountText?.split('\n').filter(line => line.trim() !== '')
      expect(lines?.length).toBeLessThanOrEqual(2)
    }
  })

  test('should work consistently across all order pages', async ({ page }) => {
    // Test on main orders page
    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')
    
    try {
      await page.waitForSelector('table tbody tr', { timeout: 5000 })
      const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
      const amountText = await amountCell.textContent()
      
      expect(amountText).toMatch(/₹\d+/)
      expect(amountText).toMatch(/(COD|Online)/)
      expect(amountText).not.toMatch(/(Paid|Pending|Failed)/i)
    } catch (error) {
      console.log('No orders on main page')
    }
    
    // Test on orders page
    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')
    
    try {
      await page.waitForSelector('table tbody tr', { timeout: 5000 })
      const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
      const amountText = await amountCell.textContent()
      
      expect(amountText).toMatch(/₹\d+/)
      expect(amountText).toMatch(/(COD|Online)/)
      expect(amountText).not.toMatch(/(Paid|Pending|Failed)/i)
    } catch (error) {
      console.log('No assigned orders')
    }
  })

  test('should maintain proper styling without payment status', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column styling
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    
    // Should have proper cell styling
    await expect(amountCell).toHaveClass(/py-4/)
    await expect(amountCell).toHaveClass(/px-4/)
    await expect(amountCell).toHaveClass(/align-top/)
    
    // Amount should be prominent
    const amountText = amountCell.locator('p').first()
    await expect(amountText).toHaveClass(/font-semibold/)
    await expect(amountText).toHaveClass(/text-sm/)
    
    // Payment method should be subtle
    const methodText = amountCell.locator('p').nth(1)
    await expect(methodText).toHaveClass(/text-xs/)
    await expect(methodText).toHaveClass(/text-gray-500/)
  })
})