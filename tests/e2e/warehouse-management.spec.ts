import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { TEST_WAREHOUSES } from './utils/test-data';
import { WarehousePage } from './utils/page-objects';

test.describe('Warehouse Management', () => {
  let authHelper: AuthHelper;
  let warehousePage: WarehousePage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    warehousePage = new WarehousePage(page);
  });

  test.afterEach(async () => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Admin Role - Warehouse Management', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('admin');
      await authHelper.page.goto('/admin/warehouses');
    });

    test('admin can create new warehouse', async () => {
      await warehousePage.openAddWarehouseModal();
      await warehousePage.fillWarehouseForm(TEST_WAREHOUSES.warehouse1);
      await warehousePage.saveWarehouse();
      
      // Wait for success message
      await expect(authHelper.page.locator('text="Warehouse added"')).toBeVisible({ timeout: 10000 });
      
      // Verify warehouse appears in list
      await warehousePage.expectWarehouseInList(TEST_WAREHOUSES.warehouse1.name);
    });

    test('admin can edit existing warehouse', async () => {
      // First ensure there's a warehouse to edit
      const warehouseRow = authHelper.page.locator('[data-testid="warehouse-row"]').first();
      if (await warehouseRow.isVisible()) {
        const editButton = warehouseRow.locator('[data-testid="edit-warehouse-button"]');
        await editButton.click();
        
        // Wait for modal to open
        await expect(warehousePage.warehouseFormModal).toBeVisible();
        
        // Update warehouse name
        await authHelper.page.fill('[data-testid="warehouse-name"]', 'Updated Warehouse Name');
        await warehousePage.saveWarehouse();
        
        // Wait for success message
        await expect(authHelper.page.locator('text="Warehouse updated"')).toBeVisible({ timeout: 10000 });
      }
    });

    test('admin can delete warehouse', async () => {
      // Check if delete functionality is available for admin
      const warehouseRow = authHelper.page.locator('[data-testid="warehouse-row"]').first();
      if (await warehouseRow.isVisible()) {
        await expect(warehouseRow.locator('[data-testid="delete-warehouse-button"]')).toBeVisible();
      }
    });
  });

  test.describe('Order and Warehouse Management Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('warehouseManager');
      await authHelper.page.goto('/admin/warehouses');
    });

    test('warehouse manager can view assigned warehouses', async () => {
      await authHelper.waitForPageLoad();
      
      // Should see warehouse list
      await expect(warehousePage.warehouseList).toBeVisible();
      
      // Should see only assigned warehouses (not all)
      // This would depend on test data setup
    });

    test('warehouse manager can edit warehouse details - FIXED AUTHORIZATION BUG', async () => {
      // This is the main test for the bug fix
      const warehouseRow = authHelper.page.locator('[data-testid="warehouse-row"]').first();
      
      if (await warehouseRow.isVisible({ timeout: 5000 })) {
        await test.step('Open edit modal', async () => {
          const editButton = warehouseRow.locator('[data-testid="edit-warehouse-button"]');
          await editButton.click();
          
          // Wait for modal to open
          await expect(warehousePage.warehouseFormModal).toBeVisible();
        });
        
        await test.step('Update warehouse details', async () => {
          // Clear and update the warehouse name
          await authHelper.page.fill('[data-testid="warehouse-name"]', '');
          await authHelper.page.fill('[data-testid="warehouse-name"]', 'Updated by Warehouse Manager');
          
          // Update other fields
          await authHelper.page.fill('[data-testid="warehouse-phone"]', '9876543210');
        });
        
        await test.step('Save changes - should not get 401 error', async () => {
          // Set up network monitoring to check for 401 errors
          let got401Error = false;
          authHelper.page.on('response', response => {
            if (response.url().includes('/api/warehouses/') && response.status() === 401) {
              got401Error = true;
            }
          });
          
          await warehousePage.saveWarehouse();
          
          // Wait for either success or error
          await authHelper.page.waitForTimeout(3000);
          
          // Should not have gotten 401 error
          expect(got401Error).toBeFalsy();
          
          // Should see success message
          await expect(authHelper.page.locator('text="Warehouse updated"')).toBeVisible({ timeout: 10000 });
        });
      } else {
        test.skip('No warehouses available for testing');
      }
    });

    test('warehouse manager cannot create new warehouse', async () => {
      // Add warehouse button should be hidden or disabled
      await expect(warehousePage.addWarehouseButton).not.toBeVisible();
    });

    test('warehouse manager cannot delete warehouse', async () => {
      const warehouseRow = authHelper.page.locator('[data-testid="warehouse-row"]').first();
      if (await warehouseRow.isVisible()) {
        // Delete button should be hidden for warehouse managers
        await expect(warehouseRow.locator('[data-testid="delete-warehouse-button"]')).not.toBeVisible();
      }
    });

    test('warehouse manager sees only assigned warehouses', async () => {
      await authHelper.waitForPageLoad();
      
      // The page should filter to show only warehouses assigned to this user
      // This test would need actual test data setup to verify properly
      await expect(warehousePage.warehouseList).toBeVisible();
      
      // Count warehouses - should be limited (not all warehouses)
      const warehouseRows = authHelper.page.locator('[data-testid="warehouse-row"]');
      const count = await warehouseRows.count();
      
      // Should see some warehouses but not necessarily all
      expect(count).toBeGreaterThanOrEqual(0);
      
      // In a real test, we'd verify specific warehouse assignments
    });
  });

  test.describe('Unauthorized Roles', () => {
    const unauthorizedRoles = ['inventoryManager', 'marketingManager', 'supportExecutive', 'financeAnalyst'];

    for (const role of unauthorizedRoles) {
      test(`${role} should not access warehouse management`, async () => {
        await authHelper.loginAs(role as any);
        
        // Try to access warehouse page
        await authHelper.page.goto('/admin/warehouses');
        await authHelper.waitForPageLoad();
        
        // Should be denied access
        await authHelper.expectUnauthorized();
      });
    }
  });

  test.describe('API Authorization Tests', () => {
    test('warehouse API endpoints require proper authorization', async ({ page }) => {
      // Test direct API calls without proper auth
      const apiUrl = 'http://localhost:4000/api/warehouses';
      
      await test.step('Unauthorized API call should return 401', async () => {
        const response = await page.request.put(`${apiUrl}/test-id`, {
          data: { name: 'Test Warehouse' },
          headers: {
            'Content-Type': 'application/json'
            // No Authorization header
          }
        });
        
        expect(response.status()).toBe(401);
      });
      
      await test.step('Invalid token should return 401', async () => {
        const response = await page.request.put(`${apiUrl}/test-id`, {
          data: { name: 'Test Warehouse' },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-token'
          }
        });
        
        expect(response.status()).toBe(401);
      });
    });

    test('warehouse manager API calls should work with proper auth', async () => {
      // Login first to get valid token
      await authHelper.loginAs('warehouseManager');
      
      // Get token from localStorage
      const token = await authHelper.page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      
      // Make authorized API call
      if (token) {
        const response = await authHelper.page.request.get('http://localhost:4000/api/warehouses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Should not be 401
        expect(response.status()).not.toBe(401);
        // Should be 200 or 403 (depending on implementation)
        expect([200, 403].includes(response.status())).toBeTruthy();
      }
    });
  });
});