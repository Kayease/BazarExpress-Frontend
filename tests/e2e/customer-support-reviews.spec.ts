import { test, expect, Page } from '@playwright/test';

// Test Customer Support Executive role permissions for Reviews section
test.describe('Customer Support Executive - Reviews Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Customer Support Executive can access and manage reviews', async () => {
    // Navigate to the admin login page
    await page.goto('http://localhost:3000/admin/login');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Fill in login credentials for Customer Support Executive
    // Note: These credentials should be set up in your test environment
    await page.fill('input[type="email"]', 'customer.support@test.com');
    await page.fill('input[type="password"]', 'test123');
    
    // Submit the login form
    await page.click('button[type="submit"]');
    
    // Wait for redirect after successful login
    await page.waitForLoadState('networkidle');

    // Navigate to the reviews page
    await page.goto('http://localhost:3000/admin/reviews');
    await page.waitForLoadState('networkidle');

    // Verify the page loads without access denied
    await expect(page.locator('h2')).toContainText('Reviews & Ratings');

    // Test 1: Should be able to see pending reviews
    await expect(page.locator('text=Pending')).toBeVisible();

    // Test 2: Should be able to filter by pending status
    await page.selectOption('select', { label: 'Pending' });
    await page.waitForLoadState('networkidle');

    // Test 3: Should be able to approve a review (if any pending reviews exist)
    const reviewCards = page.locator('.bg-white.rounded-lg.p-4.shadow-sm');
    const reviewCount = await reviewCards.count();
    
    if (reviewCount > 0) {
      const firstReview = reviewCards.first();
      
      // Test approve functionality - look for CheckCircle icon button
      const approveButton = firstReview.locator('button[title="Approve Review"]');
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(2000); // Wait for API call to complete
        
        // Verify status changed to approved
        await expect(firstReview.locator('.bg-green-100')).toBeVisible();
      }
    }

    // Test 4: Should be able to flag a review
    // First switch to approved to find a review to flag
    await page.selectOption('select', { label: 'Approved' });
    await page.waitForLoadState('networkidle');
    
    const approvedReviews = page.locator('.bg-white.rounded-lg.p-4.shadow-sm');
    const approvedCount = await approvedReviews.count();
    
    if (approvedCount > 0) {
      const firstApprovedReview = approvedReviews.first();
      
      // Test flag functionality - look for Flag icon button
      const flagButton = firstApprovedReview.locator('button[title="Flag Review"]');
      if (await flagButton.isVisible()) {
        await flagButton.click();
        await page.waitForTimeout(2000); // Wait for API call to complete
        
        // Verify status changed to flagged
        await expect(firstApprovedReview.locator('.bg-orange-100')).toBeVisible();
      }
    }

    // Test 5: Should be able to delete a review
    if (reviewCount > 0) {
      const firstReview = reviewCards.first();
      
      // Test delete functionality - look for Trash2 icon button
      const deleteButton = firstReview.locator('button[title="Delete Review Permanently"]');
      await deleteButton.click();
      await page.waitForLoadState('networkidle');
      
      // Confirm delete action in modal
      await page.click('button:has-text("Delete Review")');
      await page.waitForTimeout(2000); // Wait for API call to complete
      
      // Verify success message (toast notification)
      await expect(page.locator('text=Review deleted successfully')).toBeVisible({ timeout: 5000 });
    }

    // Test 6: Should be able to search reviews
    await page.fill('input[placeholder="Search reviews..."]', 'test');
    await page.waitForLoadState('networkidle');

    // Test 7: Should be able to filter by rating
    const ratingSelect = page.locator('select').nth(1); // Second select is for rating
    await ratingSelect.selectOption('5');
    await page.waitForLoadState('networkidle');

    // Test 8: Verify stats are visible and accessible
    await expect(page.locator('text=Total Reviews')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Rejected')).toBeVisible();
    await expect(page.locator('text=Flagged')).toBeVisible();
    await expect(page.locator('text=Avg Rating')).toBeVisible();
  });

  test('Customer Support Executive permissions are properly enforced', async () => {
    // This test verifies that the role has the correct permissions
    // Navigate to the admin reviews page directly (should not get access denied)
    await page.goto('http://localhost:3000/admin/reviews');
    await page.waitForLoadState('networkidle');

    // Should not be redirected to home page (would indicate access denied)
    expect(page.url()).toContain('/admin/reviews');
    
    // Should see the reviews management interface
    await expect(page.locator('h2')).toContainText('Reviews & Ratings');
  });

  test('Review status updates work correctly', async () => {
    await page.goto('http://localhost:3000/admin/reviews');
    await page.waitForLoadState('networkidle');

    // Filter to show pending reviews first
    await page.selectOption('select', { label: 'Pending' });
    await page.waitForLoadState('networkidle');

    // Test changing review status from pending to approved
    const pendingReviews = page.locator('.bg-white.rounded-lg.p-4.shadow-sm:has(.bg-yellow-100)');
    const pendingCount = await pendingReviews.count();

    if (pendingCount > 0) {
      const firstPendingReview = pendingReviews.first();
      
      // Click approve button
      const approveButton = firstPendingReview.locator('button[title="Approve Review"]');
      await approveButton.click();
      await page.waitForTimeout(2000); // Wait for API call
      
      // Verify the status changed to approved (green badge)
      await expect(firstPendingReview.locator('.bg-green-100')).toBeVisible();
    }

    // Filter to show approved reviews
    await page.selectOption('select', { label: 'Approved' });
    await page.waitForLoadState('networkidle');

    // Test changing review status from approved to flagged
    const approvedReviews = page.locator('.bg-white.rounded-lg.p-4.shadow-sm:has(.bg-green-100)');
    const approvedCount = await approvedReviews.count();

    if (approvedCount > 0) {
      const firstApprovedReview = approvedReviews.first();
      
      // Click flag button
      const flagButton = firstApprovedReview.locator('button[title="Flag Review"]');
      await flagButton.click();
      await page.waitForTimeout(2000); // Wait for API call
      
      // Verify the status changed to flagged (orange badge)
      await expect(firstApprovedReview.locator('.bg-orange-100')).toBeVisible();
    }
  });
});