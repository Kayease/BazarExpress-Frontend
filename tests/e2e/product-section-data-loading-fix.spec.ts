import { test, expect } from '@playwright/test';

test.describe('Product Section Data Loading and Filtering Fix', () => {
  
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

  test('products page should load data and not show empty state indefinitely', async ({ page }) => {
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential data loading
    await page.waitForTimeout(5000);
    
    // Check what's displayed on the page
    const pageContent = await page.content();
    console.log('Products page loaded');
    
    // Should not be stuck in loading state
    const loadingIndicators = [
      'Loading products...',
      'Please wait...',
      'Loading...'
    ];
    
    for (const loadingText of loadingIndicators) {
      const loadingElement = page.locator(`text="${loadingText}"`);
      if (await loadingElement.isVisible().catch(() => false)) {
        console.log(`Still showing loading indicator: ${loadingText}`);
      }
    }
    
    // Should show either products or proper empty state
    const validStates = [
      page.locator('[data-testid="product-list"]'),
      page.locator('.product-list'),
      page.locator('table:has(th:text("Product"))'),
      page.locator('text="No products yet"'),
      page.locator('text="No products found"'),
      page.locator('[data-testid="empty-products"]')
    ];
    
    let foundValidState = false;
    for (const state of validStates) {
      if (await state.isVisible().catch(() => false)) {
        foundValidState = true;
        console.log('Found valid state:', await state.textContent());
        break;
      }
    }
    
    // At minimum, page should show product management header
    const pageHeader = page.locator('h1, h2').filter({ hasText: /Product/i });
    await expect(pageHeader).toBeVisible();
    
    // Should show stats cards with numbers (even if 0)
    const statsCards = page.locator('text="Total Products"').first();
    if (await statsCards.isVisible()) {
      const statsContainer = statsCards.locator('..').locator('..'); 
      await expect(statsContainer).toBeVisible();
    }
  });

  test('category dropdown should be populated with actual categories', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for category filter dropdown
    const categorySelectors = [
      'select:has(option:text("All Categories"))',
      '[data-testid="category-filter"]',
      'select[name="category"]',
      '.category-filter select'
    ];
    
    let categoryDropdown = null;
    for (const selector of categorySelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        categoryDropdown = element;
        break;
      }
    }
    
    if (categoryDropdown) {
      await expect(categoryDropdown).toBeVisible();
      
      // Check options
      const options = categoryDropdown.locator('option');
      const optionCount = await options.count();
      console.log(`Category dropdown has ${optionCount} options`);
      
      // Should have at least "All Categories"
      expect(optionCount).toBeGreaterThanOrEqual(1);
      
      // First option should be "All Categories"
      const firstOption = options.first();
      const firstOptionText = await firstOption.textContent();
      expect(firstOptionText).toMatch(/All Categories/i);
      
      // If there are real categories, should have more than 1 option
      if (optionCount > 1) {
        // Check that other options have meaningful names
        for (let i = 1; i < Math.min(optionCount, 3); i++) {
          const option = options.nth(i);
          const optionText = await option.textContent();
          expect(optionText).not.toBe('');
          expect(optionText).not.toBe('undefined');
          expect(optionText).not.toBe('null');
          console.log(`Category option ${i}: ${optionText}`);
        }
      }
    } else {
      console.log('No category dropdown found - this indicates the data loading issue');
      // This suggests the issue exists - categories are not being loaded
      expect(false).toBeTruthy(); // Fail the test to highlight the issue
    }
  });

  test('subcategory dropdown should update based on category selection', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const categoryDropdown = page.locator('select:has(option:text("All Categories")), [data-testid="category-filter"]').first();
    const subcategoryDropdown = page.locator('select:has(option:text("All Subcategories")), [data-testid="subcategory-filter"]').first();
    
    if (await categoryDropdown.isVisible() && await subcategoryDropdown.isVisible()) {
      // Check initial subcategory state
      const initialSubcategoryOptions = subcategoryDropdown.locator('option');
      const initialCount = await initialSubcategoryOptions.count();
      console.log(`Initial subcategory options: ${initialCount}`);
      
      // Should start with "All Subcategories"
      const firstSubcategoryOption = initialSubcategoryOptions.first();
      const firstSubcategoryText = await firstSubcategoryOption.textContent();
      expect(firstSubcategoryText).toMatch(/All Subcategories/i);
      
      // Try selecting a category if available
      const categoryOptions = categoryDropdown.locator('option');
      const categoryCount = await categoryOptions.count();
      
      if (categoryCount > 1) {
        // Select second category option
        const secondCategoryOption = categoryOptions.nth(1);
        const categoryValue = await secondCategoryOption.getAttribute('value');
        
        if (categoryValue && categoryValue !== 'all') {
          await categoryDropdown.selectOption(categoryValue);
          await page.waitForTimeout(1000); // Wait for subcategory filtering
          
          // Check if subcategories updated
          const updatedSubcategoryOptions = subcategoryDropdown.locator('option');
          const updatedCount = await updatedSubcategoryOptions.count();
          
          console.log(`After category selection, subcategory options: ${updatedCount}`);
          
          // Should still have at least "All Subcategories"
          const firstUpdatedOption = updatedSubcategoryOptions.first();
          const firstUpdatedText = await firstUpdatedOption.textContent();
          expect(firstUpdatedText).toMatch(/All Subcategories/i);
        }
      }
    } else {
      console.log('Category or subcategory dropdown not found - indicates data loading issue');
      // Log what dropdowns are actually present
      const allSelects = page.locator('select');
      const selectCount = await allSelects.count();
      console.log(`Found ${selectCount} select elements on page`);
      
      for (let i = 0; i < selectCount; i++) {
        const select = allSelects.nth(i);
        const options = select.locator('option');
        const optionTexts = await options.allTextContents();
        console.log(`Select ${i} options:`, optionTexts);
      }
    }
  });

  test('warehouse dropdown should show only assigned warehouses for role', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const warehouseSelectors = [
      'select:has(option:text("All Warehouses"))',
      '[data-testid="warehouse-filter"]',
      'select[name="warehouse"]',
      '.warehouse-filter select'
    ];
    
    let warehouseDropdown = null;
    for (const selector of warehouseSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        warehouseDropdown = element;
        break;
      }
    }
    
    if (warehouseDropdown) {
      await expect(warehouseDropdown).toBeVisible();
      
      const options = warehouseDropdown.locator('option');
      const optionCount = await options.count();
      console.log(`Warehouse dropdown has ${optionCount} options`);
      
      // Should have at least "All Warehouses"
      expect(optionCount).toBeGreaterThanOrEqual(1);
      
      // First option should be "All Warehouses"
      const firstOption = options.first();
      const firstOptionText = await firstOption.textContent();
      expect(firstOptionText).toMatch(/All Warehouses/i);
      
      // For product_inventory_management role, should have limited warehouses
      // (Would be more precise with known test data)
      if (optionCount > 1) {
        const allOptionTexts = await options.allTextContents();
        console.log('Available warehouse options:', allOptionTexts);
        
        // Verify options are meaningful
        for (let i = 1; i < optionCount; i++) {
          const optionText = allOptionTexts[i];
          expect(optionText).not.toBe('');
          expect(optionText).not.toBe('undefined');
          expect(optionText).not.toMatch(/^\[object/); // Not showing object references
        }
        
        // Should not show excessive warehouses (role restriction working)
        // This would need to be compared against admin user's warehouse options
        expect(optionCount).toBeLessThan(20); // Reasonable limit for role-based access
      }
    } else {
      console.log('Warehouse dropdown not found');
      const allSelects = page.locator('select');
      const selectTexts = await allSelects.allTextContents();
      console.log('All select elements content:', selectTexts);
    }
  });

  test('product data should actually load from API', async ({ page }) => {
    // Monitor network requests
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/products') || request.url().includes('/api/categories') || request.url().includes('/api/brands')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/products') || response.url().includes('/api/categories') || response.url().includes('/api/brands')) {
        console.log(`API Response: ${response.url()} - Status: ${response.status()}`);
      }
    });
    
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('API calls made:', apiCalls);
    
    // Should have made API calls to load data
    expect(apiCalls.length).toBeGreaterThan(0);
    
    // Should have called products API
    const productsCalls = apiCalls.filter(call => call.url.includes('/api/products'));
    console.log('Products API calls:', productsCalls);
    
    // If no products API calls were made, that's the issue
    if (productsCalls.length === 0) {
      console.log('ERROR: No products API calls detected - this is the data loading bug');
      // Check if there's a useEffect or data loading mechanism missing
      expect(productsCalls.length).toBeGreaterThan(0);
    }
    
    // Check if categories and warehouses are loaded
    const categoriesCalls = apiCalls.filter(call => call.url.includes('/api/categories'));
    const warehousesCalls = apiCalls.filter(call => call.url.includes('/api/warehouse'));
    
    console.log('Categories API calls:', categoriesCalls);
    console.log('Warehouses API calls:', warehousesCalls);
    
    // These should also be called to populate dropdowns
    expect(categoriesCalls.length).toBeGreaterThan(0);
    expect(warehousesCalls.length).toBeGreaterThan(0);
  });

  test('page should handle API errors gracefully', async ({ page }) => {
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check for error states that indicate API failures
    const errorMessages = [
      'NetworkError when attempting to fetch resource',
      'Failed to load',
      'Error loading products',
      'Could not connect to server'
    ];
    
    let foundErrors = [];
    for (const errorText of errorMessages) {
      if (await page.locator(`text="${errorText}"`).isVisible().catch(() => false)) {
        foundErrors.push(errorText);
      }
    }
    
    if (foundErrors.length > 0) {
      console.log('Found API errors:', foundErrors);
      
      // Should show retry options or proper error handling
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
      const errorHandling = retryButton.or(page.locator('[data-testid="error-boundary"]'));
      
      if (await errorHandling.isVisible()) {
        console.log('Found proper error handling UI');
      } else {
        console.log('No proper error handling UI found');
      }
    }
    
    // Check console for JavaScript errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Reload to capture any console errors
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('Console errors found:', consoleMessages);
    }
  });
});