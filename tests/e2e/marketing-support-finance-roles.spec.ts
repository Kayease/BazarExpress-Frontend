import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Marketing, Support, and Finance Roles', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test.afterEach(async () => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Marketing Content Manager Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('marketingManager');
    });

    test('can access all marketing sections', async () => {
      const marketingSections = [
        { path: '/admin/banners', name: 'banners' },
        { path: '/admin/promocodes', name: 'promocodes' },
        { path: '/admin/blog', name: 'blog' },
        { path: '/admin/newsletter', name: 'newsletter' },
        { path: '/admin/notices', name: 'notices' }
      ];

      for (const section of marketingSections) {
        await test.step(`Access ${section.name}`, async () => {
          await authHelper.page.goto(section.path);
          await authHelper.waitForPageLoad();
          
          // Should not be unauthorized
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(section.name);
          
          // Should not show access denied
          await expect(authHelper.page.locator('text="Access Denied"')).not.toBeVisible();
        });
      }
    });

    test('can create and manage banners', async () => {
      await authHelper.page.goto('/admin/banners');
      await authHelper.waitForPageLoad();

      // Should see banner list
      await expect(authHelper.page.locator('[data-testid="banner-list"]')).toBeVisible();

      // Should be able to create banner
      const addBannerButton = authHelper.page.locator('[data-testid="add-banner-button"]');
      if (await addBannerButton.isVisible()) {
        await addBannerButton.click();
        
        // Should open banner form
        await expect(authHelper.page.locator('[data-testid="banner-form"]')).toBeVisible();
        
        // Fill banner details
        await authHelper.page.fill('[data-testid="banner-title"]', 'Test Marketing Banner');
        await authHelper.page.fill('[data-testid="banner-description"]', 'Test banner description');
        
        // Save banner
        await authHelper.page.click('[data-testid="save-banner-button"]');
        await expect(authHelper.page.locator('text="Banner created"')).toBeVisible({ timeout: 10000 });
      }
    });

    test('can create and manage promocodes', async () => {
      await authHelper.page.goto('/admin/promocodes');
      await authHelper.waitForPageLoad();

      // Should see promocode list
      await expect(authHelper.page.locator('[data-testid="promocode-list"]')).toBeVisible();

      // Should be able to create promocode
      const addPromocodeButton = authHelper.page.locator('[data-testid="add-promocode-button"]');
      if (await addPromocodeButton.isVisible()) {
        await addPromocodeButton.click();
        
        await expect(authHelper.page.locator('[data-testid="promocode-form"]')).toBeVisible();
        
        // Fill promocode details
        await authHelper.page.fill('[data-testid="promocode-code"]', 'TESTCODE123');
        await authHelper.page.fill('[data-testid="promocode-discount"]', '10');
        
        await authHelper.page.click('[data-testid="save-promocode-button"]');
        await expect(authHelper.page.locator('text="Promocode created"')).toBeVisible({ timeout: 10000 });
      }
    });

    test('can manage blog content', async () => {
      await authHelper.page.goto('/admin/blog');
      await authHelper.waitForPageLoad();

      // Should see blog list
      await expect(authHelper.page.locator('[data-testid="blog-list"]')).toBeVisible();

      // Should be able to create blog post
      const addBlogButton = authHelper.page.locator('[data-testid="add-blog-button"]');
      if (await addBlogButton.isVisible()) {
        await addBlogButton.click();
        
        await expect(authHelper.page.locator('[data-testid="blog-form"]')).toBeVisible();
      }
    });

    test('can manage newsletter', async () => {
      await authHelper.page.goto('/admin/newsletter');
      await authHelper.waitForPageLoad();

      // Should see newsletter management
      await expect(authHelper.page.locator('[data-testid="newsletter-management"]')).toBeVisible();
    });

    test('cannot access other role sections', async () => {
      const restrictedSections = [
        '/admin/products',
        '/admin/warehouses',
        '/admin/orders',
        '/admin/users',
        '/admin/reports',
        '/admin/taxes'
      ];

      for (const section of restrictedSections) {
        await authHelper.page.goto(section);
        await authHelper.waitForPageLoad();
        await authHelper.expectUnauthorized();
      }
    });
  });

  test.describe('Customer Support Executive Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('supportExecutive');
    });

    test('can access all support sections', async () => {
      const supportSections = [
        { path: '/admin/users', name: 'users' },
        { path: '/admin/orders', name: 'orders' },
        { path: '/admin/enquiry', name: 'enquiry' },
        { path: '/admin/reviews', name: 'reviews' }
      ];

      for (const section of supportSections) {
        await test.step(`Access ${section.name}`, async () => {
          await authHelper.page.goto(section.path);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(section.name);
        });
      }
    });

    test('can view and manage users', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.waitForPageLoad();

      // Should see user list
      await expect(authHelper.page.locator('[data-testid="user-list"]')).toBeVisible();

      const userRows = authHelper.page.locator('[data-testid="user-row"]');
      const count = await userRows.count();

      if (count > 0) {
        const firstUser = userRows.first();
        
        // Should be able to change user status
        const statusToggle = firstUser.locator('[data-testid="user-status-toggle"]');
        if (await statusToggle.isVisible()) {
          await expect(statusToggle).toBeEnabled();
        }
        
        // Should NOT be able to delete users
        await expect(firstUser.locator('[data-testid="delete-user-button"]')).not.toBeVisible();
        
        // Should NOT be able to change user roles
        await expect(firstUser.locator('[data-testid="change-role-button"]')).not.toBeVisible();
      }
    });

    test('can manage enquiries', async () => {
      await authHelper.page.goto('/admin/enquiry');
      await authHelper.waitForPageLoad();

      await expect(authHelper.page.locator('[data-testid="enquiry-list"]')).toBeVisible();

      const enquiryRows = authHelper.page.locator('[data-testid="enquiry-row"]');
      const count = await enquiryRows.count();

      if (count > 0) {
        const firstEnquiry = enquiryRows.first();
        
        // Should be able to respond to enquiries
        const respondButton = firstEnquiry.locator('[data-testid="respond-enquiry-button"]');
        if (await respondButton.isVisible()) {
          await respondButton.click();
          await expect(authHelper.page.locator('[data-testid="enquiry-response-form"]')).toBeVisible();
        }
        
        // Should be able to update status
        const statusSelect = firstEnquiry.locator('[data-testid="enquiry-status-select"]');
        if (await statusSelect.isVisible()) {
          await expect(statusSelect).toBeEnabled();
        }
        
        // Should NOT be able to delete enquiries
        await expect(firstEnquiry.locator('[data-testid="delete-enquiry-button"]')).not.toBeVisible();
      }
    });

    test('can manage reviews and ratings', async () => {
      await authHelper.page.goto('/admin/reviews');
      await authHelper.waitForPageLoad();

      await expect(authHelper.page.locator('[data-testid="review-list"]')).toBeVisible();

      const reviewRows = authHelper.page.locator('[data-testid="review-row"]');
      const count = await reviewRows.count();

      if (count > 0) {
        const firstReview = reviewRows.first();
        
        // Should be able to approve/reject reviews
        const approveButton = firstReview.locator('[data-testid="approve-review-button"]');
        const rejectButton = firstReview.locator('[data-testid="reject-review-button"]');
        
        if (await approveButton.isVisible()) {
          await expect(approveButton).toBeEnabled();
        }
        if (await rejectButton.isVisible()) {
          await expect(rejectButton).toBeEnabled();
        }
        
        // Should be able to moderate content
        const moderateButton = firstReview.locator('[data-testid="moderate-review-button"]');
        if (await moderateButton.isVisible()) {
          await expect(moderateButton).toBeEnabled();
        }
      }
    });

    test('has read-only access to orders', async () => {
      await authHelper.page.goto('/admin/orders');
      await authHelper.waitForPageLoad();

      // Should see orders
      await expect(authHelper.page.locator('[data-testid="order-list"]')).toBeVisible();

      const orderRows = authHelper.page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();

      if (count > 0) {
        const firstOrder = orderRows.first();
        const orderId = await firstOrder.getAttribute('data-order-id');
        
        if (orderId) {
          // Should NOT be able to change order status
          const statusButton = firstOrder.locator('[data-testid="order-status-button"]');
          if (await statusButton.isVisible()) {
            await expect(statusButton).toBeDisabled();
          }
          
          // Should NOT be able to edit orders
          await expect(firstOrder.locator('[data-testid="edit-order-button"]')).not.toBeVisible();
        }
      }
    });

    test('cannot access restricted sections', async () => {
      const restrictedSections = [
        '/admin/products',
        '/admin/warehouses',
        '/admin/banners',
        '/admin/reports',
        '/admin/taxes'
      ];

      for (const section of restrictedSections) {
        await authHelper.page.goto(section);
        await authHelper.waitForPageLoad();
        await authHelper.expectUnauthorized();
      }
    });
  });

  test.describe('Report Finance Analyst Role', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('financeAnalyst');
    });

    test('can access all finance sections', async () => {
      const financeSections = [
        { path: '/admin/reports', name: 'reports' },
        { path: '/admin/invoice-settings', name: 'invoice-settings' },
        { path: '/admin/taxes', name: 'taxes' },
        { path: '/admin/delivery', name: 'delivery' }
      ];

      for (const section of financeSections) {
        await test.step(`Access ${section.name}`, async () => {
          await authHelper.page.goto(section.path);
          await authHelper.waitForPageLoad();
          
          const currentUrl = authHelper.page.url();
          expect(currentUrl).toContain(section.name.replace('-', ''));
        });
      }
    });

    test('can view and export reports', async () => {
      await authHelper.page.goto('/admin/reports');
      await authHelper.waitForPageLoad();

      // Should see reports dashboard
      await expect(authHelper.page.locator('[data-testid="reports-dashboard"]')).toBeVisible();

      // Should be able to generate reports
      const generateReportButton = authHelper.page.locator('[data-testid="generate-report-button"]');
      if (await generateReportButton.isVisible()) {
        await expect(generateReportButton).toBeEnabled();
      }

      // Should be able to export reports
      const exportButtons = authHelper.page.locator('[data-testid="export-report-button"]');
      const exportCount = await exportButtons.count();
      
      for (let i = 0; i < exportCount; i++) {
        await expect(exportButtons.nth(i)).toBeEnabled();
      }
    });

    test('can manage invoice settings', async () => {
      await authHelper.page.goto('/admin/invoice-settings');
      await authHelper.waitForPageLoad();

      // Should see invoice settings form
      await expect(authHelper.page.locator('[data-testid="invoice-settings-form"]')).toBeVisible();

      // Should be able to update settings
      const saveButton = authHelper.page.locator('[data-testid="save-invoice-settings"]');
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeEnabled();
      }
    });

    test('can manage taxes', async () => {
      await authHelper.page.goto('/admin/taxes');
      await authHelper.waitForPageLoad();

      // Should see tax list
      await expect(authHelper.page.locator('[data-testid="tax-list"]')).toBeVisible();

      // Should be able to create taxes
      const addTaxButton = authHelper.page.locator('[data-testid="add-tax-button"]');
      if (await addTaxButton.isVisible()) {
        await addTaxButton.click();
        
        await expect(authHelper.page.locator('[data-testid="tax-form"]')).toBeVisible();
        
        // Fill tax details
        await authHelper.page.fill('[data-testid="tax-name"]', 'Test Tax');
        await authHelper.page.fill('[data-testid="tax-rate"]', '5');
        
        await authHelper.page.click('[data-testid="save-tax-button"]');
        await expect(authHelper.page.locator('text="Tax created"')).toBeVisible({ timeout: 10000 });
      }
    });

    test('can manage delivery settings', async () => {
      await authHelper.page.goto('/admin/delivery');
      await authHelper.waitForPageLoad();

      // Should see delivery settings
      await expect(authHelper.page.locator('[data-testid="delivery-settings"]')).toBeVisible();

      // Should be able to update delivery settings
      const saveButton = authHelper.page.locator('[data-testid="save-delivery-settings"]');
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeEnabled();
      }
    });

    test('cannot access restricted sections', async () => {
      const restrictedSections = [
        '/admin/products',
        '/admin/warehouses',
        '/admin/orders',
        '/admin/users',
        '/admin/banners'
      ];

      for (const section of restrictedSections) {
        await authHelper.page.goto(section);
        await authHelper.waitForPageLoad();
        await authHelper.expectUnauthorized();
      }
    });
  });

  test.describe('Cross-Role Permission Validation', () => {
    test('marketing manager cannot access support functions', async () => {
      await authHelper.loginAs('marketingManager');
      
      const supportSections = ['/admin/users', '/admin/enquiry', '/admin/reviews'];
      
      for (const section of supportSections) {
        await authHelper.page.goto(section);
        await authHelper.expectUnauthorized();
      }
    });

    test('support executive cannot access marketing functions', async () => {
      await authHelper.loginAs('supportExecutive');
      
      const marketingSections = ['/admin/banners', '/admin/promocodes', '/admin/blog'];
      
      for (const section of marketingSections) {
        await authHelper.page.goto(section);
        await authHelper.expectUnauthorized();
      }
    });

    test('finance analyst cannot access operational functions', async () => {
      await authHelper.loginAs('financeAnalyst');
      
      const operationalSections = ['/admin/products', '/admin/orders', '/admin/warehouses', '/admin/users'];
      
      for (const section of operationalSections) {
        await authHelper.page.goto(section);
        await authHelper.expectUnauthorized();
      }
    });

    test('all non-admin roles cannot access admin user management', async () => {
      const nonAdminRoles = ['inventoryManager', 'warehouseManager', 'marketingManager', 'supportExecutive', 'financeAnalyst'];
      
      for (const role of nonAdminRoles) {
        await test.step(`${role} cannot access admin user management`, async () => {
          await authHelper.loginAs(role as any);
          await authHelper.page.goto('/admin/admin-users');
          await authHelper.expectUnauthorized();
          await authHelper.logout();
        });
      }
    });
  });
});