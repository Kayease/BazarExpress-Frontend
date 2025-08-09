import { test, expect } from '@playwright/test';

test.describe('Modal Consolidation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin login page
    await page.goto('http://localhost:3001/admin/login');
    
    // Fill in login credentials (adjust as needed)
    await page.fill('input[type="text"]:first-child', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit the login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await page.waitForURL('**/admin/dashboard');
  });

  test('Categories modal should work in both dedicated section and product form', async ({ page }) => {
    // Test 1: Categories dedicated section modal
    await page.goto('http://localhost:3001/admin/categories');
    
    // Click Add Category button
    await page.click('button:has-text("Add Category")');
    
    // Verify modal appears with correct title
    await expect(page.locator('text=Add Category')).toBeVisible();
    
    // Fill in basic category details
    await page.fill('input[name="name"]', 'Test Category Modal');
    await page.fill('textarea[name="description"]', 'Testing consolidated modal');
    
    // Select an icon
    await page.fill('input[name="icon"]', 'TestIcon');
    
    // Close modal without saving
    await page.click('button:has-text("Cancel")');
    
    // Verify modal is closed
    await expect(page.locator('text=Add Category')).not.toBeVisible();
    
    // Test 2: Product form category modal 
    await page.goto('http://localhost:3001/admin/products/add');
    
    // Find and click the category add button (+ button next to category field)
    await page.locator('button').filter({ hasText: '+' }).first().click();
    
    // Verify the same modal appears
    await expect(page.locator('text=Add Category')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
  });

  test('Brands modal should work in both dedicated section and product form', async ({ page }) => {
    // Test 1: Brands dedicated section modal
    await page.goto('http://localhost:3001/admin/brands');
    
    // Click Add Brand button
    await page.click('button:has-text("Add Brand"), button:has-text("Add Your First Brand")');
    
    // Verify modal appears with correct title
    await expect(page.locator('text=Add Brand')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    
    // Test 2: Product form brand modal
    await page.goto('http://localhost:3001/admin/products/add');
    
    // Find and click the brand add button
    await page.locator('button').filter({ hasText: '+' }).nth(1).click();
    
    // Verify the same modal appears
    await expect(page.locator('text=Add Brand')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
  });

  test('Tax and Warehouse modals should already be unified', async ({ page }) => {
    // Test Tax modal in dedicated section
    await page.goto('http://localhost:3001/admin/taxes');
    await page.click('button:has-text("Add Tax")');
    await expect(page.locator('text=Add Tax')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test Warehouse modal in dedicated section  
    await page.goto('http://localhost:3001/admin/warehouse');
    await page.click('button:has-text("Add Warehouse")');
    await expect(page.locator('text=Add Warehouse')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test in product form
    await page.goto('http://localhost:3001/admin/products/add');
    
    // Test Tax modal from product form
    await page.locator('button').filter({ hasText: '+' }).nth(2).click();
    await expect(page.locator('text=Add Tax')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test Warehouse modal from product form
    await page.locator('button').filter({ hasText: '+' }).nth(3).click();
    await expect(page.locator('text=Add Warehouse')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Edit functionality should work in consolidated modals', async ({ page }) => {
    // Test editing a category
    await page.goto('http://localhost:3001/admin/categories');
    
    // Look for an existing category to edit
    const editButton = page.locator('button[aria-label="Edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('text=Edit Category')).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
    
    // Test editing a brand
    await page.goto('http://localhost:3001/admin/brands');
    
    const brandEditButton = page.locator('button').filter({ hasText: 'edit' }).first();
    if (await brandEditButton.isVisible()) {
      await brandEditButton.click();
      await expect(page.locator('text=Edit Brand')).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
  });
});