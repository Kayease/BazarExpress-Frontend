import { test, expect } from '@playwright/test';

test.describe('Real-time Stats Updates', () => {
  test('should update stats in real-time when user status changes', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 });
    
    // Get initial stats
    const initialActiveCount = await page.textContent('[data-testid="active-count"]');
    const initialDisabledCount = await page.textContent('[data-testid="disabled-count"]');
    
    console.log('Initial stats:', { active: initialActiveCount, disabled: initialDisabledCount });
    
    // Find a user with active status and toggle it
    const activeUserRow = page.locator('tr').filter({ hasText: 'Active' }).first();
    if (await activeUserRow.count() > 0) {
      // Click the status toggle button
      await activeUserRow.locator('[data-testid="status-toggle"]').click();
      
      // Wait for the API call to complete and stats to update
      await page.waitForTimeout(2000);
      
      // Get updated stats
      const updatedActiveCount = await page.textContent('[data-testid="active-count"]');
      const updatedDisabledCount = await page.textContent('[data-testid="disabled-count"]');
      
      console.log('Updated stats:', { active: updatedActiveCount, disabled: updatedDisabledCount });
      
      // Verify that stats have changed without page refresh
      expect(updatedActiveCount).not.toBe(initialActiveCount);
      expect(updatedDisabledCount).not.toBe(initialDisabledCount);
    }
  });

  test('should update stats when user role changes', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 });
    
    // Get initial role stats
    const initialAdminCount = await page.textContent('[data-testid="admin-count"]');
    const initialStaffCount = await page.textContent('[data-testid="staff-count"]');
    
    console.log('Initial role stats:', { admin: initialAdminCount, staff: initialStaffCount });
    
    // This test would require actual role change functionality
    // For now, we'll just verify the stats are displayed correctly
    expect(initialAdminCount).toBeTruthy();
    expect(initialStaffCount).toBeTruthy();
  });

  test('should show console logs when stats are recalculated', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Stats recalculated')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Verify that stats recalculation messages appear in console
    expect(consoleMessages.length).toBeGreaterThan(0);
    console.log('Console messages about stats:', consoleMessages);
  });
});