import { test, expect } from '@playwright/test';

test.describe('Warehouse Filtering Fix', () => {
  
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

  test('should only show assigned warehouses in dropdown, not all warehouses', async ({ page }) => {
    // First, check user's assigned warehouses via API
    const userWarehousesResponse = await page.request.get('http://localhost:4000/api/setup/my-warehouses', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    let expectedWarehouses = [];
    if (userWarehousesResponse.ok()) {
      const userData = await userWarehousesResponse.json();
      expectedWarehouses = userData.assignedWarehouses;
      console.log(`User has ${expectedWarehouses.length} assigned warehouses:`, expectedWarehouses.map(w => w.name));
    }
    
    // Navigate to add product form
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check warehouse dropdown
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const optionCount = await warehouseOptions.count();
      const optionTexts = await warehouseOptions.allTextContents();
      
      console.log(`Warehouse dropdown has ${optionCount} options:`, optionTexts);
      
      // Should have: 1 placeholder + assigned warehouses only
      // NOT all system warehouses (which would be 5+ warehouses)
      expect(optionCount).toBeLessThanOrEqual(expectedWarehouses.length + 1); // +1 for "Select Warehouse" placeholder
      
      // Should have at least assigned warehouses + placeholder
      expect(optionCount).toBeGreaterThan(1);
      
      // Verify specific assigned warehouse names are present
      if (expectedWarehouses.length > 0) {
        for (const assignedWarehouse of expectedWarehouses) {
          const warehouseInDropdown = optionTexts.some(text => 
            text.includes(assignedWarehouse.name)
          );
          expect(warehouseInDropdown).toBeTruthy();
          console.log(`✅ Found assigned warehouse in dropdown: ${assignedWarehouse.name}`);
        }
      }
      
      // Should NOT show warehouses that are not assigned
      // Check that we don't have an excessive number of options (indicating all warehouses)
      if (optionCount > 4) { // If more than 4 options, likely showing all warehouses
        console.log('❌ Too many warehouse options - likely showing all warehouses instead of filtered');
        expect(optionCount).toBeLessThanOrEqual(4); // Should be limited
      }
      
    } else {
      console.log('❌ Warehouse dropdown not found');
      expect(false).toBeTruthy(); // Fail if dropdown not found
    }
    
    console.log('✅ Warehouse dropdown shows only assigned warehouses');
  });

  test('should verify API returns only assigned warehouses, not all warehouses', async ({ page }) => {
    // Make API call to warehouses endpoint
    const warehousesResponse = await page.request.get('http://localhost:4000/api/warehouses', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    expect(warehousesResponse.status()).toBe(200);
    const warehouses = await warehousesResponse.json();
    
    console.log(`API returned ${warehouses.length} warehouses:`, warehouses.map(w => w.name));
    
    // Should return limited warehouses (not all 5+ system warehouses)
    expect(warehouses.length).toBeLessThanOrEqual(3); // Should be filtered to assigned warehouses only
    expect(warehouses.length).toBeGreaterThan(0); // Should have at least some warehouses
    
    // Verify these are the specific assigned warehouses
    const expectedWarehouseNames = ['WareHouse 1', 'Warehouse 2']; // From our setup script
    for (const warehouse of warehouses) {
      const isExpectedWarehouse = expectedWarehouseNames.includes(warehouse.name);
      expect(isExpectedWarehouse).toBeTruthy();
      console.log(`✅ Confirmed warehouse is assigned: ${warehouse.name}`);
    }
    
    console.log('✅ API correctly returns only assigned warehouses');
  });

  test('should compare warehouses shown vs total system warehouses (admin view)', async ({ page }) => {
    // Test with current user (product_inventory_management)
    const userWarehousesResponse = await page.request.get('http://localhost:4000/api/warehouses', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    const userWarehouses = userWarehousesResponse.ok() ? await userWarehousesResponse.json() : [];
    console.log(`Product inventory management user sees ${userWarehouses.length} warehouses`);
    
    // The user should see only their assigned warehouses (2), not all system warehouses (5)
    expect(userWarehouses.length).toBeLessThan(5); // Should be less than total system warehouses
    expect(userWarehouses.length).toBe(2); // Should be exactly 2 assigned warehouses
    
    // Verify warehouse names match assigned ones
    const warehouseNames = userWarehouses.map(w => w.name);
    expect(warehouseNames).toContain('WareHouse 1');
    expect(warehouseNames).toContain('Warehouse 2');
    
    // Should NOT contain other warehouses
    expect(warehouseNames).not.toContain('WareHouse 3');
    expect(warehouseNames).not.toContain('WareHouse 4');
    expect(warehouseNames).not.toContain('WareHouse 5');
    
    console.log('✅ Warehouse filtering working correctly - user sees only assigned warehouses');
  });

  test('warehouse dropdown selection should work with filtered warehouses', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    if (await warehouseDropdown.isVisible()) {
      const warehouseOptions = warehouseDropdown.locator('option');
      const optionCount = await warehouseOptions.count();
      
      if (optionCount > 1) {
        // Try to select an assigned warehouse (not the placeholder)
        await warehouseDropdown.selectOption({ index: 1 });
        
        // Get the selected value
        const selectedValue = await warehouseDropdown.inputValue();
        expect(selectedValue).not.toBe(''); // Should have a valid warehouse selected
        
        const selectedText = await warehouseDropdown.locator('option:checked').textContent();
        console.log(`Successfully selected warehouse: ${selectedText}`);
        
        // Should be one of the assigned warehouses
        const isAssignedWarehouse = selectedText?.includes('WareHouse 1') || selectedText?.includes('Warehouse 2');
        expect(isAssignedWarehouse).toBeTruthy();
        
        console.log('✅ Warehouse selection works with filtered warehouses');
      }
    }
  });

  test('should handle empty assigned warehouses gracefully', async ({ page }) => {
    // This test verifies behavior if a user has no warehouses assigned
    // (though our current test user should have warehouses)
    
    await page.goto('http://localhost:3001/admin/products/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if there's an appropriate message for no assigned warehouses
    const noWarehousesMessage = page.locator('text="No warehouses assigned to your account"');
    const warehouseDropdown = page.locator('select[name="warehouse"]');
    
    if (await noWarehousesMessage.isVisible()) {
      console.log('ℹ️  User has no assigned warehouses - showing appropriate message');
      expect(noWarehousesMessage).toBeVisible();
    } else if (await warehouseDropdown.isVisible()) {
      // Should have warehouse options if no error message
      const options = warehouseDropdown.locator('option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(1); // Should have options
      console.log('✅ User has assigned warehouses - dropdown populated');
    } else {
      console.log('❌ Neither warehouse dropdown nor error message found');
      expect(false).toBeTruthy(); // Should have one or the other
    }
  });
});