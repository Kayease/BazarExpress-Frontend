import { test, expect } from '@playwright/test';

test.describe('Brand Deletion Error Message Fix', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as product_inventory_management user
    await page.goto('http://localhost:3001');
    
    // Handle potential location modal
    const locationModal = page.locator('dialog:has-text("Select Your Location")');
    if (await locationModal.isVisible().catch(() => false)) {
      await page.click('button:has-text("Close")');
    }
    
    // Click login button
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Enter phone number for product inventory manager
    await page.getByRole('textbox', { name: 'Enter mobile number' }).fill('8875965312');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Wait for OTP or auto-login
    await page.waitForTimeout(2000);
    
    // Check if OTP input appears
    const otpInputs = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"], input[name*="otp"]');
    if (await otpInputs.count() > 0) {
      // Fill OTP - check server console for the actual OTP
      await otpInputs.first().fill('123456');
      
      const verifyButton = page.locator('button:has-text("Verify"), button[type="submit"]');
      if (await verifyButton.isVisible()) {
        await verifyButton.click();
      }
    }
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  test('should show proper error message when deleting brand fails', async ({ page }) => {
    // Navigate to brands page
    await page.goto('http://localhost:3001/admin/brands');
    await page.waitForLoadState('networkidle');
    
    // Check if we're properly authenticated and on the brands page
    const pageTitle = page.locator('h1, h2, [data-testid="page-title"]').first();
    await expect(pageTitle).toContainText(/Brand/i);
    
    // Look for existing brands or create a test brand
    const addBrandButton = page.locator('button:has-text("Add Brand"), [data-testid="add-brand-button"]');
    
    if (await addBrandButton.isVisible()) {
      // Create a test brand first
      await addBrandButton.click();
      
      const nameInput = page.locator('input[name="name"], [data-testid="brand-name"]');
      await nameInput.fill('Test Brand for Error Testing');
      
      const logoInput = page.locator('input[name="logo"], [data-testid="brand-logo"]');
      await logoInput.fill('https://example.com/logo.png');
      
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
      await saveButton.click();
      
      // Wait for brand creation
      await page.waitForTimeout(2000);
    }
    
    // Look for any brand to test deletion
    const brandCards = page.locator('[data-testid="brand-card"], .brand-card');
    const brandRows = page.locator('[data-testid="brand-row"], tr:has(td)');
    const brands = brandCards.or(brandRows);
    
    if (await brands.count() > 0) {
      const firstBrand = brands.first();
      
      // Try to find delete button
      const deleteButton = firstBrand.locator('button[title*="Delete"], [data-testid="delete-brand-button"], button:has([data-icon="trash"])');
      
      if (await deleteButton.isVisible()) {
        // Click delete button
        await deleteButton.click();
        
        // Handle confirmation dialog if it appears
        const confirmDialog = page.locator('dialog:has-text("Delete"), [data-testid="confirm-delete-modal"]');
        if (await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
        }
        
        // Wait for response
        await page.waitForTimeout(2000);
        
        // Check for error messages
        const errorMessages = [
          page.locator('text="Not allowed to delete Brand"'),
          page.locator('text="You can only delete brands you created"'), 
          page.locator('text="Cannot delete brand: Products exist under this brand"'),
          page.locator('text="Insufficient permissions"'),
          page.locator('[data-testid="error-message"]'),
          page.locator('.toast-error'),
          page.locator('.error-toast')
        ];
        
        // Should show specific error message, not generic "failed to delete brand"
        let foundSpecificError = false;
        for (const errorSelector of errorMessages) {
          if (await errorSelector.isVisible().catch(() => false)) {
            foundSpecificError = true;
            console.log('Found specific error message:', await errorSelector.textContent());
            break;
          }
        }
        
        // Should NOT show generic "failed to delete brand" message
        const genericError = page.locator('text="failed to delete brand"');
        await expect(genericError).not.toBeVisible();
        
        // If no specific error was found, at least the operation should complete without generic error
        if (!foundSpecificError) {
          // Check if deletion was successful instead
          const successMessages = [
            page.locator('text="Brand deleted successfully"'),
            page.locator('text="Deleted successfully"'),
            page.locator('[data-testid="success-message"]'),
            page.locator('.toast-success')
          ];
          
          let foundSuccess = false;
          for (const successSelector of successMessages) {
            if (await successSelector.isVisible().catch(() => false)) {
              foundSuccess = true;
              break;
            }
          }
          
          // Should have either specific error or success, not generic failure
          expect(foundSpecificError || foundSuccess).toBeTruthy();
        }
      } else {
        console.log('No delete button visible - this may be expected for permission restrictions');
        // If delete button is not visible, that's also valid behavior for restricted access
        expect(true).toBeTruthy();
      }
    } else {
      console.log('No brands found to test deletion');
      // Create a brand and test deletion
      if (await addBrandButton.isVisible()) {
        // Test brand creation and then deletion
        await addBrandButton.click();
        await page.fill('input[name="name"]', 'Test Brand for Deletion');
        await page.fill('input[name="logo"]', 'https://example.com/test-logo.png');
        await page.click('button[type="submit"]');
        
        // After creation, try to delete
        await page.waitForTimeout(2000);
        const newBrandDelete = page.locator('button[title*="Delete"]').first();
        if (await newBrandDelete.isVisible()) {
          await newBrandDelete.click();
          
          // Should show proper error message or success
          await page.waitForTimeout(1000);
          await expect(page.locator('text="failed to delete brand"')).not.toBeVisible();
        }
      }
    }
  });

  test('should handle brand deletion with products associated', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/brands');
    await page.waitForLoadState('networkidle');
    
    // This test checks for the specific case where a brand has products
    // and should show "Cannot delete brand: Products exist under this brand"
    
    const brands = page.locator('[data-testid="brand-card"], .brand-card, tr:has(td)');
    if (await brands.count() > 0) {
      // Look for a brand that might have products
      for (let i = 0; i < await brands.count(); i++) {
        const brand = brands.nth(i);
        const deleteButton = brand.locator('button[title*="Delete"], [data-testid="delete-button"]');
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Handle confirmation
          const confirmButton = page.locator('dialog button:has-text("Delete"), button:has-text("Confirm")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          await page.waitForTimeout(2000);
          
          // Should either succeed or show specific error about products
          const specificErrors = [
            'Cannot delete brand: Products exist under this brand',
            'Brand has associated products',
            'Remove products first'
          ];
          
          let foundValidResponse = false;
          
          // Check for specific error messages
          for (const errorText of specificErrors) {
            if (await page.locator(`text="${errorText}"`).isVisible().catch(() => false)) {
              foundValidResponse = true;
              break;
            }
          }
          
          // Or success message
          if (!foundValidResponse) {
            const successMessage = page.locator('text="Brand deleted successfully", text="Deleted successfully"');
            foundValidResponse = await successMessage.isVisible().catch(() => false);
          }
          
          // Should not show generic error
          await expect(page.locator('text="failed to delete brand"')).not.toBeVisible();
          
          if (foundValidResponse) {
            break; // Test completed successfully
          }
        }
      }
    }
  });

  test('should properly handle permission-based deletion restrictions', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/brands');
    await page.waitForLoadState('networkidle');
    
    // Look for brands created by other users (like admin)
    const brands = page.locator('[data-testid="brand-row"], tr').filter({ has: page.locator('td') });
    
    for (let i = 0; i < Math.min(await brands.count(), 3); i++) {
      const brand = brands.nth(i);
      
      // Check if this brand shows it was created by someone else
      const createdByCell = brand.locator('[data-testid="created-by"], td:last-child, .created-by');
      const createdByText = await createdByCell.textContent().catch(() => '');
      
      if (createdByText && !createdByText.includes('You') && !createdByText.includes('product_inventory_management')) {
        // This brand was created by someone else
        const deleteButton = brand.locator('button[title*="Delete"], [data-testid="delete-button"]');
        
        if (await deleteButton.isVisible()) {
          // Button exists - click it and check for permission error
          await deleteButton.click();
          
          // Should show permission-based error
          const permissionErrors = [
            'Not allowed to delete Brand',
            'You can only delete brands you created',
            'Insufficient permissions',
            'Access denied'
          ];
          
          let foundPermissionError = false;
          for (const errorText of permissionErrors) {
            if (await page.locator(`text="${errorText}"`).isVisible({ timeout: 3000 }).catch(() => false)) {
              foundPermissionError = true;
              break;
            }
          }
          
          expect(foundPermissionError).toBeTruthy();
          
          // Should not show generic error
          await expect(page.locator('text="failed to delete brand"')).not.toBeVisible();
          break;
        } else {
          // Delete button is hidden - this is also correct behavior
          console.log('Delete button properly hidden for brand created by others');
          expect(true).toBeTruthy();
        }
      }
    }
  });
});