import { test, expect } from '@playwright/test'

test.describe('Warehouse Filter Fix', () => {
  test('should show all orders for selected warehouse regardless of status', async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('http://localhost:3001/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'warehouse-filter-before.png', fullPage: true })
    
    // Get the total orders count without any filters
    const totalOrdersElement = await page.locator('text=/Total.*orders/i').first()
    const totalOrdersText = await totalOrdersElement.textContent()
    console.log('Total orders without filter:', totalOrdersText)
    
    // Find and click on warehouse filter dropdown
    const warehouseFilter = page.locator('select').filter({ hasText: /warehouse/i }).or(
      page.locator('select[name*="warehouse"]')
    ).or(
      page.locator('select').nth(1) // Assuming warehouse filter is the second select
    )
    
    // Wait for warehouse options to load
    await page.waitForTimeout(2000)
    
    // Get all warehouse options
    const warehouseOptions = await warehouseFilter.locator('option').allTextContents()
    console.log('Available warehouse options:', warehouseOptions)
    
    // Select the first non-"all" warehouse option
    const warehouseToSelect = warehouseOptions.find(option => 
      option !== 'All Warehouses' && option !== 'all' && option.trim() !== ''
    )
    
    if (warehouseToSelect) {
      console.log('Selecting warehouse:', warehouseToSelect)
      await warehouseFilter.selectOption({ label: warehouseToSelect })
      
      // Wait for the filter to be applied
      await page.waitForTimeout(3000)
      await page.waitForLoadState('networkidle')
      
      // Take a screenshot after applying warehouse filter
      await page.screenshot({ path: 'warehouse-filter-after.png', fullPage: true })
      
      // Get the filtered orders count
      const filteredOrdersElement = await page.locator('text=/Total.*orders/i').first()
      const filteredOrdersText = await filteredOrdersElement.textContent()
      console.log('Total orders with warehouse filter:', filteredOrdersText)
      
      // Verify that orders are shown (should not be 0 unless the warehouse truly has no orders)
      const ordersTable = page.locator('table tbody tr')
      const orderCount = await ordersTable.count()
      console.log('Number of orders displayed in table:', orderCount)
      
      // Check if all displayed orders belong to the selected warehouse
      if (orderCount > 0) {
        // Get warehouse info from the first few orders
        for (let i = 0; i < Math.min(3, orderCount); i++) {
          const orderRow = ordersTable.nth(i)
          const warehouseCell = orderRow.locator('td').filter({ hasText: /warehouse/i }).or(
            orderRow.locator('td').nth(-2) // Assuming warehouse is second to last column
          )
          
          if (await warehouseCell.count() > 0) {
            const warehouseText = await warehouseCell.textContent()
            console.log(`Order ${i + 1} warehouse:`, warehouseText)
            
            // Verify the warehouse matches the selected filter
            expect(warehouseText).toContain(warehouseToSelect)
          }
        }
      }
      
      // Now test that status filter works correctly with warehouse filter
      console.log('Testing status filter with warehouse filter...')
      
      // Apply a status filter (e.g., "new")
      const statusFilter = page.locator('select').filter({ hasText: /status/i }).or(
        page.locator('select[name*="status"]')
      ).or(
        page.locator('select').first() // Assuming status filter is the first select
      )
      
      await statusFilter.selectOption({ label: 'New' })
      await page.waitForTimeout(2000)
      await page.waitForLoadState('networkidle')
      
      // Take a screenshot after applying both filters
      await page.screenshot({ path: 'warehouse-and-status-filter.png', fullPage: true })
      
      // Get the count with both filters
      const bothFiltersOrdersElement = await page.locator('text=/Total.*orders/i').first()
      const bothFiltersOrdersText = await bothFiltersOrdersElement.textContent()
      console.log('Total orders with both warehouse and status filter:', bothFiltersOrdersText)
      
      // Verify that the filtered count is less than or equal to warehouse-only count
      const warehouseOnlyCount = parseInt(filteredOrdersText?.match(/\d+/)?.[0] || '0')
      const bothFiltersCount = parseInt(bothFiltersOrdersText?.match(/\d+/)?.[0] || '0')
      
      console.log('Warehouse only count:', warehouseOnlyCount)
      console.log('Both filters count:', bothFiltersCount)
      
      expect(bothFiltersCount).toBeLessThanOrEqual(warehouseOnlyCount)
      
      // Reset filters to test the fix
      console.log('Resetting filters to test the fix...')
      await statusFilter.selectOption({ label: 'All Statuses' })
      await page.waitForTimeout(2000)
      await page.waitForLoadState('networkidle')
      
      // The count should return to the warehouse-only count
      const resetOrdersElement = await page.locator('text=/Total.*orders/i').first()
      const resetOrdersText = await resetOrdersElement.textContent()
      const resetCount = parseInt(resetOrdersText?.match(/\d+/)?.[0] || '0')
      
      console.log('Count after resetting status filter:', resetCount)
      
      // This should match the warehouse-only count (this is the main fix)
      expect(resetCount).toBe(warehouseOnlyCount)
      
    } else {
      console.log('No warehouse options available for testing')
    }
  })
  
  test('should show correct stats when warehouse filter is applied', async ({ page }) => {
    // Navigate to admin orders page
    await page.goto('http://localhost:3001/admin/orders')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if stats cards are visible
    const statsCards = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /new|processing|shipped|delivered/i })
    const statsCount = await statsCards.count()
    
    if (statsCount > 0) {
      console.log('Stats cards found:', statsCount)
      
      // Get initial stats
      const initialStats: Record<string, number> = {}
      for (let i = 0; i < statsCount; i++) {
        const card = statsCards.nth(i)
        const text = await card.textContent()
        const match = text?.match(/(\w+).*?(\d+)/)
        if (match) {
          initialStats[match[1].toLowerCase()] = parseInt(match[2])
        }
      }
      console.log('Initial stats:', initialStats)
      
      // Apply warehouse filter
      const warehouseFilter = page.locator('select').filter({ hasText: /warehouse/i }).or(
        page.locator('select[name*="warehouse"]')
      ).or(
        page.locator('select').nth(1)
      )
      
      await page.waitForTimeout(2000)
      const warehouseOptions = await warehouseFilter.locator('option').allTextContents()
      const warehouseToSelect = warehouseOptions.find(option => 
        option !== 'All Warehouses' && option !== 'all' && option.trim() !== ''
      )
      
      if (warehouseToSelect) {
        await warehouseFilter.selectOption({ label: warehouseToSelect })
        await page.waitForTimeout(3000)
        await page.waitForLoadState('networkidle')
        
        // Get filtered stats
        const filteredStats: Record<string, number> = {}
        for (let i = 0; i < statsCount; i++) {
          const card = statsCards.nth(i)
          const text = await card.textContent()
          const match = text?.match(/(\w+).*?(\d+)/)
          if (match) {
            filteredStats[match[1].toLowerCase()] = parseInt(match[2])
          }
        }
        console.log('Filtered stats:', filteredStats)
        
        // Verify that filtered stats are less than or equal to initial stats
        for (const [status, count] of Object.entries(filteredStats)) {
          if (initialStats[status] !== undefined) {
            expect(count).toBeLessThanOrEqual(initialStats[status])
          }
        }
        
        console.log('Stats filtering test passed!')
      }
    } else {
      console.log('No stats cards found on the page')
    }
  })
})