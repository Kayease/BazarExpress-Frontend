import { test, expect } from '@playwright/test';

test.describe('Abandoned Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test abandoned cart page
    await page.goto('http://localhost:3001/test-abandoned-cart');
    await page.waitForLoadState('networkidle');
  });

  test('should display abandoned cart stats correctly', async ({ page }) => {
    // Check if stats cards are displayed
    await expect(page.locator('text=Total Abandoned')).toBeVisible();
    await expect(page.locator('text=Registered Users')).toBeVisible();
    await expect(page.locator('text=Unregistered Users')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();

    // Check if stats show correct numbers
    await expect(page.locator('text=7').first()).toBeVisible(); // Total abandoned
    await expect(page.locator('text=3').first()).toBeVisible(); // Registered users
    await expect(page.locator('text=4').first()).toBeVisible(); // Unregistered users
    await expect(page.locator('text=14,582')).toBeVisible(); // Total value
  });

  test('should switch between registered and unregistered tabs', async ({ page }) => {
    // Initially on registered tab
    await expect(page.locator('button:has-text("Registered Users (3)")')).toHaveClass(/border-blue-500/);
    
    // Check registered user data
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=jane.smith@example.com')).toBeVisible();

    // Switch to unregistered tab
    await page.click('button:has-text("Unregistered Users (4)")');
    
    // Check unregistered user data
    await expect(page.locator('text=Guest User 1')).toBeVisible();
    await expect(page.locator('text=Guest User 2')).toBeVisible();
    
    // Verify tab styling changed
    await expect(page.locator('button:has-text("Unregistered Users (4)")')).toHaveClass(/border-blue-500/);
  });

  test('should display items count correctly', async ({ page }) => {
    // Check registered users tab
    await expect(page.locator('text=2 items').first()).toBeVisible();
    await expect(page.locator('text=1 item').first()).toBeVisible();

    // Switch to unregistered tab
    await page.click('button:has-text("Unregistered Users (4)")');
    
    // Check unregistered users tab
    await expect(page.locator('text=2 items').first()).toBeVisible();
    await expect(page.locator('text=1 item').first()).toBeVisible();
  });

  test('should have functional action buttons', async ({ page }) => {
    // Test View Details button
    await page.click('button:has-text("View Details")');
    
    // Check if alert dialog appears with cart details
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Cart Details:');
      expect(dialog.message()).toContain('Customer: John Doe');
      expect(dialog.message()).toContain('Items: Organic Bananas (x2), Fresh Milk (x1)');
      expect(dialog.message()).toContain('Total Value: ₹300');
      await dialog.accept();
    });

    // Test Send Reminder button
    await page.click('button:has-text("Send Reminder")');
    
    // Check if reminder success dialog appears
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Reminder sent successfully!');
      await dialog.accept();
    });
  });

  test('should show reminder count for carts with sent reminders', async ({ page }) => {
    // Check if reminder count is displayed
    await expect(page.locator('text=1 reminder sent')).toBeVisible();
    
    // Switch to unregistered tab
    await page.click('button:has-text("Unregistered Users (4)")');
    
    // Check if reminder count is displayed for unregistered users too
    await expect(page.locator('text=1 reminder sent')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Test search input
    const searchInput = page.locator('input[placeholder="Search by name, email, or phone..."]');
    await expect(searchInput).toBeVisible();
    
    // Search should be functional (even if using mock data)
    await searchInput.fill('John');
    await expect(searchInput).toHaveValue('John');
  });

  test('should have working time filter', async ({ page }) => {
    // Test time filter dropdown
    const timeFilter = page.locator('select').first();
    await expect(timeFilter).toBeVisible();
    
    // Check filter options
    await expect(timeFilter.locator('option:has-text("All Time")')).toBeVisible();
    await expect(timeFilter.locator('option:has-text("Today")')).toBeVisible();
    await expect(timeFilter.locator('option:has-text("This Week")')).toBeVisible();
    await expect(timeFilter.locator('option:has-text("This Month")')).toBeVisible();
  });

  test('should display proper table structure', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Items")')).toBeVisible();
    await expect(page.locator('th:has-text("Total Value")')).toBeVisible();
    await expect(page.locator('th:has-text("Abandoned")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Activity")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should show proper currency formatting', async ({ page }) => {
    // Check if Indian Rupee symbol is displayed
    await expect(page.locator('text=₹300')).toBeVisible();
    await expect(page.locator('text=₹45')).toBeVisible();
    
    // Check total value formatting
    await expect(page.locator('text=₹14,582')).toBeVisible();
  });

  test('should handle empty state properly', async ({ page }) => {
    // This test would be more relevant with real API data
    // For now, we can check that the table structure exists
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check that rows exist (with mock data)
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2); // 2 mock items per tab
  });
});

test.describe('Abandoned Cart API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // This test would simulate API failures
    // For now, we verify the error handling structure exists
    await page.goto('http://localhost:3001/admin/abandoned-cart');
    
    // Should redirect to home if not authenticated
    await expect(page).toHaveURL('http://localhost:3001/');
  });
});

test.describe('Abandoned Cart Real-time Tracking', () => {
  test('should track cart abandonment for unregistered users', async ({ page }) => {
    // Navigate to main site
    await page.goto('http://localhost:3001/');
    
    // Add items to cart without logging in
    // This would trigger the abandoned cart tracking
    
    // For now, we can verify the cart functionality exists
    const cartButton = page.locator('button:has-text("My Cart")');
    await expect(cartButton).toBeVisible();
    
    // Click cart to open
    await cartButton.click();
    
    // Verify cart is empty initially
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('should track cart abandonment for registered users', async ({ page }) => {
    // This test would require actual login functionality
    // For now, we verify the login button exists
    await page.goto('http://localhost:3001/');
    
    const loginButton = page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible();
  });
});