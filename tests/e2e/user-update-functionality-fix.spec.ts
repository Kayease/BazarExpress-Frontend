import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USERS } from './utils/auth-helpers';

test.describe('User Update Functionality Fix', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    
    // Update the base URL to port 3001
    const originalGoto = page.goto;
    page.goto = (url: string, options?: any) => {
      const updatedUrl = url.replace('http://localhost:3000', 'http://localhost:3001');
      return originalGoto.call(page, updatedUrl, options);
    };
    
    // Login as admin
    await authHelper.loginAs('admin');
    
    // Navigate to users page
    await page.goto('http://localhost:3001/admin/users');
    await page.waitForLoadState('networkidle');
  });

  test('should load users page successfully', async ({ page }) => {
    // Check if page title contains "User Management" or similar
    await expect(page).toHaveURL(/.*admin\/users.*/);
    
    // Check for search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Check for user table or cards
    const userCards = page.locator('[data-testid="user-card"], .user-card, .border.rounded');
    await expect(userCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open user edit modal when clicking edit button', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first edit button and click it
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await expect(editButton).toBeVisible();
    
    await editButton.click();
    
    // Check if modal opens
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check for required form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('select[name="role"], select')).toBeVisible();
  });

  test('should successfully update user basic information', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first edit button and click it
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Update user name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    await nameInput.clear();
    await nameInput.fill('Updated Test User');
    
    // Update phone (if field exists)
    const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill('1234567890');
    }
    
    // Listen for network requests
    const updateRequest = page.waitForRequest(request => 
      request.url().includes('/admin/users/') && request.method() === 'PUT'
    );
    
    // Find and click save button
    const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
    await saveButton.click();
    
    // Wait for the API request to complete
    const request = await updateRequest;
    
    // Check that the request was made with correct method
    expect(request.method()).toBe('PUT');
    
    // Wait for success message or modal to close
    await Promise.race([
      page.waitForSelector('text=successfully', { timeout: 5000 }).catch(() => null),
      modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null)
    ]);
    
    // Verify the user was updated (check if modal closed or success message appeared)
    const isModalClosed = await modal.isHidden().catch(() => false);
    const hasSuccessMessage = await page.locator('text=successfully').isVisible().catch(() => false);
    
    expect(isModalClosed || hasSuccessMessage).toBe(true);
  });

  test('should handle password update correctly', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first non-user role (admin or staff) edit button
    const userCards = page.locator('.border.rounded');
    const count = await userCards.count();
    
    let editButton = null;
    for (let i = 0; i < count; i++) {
      const card = userCards.nth(i);
      const roleText = await card.textContent();
      
      // Skip regular users, look for admin or staff roles
      if (!roleText?.includes('User') || roleText?.includes('Admin') || roleText?.includes('Management')) {
        editButton = card.locator('button').filter({ hasText: 'Edit' });
        if (await editButton.isVisible()) {
          break;
        }
      }
    }
    
    if (!editButton) {
      // If no admin/staff user found, skip this test
      test.skip('No admin/staff users available for password testing');
    }
    
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Look for password fields
    const newPasswordInput = page.locator('input[name*="password"], input[placeholder*="password"]').first();
    const confirmPasswordInput = page.locator('input[name*="password"], input[placeholder*="password"]').nth(1);
    
    if (await newPasswordInput.isVisible()) {
      // Fill password fields
      await newPasswordInput.fill('newPassword123');
      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.fill('newPassword123');
      }
      
      // Listen for network requests
      const updateRequest = page.waitForRequest(request => 
        request.url().includes('/admin/users/') && request.method() === 'PUT'
      );
      
      // Save the changes
      const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
      await saveButton.click();
      
      // Wait for the API request
      const request = await updateRequest;
      expect(request.method()).toBe('PUT');
      
      // Verify request payload contains password
      const postData = request.postDataJSON();
      expect(postData).toHaveProperty('password');
      
      // Wait for success
      await Promise.race([
        page.waitForSelector('text=successfully', { timeout: 5000 }).catch(() => null),
        modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null)
      ]);
    }
  });

  test('should handle warehouse assignment correctly', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first edit button and click it
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Find role select and change to warehouse-dependent role
    const roleSelect = page.locator('select[name="role"], select').first();
    await roleSelect.selectOption('product_inventory_management');
    
    // Wait for warehouse section to appear
    await page.waitForTimeout(1000); // Wait for UI update
    
    // Check if warehouse section appears
    const warehouseSection = page.locator('text=Warehouse Assignment, text=Select Warehouses');
    if (await warehouseSection.isVisible()) {
      // Find warehouse checkboxes
      const warehouseCheckboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await warehouseCheckboxes.count();
      
      if (checkboxCount > 0) {
        // Select first warehouse
        await warehouseCheckboxes.first().check();
      }
    }
    
    // Listen for network requests
    const updateRequest = page.waitForRequest(request => 
      request.url().includes('/admin/users/') && request.method() === 'PUT'
    );
    
    // Save the changes
    const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
    await saveButton.click();
    
    // Wait for the API request
    const request = await updateRequest;
    expect(request.method()).toBe('PUT');
    
    // Verify request payload contains assignedWarehouses
    const postData = request.postDataJSON();
    expect(postData).toHaveProperty('assignedWarehouses');
    
    // Wait for success
    await Promise.race([
      page.waitForSelector('text=successfully', { timeout: 5000 }).catch(() => null),
      modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null)
    ]);
  });

  test('should validate required fields properly', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first edit button and click it
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Clear required fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    await nameInput.clear();
    
    const emailInput = page.locator('input[name="email"], input[placeholder*="email"]').first();
    await emailInput.clear();
    
    // Try to save
    const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
    await saveButton.click();
    
    // Check for validation errors
    const errorMessages = page.locator('text=required, text=invalid, [class*="error"], .text-red-500');
    
    // Should see error messages or prevent form submission
    const hasErrors = await errorMessages.count() > 0;
    const modalStillOpen = await modal.isVisible();
    
    // Either errors are shown or modal stays open
    expect(hasErrors || modalStillOpen).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/admin/users/*', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Test validation error' })
        });
      } else {
        route.continue();
      }
    });
    
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Find first edit button and click it
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Make a change
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    await nameInput.clear();
    await nameInput.fill('Test Error Handling');
    
    // Try to save
    const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
    await saveButton.click();
    
    // Wait for error message
    await page.waitForSelector('text=error, text=failed, [class*="error"]', { timeout: 5000 });
    
    // Modal should still be open
    await expect(modal).toBeVisible();
    
    // Error message should be displayed
    const errorMessage = page.locator('text=error, text=failed, [class*="error"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should maintain data integrity during update', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('.border.rounded', { timeout: 10000 });
    
    // Get initial user data
    const firstUserCard = page.locator('.border.rounded').first();
    const originalContent = await firstUserCard.textContent();
    
    // Click edit
    const editButton = firstUserCard.locator('button').filter({ hasText: 'Edit' });
    await editButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify form is populated with current data
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
    
    const emailInput = page.locator('input[name="email"], input[placeholder*="email"]').first();
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toContain('@');
    
    // Make minimal change
    await nameInput.clear();
    await nameInput.fill(nameValue + ' Updated');
    
    // Listen for network request
    const updateRequest = page.waitForRequest(request => 
      request.url().includes('/admin/users/') && request.method() === 'PUT'
    );
    
    // Save
    const saveButton = page.locator('button').filter({ hasText: /Save|Update/ }).first();
    await saveButton.click();
    
    // Verify API call
    const request = await updateRequest;
    const postData = request.postDataJSON();
    
    // Verify clean payload (no extra fields like _id, createdAt, etc.)
    expect(postData).toHaveProperty('name');
    expect(postData).toHaveProperty('email');
    expect(postData).not.toHaveProperty('_id');
    expect(postData).not.toHaveProperty('createdAt');
    expect(postData).not.toHaveProperty('assignedWarehouseIds'); // Should be assignedWarehouses
    
    // Wait for success
    await Promise.race([
      page.waitForSelector('text=successfully', { timeout: 5000 }).catch(() => null),
      modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null)
    ]);
  });
});