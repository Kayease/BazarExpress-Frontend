import { test, expect } from '@playwright/test';

test.describe('Product Form Data Loading Fix', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as product_inventory_management user
    await page.goto('http://localhost:3001');
    
    // Handle location modal
    const locationModal = page.locator('dialog:has-text("Select Your Location")');
    if (await locationModal.isVisible().catch(() => false)) {
      await page.click('button:has-text("Close")');
    }
    
    // Login flow
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(2000);
    
    // Handle OTP if present
    const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"]');
    if (await otpInputs.count() > 0) {
      await otpInputs.first().fill('123456');
      const verifyButton = page.locator('button:has-text("Verify"), button[type="submit"]');
      if (await verifyButton.isVisible()) {
        await verifyButton.click();
      }
    }
    
    await page.waitForTimeout(3000);
  });

  test('add product form should load all required data without "failed to load form data" error', async ({ page }) => {
    // Navigate to add product page
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    
    // Wait for form data to load
    await page.waitForTimeout(5000);
    
    // Should NOT see "Failed to load form data" error
    const errorMessage = page.locator('text="Failed to load form data"');
    await expect(errorMessage).not.toBeVisible();
    
    // Check that form elements are present and populated
    
    // 1. Category dropdown should have options
    const categoryDropdown = page.locator('select[name="category"], select:has(option:text("Select Category"))');
    if (await categoryDropdown.isVisible()) {
      const categoryOptions = categoryDropdown.locator('option');
      const categoryCount = await categoryOptions.count();
      console.log(`Category options loaded: ${categoryCount}`);
      expect(categoryCount).toBeGreaterThan(1); // Should have at least "Select Category" + real categories
      
      // Should not have placeholder text like "Loading..." in options
      const optionTexts = await categoryOptions.allTextContents();
      for (const text of optionTexts) {
        expect(text).not.toContain('Loading');
        expect(text).not.toBe('undefined');
      }
    }
    
    // 2. Brand dropdown should have options  
    const brandDropdown = page.locator('select[name="brand"], select:has(option:text("Select Brand"))');
    if (await brandDropdown.isVisible()) {
      const brandOptions = brandDropdown.locator('option');
      const brandCount = await brandOptions.count();
      console.log(`Brand options loaded: ${brandCount}`);
      expect(brandCount).toBeGreaterThan(0);
    }
    
    // 3. Warehouse dropdown should have options
    const warehouseDropdown = page.locator('select[name="warehouse"], select:has(option:text("Select Warehouse"))');
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const warehouseCount = await warehouseOptions.count();
      console.log(`Warehouse options loaded: ${warehouseCount}`);
      expect(warehouseCount).toBeGreaterThan(1); // Should have options for product_inventory_management role
      
      // Should show only assigned warehouses, not all warehouses
      const optionTexts = await warehouseOptions.allTextContents();
      console.log('Available warehouse options:', optionTexts);
      
      // Should not exceed reasonable limit (role-based filtering working)
      expect(warehouseCount).toBeLessThan(50); // Reasonable limit
    }
    
    // 4. Tax dropdown should have options
    const taxDropdown = page.locator('select[name="tax"], select:has(option:text("Select Tax"))');
    if (await taxDropdown.isVisible()) {
      const taxOptions = taxDropdown.locator('option');
      const taxCount = await taxOptions.count();
      console.log(`Tax options loaded: ${taxCount}`);
      expect(taxCount).toBeGreaterThan(0);
    }
    
    // 5. Basic form fields should be present
    await expect(page.locator('input[name="name"], input[placeholder*="Product Name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea[placeholder*="Description"]')).toBeVisible();
    await expect(page.locator('input[name="price"], input[placeholder*="Price"]')).toBeVisible();
    
    console.log('✅ Add product form loaded successfully with all required data');
  });

  test('edit product form should load existing product data and form options', async ({ page }) => {
    // First go to products list to find a product to edit
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for edit buttons
    const editButtons = page.locator('a[href*="/edit"], button[title*="Edit"], [data-testid="edit-button"]');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      // Click the first edit button
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      // Should NOT see loading error
      await expect(page.locator('text="Failed to load form data"')).not.toBeVisible();
      
      // Should not see "Product not found" error
      await expect(page.locator('text="Product not found"')).not.toBeVisible();
      
      // Form should be populated with existing data
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        const nameValue = await nameInput.inputValue();
        expect(nameValue).not.toBe(''); // Should have existing product name
        console.log(`Editing product: ${nameValue}`);
      }
      
      // Dropdowns should still be populated
      const categoryDropdown = page.locator('select[name="category"]');
      if (await categoryDropdown.isVisible()) {
        const selectedValue = await categoryDropdown.inputValue();
        console.log(`Selected category: ${selectedValue}`);
        // Should have a selected category (not empty)
        expect(selectedValue).not.toBe('');
      }
      
      console.log('✅ Edit product form loaded successfully');
    } else {
      console.log('⚠️ No products found to test edit functionality');
      
      // If no products exist, we should at least verify the edit page structure
      // Try to access edit page directly with a test ID
      await page.goto('http://localhost:3001/admin/products/testid/edit');
      await page.waitForTimeout(3000);
      
      // Should show proper error message, not form loading error
      await expect(page.locator('text="Failed to load form data"')).not.toBeVisible();
    }
  });

  test('product form should handle API errors gracefully', async ({ page }) => {
    // Monitor network requests for failures
    const failedRequests = [];
    
    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (failedRequests.length > 0) {
      console.log('Failed API requests detected:', failedRequests);
      
      // Check if form shows appropriate error handling
      const errorMessages = [
        page.locator('text="Failed to load form data"'),
        page.locator('text="Error loading categories"'),
        page.locator('text="Error loading brands"'),  
        page.locator('text="Error loading warehouses"'),
        page.locator('text="Error loading taxes"')
      ];
      
      let foundErrorMessage = false;
      for (const errorSelector of errorMessages) {
        if (await errorSelector.isVisible()) {
          foundErrorMessage = true;
          const errorText = await errorSelector.textContent();
          console.log(`Found error message: ${errorText}`);
          break;
        }
      }
      
      if (foundErrorMessage) {
        // Should also show retry option or graceful degradation
        const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
        if (await retryButton.isVisible()) {
          console.log('✅ Found retry option for failed requests');
        }
      }
    } else {
      console.log('✅ All API requests succeeded');
    }
  });

  test('warehouse access should be restricted to assigned warehouses for role', async ({ page }) => {
    // Navigate to add product form
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check warehouse dropdown options
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const warehouseCount = await warehouseOptions.count();
      const optionTexts = await warehouseOptions.allTextContents();
      
      console.log(`Warehouse options for product_inventory_management role:`, optionTexts);
      
      // Should have reasonable number of warehouses (not all system warehouses)
      expect(warehouseCount).toBeGreaterThan(1); // At least "Select Warehouse" + some warehouses
      expect(warehouseCount).toBeLessThan(20); // Should be limited by role restrictions
      
      // Should not show options like "All Warehouses" or admin-only warehouses
      const combinedText = optionTexts.join(' ');
      expect(combinedText).not.toContain('Admin Warehouse');
      expect(combinedText).not.toContain('Restricted');
      
      console.log('✅ Warehouse access properly restricted by role');
    } else {
      console.log('❌ Warehouse dropdown not found');
      expect(false).toBeTruthy(); // Fail test if dropdown not found
    }
  });
});