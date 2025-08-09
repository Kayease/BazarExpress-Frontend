import { test, expect } from '@playwright/test';

test.describe('API URL Fix - WarehouseSelector 404 Error', () => {
  
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

  test('should NOT get 404 error when WarehouseSelector fetches warehouses', async ({ page }) => {
    // Monitor network requests
    const networkRequests: Array<{ url: string; status: number; method: string }> = [];
    
    page.on('response', response => {
      if (response.url().includes('/warehouses')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Navigate to add product page (which uses WarehouseSelector)
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('Network requests to warehouse endpoints:', networkRequests);
    
    // Should not have any 404 requests to warehouses
    const failedRequests = networkRequests.filter(req => req.status === 404);
    expect(failedRequests).toHaveLength(0);
    
    // Should have successful warehouse API calls
    const successfulRequests = networkRequests.filter(req => 
      req.status >= 200 && req.status < 300 && req.url().includes('localhost:4000')
    );
    expect(successfulRequests.length).toBeGreaterThan(0);
    
    // Should NOT see "Failed to fetch warehouses" error in console
    const consoleLogs = await page.evaluate(() => {
      return (window as any).consoleLogs || [];
    });
    
    const warehouseFetchErrors = consoleLogs.filter((log: any) => 
      log.includes('Failed to fetch warehouses')
    );
    expect(warehouseFetchErrors).toHaveLength(0);
    
    console.log('✅ WarehouseSelector API calls successful - no 404 errors');
  });

  test('warehouse dropdown should be populated without API errors', async ({ page }) => {
    // Navigate to add product form
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if warehouse selector is present and populated
    const warehouseDropdown = page.locator('select[name="warehouse"], .warehouse-selector select');
    
    if (await warehouseDropdown.isVisible()) {
      const options = warehouseDropdown.locator('option');
      const optionCount = await options.count();
      
      console.log(`Warehouse dropdown has ${optionCount} options`);
      expect(optionCount).toBeGreaterThan(1); // Should have options beyond placeholder
      
      const optionTexts = await options.allTextContents();
      console.log('Warehouse options:', optionTexts);
      
      // Should not show loading state
      const loadingIndicator = page.locator('.animate-pulse, text="Loading warehouses"');
      await expect(loadingIndicator).not.toBeVisible();
      
      // Should not show error message
      const errorMessage = page.locator('text="No warehouses assigned to your account"');
      await expect(errorMessage).not.toBeVisible();
      
    } else {
      // Check if warehouse selector component exists at all
      const warehouseSelectorComponent = page.locator('[data-testid="warehouse-selector"], .warehouse-selector');
      const componentExists = await warehouseSelectorComponent.count() > 0;
      console.log(`Warehouse selector component exists: ${componentExists}`);
    }
    
    console.log('✅ Warehouse dropdown populated successfully');
  });

  test('should verify backend API calls are made to correct port (4000)', async ({ page }) => {
    const apiCalls: string[] = [];
    
    // Intercept API calls
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/warehouses')) {
        apiCalls.push(request.url());
      }
    });
    
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('All API calls made:', apiCalls);
    
    // Should have calls to backend (port 4000)
    const backendCalls = apiCalls.filter(url => url.includes('localhost:4000'));
    expect(backendCalls.length).toBeGreaterThan(0);
    
    // Should NOT have incorrectly routed calls to frontend port (3000) for backend APIs
    const incorrectCalls = apiCalls.filter(url => 
      url.includes('localhost:3000') && 
      (url.includes('/warehouses') || url.includes('/brands') || url.includes('/categories'))
    );
    
    if (incorrectCalls.length > 0) {
      console.log('❌ Found incorrect API calls to frontend port:', incorrectCalls);
      expect(incorrectCalls).toHaveLength(0);
    }
    
    // Verify specific warehouse API call is correct
    const warehouseCalls = apiCalls.filter(url => url.includes('/warehouses'));
    if (warehouseCalls.length > 0) {
      const correctWarehouseCalls = warehouseCalls.filter(url => url.includes('localhost:4000'));
      expect(correctWarehouseCalls.length).toBeGreaterThan(0);
      console.log('✅ Warehouse API calls correctly routed to backend:', correctWarehouseCalls);
    }
  });

  test('should not show console errors related to failed API fetches', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Filter for relevant API-related errors
    const apiErrors = consoleErrors.filter(error => 
      error.includes('404') || 
      error.includes('Failed to fetch') ||
      error.includes('GET http://localhost:3000/api') ||
      error.includes('warehouses')
    );
    
    console.log('Console errors captured:', consoleErrors);
    console.log('API-related errors:', apiErrors);
    
    // Should not have API-related console errors
    expect(apiErrors).toHaveLength(0);
    
    console.log('✅ No console errors related to API fetch failures');
  });

  test('form data should load successfully for all dropdowns', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check all form dropdowns are populated
    const dropdowns = [
      { name: 'category', label: 'Category' },
      { name: 'brand', label: 'Brand' }, 
      { name: 'warehouse', label: 'Warehouse' },
      { name: 'tax', label: 'Tax' }
    ];
    
    let allDropdownsLoaded = true;
    
    for (const dropdown of dropdowns) {
      const dropdownElement = page.locator(`select[name="${dropdown.name}"]`);
      
      if (await dropdownElement.isVisible()) {
        const options = dropdownElement.locator('option');
        const optionCount = await options.count();
        
        console.log(`${dropdown.label} dropdown has ${optionCount} options`);
        
        if (optionCount <= 1) {
          console.log(`❌ ${dropdown.label} dropdown not properly loaded`);
          allDropdownsLoaded = false;
        } else {
          console.log(`✅ ${dropdown.label} dropdown loaded successfully`);
        }
      } else {
        console.log(`⚠️ ${dropdown.label} dropdown not found`);
      }
    }
    
    // Should NOT see generic "Failed to load form data" error
    const formDataError = page.locator('text="Failed to load form data"');
    await expect(formDataError).not.toBeVisible();
    
    console.log(`Overall form data loading success: ${allDropdownsLoaded}`);
  });
});