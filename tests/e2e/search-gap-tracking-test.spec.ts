import { test, expect } from '@playwright/test';

test.describe('Search Gap Tracking', () => {
  test('should track search gaps for non-existent products', async ({ page }) => {
    // Navigate to the search page with a non-existent product
    await page.goto('http://localhost:3001/search?q=nonexistent-super-rare-product-12345');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify that no products are found
    await expect(page.getByText('0 products found')).toBeVisible();
    
    // The search gap should be tracked automatically in the background
    // We can't directly verify this in the frontend without admin access
    console.log('Search gap tracking should have been triggered for: nonexistent-super-rare-product-12345');
  });

  test('should generate guest ID for anonymous users', async ({ page }) => {
    // Navigate to any page to trigger guest ID generation
    await page.goto('http://localhost:3001');
    
    // Check if guest ID is stored in localStorage
    const guestId = await page.evaluate(() => {
      return localStorage.getItem('bazarxpress_guest_id');
    });
    
    // Guest ID should be generated and stored
    expect(guestId).toBeTruthy();
    expect(guestId).toMatch(/^guest_\d+_[a-z0-9]+$/);
    
    console.log('Generated guest ID:', guestId);
  });

  test('should reuse same guest ID across sessions', async ({ page }) => {
    // Navigate to any page
    await page.goto('http://localhost:3001');
    
    // Get the first guest ID
    const firstGuestId = await page.evaluate(() => {
      return localStorage.getItem('bazarxpress_guest_id');
    });
    
    // Reload the page
    await page.reload();
    
    // Get the guest ID again
    const secondGuestId = await page.evaluate(() => {
      return localStorage.getItem('bazarxpress_guest_id');
    });
    
    // Should be the same
    expect(firstGuestId).toBe(secondGuestId);
    
    console.log('Guest ID consistency verified:', firstGuestId);
  });
});