import { test, expect } from '@playwright/test'

test.describe('Enhanced Orders Table UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display enhanced table with proper spacing and formatting', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check table structure
    await expect(page.locator('table')).toHaveClass(/table-fixed/)
    
    // Check header styling
    const headers = page.locator('thead th')
    await expect(headers.first()).toHaveClass(/py-4/)
    await expect(headers.first()).toHaveClass(/px-4/)
    await expect(headers.first()).toHaveClass(/font-semibold/)
    
    // Check row spacing
    const firstRow = page.locator('tbody tr:first-child')
    await expect(firstRow).toHaveClass(/border-b/)
    await expect(firstRow).toHaveClass(/hover:bg-gray-50/)
    
    // Check cell padding
    const firstCell = page.locator('tbody tr:first-child td:first-child')
    await expect(firstCell).toHaveClass(/py-4/)
    await expect(firstCell).toHaveClass(/px-4/)
  })

  test('should display address with proper line breaks and truncation', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check address column (3rd column)
    const addressCell = page.locator('table tbody tr:first-child td:nth-child(3)')
    
    // Should have proper button styling
    const addressButton = addressCell.locator('button')
    await expect(addressButton).toHaveClass(/hover:bg-blue-50/)
    await expect(addressButton).toHaveClass(/p-2/)
    await expect(addressButton).toHaveClass(/rounded/)
    
    // Should have space-y-1 for line spacing
    const addressDiv = addressButton.locator('div')
    await expect(addressDiv).toHaveClass(/space-y-1/)
    
    // Address parts should be properly formatted
    const addressParts = addressDiv.locator('p')
    const count = await addressParts.count()
    
    // Should have at least 1 part, max 4 (including ...)
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(4)
    
    // Each part should have proper styling
    for (let i = 0; i < count; i++) {
      const part = addressParts.nth(i)
      await expect(part).toHaveClass(/text-xs/)
      await expect(part).toHaveClass(/text-blue-600/)
      await expect(part).toHaveClass(/font-medium/)
      await expect(part).toHaveClass(/truncate/)
    }
  })

  test('should display enhanced payment status badges', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check amount column (4th column)
    const amountCell = page.locator('table tbody tr:first-child td:nth-child(4)')
    
    // Should have proper spacing
    const amountDiv = amountCell.locator('div')
    await expect(amountDiv).toHaveClass(/space-y-1/)
    
    // Payment status should be a badge
    const paymentStatus = amountDiv.locator('p:last-child')
    await expect(paymentStatus).toHaveClass(/px-2/)
    await expect(paymentStatus).toHaveClass(/py-1/)
    await expect(paymentStatus).toHaveClass(/rounded-full/)
    
    // Should have appropriate color based on status
    const statusText = await paymentStatus.textContent()
    if (statusText?.toLowerCase().includes('paid')) {
      await expect(paymentStatus).toHaveClass(/bg-green-100/)
      await expect(paymentStatus).toHaveClass(/text-green-700/)
    } else if (statusText?.toLowerCase().includes('pending')) {
      await expect(paymentStatus).toHaveClass(/bg-yellow-100/)
      await expect(paymentStatus).toHaveClass(/text-yellow-700/)
    }
  })

  test('should display enhanced status badges', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check status column (5th column)
    const statusCell = page.locator('table tbody tr:first-child td:nth-child(5)')
    
    // Status badge should have proper styling
    const statusBadge = statusCell.locator('div')
    await expect(statusBadge).toHaveClass(/inline-flex/)
    await expect(statusBadge).toHaveClass(/items-center/)
    await expect(statusBadge).toHaveClass(/space-x-1/)
    await expect(statusBadge).toHaveClass(/px-3/)
    await expect(statusBadge).toHaveClass(/py-1\.5/)
    await expect(statusBadge).toHaveClass(/rounded-full/)
    
    // Should have icon and text
    await expect(statusBadge.locator('svg')).toBeVisible()
    await expect(statusBadge.locator('span')).toBeVisible()
  })

  test('should display enhanced action buttons', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check actions column (9th column)
    const actionsCell = page.locator('table tbody tr:first-child td:nth-child(9)')
    
    // View button should have enhanced styling
    const viewButton = actionsCell.locator('button')
    await expect(viewButton).toHaveClass(/inline-flex/)
    await expect(viewButton).toHaveClass(/items-center/)
    await expect(viewButton).toHaveClass(/px-3/)
    await expect(viewButton).toHaveClass(/py-2/)
    await expect(viewButton).toHaveClass(/bg-purple-600/)
    await expect(viewButton).toHaveClass(/hover:bg-purple-700/)
    await expect(viewButton).toHaveClass(/rounded-lg/)
    await expect(viewButton).toHaveClass(/shadow-sm/)
    
    // Should have icon and text
    await expect(viewButton.locator('svg')).toBeVisible()
    await expect(viewButton).toContainText('View')
  })

  test('should have enhanced filter section', async ({ page }) => {
    // Check filter section
    const filterSection = page.locator('div').filter({ hasText: 'Search by order ID' }).first()
    await expect(filterSection).toBeVisible()
    
    // Should have proper layout
    const filterContainer = filterSection.locator('div').first()
    await expect(filterContainer).toHaveClass(/flex/)
    await expect(filterContainer).toHaveClass(/flex-col/)
    await expect(filterContainer).toHaveClass(/md:flex-row/)
    
    // Search input should be enhanced
    const searchInput = page.locator('input[placeholder*="Search by order ID"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveClass(/pl-10/)
    await expect(searchInput).toHaveClass(/py-3/)
    await expect(searchInput).toHaveClass(/focus:ring-blue-500/)
    
    // Search icon should be present
    const searchIcon = page.locator('svg').first()
    await expect(searchIcon).toBeVisible()
  })

  test('should handle filter functionality correctly', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search by order ID"]')
    await searchInput.fill('ORD')
    
    // Wait for search to process
    await page.waitForTimeout(1000)
    
    // Should show filtered results or no results message
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      // If results found, they should contain the search term
      const firstOrderId = await page.locator('table tbody tr:first-child td:first-child').textContent()
      expect(firstOrderId?.toUpperCase()).toContain('ORD')
    } else {
      // If no results, should show appropriate message
      await expect(page.locator('td').filter({ hasText: 'No orders found' })).toBeVisible()
    }
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(1000)
  })

  test('should display proper column widths and alignment', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Check table has fixed layout
    await expect(page.locator('table')).toHaveClass(/table-fixed/)
    
    // Check specific column widths
    const headers = page.locator('thead th')
    
    // Order ID column
    await expect(headers.nth(0)).toHaveClass(/w-32/)
    
    // Customer column
    await expect(headers.nth(1)).toHaveClass(/w-48/)
    
    // Address column
    await expect(headers.nth(2)).toHaveClass(/w-40/)
    
    // Amount column
    await expect(headers.nth(3)).toHaveClass(/w-32/)
    
    // Status column should be centered
    await expect(headers.nth(4)).toHaveClass(/text-center/)
    
    // Actions column should be centered
    await expect(headers.nth(8)).toHaveClass(/text-center/)
  })

  test('should work on orders page as well', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Should have the same enhanced table structure
    await expect(page.locator('table')).toHaveClass(/table-fixed/)
    
    // Should have proper headers
    await expect(page.locator('th').filter({ hasText: 'Order ID' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Address' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Assigned to' })).toBeVisible()
  })
})