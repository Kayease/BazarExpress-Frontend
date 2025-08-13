import { test, expect } from '@playwright/test'

test.describe('Delivery Boy Performance Chart Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3001/admin')
  })

  test('Delivery boy dashboard shows corrected performance metrics', async ({ page }) => {
    // This test documents the expected behavior after the fix
    // Note: This would require actual authentication with delivery boy credentials
    
    // Mock the dashboard API response to test the UI
    await page.route('**/api/dashboard', async (route) => {
      await route.fulfill({
        json: {
          role: 'delivery_boy',
          cards: {
            assignedOrders: 15, // Total including cancelled/refunded
            assignedOrdersExcludingCancelledRefunded: 12, // Performance metric
            shippedOrders: 3,
            deliveredOrders: 8,
            deliveredToday: 2,
            todayAssignedOrders: 5, // Total today including cancelled/refunded
            todayAssignedOrdersExcludingCancelledRefunded: 4, // Performance metric
            pendingDeliveries: 3,
            // New cancelled/refunded after delivery stats
            cancelledAfterDelivery: 2,
            refundedAfterDelivery: 1,
            todayCancelledAfterDelivery: 1,
            todayRefundedAfterDelivery: 0,
            // Still provided for other UI bits
            todayCancelledOrders: 1,
            todayRefundedOrders: 0,
          },
          assignedWarehouses: [],
          todayDeliveries: []
        }
      })
    })

    // Wait for page to load and API call to complete
    await page.waitForLoadState('networkidle')

    // Verify main stats are displayed
    await expect(page.getByText('Total Assigned')).toBeVisible()
    await expect(page.getByText('15')).toBeVisible() // Total assigned orders

    // Verify new cancelled/refunded after delivery stats are shown
    await expect(page.getByText('Cancelled After Delivery')).toBeVisible()
    await expect(page.getByText('2')).toBeVisible() // Cancelled after delivery
    await expect(page.getByText('Refunded After Delivery')).toBeVisible()
    await expect(page.getByText('1')).toBeVisible() // Refunded after delivery
    await expect(page.getByText('Today Cancelled After Delivery')).toBeVisible()
    await expect(page.getByText('Today Refunded After Delivery')).toBeVisible()

    // Verify performance chart uses corrected metrics
    await expect(page.getByText('Delivery Performance Chart')).toBeVisible()
    await expect(page.getByText('Today\'s Valid Orders')).toBeVisible()
    await expect(page.getByText('4')).toBeVisible() // Should show 4, not 5 (excludes cancelled)
    
    // Verify progress calculation is correct
    await expect(page.getByText('Delivery Progress (Valid Orders Only)')).toBeVisible()
    await expect(page.getByText('2 / 4')).toBeVisible() // 2 delivered out of 4 valid orders
    
    // The progress bar should show 50% (2/4), not 40% (2/5)
    const progressBar = page.locator('.bg-gradient-to-r.from-green-400.to-green-600')
    await expect(progressBar).toHaveAttribute('style', expect.stringContaining('width: 50%'))

    // Verify cancelled/refunded after delivery info is shown when applicable
    await expect(page.getByText('Today\'s Cancelled/Refunded (After Delivery)')).toBeVisible()
    await expect(page.getByText('1 cancelled, 0 refunded')).toBeVisible()

    console.log('✅ Delivery boy performance chart correctly excludes cancelled/refunded orders')
    console.log('✅ New cancelled/refunded stats are displayed properly')
    console.log('✅ Progress calculation uses valid orders only (excluding cancelled/refunded)')
  })

  test('Performance chart handles edge cases correctly', async ({ page }) => {
    // Test case where all orders are cancelled/refunded
    await page.route('**/api/dashboard', async (route) => {
      await route.fulfill({
        json: {
          role: 'delivery_boy',
          cards: {
            assignedOrders: 5,
            assignedOrdersExcludingCancelledRefunded: 0, // All cancelled/refunded
            shippedOrders: 0,
            deliveredOrders: 0,
            deliveredToday: 0,
            todayAssignedOrders: 3,
            todayAssignedOrdersExcludingCancelledRefunded: 0, // All cancelled/refunded today
            cancelledAfterDelivery: 3,
            refundedAfterDelivery: 2,
            todayCancelledAfterDelivery: 2,
            todayRefundedAfterDelivery: 1,
            todayCancelledOrders: 2,
            todayRefundedOrders: 1,
          },
          assignedWarehouses: [],
          todayDeliveries: []
        }
      })
    })

    await page.waitForLoadState('networkidle')

    // Should show 0% completion instead of throwing error
    await expect(page.getByText('0% completion')).toBeVisible()
    await expect(page.getByText('0 / 0')).toBeVisible()

    // Progress bar should be at 0%
    const progressBar = page.locator('.bg-gradient-to-r.from-green-400.to-green-600')
    await expect(progressBar).toHaveAttribute('style', expect.stringContaining('width: 0%'))

    console.log('✅ Edge case handled correctly: all orders cancelled/refunded')
  })

  test('Performance chart shows difference between total and valid orders', async ({ page }) => {
    await page.route('**/api/dashboard', async (route) => {
      await route.fulfill({
        json: {
          role: 'delivery_boy',
          cards: {
            assignedOrders: 10,
            assignedOrdersExcludingCancelledRefunded: 7,
            todayAssignedOrders: 6,
            todayAssignedOrdersExcludingCancelledRefunded: 4,
            deliveredToday: 1,
            todayCancelledOrders: 1,
            todayRefundedOrders: 1,
            // ... other fields
          },
          assignedWarehouses: [],
          todayDeliveries: []
        }
      })
    })

    await page.waitForLoadState('networkidle')

    // Should show the difference between total assigned and valid orders
    await expect(page.getByText('Total assigned today: 6 (2 cancelled/refunded)')).toBeVisible()
    
    console.log('✅ Shows clear distinction between total assigned and valid orders')
  })
})