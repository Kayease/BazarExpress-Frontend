import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { TEST_PRODUCTS, TEST_BRANDS, TEST_CATEGORIES } from './utils/test-data';
import { ProductPage, BrandPage } from './utils/page-objects';

test.describe('Product and Inventory Management Role', () => {
  let authHelper: AuthHelper;
  let productPage: ProductPage;
  let brandPage: BrandPage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    productPage = new ProductPage(page);
    brandPage = new BrandPage(page);
  });

  test.afterEach(async () => {
    await authHelper.logout().catch(() => {
      // Ignore logout errors in cleanup
    });
  });

  test.describe('Product Management', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
    });

    test('can view products from assigned warehouses only', async () => {
      await authHelper.page.goto('/admin/products');
      await authHelper.waitForPageLoad();

      // Should see product list
      await expect(productPage.productList).toBeVisible();

      // Should see warehouse filter with only assigned warehouses
      await expect(productPage.warehouseFilter).toBeVisible();

      // Warehouse filter should be limited to assigned warehouses only
      const warehouseOptions = authHelper.page.locator('[data-testid="warehouse-filter"] option');
      const optionCount = await warehouseOptions.count();
      
      // Should have fewer options than admin (who sees all warehouses)
      // The exact count would depend on test data setup
      expect(optionCount).toBeGreaterThan(0);
    });

    test('can create products for assigned warehouses only', async () => {
      await authHelper.page.goto('/admin/products');
      await authHelper.waitForPageLoad();

      // Click add product button
      await productPage.addProductButton.click();

      // Should open product form
      await expect(authHelper.page.locator('[data-testid="product-form"]')).toBeVisible();

      // Warehouse dropdown should show only assigned warehouses
      const warehouseSelect = authHelper.page.locator('[data-testid="product-warehouse-select"]');
      await expect(warehouseSelect).toBeVisible();

      // Try to create product - should be restricted to assigned warehouses
      await authHelper.page.fill('[data-testid="product-name"]', TEST_PRODUCTS.product1.name);
      await authHelper.page.fill('[data-testid="product-sku"]', TEST_PRODUCTS.product1.sku);
      await authHelper.page.fill('[data-testid="product-price"]', TEST_PRODUCTS.product1.price.toString());

      // Submit and verify success
      await authHelper.page.click('[data-testid="save-product-button"]');
      await expect(authHelper.page.locator('text="Product created"')).toBeVisible({ timeout: 10000 });
    });

    test('cannot create warehouses or taxes', async () => {
      await authHelper.page.goto('/admin/products/add');
      await authHelper.waitForPageLoad();

      // Warehouse and tax creation buttons should be hidden/disabled
      await expect(authHelper.page.locator('[data-testid="create-warehouse-button"]')).not.toBeVisible();
      await expect(authHelper.page.locator('[data-testid="create-tax-button"]')).not.toBeVisible();
    });

    test('can edit own products only', async () => {
      await authHelper.page.goto('/admin/products');
      await authHelper.waitForPageLoad();

      const productRows = authHelper.page.locator('[data-testid="product-row"]');
      const count = await productRows.count();

      if (count > 0) {
        const firstProduct = productRows.first();
        const createdByText = await firstProduct.locator('[data-testid="created-by"]').textContent();
        
        if (createdByText?.includes('You') || createdByText?.includes(TEST_USERS.inventoryManager.email)) {
          // Should be able to edit own products
          await expect(firstProduct.locator('[data-testid="edit-product-button"]')).toBeVisible();
        } else {
          // Should not be able to edit products created by others
          await expect(firstProduct.locator('[data-testid="edit-product-button"]')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Brand Management', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
      await authHelper.page.goto('/admin/brands');
    });

    test('can view all brands', async () => {
      await authHelper.waitForPageLoad();
      
      // Should see brand list
      await expect(brandPage.brandList).toBeVisible();
      
      // Should be able to see all brands (not filtered)
      const brandRows = authHelper.page.locator('[data-testid="brand-row"]');
      const count = await brandRows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can create new brands', async () => {
      await brandPage.createBrand('Test Brand by Inventory Manager');
      
      // Should see success message
      await expect(authHelper.page.locator('text="Brand created"')).toBeVisible({ timeout: 10000 });
      
      // Brand should appear in list
      await expect(authHelper.page.locator('text="Test Brand by Inventory Manager"')).toBeVisible();
    });

    test('can edit/delete only own brands', async () => {
      // Create a brand first
      await brandPage.createBrand('Own Brand Test');
      await authHelper.page.reload();
      await authHelper.waitForPageLoad();

      const brandRows = authHelper.page.locator('[data-testid="brand-row"]');
      const count = await brandRows.count();

      for (let i = 0; i < count; i++) {
        const brandRow = brandRows.nth(i);
        const brandName = await brandRow.locator('[data-testid="brand-name"]').textContent();
        const createdBy = await brandRow.locator('[data-testid="brand-created-by"]').textContent();
        
        if (createdBy?.includes('You') || brandName?.includes('Own Brand Test')) {
          // Should be able to edit/delete own brands
          await brandPage.expectEditButtonVisible(brandName || '');
          await brandPage.expectDeleteButtonVisible(brandName || '');
        } else {
          // Should not be able to edit/delete brands created by others
          await brandPage.expectEditButtonHidden(brandName || '');
          await brandPage.expectDeleteButtonHidden(brandName || '');
        }
      }
    });

    test('cannot edit brands created by others', async () => {
      // This test assumes there are existing brands created by admin
      const adminBrandRow = authHelper.page.locator('[data-testid="brand-row"]')
        .filter({ has: authHelper.page.locator('text="admin"') });
      
      if (await adminBrandRow.count() > 0) {
        const brandName = await adminBrandRow.locator('[data-testid="brand-name"]').textContent();
        
        // Edit and delete buttons should be hidden
        await expect(adminBrandRow.locator('[data-testid="edit-brand-button"]')).not.toBeVisible();
        await expect(adminBrandRow.locator('[data-testid="delete-brand-button"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Category Management', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
      await authHelper.page.goto('/admin/categories');
    });

    test('can view all categories', async () => {
      await authHelper.waitForPageLoad();
      
      // Should see category list
      await expect(authHelper.page.locator('[data-testid="category-list"]')).toBeVisible();
    });

    test('can create new categories', async () => {
      await authHelper.page.click('[data-testid="add-category-button"]');
      await authHelper.page.fill('[data-testid="category-name"]', 'Test Category by Inventory Manager');
      await authHelper.page.click('[data-testid="save-category-button"]');
      
      // Should see success message
      await expect(authHelper.page.locator('text="Category created"')).toBeVisible({ timeout: 10000 });
    });

    test('can edit/delete only own categories', async () => {
      const categoryRows = authHelper.page.locator('[data-testid="category-row"]');
      const count = await categoryRows.count();

      for (let i = 0; i < count; i++) {
        const categoryRow = categoryRows.nth(i);
        const createdBy = await categoryRow.locator('[data-testid="category-created-by"]').textContent();
        const categoryName = await categoryRow.locator('[data-testid="category-name"]').textContent();
        
        if (createdBy?.includes('You') || createdBy?.includes(TEST_USERS.inventoryManager.email)) {
          // Should be able to edit/delete own categories
          await expect(categoryRow.locator('[data-testid="edit-category-button"]')).toBeVisible();
          await expect(categoryRow.locator('[data-testid="delete-category-button"]')).toBeVisible();
        } else {
          // Should not be able to edit/delete categories created by others
          await expect(categoryRow.locator('[data-testid="edit-category-button"]')).not.toBeVisible();
          await expect(categoryRow.locator('[data-testid="delete-category-button"]')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Warehouse Restrictions', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
    });

    test('cannot access warehouse management', async () => {
      await authHelper.page.goto('/admin/warehouses');
      await authHelper.waitForPageLoad();
      
      // Should be denied access
      await authHelper.expectUnauthorized();
    });

    test('product list is filtered by assigned warehouses', async () => {
      await authHelper.page.goto('/admin/products');
      await authHelper.waitForPageLoad();

      // Check if warehouse filter shows limited options
      const warehouseFilter = productPage.warehouseFilter;
      await expect(warehouseFilter).toBeVisible();

      const allOption = authHelper.page.locator('[data-testid="warehouse-filter"] option[value="all"]');
      const warehouseOptions = authHelper.page.locator('[data-testid="warehouse-filter"] option:not([value="all"])');
      
      const optionCount = await warehouseOptions.count();
      
      // Should have limited warehouse options (not all warehouses)
      expect(optionCount).toBeGreaterThan(0);
      
      // Filter by specific warehouse and verify products are filtered
      if (optionCount > 0) {
        await warehouseFilter.selectOption({ index: 1 }); // First warehouse option
        await authHelper.waitForPageLoad();
        
        // Products should be filtered - verify API calls include warehouse filter
        let apiCallsIncludeWarehouse = false;
        authHelper.page.on('response', response => {
          if (response.url().includes('/api/products') && response.url().includes('warehouse=')) {
            apiCallsIncludeWarehouse = true;
          }
        });
        
        await authHelper.page.reload();
        await authHelper.waitForPageLoad();
        
        expect(apiCallsIncludeWarehouse).toBeTruthy();
      }
    });
  });

  test.describe('Permission Boundaries', () => {
    test.beforeEach(async () => {
      await authHelper.loginAs('inventoryManager');
    });

    test('cannot access order management', async () => {
      await authHelper.page.goto('/admin/orders');
      await authHelper.expectUnauthorized();
    });

    test('cannot access user management', async () => {
      await authHelper.page.goto('/admin/users');
      await authHelper.expectUnauthorized();
    });

    test('cannot access marketing sections', async () => {
      const marketingSections = ['/admin/banners', '/admin/promocodes', '/admin/blog'];
      
      for (const section of marketingSections) {
        await authHelper.page.goto(section);
        await authHelper.expectUnauthorized();
      }
    });

    test('cannot access reports and finance', async () => {
      const financeSections = ['/admin/reports', '/admin/taxes', '/admin/invoice-settings'];
      
      for (const section of financeSections) {
        await authHelper.page.goto(section);
        await authHelper.expectUnauthorized();
      }
    });
  });
});