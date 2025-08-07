import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USERS } from './utils/auth-helpers';
import { SECTION_URLS, ROLE_PERMISSIONS, getUnauthorizedSections } from './utils/test-data';
import { AdminDashboard } from './utils/page-objects';

test.describe('Role-Based Access Control', () => {
  let authHelper: AuthHelper;
  let dashboard: AdminDashboard;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    dashboard = new AdminDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Admin Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('admin');
    });

    test('should have access to all sections', async () => {
      for (const [sectionName, sectionUrl] of Object.entries(SECTION_URLS)) {
        await test.step(`Access ${sectionName} section`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          // Should not be redirected to login or show unauthorized
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop());
          
          // Should not show access denied messages
          await expect(authHelper.page.locator('text="Access Denied"')).not.toBeVisible();
          await expect(authHelper.page.locator('text="Unauthorized"')).not.toBeVisible();
        });
      }
    });

    test('should see all navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Check that admin navigation is visible and contains all sections
      const expectedSections = ['products', 'brands', 'categories', 'warehouses', 
                               'orders', 'users', 'banners', 'reports'];
      
      for (const section of expectedSections) {
        await dashboard.expectSectionVisible(section);
      }
    });
  });

  test.describe('Product Inventory Management Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
    });

    test('should have access to authorized sections only', async () => {
      const authorizedSections = ROLE_PERMISSIONS['product_inventory_management'];
      
      for (const sectionUrl of authorizedSections) {
        await test.step(`Access authorized section: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop() || 'dashboard');
        });
      }
    });

    test('should be denied access to unauthorized sections', async () => {
      const unauthorizedSections = getUnauthorizedSections('product_inventory_management');
      
      for (const sectionUrl of unauthorizedSections) {
        await test.step(`Denied access to: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          // Should be redirected or show unauthorized message
          await authHelper.expectUnauthorized();
        });
      }
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Should see these sections
      await dashboard.expectSectionVisible('products');
      await dashboard.expectSectionVisible('brands');
      await dashboard.expectSectionVisible('categories');
      
      // Should NOT see these sections
      await dashboard.expectSectionHidden('warehouses');
      await dashboard.expectSectionHidden('orders');
      await dashboard.expectSectionHidden('users');
      await dashboard.expectSectionHidden('reports');
    });
  });

  test.describe('Order and Warehouse Management Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('warehouseManager');
    });

    test('should have access to authorized sections only', async () => {
      const authorizedSections = ROLE_PERMISSIONS['order_warehouse_management'];
      
      for (const sectionUrl of authorizedSections) {
        await test.step(`Access authorized section: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop() || 'dashboard');
        });
      }
    });

    test('should be denied access to unauthorized sections', async () => {
      const unauthorizedSections = getUnauthorizedSections('order_warehouse_management');
      
      for (const sectionUrl of unauthorizedSections) {
        await test.step(`Denied access to: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          await authHelper.expectUnauthorized();
        });
      }
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Should see these sections
      await dashboard.expectSectionVisible('orders');
      await dashboard.expectSectionVisible('warehouses');
      
      // Should NOT see these sections
      await dashboard.expectSectionHidden('products');
      await dashboard.expectSectionHidden('brands');
      await dashboard.expectSectionHidden('users');
      await dashboard.expectSectionHidden('reports');
    });
  });

  test.describe('Marketing Content Manager Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('marketingManager');
    });

    test('should have access to authorized sections only', async () => {
      const authorizedSections = ROLE_PERMISSIONS['marketing_content_manager'];
      
      for (const sectionUrl of authorizedSections) {
        await test.step(`Access authorized section: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop() || 'dashboard');
        });
      }
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Should see these sections
      await dashboard.expectSectionVisible('banners');
      await dashboard.expectSectionVisible('promocodes');
      await dashboard.expectSectionVisible('blog');
      await dashboard.expectSectionVisible('newsletter');
      
      // Should NOT see these sections
      await dashboard.expectSectionHidden('products');
      await dashboard.expectSectionHidden('orders');
      await dashboard.expectSectionHidden('warehouses');
    });
  });

  test.describe('Customer Support Executive Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('should have access to authorized sections only', async () => {
      const authorizedSections = ROLE_PERMISSIONS['customer_support_executive'];
      
      for (const sectionUrl of authorizedSections) {
        await test.step(`Access authorized section: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop() || 'dashboard');
        });
      }
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Should see these sections
      await dashboard.expectSectionVisible('users');
      await dashboard.expectSectionVisible('orders');
      await dashboard.expectSectionVisible('enquiry');
      await dashboard.expectSectionVisible('reviews');
      
      // Should NOT see these sections
      await dashboard.expectSectionHidden('products');
      await dashboard.expectSectionHidden('warehouses');
      await dashboard.expectSectionHidden('reports');
    });
  });

  test.describe('Report Finance Analyst Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('financeAnalyst');
    });

    test('should have access to authorized sections only', async () => {
      const authorizedSections = ROLE_PERMISSIONS['report_finance_analyst'];
      
      for (const sectionUrl of authorizedSections) {
        await test.step(`Access authorized section: ${sectionUrl}`, async () => {
          await authHelper.page.goto(sectionUrl);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(sectionUrl.split('/').pop() || 'dashboard');
        });
      }
    });

    test('should see only authorized navigation items', async () => {
      await authHelper.page.goto(SECTION_URLS.dashboard);
      await authHelper.waitForPageLoad();

      // Should see these sections
      await dashboard.expectSectionVisible('reports');
      await dashboard.expectSectionVisible('invoice-settings');
      await dashboard.expectSectionVisible('taxes');
      await dashboard.expectSectionVisible('delivery');
      
      // Should NOT see these sections
      await dashboard.expectSectionHidden('products');
      await dashboard.expectSectionHidden('orders');
      await dashboard.expectSectionHidden('warehouses');
      await dashboard.expectSectionHidden('users');
    });
  });

  test('unauthorized users should be redirected to login', async ({ page }) => {
    // Navigate to admin section without logging in
    await page.goto(SECTION_URLS.dashboard);
    
    // Should be redirected to login
    await page.waitForURL('**/admin/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});