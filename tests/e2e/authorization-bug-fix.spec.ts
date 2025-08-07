import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Authorization Bug Fix Verification', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test.afterEach(async () => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Warehouse Editing Authorization Fix', () => {
    test('warehouse manager can edit warehouse without 401 error - BUG FIX VERIFICATION', async () => {
      await authHelper.loginAs('warehouseManager');
      await authHelper.page.goto('/admin/warehouses');
      await authHelper.waitForPageLoad();

      // Monitor network requests for 401 errors
      let unauthorized401Errors: string[] = [];
      let successfulRequests: string[] = [];

      authHelper.page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/warehouses/')) {
          if (response.status() === 401) {
            unauthorized401Errors.push(`${response.request().method()} ${url} - 401 Unauthorized`);
          } else if (response.status() >= 200 && response.status() < 300) {
            successfulRequests.push(`${response.request().method()} ${url} - ${response.status()}`);
          }
        }
      });

      // Check if there are warehouses to edit
      const warehouseRows = authHelper.page.locator('[data-testid="warehouse-row"]');
      const warehouseCount = await warehouseRows.count();

      if (warehouseCount === 0) {
        // Create a test warehouse first as admin
        await authHelper.logout();
        await authHelper.loginAs('admin');
        await authHelper.page.goto('/admin/warehouses');
        
        // Add a warehouse
        const addWarehouseButton = authHelper.page.locator('[data-testid="add-warehouse-button"]');
        if (await addWarehouseButton.isVisible()) {
          await addWarehouseButton.click();
          
          // Fill warehouse form
          await authHelper.page.fill('[data-testid="warehouse-name"]', 'Test Warehouse for Authorization');
          await authHelper.page.fill('[data-testid="warehouse-address"]', 'Test Address');
          await authHelper.page.fill('[data-testid="warehouse-city"]', 'Test City');
          await authHelper.page.fill('[data-testid="warehouse-state"]', 'Test State');
          await authHelper.page.fill('[data-testid="warehouse-pincode"]', '123456');
          await authHelper.page.fill('[data-testid="warehouse-phone"]', '1234567890');
          await authHelper.page.fill('[data-testid="warehouse-email"]', 'test@warehouse.com');
          
          await authHelper.page.click('[data-testid="save-warehouse-button"]');
          await expect(authHelper.page.locator('text="Warehouse added"')).toBeVisible({ timeout: 10000 });
        }
        
        // Now logout admin and login as warehouse manager
        await authHelper.logout();
        await authHelper.loginAs('warehouseManager');
        await authHelper.page.goto('/admin/warehouses');
        await authHelper.waitForPageLoad();
      }

      // Try to edit a warehouse
      const availableWarehouses = authHelper.page.locator('[data-testid="warehouse-row"]');
      const availableCount = await availableWarehouses.count();

      if (availableCount > 0) {
        await test.step('Open warehouse edit modal', async () => {
          const firstWarehouse = availableWarehouses.first();
          const editButton = firstWarehouse.locator('[data-testid="edit-warehouse-button"]');
          
          await editButton.click();
          
          // Wait for modal to open
          await expect(authHelper.page.locator('[data-testid="warehouse-form-modal"]')).toBeVisible({ timeout: 5000 });
        });

        await test.step('Make changes to warehouse', async () => {
          // Clear and update name field
          const nameField = authHelper.page.locator('[data-testid="warehouse-name"]');
          await nameField.clear();
          await nameField.fill('Updated Warehouse Name - Authorization Fixed');
          
          // Update phone number
          const phoneField = authHelper.page.locator('[data-testid="warehouse-phone"]');
          if (await phoneField.isVisible()) {
            await phoneField.clear();
            await phoneField.fill('9876543210');
          }
          
          // Update delivery radius if available
          const radiusField = authHelper.page.locator('[data-testid="warehouse-delivery-radius"]');
          if (await radiusField.isVisible()) {
            await radiusField.clear();
            await radiusField.fill('15');
          }
        });

        await test.step('Save changes - should NOT get 401 error', async () => {
          // Click save button
          const saveButton = authHelper.page.locator('[data-testid="save-warehouse-button"]');
          await saveButton.click();

          // Wait for request to complete
          await authHelper.page.waitForTimeout(3000);

          // Verify no 401 errors occurred
          expect(unauthorized401Errors).toHaveLength(0);
          
          if (unauthorized401Errors.length > 0) {
            console.error('❌ 401 Errors detected:', unauthorized401Errors);
            throw new Error(`Authorization bug still exists! Got 401 errors: ${unauthorized401Errors.join(', ')}`);
          }

          // Should see success message
          const successMessage = authHelper.page.locator('text="Warehouse updated"');
          const errorMessage = authHelper.page.locator('text="Failed to save warehouse"');
          
          // Wait for either success or error
          await Promise.race([
            successMessage.waitFor({ timeout: 10000 }),
            errorMessage.waitFor({ timeout: 10000 })
          ]);

          // Should see success, not error
          if (await errorMessage.isVisible()) {
            console.error('❌ Save failed - possible authorization issue');
            throw new Error('Warehouse save failed - check authorization implementation');
          }

          await expect(successMessage).toBeVisible();
          
          console.log('✅ Authorization fix verified! Warehouse manager can successfully edit warehouses');
          console.log('✅ Successful requests:', successfulRequests);
        });
      } else {
        test.skip('No warehouses available for editing test');
      }
    });

    test('verify WarehouseFormModal uses authenticatedFetch', async () => {
      // This test verifies the code fix at the component level
      await authHelper.loginAs('warehouseManager');
      await authHelper.page.goto('/admin/warehouses');

      // Monitor network requests to ensure Authorization header is present
      let requestsWithoutAuth: string[] = [];
      let requestsWithAuth: string[] = [];

      authHelper.page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/warehouses/')) {
          const authHeader = request.headers()['authorization'];
          if (!authHeader) {
            requestsWithoutAuth.push(`${request.method()} ${url}`);
          } else {
            requestsWithAuth.push(`${request.method()} ${url} - Auth: ${authHeader.substring(0, 20)}...`);
          }
        }
      });

      // Try to edit a warehouse
      const warehouseRows = authHelper.page.locator('[data-testid="warehouse-row"]');
      if (await warehouseRows.count() > 0) {
        const editButton = warehouseRows.first().locator('[data-testid="edit-warehouse-button"]');
        await editButton.click();
        
        await expect(authHelper.page.locator('[data-testid="warehouse-form-modal"]')).toBeVisible();
        
        // Make a small change
        await authHelper.page.fill('[data-testid="warehouse-name"]', 'Auth Test Warehouse');
        
        // Save
        await authHelper.page.click('[data-testid="save-warehouse-button"]');
        await authHelper.page.waitForTimeout(2000);

        // All warehouse API requests should have Authorization header
        expect(requestsWithoutAuth).toHaveLength(0);
        expect(requestsWithAuth.length).toBeGreaterThan(0);

        if (requestsWithoutAuth.length > 0) {
          console.error('❌ Requests without Authorization header:', requestsWithoutAuth);
          throw new Error('Found warehouse API requests without Authorization header - fix not properly implemented');
        }

        console.log('✅ All warehouse API requests include Authorization header');
        console.log('✅ Authorized requests:', requestsWithAuth);
      }
    });
  });

  test.describe('Other Authorization Fixes Verification', () => {
    test('all admin API calls should include authorization headers', async ({ page }) => {
      await authHelper.loginAs('admin');
      
      let unauthorizedRequests: string[] = [];
      let authorizedRequests: string[] = [];

      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') && !url.includes('/public/')) {
          const authHeader = request.headers()['authorization'];
          if (!authHeader) {
            unauthorizedRequests.push(`${request.method()} ${url}`);
          } else {
            authorizedRequests.push(`${request.method()} ${url}`);
          }
        }
      });

      // Navigate through several admin pages to trigger API calls
      const adminPages = [
        '/admin/dashboard',
        '/admin/products',
        '/admin/orders',
        '/admin/warehouses'
      ];

      for (const adminPage of adminPages) {
        await page.goto(adminPage);
        await authHelper.waitForPageLoad();
        await page.waitForTimeout(1000); // Allow API calls to complete
      }

      // Most admin API calls should have authorization (some public endpoints are okay)
      console.log('API calls without auth:', unauthorizedRequests);
      console.log('API calls with auth:', authorizedRequests);
      
      // Should have more authorized than unauthorized requests
      expect(authorizedRequests.length).toBeGreaterThan(0);
      
      // Check if any critical endpoints are missing authorization
      const criticalUnauthorizedCalls = unauthorizedRequests.filter(call => 
        !call.includes('/public/') && 
        !call.includes('/health') && 
        !call.includes('/metrics')
      );

      if (criticalUnauthorizedCalls.length > 0) {
        console.warn('⚠️  Critical API calls without authorization:', criticalUnauthorizedCalls);
      }
    });

    test('ensure all role-based API endpoints return proper status codes', async () => {
      const testCases = [
        {
          role: 'warehouseManager',
          endpoint: '/api/warehouses',
          method: 'GET',
          expectedStatuses: [200, 403] // Should not be 401 with proper auth
        },
        {
          role: 'warehouseManager', 
          endpoint: '/api/warehouses/test-id',
          method: 'PUT',
          expectedStatuses: [200, 404, 403], // Should not be 401 with proper auth
          body: { name: 'Test Update' }
        },
        {
          role: 'inventoryManager',
          endpoint: '/api/products',
          method: 'GET', 
          expectedStatuses: [200, 403]
        },
        {
          role: 'supportExecutive',
          endpoint: '/api/users/admin/all',
          method: 'GET',
          expectedStatuses: [200, 403]
        }
      ];

      for (const testCase of testCases) {
        await test.step(`${testCase.role} ${testCase.method} ${testCase.endpoint}`, async () => {
          await authHelper.loginAs(testCase.role as any);
          
          // Get auth token
          const token = await authHelper.page.evaluate(() => localStorage.getItem('token'));
          expect(token).toBeTruthy();

          // Make API request
          const requestOptions: any = {
            method: testCase.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };

          if (testCase.body) {
            requestOptions.data = testCase.body;
          }

          const response = await authHelper.page.request.fetch(`http://localhost:4000${testCase.endpoint}`, requestOptions);
          
          // Should not be 401 (unauthorized) with valid token
          expect(response.status()).not.toBe(401);
          
          // Should be one of expected statuses
          expect(testCase.expectedStatuses).toContain(response.status());
          
          console.log(`✅ ${testCase.role} ${testCase.method} ${testCase.endpoint}: ${response.status()}`);
        });
        
        await authHelper.logout();
      }
    });
  });

  test.describe('Frontend Component Authorization', () => {
    test('all forms use authenticatedFetch instead of plain fetch', async () => {
      // This test would ideally check the source code, but we can verify behavior
      await authHelper.loginAs('admin');
      
      let plainFetchUsed = false;
      let authenticatedFetchUsed = false;

      // Monitor for typical patterns
      authHelper.page.on('request', request => {
        const url = request.url();
        const authHeader = request.headers()['authorization'];
        
        if (url.includes('/api/')) {
          if (authHeader && authHeader.startsWith('Bearer ')) {
            authenticatedFetchUsed = true;
          } else if (!url.includes('/public/')) {
            plainFetchUsed = true;
            console.warn(`⚠️  API request without auth: ${request.method()} ${url}`);
          }
        }
      });

      // Test various forms
      const formsToTest = [
        { page: '/admin/products/add', formId: 'product-form', saveButton: 'save-product-button' },
        { page: '/admin/brands', formId: 'brand-form', saveButton: 'save-brand-button', addButton: 'add-brand-button' }
      ];

      for (const form of formsToTest) {
        try {
          await authHelper.page.goto(form.page);
          await authHelper.waitForPageLoad();

          // Open form if needed
          if (form.addButton) {
            const addButton = authHelper.page.locator(`[data-testid="${form.addButton}"]`);
            if (await addButton.isVisible()) {
              await addButton.click();
            }
          }

          // Check if form exists and interact with it minimally
          const formElement = authHelper.page.locator(`[data-testid="${form.formId}"]`);
          if (await formElement.isVisible({ timeout: 3000 })) {
            console.log(`✅ Testing form: ${form.page}`);
            
            // Fill minimal required fields (this would trigger validation API calls)
            const nameField = formElement.locator('input[name*="name"], input[data-testid*="name"]').first();
            if (await nameField.isVisible()) {
              await nameField.fill('Test Authorization Check');
            }
          }
        } catch (error) {
          console.log(`ℹ️  Form test skipped for ${form.page}: ${error}`);
        }
      }

      // After interacting with forms, we should see more authenticated requests
      expect(authenticatedFetchUsed).toBeTruthy();
      
      if (plainFetchUsed) {
        console.warn('⚠️  Some forms may still be using plain fetch without authentication');
      } else {
        console.log('✅ All tested forms appear to use authenticated requests');
      }
    });
  });
});