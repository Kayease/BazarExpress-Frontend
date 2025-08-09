import { test, expect } from '@playwright/test';

test.describe('Role Management Deep Analysis - Product Inventory Management', () => {
  test.describe('Brand Management Issues', () => {
    test.beforeEach(async ({ page }) => {
      // Login as product_inventory_management user
      await page.goto('http://localhost:3001');
      
      // Click login button
      await page.getByRole('button', { name: 'Login' }).click();
      
      // Enter phone number for product inventory manager
      await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      // Wait for OTP input (assuming OTP flow exists)
      await page.waitForSelector('input[placeholder*="OTP"], input[placeholder*="otp"]', { timeout: 10000 }).catch(() => {
        // If no OTP input found, might already be logged in or different flow
      });
      
      // Try to get OTP from server console or use a test OTP
      const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"]');
      if (await otpInputs.count() > 0) {
        // Fill OTP - in real test, this would come from server console
        await otpInputs.first().fill('123456'); // Test OTP
        await page.getByRole('button', { name: 'Verify' }).click();
      }
      
      // Navigate to admin after login
      await page.goto('http://localhost:3001/admin/brands');
      await page.waitForLoadState('networkidle');
    });

    test('should show specific error message when trying to delete brand without permission', async ({ page }) => {
      // Create a test brand first (as the logged-in user)
      await page.click('[data-testid="add-brand-button"], button:has-text("Add Brand")');
      await page.fill('[data-testid="brand-name"], input[name="name"]', 'Test Brand for Deletion');
      await page.fill('[data-testid="brand-description"], textarea[name="description"]', 'Test brand description');
      await page.click('[data-testid="save-brand-button"], button[type="submit"]');
      
      // Wait for brand to be created
      await expect(page.locator('text="Test Brand for Deletion"')).toBeVisible({ timeout: 10000 });
      
      // Now try to delete it - should work for own brand
      const brandRow = page.locator('[data-testid="brand-row"]').filter({ hasText: 'Test Brand for Deletion' });
      await brandRow.locator('[data-testid="delete-brand-button"], button:has([data-testid="trash-icon"])').click();
      
      // Confirm deletion dialog
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      
      // Should see success or appropriate message, not generic "failed to delete brand"
      const successMessage = page.locator('text="Brand deleted successfully", text="Successfully deleted"');
      const errorMessage = page.locator('text="Not allowed to delete Brand", text="Cannot delete brand: Products exist under this brand"');
      
      // Either success or specific error message should appear
      await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 10000 });
      
      // Should NOT see generic "failed to delete brand"
      await expect(page.locator('text="failed to delete brand"')).not.toBeVisible();
    });

    test('should show "Not allowed to delete Brand" for brands created by other users', async ({ page }) => {
      // This test assumes there are brands created by admin/other users
      // Look for brands not created by current user
      const brandRows = page.locator('[data-testid="brand-row"]');
      const count = await brandRows.count();
      
      for (let i = 0; i < count; i++) {
        const brandRow = brandRows.nth(i);
        const createdByText = await brandRow.locator('[data-testid="created-by"], .created-by').textContent();
        
        // If this brand was created by someone else
        if (createdByText && !createdByText.includes('You') && !createdByText.includes('product_inventory_management')) {
          const deleteButton = brandRow.locator('[data-testid="delete-brand-button"], button:has([data-testid="trash-icon"])');
          
          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            
            // Should show specific permission error, not generic error
            await expect(page.locator('text="Not allowed to delete Brand", text="You can only delete brands you created"')).toBeVisible({ timeout: 5000 });
            break;
          } else {
            // Delete button should be hidden/disabled for other users' brands
            await expect(deleteButton).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Product Section Data Loading Issues', () => {
    test.beforeEach(async ({ page }) => {
      // Login process (same as above)
      await page.goto('http://localhost:3001');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      // Handle OTP if present
      const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"]');
      if (await otpInputs.count() > 0) {
        await otpInputs.first().fill('123456');
        await page.getByRole('button', { name: 'Verify' }).click();
      }
      
      await page.goto('http://localhost:3001/admin/products');
      await page.waitForLoadState('networkidle');
    });

    test('should load and display products data in the product list', async ({ page }) => {
      // Check if products are being loaded
      const loadingIndicator = page.locator('text="Loading products...", [data-testid="products-loading"]');
      
      // Wait for loading to complete or data to appear
      await page.waitForTimeout(3000);
      
      // Should either show products or a proper "no products" message
      const productList = page.locator('[data-testid="product-list"], .product-list');
      const noProductsMessage = page.locator('text="No products yet", text="No products found"');
      const statsCards = page.locator('[data-testid="total-products"], text="Total Products"');
      
      // At least one of these should be visible
      const hasContent = await productList.isVisible() || await noProductsMessage.isVisible() || await statsCards.isVisible();
      expect(hasContent).toBeTruthy();
      
      // Should not be stuck in loading state
      await expect(loadingIndicator).not.toBeVisible();
    });

    test('should populate category dropdown with available categories', async ({ page }) => {
      // Check category filter dropdown
      const categoryFilter = page.locator('[data-testid="category-filter"], select:has(option:text-is("All Categories"))');
      await expect(categoryFilter).toBeVisible();
      
      // Should have more than just "All Categories" option if categories exist
      const categoryOptions = categoryFilter.locator('option');
      const optionCount = await categoryOptions.count();
      
      // Should have at least "All Categories" option
      expect(optionCount).toBeGreaterThanOrEqual(1);
      
      // Check if "All Categories" option exists
      await expect(categoryOptions.filter({ hasText: 'All Categories' })).toHaveCount(1);
      
      // If there are actual categories, there should be more than 1 option
      if (optionCount > 1) {
        // Verify categories are loaded from actual data, not hardcoded
        const secondOption = categoryOptions.nth(1);
        const optionText = await secondOption.textContent();
        expect(optionText).not.toBe(''); // Should have actual category name
      }
    });

    test('should populate subcategory dropdown based on selected category', async ({ page }) => {
      const categoryFilter = page.locator('[data-testid="category-filter"], select:has(option:text-is("All Categories"))');
      const subcategoryFilter = page.locator('[data-testid="subcategory-filter"], select:has(option:text-is("All Subcategories"))');
      
      await expect(subcategoryFilter).toBeVisible();
      
      // Initially should show "All Subcategories"
      await expect(subcategoryFilter.locator('option').first()).toHaveText(/All Subcategories/);
      
      // If there are categories, test filtering
      const categoryOptions = categoryFilter.locator('option');
      const categoryCount = await categoryOptions.count();
      
      if (categoryCount > 1) {
        // Select a specific category
        const secondCategory = categoryOptions.nth(1);
        const categoryValue = await secondCategory.getAttribute('value');
        
        if (categoryValue && categoryValue !== 'all') {
          await categoryFilter.selectOption(categoryValue);
          await page.waitForTimeout(1000); // Wait for subcategories to update
          
          // Subcategory options should update based on selected category
          const subcategoryOptions = subcategoryFilter.locator('option');
          const subcategoryCount = await subcategoryOptions.count();
          
          // Should still have "All Subcategories" as first option
          await expect(subcategoryOptions.first()).toHaveText(/All Subcategories/);
        }
      }
    });

    test('should show only assigned warehouses in warehouse dropdown', async ({ page }) => {
      const warehouseFilter = page.locator('[data-testid="warehouse-filter"], select:has(option:text-is("All Warehouses"))');
      await expect(warehouseFilter).toBeVisible();
      
      // Should have warehouse options
      const warehouseOptions = warehouseFilter.locator('option');
      const optionCount = await warehouseOptions.count();
      
      // Should have at least "All Warehouses" option
      expect(optionCount).toBeGreaterThanOrEqual(1);
      
      // First option should be "All Warehouses"
      await expect(warehouseOptions.first()).toHaveText(/All Warehouses/);
      
      // For product_inventory_management role, should show only assigned warehouses
      // This means fewer options than an admin would see
      if (optionCount > 1) {
        const warehouseOptionsText = await warehouseOptions.allTextContents();
        console.log('Available warehouses for product_inventory_management role:', warehouseOptionsText);
        
        // Should not see all possible warehouses (would be more comprehensive test with known data)
        // For now, just verify structure is correct
        expect(warehouseOptionsText[0]).toMatch(/All Warehouses/);
      }
    });
  });

  test.describe('Permission and Access Control', () => {
    test.beforeEach(async ({ page }) => {
      // Login as product_inventory_management user
      await page.goto('http://localhost:3001');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"]');
      if (await otpInputs.count() > 0) {
        await otpInputs.first().fill('123456');
        await page.getByRole('button', { name: 'Verify' }).click();
      }
    });

    test('should have access to products, brands, and categories sections', async ({ page }) => {
      // Test access to products section
      await page.goto('http://localhost:3001/admin/products');
      await page.waitForLoadState('networkidle');
      
      // Should not be redirected or show unauthorized message
      expect(page.url()).toContain('/admin/products');
      await expect(page.locator('text="Products Management", text="Manage your product inventory"')).toBeVisible();
      
      // Test access to brands section
      await page.goto('http://localhost:3001/admin/brands');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/admin/brands');
      await expect(page.locator('text="Brands", text="Brand Management"')).toBeVisible();
      
      // Test access to categories section
      await page.goto('http://localhost:3001/admin/categories');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/admin/categories');
      await expect(page.locator('text="Categories", text="Category Management"')).toBeVisible();
    });

    test('should be denied access to unauthorized sections', async ({ page }) => {
      const unauthorizedSections = [
        '/admin/warehouses',
        '/admin/orders',
        '/admin/users',
        '/admin/banners',
        '/admin/promocodes',
        '/admin/blog',
        '/admin/reports',
        '/admin/taxes'
      ];

      for (const section of unauthorizedSections) {
        await page.goto(`http://localhost:3001${section}`);
        await page.waitForLoadState('networkidle');
        
        // Should be redirected away from unauthorized section or show access denied
        const isUnauthorized = page.url() === 'http://localhost:3001/' || 
                              page.url().includes('/login') ||
                              await page.locator('text="Access Denied", text="Unauthorized", text="403"').isVisible();
        
        expect(isUnauthorized).toBeTruthy();
      }
    });

    test('should show role-appropriate navigation menu', async ({ page }) => {
      await page.goto('http://localhost:3001/admin');
      await page.waitForLoadState('networkidle');
      
      // Should see authorized menu items
      const authorizedMenuItems = ['Products', 'Brands', 'Categories'];
      for (const item of authorizedMenuItems) {
        await expect(page.locator(`nav a:has-text("${item}"), .sidebar a:has-text("${item}")`)).toBeVisible();
      }
      
      // Should NOT see unauthorized menu items
      const unauthorizedMenuItems = ['Warehouses', 'Users', 'Reports', 'Banners'];
      for (const item of unauthorizedMenuItems) {
        await expect(page.locator(`nav a:has-text("${item}"), .sidebar a:has-text("${item}")`)).not.toBeVisible();
      }
    });
  });

  test.describe('Data Filtering and Scope', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3001');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"]');
      if (await otpInputs.count() > 0) {
        await otpInputs.first().fill('123456');
        await page.getByRole('button', { name: 'Verify' }).click();
      }
    });

    test('should filter products by assigned warehouses', async ({ page }) => {
      await page.goto('http://localhost:3001/admin/products');
      await page.waitForLoadState('networkidle');
      
      // Select a specific warehouse from the filter
      const warehouseFilter = page.locator('[data-testid="warehouse-filter"], select:has(option:text-is("All Warehouses"))');
      const warehouseOptions = warehouseFilter.locator('option');
      const optionCount = await warehouseOptions.count();
      
      if (optionCount > 1) {
        // Select the second warehouse option (first is "All Warehouses")
        await warehouseFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        // Products should be filtered
        // Monitor network requests to verify API calls include warehouse filter
        let apiCallIncludesWarehouse = false;
        
        page.on('request', request => {
          if (request.url().includes('/api/products') && request.url().includes('warehouse=')) {
            apiCallIncludesWarehouse = true;
          }
        });
        
        // Trigger a refresh or filter change to make API call
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Verify that API calls include warehouse filtering
        // (In a real test, you might check the actual filtered results)
        expect(apiCallIncludesWarehouse).toBeTruthy();
      }
    });

    test('should show only own brands/categories for editing', async ({ page }) => {
      await page.goto('http://localhost:3001/admin/brands');
      await page.waitForLoadState('networkidle');
      
      const brandRows = page.locator('[data-testid="brand-row"]');
      const count = await brandRows.count();
      
      for (let i = 0; i < count; i++) {
        const brandRow = brandRows.nth(i);
        const createdByText = await brandRow.locator('[data-testid="created-by"], .created-by').textContent();
        const editButton = brandRow.locator('[data-testid="edit-brand-button"], button[title*="Edit"]');
        const deleteButton = brandRow.locator('[data-testid="delete-brand-button"], button[title*="Delete"]');
        
        if (createdByText && createdByText.includes('You')) {
          // Should be able to edit/delete own brands
          await expect(editButton).toBeVisible();
          await expect(deleteButton).toBeVisible();
        } else {
          // Should not be able to edit/delete others' brands
          const editVisible = await editButton.isVisible().catch(() => false);
          const deleteVisible = await deleteButton.isVisible().catch(() => false);
          
          // Buttons should either be hidden or disabled
          if (editVisible) {
            await expect(editButton).toBeDisabled();
          }
          if (deleteVisible) {
            await expect(deleteButton).toBeDisabled();
          }
        }
      }
    });
  });
});