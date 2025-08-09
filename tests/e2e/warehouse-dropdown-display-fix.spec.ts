import { test, expect } from '@playwright/test';

test.describe('Warehouse Dropdown Display Fix', () => {
  
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

  test('warehouse dropdown should show only warehouse names, not addresses', async ({ page }) => {
    // Navigate to add product form
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check warehouse dropdown
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const optionTexts = await warehouseOptions.allTextContents();
      
      console.log('Warehouse dropdown options:', optionTexts);
      
      // Filter out the placeholder option
      const warehouseOptionTexts = optionTexts.filter(text => text !== 'Select Warehouse');
      
      for (const optionText of warehouseOptionTexts) {
        console.log(`Checking warehouse option: "${optionText}"`);
        
        // Should NOT contain address indicators like commas, "Street", "Nagar", etc.
        expect(optionText).not.toContain(','); // Addresses typically have commas
        expect(optionText).not.toMatch(/.*Street.*/); // Should not contain "Street"
        expect(optionText).not.toMatch(/.*Nagar.*/); // Should not contain "Nagar"
        expect(optionText).not.toMatch(/.*Road.*/); // Should not contain "Road"
        expect(optionText).not.toMatch(/.*Area.*/); // Should not contain "Area"
        expect(optionText).not.toMatch(/.*City.*/); // Should not contain "City"
        expect(optionText).not.toMatch(/.*Pin.*/); // Should not contain "Pin"
        expect(optionText).not.toMatch(/.*-.*-.*-/); // Should not have multiple dashes (indicating formatted address)
        
        // Should be clean warehouse names like "WareHouse 1", "Warehouse 2"
        expect(optionText.length).toBeLessThan(30); // Warehouse names should be reasonably short
        expect(optionText.trim()).toBe(optionText); // No extra whitespace
        
        console.log(`✅ Warehouse option looks clean: "${optionText}"`);
      }
      
      // Verify we have the expected warehouse names
      const expectedWarehouses = ['WareHouse 1', 'Warehouse 2'];
      for (const expectedWarehouse of expectedWarehouses) {
        const foundExpected = optionTexts.some(text => text === expectedWarehouse);
        expect(foundExpected).toBeTruthy();
        console.log(`✅ Found expected warehouse name: "${expectedWarehouse}"`);
      }
      
      console.log('✅ Warehouse dropdown shows only clean warehouse names');
      
    } else {
      console.log('❌ Warehouse dropdown not found');
      expect(false).toBeTruthy();
    }
  });

  test('warehouse dropdown options should be concise and readable', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const optionTexts = await warehouseOptions.allTextContents();
      
      // Filter out placeholder
      const warehouseNames = optionTexts.filter(text => text !== 'Select Warehouse');
      
      for (const warehouseName of warehouseNames) {
        // Should be concise (not overly long)
        expect(warehouseName.length).toBeLessThan(50);
        
        // Should not be empty
        expect(warehouseName.trim().length).toBeGreaterThan(0);
        
        // Should not contain typical address patterns
        const hasAddressPattern = warehouseName.includes(' - ') || 
                                 warehouseName.match(/\d{6}/) || // Pin codes
                                 warehouseName.includes(', '); // Address separators
        expect(hasAddressPattern).toBeFalsy();
        
        console.log(`✅ Warehouse name is concise: "${warehouseName}" (${warehouseName.length} chars)`);
      }
      
      console.log('✅ All warehouse names are concise and readable');
    }
  });

  test('warehouse selection should work with clean names', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await warehouseDropdown.isVisible()) {
      const options = warehouseDropdown.locator('option');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        // Select first warehouse (not placeholder)
        await warehouseDropdown.selectOption({ index: 1 });
        
        const selectedValue = await warehouseDropdown.inputValue();
        expect(selectedValue).not.toBe('');
        
        const selectedText = await warehouseDropdown.locator('option:checked').textContent();
        console.log(`Selected warehouse: "${selectedText}"`);
        
        // Verify selected text is clean (no address)
        expect(selectedText).not.toContain(' - ');
        expect(selectedText).not.toContain(',');
        
        // Should be one of our expected clean names
        const isExpectedName = selectedText === 'WareHouse 1' || selectedText === 'Warehouse 2';
        expect(isExpectedName).toBeTruthy();
        
        console.log('✅ Warehouse selection works with clean names');
      }
    }
  });

  test('form should display selected warehouse name cleanly', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await warehouseDropdown.isVisible()) {
      // Select a warehouse
      await warehouseDropdown.selectOption({ index: 1 });
      
      // Check if there's any form summary or display that shows the selected warehouse
      const formSummary = page.locator('.form-summary, .product-summary, .warehouse-display');
      
      if (await formSummary.isVisible()) {
        const summaryText = await formSummary.textContent();
        
        // Should show warehouse name without address
        expect(summaryText).not.toContain('Jaipur, Rajasthan');
        expect(summaryText).not.toContain('Mumbai, Maharashtra');
        
        console.log('Form summary shows clean warehouse name');
      }
      
      // Verify dropdown value itself
      const selectedOption = warehouseDropdown.locator('option:checked');
      const selectedText = await selectedOption.textContent();
      
      // Final verification that selected option is clean
      expect(selectedText).toBe('WareHouse 1'); // or 'Warehouse 2'
      expect(selectedText).not.toMatch(/.*,.*,.*,/); // No multiple commas (address format)
      
      console.log(`✅ Selected warehouse displays cleanly: "${selectedText}"`);
    }
  });

  test('compare before and after: warehouse names should be cleaner than before', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await warehouseDropdown.isVisible()) {
      const optionTexts = await warehouseDropdown.locator('option').allTextContents();
      const warehouseNames = optionTexts.filter(text => text !== 'Select Warehouse');
      
      console.log('Current warehouse dropdown options:', warehouseNames);
      
      // Expected clean names (after fix)
      const expectedCleanNames = ['WareHouse 1', 'Warehouse 2'];
      
      // These would be the messy names from before the fix:
      const messyPatterns = [
        /.*Jaipur.*Rajasthan.*/,  // Full address pattern
        /.*Mumbai.*Maharashtra.*/, // Full address pattern  
        /.*-.*-.*-.*-/,           // Multiple dashes
        /.*,.*,.*,.*/             // Multiple commas
      ];
      
      // Verify current names are clean
      for (const warehouseName of warehouseNames) {
        const isMessy = messyPatterns.some(pattern => pattern.test(warehouseName));
        expect(isMessy).toBeFalsy();
        
        const isClean = expectedCleanNames.includes(warehouseName);
        expect(isClean).toBeTruthy();
        
        console.log(`✅ Warehouse name is clean and expected: "${warehouseName}"`);
      }
      
      console.log('✅ Warehouse names are properly cleaned up');
    }
  });
});