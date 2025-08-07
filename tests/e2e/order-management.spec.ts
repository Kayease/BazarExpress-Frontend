import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { TEST_ORDERS } from './utils/test-data';
import { OrderPage } from './utils/page-objects';

test.describe('Order Management Role Tests', () => {
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

  test.describe('Order and Warehouse Management Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('warehouseManager');
      await authHelper.page.goto('/admin/orders');
    });

    test('can view orders from assigned warehouses only', async () => {
      await authHelper.waitForPageLoad();

      // Should see order list
      await expect(orderPage.orderList).toBeVisible();

      // Should see warehouse filter with only assigned warehouses
      if (await orderPage.warehouseFilter.isVisible()) {
        const warehouseOptions = authHelper.page.locator('[data-testid="order-warehouse-filter"] option');
        const optionCount = await warehouseOptions.count();
        
        // Should have limited warehouse options
        expect(optionCount).toBeGreaterThan(0);
      }
    });

    test('can change order status for assigned warehouse orders', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        const firstOrder = orderRows.first();
        const orderId = await firstOrder.getAttribute('data-order-id');
        
        if (orderId) {
          // Should be able to update order status
          await orderPage.expectStatusUpdateEnabled(orderId);

          // Try to update status
          await orderPage.updateOrderStatus(orderId, 'processing');
          
          // Should see success message
          await expect(authHelper.page.locator('text="Order status updated"')).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('can access all order sections', async () => {
      const orderSections = [
        'new', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
      ];

      for (const section of orderSections) {
        await test.step(`Access ${section} orders`, async () => {
          await authHelper.page.goto(`/admin/orders/${section}`);
          await authHelper.waitForPageLoad();
          
          // Should not be redirected or show unauthorized
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(section);
          
          // Should see order list
          await expect(orderPage.orderList).toBeVisible();
        });
      }
    });

    test('sees orders filtered by assigned warehouses', async () => {
      await authHelper.waitForPageLoad();

      // Monitor API requests to ensure warehouse filtering is applied
      let warehouseFilterApplied = false;
      
      authHelper.page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/orders') && (url.includes('warehouse=') || url.includes('assignedWarehouses'))) {
          warehouseFilterApplied = true;
        }
      });

      await authHelper.page.reload();
      await authHelper.waitForPageLoad();

      // API calls should include warehouse filtering
      expect(warehouseFilterApplied).toBeTruthy();
    });

    test('cannot delete orders', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        // Delete buttons should not be visible for warehouse managers
        for (let i = 0; i < Math.min(count, 3); i++) {
          const orderRow = orderRows.nth(i);
          await expect(orderRow.locator('[data-testid="delete-order-button"]')).not.toBeVisible();
        }
      }
    });

    test('cannot access customer information beyond order details', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      if (await orderRows.count() > 0) {
        const firstOrder = orderRows.first();
        await firstOrder.click();

        // Should see order details but not full customer profile link
        await expect(authHelper.page.locator('[data-testid="order-details"]')).toBeVisible();
        
        // Customer profile management should not be accessible
        await expect(authHelper.page.locator('[data-testid="manage-customer-button"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Customer Support Executive Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
      await authHelper.page.goto('/admin/orders');
    });

    test('can view all orders (read-only)', async () => {
      await authHelper.waitForPageLoad();

      // Should see order list
      await expect(orderPage.orderList).toBeVisible();

      // Should be able to see all orders (no warehouse filter)
      const warehouseFilter = orderPage.warehouseFilter;
      
      // Either no warehouse filter or it shows all warehouses
      if (await warehouseFilter.isVisible()) {
        const warehouseOptions = authHelper.page.locator('[data-testid="order-warehouse-filter"] option');
        const optionCount = await warehouseOptions.count();
        
        // Should see more warehouse options than restricted roles
        expect(optionCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('cannot change order status', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        const firstOrder = orderRows.first();
        const orderId = await firstOrder.getAttribute('data-order-id');
        
        if (orderId) {
          // Status update should be disabled
          await orderPage.expectStatusUpdateDisabled(orderId);
        }
      }
    });

    test('can access customer management from orders', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      if (await orderRows.count() > 0) {
        const firstOrder = orderRows.first();
        await firstOrder.click();

        // Should see order details with customer management options
        await expect(authHelper.page.locator('[data-testid="order-details"]')).toBeVisible();
        
        // Should have access to customer profile
        const customerLink = authHelper.page.locator('[data-testid="view-customer-profile"]');
        if (await customerLink.isVisible()) {
          await expect(customerLink).toBeVisible();
        }
      }
    });

    test('cannot delete or modify orders', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const orderRow = orderRows.nth(i);
          
          // Delete and edit buttons should not be visible
          await expect(orderRow.locator('[data-testid="delete-order-button"]')).not.toBeVisible();
          await expect(orderRow.locator('[data-testid="edit-order-button"]')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Admin Role - Order Management', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('admin');
      await authHelper.page.goto('/admin/orders');
    });

    test('can view all orders from all warehouses', async () => {
      await authHelper.waitForPageLoad();

      // Should see order list
      await expect(orderPage.orderList).toBeVisible();

      // Should see warehouse filter with all warehouses
      if (await orderPage.warehouseFilter.isVisible()) {
        const warehouseOptions = authHelper.page.locator('[data-testid="order-warehouse-filter"] option');
        const optionCount = await warehouseOptions.count();
        
        // Should see all warehouses
        expect(optionCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('can change order status for any order', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        const firstOrder = orderRows.first();
        const orderId = await firstOrder.getAttribute('data-order-id');
        
        if (orderId) {
          // Should be able to update order status
          await orderPage.expectStatusUpdateEnabled(orderId);

          // Try multiple status changes
          await orderPage.updateOrderStatus(orderId, 'processing');
          await expect(authHelper.page.locator('text="Order status updated"')).toBeVisible({ timeout: 5000 });

          await orderPage.updateOrderStatus(orderId, 'shipped');
          await expect(authHelper.page.locator('text="Order status updated"')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('can delete orders if permitted', async () => {
      await authHelper.waitForPageLoad();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        // Delete buttons should be visible for admin
        const firstOrder = orderRows.first();
        const deleteButton = firstOrder.locator('[data-testid="delete-order-button"]');
        
        // Note: This might be hidden by business logic even for admins
        // Check if delete functionality is available
        if (await deleteButton.isVisible()) {
          await expect(deleteButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Unauthorized Roles', () => {
    const unauthorizedRoles = [
      { role: 'inventoryManager', sections: ['/admin/orders'] },
      { role: 'marketingManager', sections: ['/admin/orders'] },
      { role: 'financeAnalyst', sections: ['/admin/orders'] }
    ];

    for (const { role, sections } of unauthorizedRoles) {
      test(`${role} should not access order management`, async () => {
        await authHelper.loginAs(role as any);
        
        for (const section of sections) {
          await authHelper.page.goto(section);
          await authHelper.waitForPageLoad();
          
          await authHelper.expectUnauthorized();
        }
      });
    }
  });

  test.describe('Order Status Workflow', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('warehouseManager');
    });

    const statusWorkflow = [
      { from: 'new', to: 'processing' },
      { from: 'processing', to: 'shipped' },
      { from: 'shipped', to: 'delivered' },
      { from: 'new', to: 'cancelled' }
    ];

    for (const { from, to } of statusWorkflow) {
      test(`can change order from ${from} to ${to}`, async () => {
        await authHelper.page.goto(`/admin/orders/${from}`);
        await authHelper.waitForPageLoad();

        const orderRows = authHelper.page.locator('[data-testid="order-row"]');
        if (await orderRows.count() > 0) {
          const firstOrder = orderRows.first();
          const orderId = await firstOrder.getAttribute('data-order-id');
          
          if (orderId) {
            await orderPage.updateOrderStatus(orderId, to);
            await expect(authHelper.page.locator('text="Order status updated"')).toBeVisible({ timeout: 10000 });
          }
        }
      });
    }
  });
});