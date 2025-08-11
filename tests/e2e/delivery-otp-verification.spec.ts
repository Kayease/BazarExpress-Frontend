import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { OrderPage } from './utils/page-objects';

test.describe('Delivery OTP Verification', () => {
  let authHelper: AuthHelper;
  let orderPage: OrderPage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    orderPage = new OrderPage(page);
  });

  test.afterEach(async () => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Admin Role - OTP Delivery Workflow', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('admin');
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();
    });

    test('should trigger OTP generation when changing status to delivered', async () => {
      // Wait for orders to load
      await expect(orderPage.orderList).toBeVisible();
      
      // Find an order that can be changed to delivered (preferably shipped status)
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const orderCount = await orderRows.count();

      if (orderCount === 0) {
        test.skip('No orders available for testing');
        return;
      }

      let testOrderId: string | null = null;
      let orderFound = false;

      // Look for an order that's not already delivered
      for (let i = 0; i < orderCount; i++) {
        const orderRow = orderRows.nth(i);
        const orderId = await orderRow.getAttribute('data-order-id');
        const statusElement = orderRow.locator('[data-testid^="order-status-"]');
        
        if (orderId && await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          
          // Skip if already delivered
          if (!statusText?.toLowerCase().includes('delivered')) {
            testOrderId = orderId;
            orderFound = true;
            break;
          }
        }
      }

      if (!orderFound || !testOrderId) {
        test.skip('No suitable orders found for testing (all may be delivered already)');
        return;
      }

      // Click on the order to open details modal
      const targetOrderRow = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
      const viewButton = targetOrderRow.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        // Try clicking on the order row itself
        await targetOrderRow.click();
      }

      // Wait for order details modal to open
      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      // Look for status update dropdown/select
      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      await expect(statusSelect).toBeVisible();

      // Change status to delivered
      await statusSelect.selectOption({ value: 'delivered' });

      // Click update status button
      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      // Should trigger OTP generation instead of direct status update
      // Look for OTP input modal
      await expect(authHelper.page.locator('text="Delivery OTP" i, text="Enter OTP" i, text="Verify delivery" i')).toBeVisible({ timeout: 15000 });
      
      // Should see 4 OTP input fields
      const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
      await expect(otpInputs).toHaveCount(4);

      // Should see success message for OTP generation
      await expect(authHelper.page.locator('text="Delivery OTP generated successfully" i, text="OTP generated" i')).toBeVisible({ timeout: 10000 });
    });

    test('should complete delivery verification with valid OTP', async () => {
      // Set up console logging to capture OTP
      let capturedOtp: string | null = null;
      
      authHelper.page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Delivery OTP:')) {
          const match = text.match(/Delivery OTP:\s*(\d{4})/);
          if (match) {
            capturedOtp = match[1];
          }
        }
      });

      // Wait for orders to load
      await expect(orderPage.orderList).toBeVisible();
      
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const orderCount = await orderRows.count();

      if (orderCount === 0) {
        test.skip('No orders available for testing');
        return;
      }

      let testOrderId: string | null = null;
      let orderFound = false;

      // Find a non-delivered order
      for (let i = 0; i < orderCount; i++) {
        const orderRow = orderRows.nth(i);
        const orderId = await orderRow.getAttribute('data-order-id');
        const statusElement = orderRow.locator('[data-testid^="order-status-"]');
        
        if (orderId && await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          
          if (!statusText?.toLowerCase().includes('delivered')) {
            testOrderId = orderId;
            orderFound = true;
            break;
          }
        }
      }

      if (!orderFound || !testOrderId) {
        test.skip('No suitable orders found for testing');
        return;
      }

      // Open order details
      const targetOrderRow = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
      const viewButton = targetOrderRow.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await targetOrderRow.click();
      }

      // Wait for modal
      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      // Change status to delivered to trigger OTP
      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      await statusSelect.selectOption({ value: 'delivered' });

      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      // Wait for OTP modal
      await expect(authHelper.page.locator('text="Delivery OTP" i, text="Enter OTP" i')).toBeVisible({ timeout: 15000 });

      // Wait a bit for OTP to be generated and logged
      await authHelper.page.waitForTimeout(2000);

      if (capturedOtp) {
        // Enter the captured OTP
        const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
        
        for (let i = 0; i < 4; i++) {
          await otpInputs.nth(i).fill(capturedOtp[i]);
        }

        // Submit OTP
        const verifyButton = authHelper.page.locator('button:has-text("Verify"), button:has-text("Submit"), [data-testid*="verify"]').first();
        await verifyButton.click();

        // Should see success message
        await expect(authHelper.page.locator('text="Order status updated to delivered successfully" i, text="Order delivered" i')).toBeVisible({ timeout: 10000 });

        // Order status should be updated to delivered
        await authHelper.page.reload();
        await authHelper.waitForPageLoad();
        
        // Check that order now shows as delivered in the list
        const deliveredOrder = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
        const statusInList = deliveredOrder.locator('[data-testid^="order-status-"]');
        await expect(statusInList).toContainText('delivered', { timeout: 10000 });

      } else {
        test.skip('Could not capture OTP from console for testing');
      }
    });

    test('should handle invalid OTP correctly', async () => {
      // Wait for orders to load
      await expect(orderPage.orderList).toBeVisible();
      
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const orderCount = await orderRows.count();

      if (orderCount === 0) {
        test.skip('No orders available for testing');
        return;
      }

      let testOrderId: string | null = null;

      // Find any non-delivered order
      for (let i = 0; i < orderCount; i++) {
        const orderRow = orderRows.nth(i);
        const orderId = await orderRow.getAttribute('data-order-id');
        const statusElement = orderRow.locator('[data-testid^="order-status-"]');
        
        if (orderId && await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          
          if (!statusText?.toLowerCase().includes('delivered')) {
            testOrderId = orderId;
            break;
          }
        }
      }

      if (!testOrderId) {
        test.skip('No suitable orders found for testing');
        return;
      }

      // Open order and trigger OTP flow
      const targetOrderRow = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
      const viewButton = targetOrderRow.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await targetOrderRow.click();
      }

      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      await statusSelect.selectOption({ value: 'delivered' });

      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      // Wait for OTP modal
      await expect(authHelper.page.locator('text="Delivery OTP" i, text="Enter OTP" i')).toBeVisible({ timeout: 15000 });

      // Enter invalid OTP (1234)
      const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
      const invalidOtp = '1234';
      
      for (let i = 0; i < 4; i++) {
        await otpInputs.nth(i).fill(invalidOtp[i]);
      }

      // Submit invalid OTP
      const verifyButton = authHelper.page.locator('button:has-text("Verify"), button:has-text("Submit"), [data-testid*="verify"]').first();
      await verifyButton.click();

      // Should see error message
      await expect(authHelper.page.locator('text="Invalid OTP" i, text="Failed to verify" i, text="OTP verification failed" i')).toBeVisible({ timeout: 10000 });

      // Order status should NOT be updated
      await authHelper.page.reload();
      await authHelper.waitForPageLoad();
      
      const orderAfterFailure = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
      const statusAfterFailure = orderAfterFailure.locator('[data-testid^="order-status-"]');
      
      // Should NOT show delivered status
      const statusText = await statusAfterFailure.textContent();
      expect(statusText?.toLowerCase()).not.toContain('delivered');
    });

    test('should validate OTP input requirements', async () => {
      await expect(orderPage.orderList).toBeVisible();
      
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const orderCount = await orderRows.count();

      if (orderCount === 0) {
        test.skip('No orders available for testing');
        return;
      }

      let testOrderId: string | null = null;

      for (let i = 0; i < orderCount; i++) {
        const orderRow = orderRows.nth(i);
        const orderId = await orderRow.getAttribute('data-order-id');
        const statusElement = orderRow.locator('[data-testid^="order-status-"]');
        
        if (orderId && await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          
          if (!statusText?.toLowerCase().includes('delivered')) {
            testOrderId = orderId;
            break;
          }
        }
      }

      if (!testOrderId) {
        test.skip('No suitable orders found for testing');
        return;
      }

      // Trigger OTP flow
      const targetOrderRow = authHelper.page.locator(`[data-testid="order-row"][data-order-id="${testOrderId}"]`);
      const viewButton = targetOrderRow.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await targetOrderRow.click();
      }

      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      await statusSelect.selectOption({ value: 'delivered' });

      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      await expect(authHelper.page.locator('text="Delivery OTP" i, text="Enter OTP" i')).toBeVisible({ timeout: 15000 });

      // Test incomplete OTP (only 3 digits)
      const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
      
      // Fill only first 3 digits
      await otpInputs.nth(0).fill('1');
      await otpInputs.nth(1).fill('2');
      await otpInputs.nth(2).fill('3');

      const verifyButton = authHelper.page.locator('button:has-text("Verify"), button:has-text("Submit"), [data-testid*="verify"]').first();
      await verifyButton.click();

      // Should see validation error for incomplete OTP
      await expect(authHelper.page.locator('text="Please enter complete 4-digit OTP" i, text="OTP required" i')).toBeVisible({ timeout: 5000 });
    });

    test('should handle OTP auto-focus behavior', async () => {
      await expect(orderPage.orderList).toBeVisible();
      
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      if (await orderRows.count() === 0) {
        test.skip('No orders available');
        return;
      }

      // Get first non-delivered order
      const firstOrder = orderRows.first();
      const viewButton = firstOrder.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await firstOrder.click();
      }

      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      await statusSelect.selectOption({ value: 'delivered' });

      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      await expect(authHelper.page.locator('text="Delivery OTP" i')).toBeVisible({ timeout: 15000 });

      // Test auto-focus behavior
      const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
      
      // Type in first input, should auto-focus to second
      await otpInputs.nth(0).fill('1');
      
      // Check that second input is now focused
      const secondInput = otpInputs.nth(1);
      await expect(secondInput).toBeFocused({ timeout: 2000 });

      // Continue with remaining inputs
      await secondInput.fill('2');
      
      const thirdInput = otpInputs.nth(2);
      await expect(thirdInput).toBeFocused({ timeout: 2000 });

      // Test backspace behavior
      await thirdInput.press('Backspace');
      
      // Should focus back to second input on backspace
      await expect(secondInput).toBeFocused({ timeout: 2000 });
    });
  });

  test.describe('Warehouse Manager Role - OTP Delivery', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('warehouseManager');
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();
    });

    test('warehouse manager can use OTP delivery workflow', async () => {
      // Warehouse managers should also be able to use OTP delivery
      await expect(orderPage.orderList).toBeVisible();
      
      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      if (await orderRows.count() === 0) {
        test.skip('No orders available');
        return;
      }

      // Try to find an order from assigned warehouse
      let suitableOrder: any = null;
      const orderCount = await orderRows.count();

      for (let i = 0; i < Math.min(orderCount, 5); i++) {
        const orderRow = orderRows.nth(i);
        const orderId = await orderRow.getAttribute('data-order-id');
        const statusElement = orderRow.locator('[data-testid^="order-status-"]');
        
        if (orderId && await statusElement.isVisible()) {
          const statusText = await statusElement.textContent();
          
          if (!statusText?.toLowerCase().includes('delivered')) {
            suitableOrder = { row: orderRow, id: orderId };
            break;
          }
        }
      }

      if (!suitableOrder) {
        test.skip('No suitable orders found');
        return;
      }

      // Open order details
      const viewButton = suitableOrder.row.locator('[data-testid^="view-order"], button:has-text("View"), [title*="view" i]').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await suitableOrder.row.click();
      }

      await expect(authHelper.page.locator('[data-testid="order-details-modal"], [role="dialog"]')).toBeVisible({ timeout: 10000 });

      // Try to change status to delivered
      const statusSelect = authHelper.page.locator('select:near(text="Status" i), [data-testid*="status"], select').first();
      
      // Should be able to see and interact with status select
      await expect(statusSelect).toBeVisible();
      await statusSelect.selectOption({ value: 'delivered' });

      const updateButton = authHelper.page.locator('button:has-text("Update"), [data-testid*="update"], button:has-text("Save")').first();
      await updateButton.click();

      // Should trigger OTP flow for warehouse managers too
      await expect(authHelper.page.locator('text="Delivery OTP" i, text="Enter OTP" i')).toBeVisible({ timeout: 15000 });
      
      // Should see OTP inputs
      const otpInputs = authHelper.page.locator('input[maxlength="1"], input[type="text"][id*="otp"]');
      await expect(otpInputs).toHaveCount(4);
    });
  });

  test.describe('Unauthorized Roles - OTP Access', () => {
    const restrictedRoles = ['supportExecutive', 'inventoryManager', 'marketingManager', 'financeAnalyst'];

    for (const role of restrictedRoles) {
      test(`${role} should not be able to change order status to delivered`, async () => {
        await authHelper.loginAs(role as any);
        await authHelper.page.goto('/admin/orders');
        await authHelper.waitForPageLoad();

        // Most roles shouldn't even see orders page or have limited access
        if (role === 'supportExecutive') {
          // Support executive can view orders but not change status
          await expect(orderPage.orderList).toBeVisible();
          
          const orderRows = authHelper.page.locator('[data-testid="order-row"]');
          if (await orderRows.count() > 0) {
            const firstOrder = orderRows.first();
            const viewButton = firstOrder.locator('[data-testid^="view-order"], button:has-text("View")').first();
            
            if (await viewButton.isVisible()) {
              await viewButton.click();
              
              // Should not see editable status dropdown
              const statusSelect = authHelper.page.locator('select:near(text="Status" i)');
              await expect(statusSelect).not.toBeVisible();
            }
          }
        } else {
          // Other roles should be redirected or see unauthorized
          await authHelper.expectUnauthorized();
        }
      });
    }
  });
});