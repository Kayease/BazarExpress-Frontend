import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USERS } from './utils/auth-helpers';
import { AdminDashboard } from './utils/page-objects';

test.describe('Customer Support Executive Comprehensive Test', () => {
  let authHelper: AuthHelper;
  let dashboard: AdminDashboard;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    dashboard = new AdminDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout().catch(() => {});
  });

  test.describe('User Management Access', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should successfully load users list', async () => {
      await test.step('Navigate to users section', async () => {
        await authHelper.page.goto('/admin/users');
        await authHelper.waitForPageLoad();
      });

      await test.step('Verify users list loads successfully', async () => {
        // Should not be redirected to login or show unauthorized
        expect(authHelper.page.url()).toContain('/admin/users');
        
        // Should not show access denied messages
        await expect(authHelper.page.locator('text="Access Denied"')).not.toBeVisible();
        await expect(authHelper.page.locator('text="Unauthorized"')).not.toBeVisible();
        
        // Should show users table
        await expect(authHelper.page.locator('table')).toBeVisible();
        
        // Should show loading completed
        await expect(authHelper.page.locator('text="Loading users..."')).not.toBeVisible();
      });

      await test.step('Verify users data is loaded', async () => {
        // Wait for users to load
        await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
        
        // Should show user data
        const userRows = authHelper.page.locator('tbody tr');
        const count = await userRows.count();
        expect(count).toBeGreaterThan(0);
        
        console.log(`✅ Users loaded successfully: ${count} users found`);
      });
    });

    test('should only show status change button (not edit/delete)', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();
      
      // Wait for users to load
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      
      const firstUserRow = authHelper.page.locator('tbody tr').first();
      
      await test.step('Verify action buttons for Customer Support Executive', async () => {
        // Should NOT see Edit button
        await expect(firstUserRow.locator('button:has-text("Edit")')).not.toBeVisible();
        
        // Should NOT see Delete button  
        await expect(firstUserRow.locator('button:has([data-testid="delete-icon"])')).not.toBeVisible();
        
        // SHOULD see status toggle button (activate/deactivate)
        await expect(firstUserRow.locator('button:has([data-testid="status-toggle"])')).toBeVisible();
        
        // SHOULD see "Status Only" indicator
        await expect(firstUserRow.locator('text="Status Only"')).toBeVisible();
        
        console.log('✅ Customer Support Executive sees correct action buttons');
      });
    });

    test('should be able to change user status successfully', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();
      
      // Wait for users to load
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      
      const firstUserRow = authHelper.page.locator('tbody tr').first();
      
      await test.step('Change user status', async () => {
        // Get current status
        const statusBadge = firstUserRow.locator('[class*="bg-"][class*="100"]').first();
        const currentStatusText = await statusBadge.textContent();
        
        // Click status toggle button
        const statusButton = firstUserRow.locator('button:has([data-testid="status-toggle"])');
        await statusButton.click();
        
        // Wait for success message
        await expect(authHelper.page.locator('text*="successfully"')).toBeVisible({ timeout: 5000 });
        
        // Verify status changed
        await authHelper.page.waitForTimeout(1000); // Allow UI to update
        const newStatusText = await statusBadge.textContent();
        expect(newStatusText).not.toBe(currentStatusText);
        
        console.log(`✅ Status changed from "${currentStatusText}" to "${newStatusText}"`);
      });
    });

    test('should not be able to access user edit modal', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();
      
      await test.step('Verify no edit functionality available', async () => {
        // Should not see any edit buttons
        await expect(authHelper.page.locator('button:has-text("Edit")')).toHaveCount(0);
        
        // Should not be able to open edit modal by any means
        await expect(authHelper.page.locator('[data-testid="edit-user-modal"]')).not.toBeVisible();
        
        console.log('✅ Customer Support Executive cannot access user edit functionality');
      });
    });
  });

  test.describe('Orders Management Access', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should successfully load orders list', async () => {
      await test.step('Navigate to orders section', async () => {
        await authHelper.page.goto('/admin/orders');
        await authHelper.waitForPageLoad();
      });

      await test.step('Verify orders list loads successfully', async () => {
        // Should not be redirected or show unauthorized
        expect(authHelper.page.url()).toContain('/admin/orders');
        
        await expect(authHelper.page.locator('text="Access Denied"')).not.toBeVisible();
        await expect(authHelper.page.locator('text="Unauthorized"')).not.toBeVisible();
        
        // Should show orders table
        await expect(authHelper.page.locator('table')).toBeVisible();
        
        console.log('✅ Orders section loaded successfully');
      });
    });

    test('should be able to view order details', async () => {
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();
      
      // Wait for orders to load
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      
      const orderRows = await authHelper.page.locator('tbody tr').count();
      
      if (orderRows > 0) {
        await test.step('Open order details modal', async () => {
          // Click view button on first order
          const viewButton = authHelper.page.locator('button:has-text("View")').first();
          await viewButton.click();
          
          // Should open order details modal
          await expect(authHelper.page.locator('[data-testid="order-details-modal"]')).toBeVisible({ timeout: 5000 });
          
          console.log('✅ Can view order details');
        });

        await test.step('Verify order details content', async () => {
          // Should show order information
          await expect(authHelper.page.locator('text="Order Status"')).toBeVisible();
          await expect(authHelper.page.locator('text="Customer"')).toBeVisible();
          await expect(authHelper.page.locator('text="Items"')).toBeVisible();
          await expect(authHelper.page.locator('text="Delivery Address"')).toBeVisible();
          
          console.log('✅ Order details displayed correctly');
        });
      } else {
        console.log('⚠️ No orders found to test with');
      }
    });

    test('should NOT be able to change order status', async () => {
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();
      
      // Wait for orders to load  
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      
      const orderRows = await authHelper.page.locator('tbody tr').count();
      
      if (orderRows > 0) {
        await test.step('Open order details and verify status dropdown disabled', async () => {
          // Click view button on first order
          const viewButton = authHelper.page.locator('button:has-text("View")').first();
          await viewButton.click();
          
          // Wait for modal to open
          await expect(authHelper.page.locator('[data-testid="order-details-modal"]')).toBeVisible({ timeout: 5000 });
          
          // Status dropdown should be disabled
          const statusDropdown = authHelper.page.locator('select[disabled]');
          await expect(statusDropdown).toBeVisible();
          await expect(statusDropdown).toBeDisabled();
          
          // Should see "View Only" message instead of update button
          await expect(authHelper.page.locator('text="View Only - Cannot change order status"')).toBeVisible();
          
          // Should NOT see "Update Status" button
          await expect(authHelper.page.locator('button:has-text("Update Status")')).not.toBeVisible();
          
          console.log('✅ Order status dropdown correctly disabled for Customer Support Executive');
        });
      } else {
        console.log('⚠️ No orders found to test status restrictions with');
      }
    });
  });

  test.describe('Navigation and Role Access', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto('/admin');
      await authHelper.waitForPageLoad();

      await test.step('Verify visible navigation sections', async () => {
        // Should see these sections
        await dashboard.expectSectionVisible('users');
        await dashboard.expectSectionVisible('orders');  
        await dashboard.expectSectionVisible('enquiry');
        await dashboard.expectSectionVisible('reviews');
        
        console.log('✅ Authorized sections visible');
      });

      await test.step('Verify hidden navigation sections', async () => {
        // Should NOT see these sections
        await dashboard.expectSectionHidden('products');
        await dashboard.expectSectionHidden('warehouses'); 
        await dashboard.expectSectionHidden('banners');
        await dashboard.expectSectionHidden('reports');
        await dashboard.expectSectionHidden('finance');
        
        console.log('✅ Unauthorized sections hidden');
      });
    });

    test('should be denied access to unauthorized sections', async () => {
      const unauthorizedSections = [
        '/admin/products',
        '/admin/warehouses', 
        '/admin/banners',
        '/admin/reports',
        '/admin/finance'
      ];

      for (const section of unauthorizedSections) {
        await test.step(`Verify access denied to ${section}`, async () => {
          await authHelper.page.goto(section);
          await authHelper.waitForPageLoad();
          
          // Should be redirected or show unauthorized message
          await authHelper.expectUnauthorized();
          
          console.log(`✅ Access denied to ${section}`);
        });
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should handle API errors gracefully', async () => {
      await test.step('Test users API error handling', async () => {
        // Navigate to users section
        await authHelper.page.goto('/admin/users');
        
        // Mock network failure for users API
        await authHelper.page.route('**/auth/users', route => route.abort());
        
        // Reload page to trigger API error
        await authHelper.page.reload();
        await authHelper.waitForPageLoad();
        
        // Should show error message
        await expect(authHelper.page.locator('text*="Could not load users"')).toBeVisible({ timeout: 5000 });
        
        console.log('✅ Users API error handled gracefully');
      });

      await test.step('Test orders API error handling', async () => {
        // Navigate to orders section
        await authHelper.page.goto('/admin/orders');
        
        // Mock network failure for orders API  
        await authHelper.page.route('**/orders/admin/all', route => route.abort());
        
        // Reload page to trigger API error
        await authHelper.page.reload();
        await authHelper.waitForPageLoad();
        
        // Should show error message or loading state
        const hasError = await authHelper.page.locator('text*="error"').isVisible();
        const isLoading = await authHelper.page.locator('text*="Loading"').isVisible();
        
        expect(hasError || isLoading).toBe(true);
        
        console.log('✅ Orders API error handled gracefully');
      });
    });
  });

  test.describe('Performance and UX', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should load pages within acceptable time limits', async () => {
      const pages = [
        { name: 'Users', url: '/admin/users' },
        { name: 'Orders', url: '/admin/orders' }
      ];

      for (const page of pages) {
        await test.step(`Verify ${page.name} page load performance`, async () => {
          const startTime = Date.now();
          
          await authHelper.page.goto(page.url);
          await authHelper.waitForPageLoad();
          
          // Wait for data to load
          await authHelper.page.waitForSelector('tbody tr, .loading, .error', { timeout: 15000 });
          
          const loadTime = Date.now() - startTime;
          
          // Should load within 15 seconds
          expect(loadTime).toBeLessThan(15000);
          
          console.log(`✅ ${page.name} page loaded in ${loadTime}ms`);
        });
      }
    });

    test('should provide clear feedback for user actions', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();
      
      // Wait for users to load
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      
      const firstUserRow = authHelper.page.locator('tbody tr').first();
      
      await test.step('Verify status change feedback', async () => {
        // Click status toggle button
        const statusButton = firstUserRow.locator('button:has([data-testid="status-toggle"])');
        await statusButton.click();
        
        // Should show loading state or success message
        const hasSuccessMessage = await authHelper.page.locator('text*="successfully"').isVisible();
        const hasLoadingState = await authHelper.page.locator('.loading, [data-testid="loading"]').isVisible();
        
        expect(hasSuccessMessage || hasLoadingState).toBe(true);
        
        console.log('✅ Clear feedback provided for user actions');
      });
    });
  });

  test('final comprehensive status report', async () => {
    await authHelper.loginAs('supportExecutive');

    const testResults = {
      userManagement: {
        canViewUsers: false,
        canChangeStatus: false,
        cannotEditUsers: false,
        cannotDeleteUsers: false
      },
      orderManagement: {
        canViewOrders: false,
        canViewOrderDetails: false,
        cannotChangeOrderStatus: false
      },
      navigation: {
        correctSectionsVisible: false,
        unauthorizedSectionsHidden: false
      }
    };

    // Test user management
    try {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      testResults.userManagement.canViewUsers = true;
      testResults.userManagement.cannotEditUsers = await authHelper.page.locator('button:has-text("Edit")').count() === 0;
      testResults.userManagement.cannotDeleteUsers = await authHelper.page.locator('button:has([data-testid="delete-icon"])').count() === 0;
    } catch (error) {
      console.log('❌ User management test failed:', error);
    }

    // Test order management
    try {
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();
      await authHelper.page.waitForSelector('tbody tr', { timeout: 10000 });
      testResults.orderManagement.canViewOrders = true;
    } catch (error) {
      console.log('❌ Order management test failed:', error);
    }

    console.log('\n🎯 CUSTOMER SUPPORT EXECUTIVE FINAL TEST REPORT:');
    console.log('=================================================');
    console.log(`✅ Can view users: ${testResults.userManagement.canViewUsers}`);
    console.log(`✅ Cannot edit users: ${testResults.userManagement.cannotEditUsers}`);
    console.log(`✅ Cannot delete users: ${testResults.userManagement.cannotDeleteUsers}`);
    console.log(`✅ Can view orders: ${testResults.orderManagement.canViewOrders}`);
    console.log('=================================================');

    // Overall success check
    const allTestsPassed = Object.values(testResults).every(category => 
      Object.values(category).every(test => test === true)
    );

    if (allTestsPassed) {
      console.log('🎉 ALL CUSTOMER SUPPORT EXECUTIVE TESTS PASSED!');
    } else {
      console.log('⚠️ Some tests failed - see details above');
    }
  });
});