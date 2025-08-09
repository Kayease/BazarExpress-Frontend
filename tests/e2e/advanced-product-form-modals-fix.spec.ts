import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Test account credentials (these should exist in your test database)
const testCredentials = {
  phoneNumber: '9876543210',
  otp: '123456'
};

test.describe('Advanced Product Form - Modals Fix Tests', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Login to get authentication token
    await page.goto('/login');
    
    // Fill phone number
    await page.fill('[data-testid="phone-input"]', testCredentials.phoneNumber);
    await page.click('button[type="submit"]');
    
    // Fill OTP
    await page.fill('input[placeholder="Enter 6-digit OTP"]', testCredentials.otp);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Get auth token for API calls
    authToken = await page.evaluate(() => localStorage.getItem('token')) || '';
  });

  test('Category plus button should work and update dropdown in real-time', async ({ page }) => {
    // Navigate to add product page
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // Take screenshot before action
    await page.screenshot({ path: 'before-category-modal.png' });

    // Click the category plus button
    await page.click('button:has-text("+"):near(input[placeholder*="category"])');

    // Verify the modal opens
    await expect(page.locator('[data-testid="category-modal"]')).toBeVisible();

    // Create a unique category name
    const categoryName = `Test Category ${Date.now()}`;
    
    // Fill the category form (assuming it has a name field)
    await page.fill('input[name="name"]', categoryName);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="category-modal"]')).not.toBeVisible();
    
    // Wait a moment for the dropdown to update
    await page.waitForTimeout(1000);
    
    // Click on the category input to open dropdown
    const categoryInput = page.locator('input[placeholder*="category"]').first();
    await categoryInput.focus();
    
    // Search for the newly created category
    await categoryInput.fill(categoryName);
    
    // Verify the new category appears in the dropdown
    await expect(page.locator(`text="${categoryName}"`)).toBeVisible();
    
    // Take screenshot after successful creation
    await page.screenshot({ path: 'after-category-creation.png' });
  });

  test('Brand plus button should work and update dropdown in real-time', async ({ page }) => {
    // Navigate to add product page
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // Click the brand plus button
    await page.click('button:has-text("+"):near(input[placeholder*="brand"])');

    // Verify the modal opens
    await expect(page.locator('[data-testid="brand-modal"]')).toBeVisible();

    // Create a unique brand name
    const brandName = `Test Brand ${Date.now()}`;
    
    // Fill the brand form
    await page.fill('input[name="name"]', brandName);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="brand-modal"]')).not.toBeVisible();
    
    // Wait a moment for the dropdown to update
    await page.waitForTimeout(1000);
    
    // Click on the brand input to open dropdown
    const brandInput = page.locator('input[placeholder*="brand"]').first();
    await brandInput.focus();
    
    // Search for the newly created brand
    await brandInput.fill(brandName);
    
    // Verify the new brand appears in the dropdown
    await expect(page.locator(`text="${brandName}"`)).toBeVisible();
  });

  test('Warehouse plus button should work and update WarehouseSelector in real-time', async ({ page }) => {
    // Navigate to add product page
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // Get initial warehouse count
    const initialWarehouseOptions = await page.locator('select option').count();

    // Click the warehouse plus button
    await page.click('button:has-text("+"):near(select)');

    // Verify the modal opens
    await expect(page.locator('[data-testid="warehouse-modal"]')).toBeVisible();

    // Create a unique warehouse
    const warehouseName = `Test Warehouse ${Date.now()}`;
    
    // Fill the warehouse form
    await page.fill('input[name="name"]', warehouseName);
    await page.fill('textarea[name="address"]', '123 Test Street, Test City');
    await page.fill('input[name="contactPhone"]', '9876543210');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="warehouse-modal"]')).not.toBeVisible();
    
    // Wait for the WarehouseSelector to refresh
    await page.waitForTimeout(2000);
    
    // Check that warehouse count has increased
    const newWarehouseOptions = await page.locator('select option').count();
    expect(newWarehouseOptions).toBeGreaterThan(initialWarehouseOptions);
    
    // Verify the new warehouse appears in the dropdown
    await expect(page.locator(`option:has-text("${warehouseName}")`)).toBeVisible();
  });

  test('Subcategory plus button should work after selecting a category', async ({ page }) => {
    // Navigate to add product page
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // First select an existing category
    const categoryInput = page.locator('input[placeholder*="category"]').first();
    await categoryInput.focus();
    
    // Get first available category
    const firstCategory = await page.locator('div.absolute div:first-child').first();
    if (await firstCategory.isVisible()) {
      await firstCategory.click();
    }

    // Now try to add a subcategory
    const subcategoryPlusButton = page.locator('button:has-text("+"):near(input[placeholder*="subcategory"])');
    
    // Check if button is enabled (should be enabled when category is selected)
    await expect(subcategoryPlusButton).not.toBeDisabled();
    
    // Click the subcategory plus button
    await subcategoryPlusButton.click();

    // Verify the modal opens
    await expect(page.locator('[data-testid="category-modal"]')).toBeVisible();

    // Create a unique subcategory name
    const subcategoryName = `Test Subcategory ${Date.now()}`;
    
    // Fill the subcategory form
    await page.fill('input[name="name"]', subcategoryName);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="category-modal"]')).not.toBeVisible();
    
    // Wait a moment for the dropdown to update
    await page.waitForTimeout(1000);
    
    // Click on the subcategory input to open dropdown
    const subcategoryInput = page.locator('input[placeholder*="subcategory"]').first();
    await subcategoryInput.focus();
    
    // Search for the newly created subcategory
    await subcategoryInput.fill(subcategoryName);
    
    // Verify the new subcategory appears in the dropdown
    await expect(page.locator(`text="${subcategoryName}"`)).toBeVisible();
  });

  test('Tax plus button should work and update dropdown in real-time', async ({ page }) => {
    // Navigate to add product page
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // Get initial tax count
    const taxSelect = page.locator('select[value*="tax"], select:near(label:has-text("Tax"))');
    const initialTaxOptions = await taxSelect.locator('option').count();

    // Click the tax plus button
    await page.click('button:has-text("+"):near(select:near(label:has-text("Tax")))');

    // Verify the modal opens
    await expect(page.locator('[data-testid="tax-modal"]')).toBeVisible();

    // Create a unique tax
    const taxName = `Test Tax ${Date.now()}`;
    
    // Fill the tax form
    await page.fill('input[name="name"]', taxName);
    await page.fill('input[name="rate"]', '18');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="tax-modal"]')).not.toBeVisible();
    
    // Wait a moment for the dropdown to update
    await page.waitForTimeout(1000);
    
    // Check that tax count has increased
    const newTaxOptions = await taxSelect.locator('option').count();
    expect(newTaxOptions).toBeGreaterThan(initialTaxOptions);
    
    // Verify the new tax appears in the dropdown
    await expect(page.locator(`option:has-text("${taxName}")`)).toBeVisible();
  });

  test('Form should handle all modal interactions without page refresh', async ({ page }) => {
    // This test ensures that the entire form workflow works without needing page refresh
    await page.goto('/admin/products/add');
    await page.waitForLoadState('networkidle');

    // Fill basic product information
    await page.fill('input[name="name"]', `Test Product ${Date.now()}`);
    
    // Test all plus buttons work in sequence
    const actions = [
      'category',
      'brand', 
      'tax'
    ];

    for (const action of actions) {
      // Find and click the corresponding plus button
      const plusButton = page.locator(`button:has-text("+"):near(input[placeholder*="${action}"], select:near(label:has-text("${action.charAt(0).toUpperCase() + action.slice(1)}")))`.toLowerCase());
      
      if (await plusButton.isVisible()) {
        await plusButton.click();
        
        // Wait for modal to appear
        await page.waitForSelector('[data-testid$="-modal"]', { state: 'visible', timeout: 5000 });
        
        // Close modal by clicking outside or close button
        const closeButton = page.locator('button:has-text("Cancel"), button:has-text("×"), button[aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
        
        // Wait for modal to close
        await page.waitForSelector('[data-testid$="-modal"]', { state: 'hidden', timeout: 5000 });
      }
    }

    // Verify form is still functional
    await page.fill('input[name="price"]', '99.99');
    await page.fill('input[name="mrp"]', '149.99');
    
    // The form should still be interactive and not broken
    await expect(page.locator('form')).toBeVisible();
  });
});