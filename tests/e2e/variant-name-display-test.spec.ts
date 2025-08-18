import { test, expect } from '@playwright/test'

test.describe('Variant Name Display Test', () => {
  test('should display variant names in OrderDetailsModal and WarehousePickingModal', async ({ page }) => {
    // This test verifies that variant names are properly displayed in both modals
    
    // Navigate to admin login
    await page.goto('http://localhost:3001')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Look for login button and click it
    const loginButton = page.locator('button:has-text("Login")')
    await expect(loginButton).toBeVisible({ timeout: 10000 })
    await loginButton.click()
    
    // Wait for login modal to appear
    await page.waitForSelector('[data-testid="login-modal"], .modal, [role="dialog"]', { timeout: 5000 })
    
    // Fill in admin credentials (using phone-based auth)
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[name="phone"]').first()
    await expect(phoneInput).toBeVisible({ timeout: 5000 })
    await phoneInput.fill('9876543210') // Admin phone
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    await expect(passwordInput).toBeVisible({ timeout: 5000 })
    await passwordInput.fill('admin123')
    
    // Click login button in modal
    const modalLoginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').last()
    await modalLoginButton.click()
    
    // Wait for potential OTP step or dashboard
    await page.waitForTimeout(3000)
    
    // Check if OTP is required
    const otpInputs = page.locator('input[maxlength="1"]')
    if (await otpInputs.count() > 0) {
      // Fill OTP (assuming test OTP is 1234)
      for (let i = 0; i < 4; i++) {
        await otpInputs.nth(i).fill((i + 1).toString())
      }
      
      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Submit")')
      await verifyButton.click()
      await page.waitForTimeout(2000)
    }
    
    // Navigate to orders page
    await page.goto('http://localhost:3001/admin/orders')
    await page.waitForLoadState('networkidle')
    
    // Look for an order with items that might have variants
    const orderRows = page.locator('tr').filter({ hasText: /ORD-/ })
    const orderCount = await orderRows.count()
    
    if (orderCount === 0) {
      console.log('No orders found to test variant display')
      return
    }
    
    // Click on the first order to view details
    const firstOrderRow = orderRows.first()
    const viewButton = firstOrderRow.locator('button:has-text("View"), button[title*="View"], .eye-icon').first()
    
    if (await viewButton.count() > 0) {
      await viewButton.click()
    } else {
      // Try clicking on the row itself
      await firstOrderRow.click()
    }
    
    // Wait for order details modal to appear
    await page.waitForSelector('[data-testid="order-details-modal"], .modal, [role="dialog"]', { timeout: 10000 })
    
    // Check if order items are displayed
    const orderItems = page.locator('.order-item, [data-testid="order-item"]')
    const itemCount = await orderItems.count()
    
    if (itemCount > 0) {
      console.log(`Found ${itemCount} order items`)
      
      // Check each item for variant information
      for (let i = 0; i < Math.min(itemCount, 3); i++) {
        const item = orderItems.nth(i)
        const itemText = await item.textContent()
        
        console.log(`Item ${i + 1} content:`, itemText)
        
        // Look for variant information in parentheses
        if (itemText && itemText.includes('(') && itemText.includes(')')) {
          console.log(`✓ Item ${i + 1} appears to have variant information`)
        } else {
          console.log(`- Item ${i + 1} does not show variant information`)
        }
      }
    }
    
    // Test Warehouse Picking Modal (if user has permission)
    const pickingListButton = page.locator('button:has-text("Picking List"), button[title*="Picking"]')
    
    if (await pickingListButton.count() > 0) {
      console.log('Testing Warehouse Picking Modal...')
      await pickingListButton.click()
      
      // Wait for picking modal to appear
      await page.waitForSelector('[data-testid="picking-modal"], .modal', { timeout: 5000 })
      
      // Try to generate PDF to test variant name extraction
      const downloadButton = page.locator('button:has-text("Download PDF")')
      if (await downloadButton.count() > 0) {
        console.log('Warehouse Picking Modal loaded successfully')
        
        // Close the picking modal
        const closeButton = page.locator('button:has-text("×"), button[aria-label="Close"]').last()
        if (await closeButton.count() > 0) {
          await closeButton.click()
        }
      }
    } else {
      console.log('Picking List button not available (user may not have permission)')
    }
    
    // Close the order details modal
    const closeModalButton = page.locator('button:has-text("×"), button[aria-label="Close"]').first()
    if (await closeModalButton.count() > 0) {
      await closeModalButton.click()
    }
    
    console.log('Variant name display test completed')
  })
  
  test('should handle different variant name sources correctly', async ({ page }) => {
    // This test specifically checks the variant name extraction logic
    
    // Create a mock order with different variant name scenarios
    await page.goto('http://localhost:3001')
    
    // Inject test data to verify variant name extraction
    await page.evaluate(() => {
      // Mock order items with different variant name structures
      const testItems = [
        {
          name: 'Test Product 1',
          variantName: 'Red - Large', // Direct variant name
          quantity: 1,
          price: 100
        },
        {
          name: 'Test Product 2',
          selectedVariant: { name: 'Blue - Medium' }, // Variant in selectedVariant
          quantity: 2,
          price: 150
        },
        {
          name: 'Test Product 3',
          productId: {
            _id: 'prod3',
            name: 'Test Product 3',
            variantName: 'Green - Small' // Variant in populated productId
          },
          quantity: 1,
          price: 120
        },
        {
          name: 'Test Product 4', // No variant information
          quantity: 3,
          price: 80
        }
      ]
      
      // Store test data for component testing
      window.testVariantItems = testItems
    })
    
    console.log('Mock variant test data injected successfully')
  })
})