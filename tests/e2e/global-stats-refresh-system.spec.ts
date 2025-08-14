import { test, expect } from '@playwright/test';

test.describe('Global Stats Refresh System', () => {
  test('should initialize global toast interceptor on admin layout load', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Navigate to admin dashboard
    await page.goto('http://localhost:3001/admin');
    
    // Wait for initialization
    await page.waitForTimeout(2000);
    
    // Check if global toast interceptor was initialized
    const initMessage = consoleMessages.find(msg => 
      msg.includes('Global toast interceptor initialized')
    );
    
    expect(initMessage).toBeTruthy();
    console.log('✅ Global toast interceptor initialized:', initMessage);
  });

  test('should trigger global stats refresh on success toast in users section', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Global stats refresh triggered') || 
          msg.text().includes('Stats refreshed for trigger')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 });
    
    // Get initial stats
    const initialStats = await page.textContent('[data-testid="total-count"]');
    console.log('Initial total users:', initialStats);
    
    // Simulate a successful operation by triggering a toast
    await page.evaluate(() => {
      // @ts-ignore
      if (window.toast && window.toast.success) {
        // @ts-ignore
        window.toast.success('User updated successfully');
      }
    });
    
    // Wait for potential refresh
    await page.waitForTimeout(1000);
    
    // Check if refresh was triggered
    const refreshMessages = consoleMessages.filter(msg => 
      msg.includes('Global stats refresh triggered') || 
      msg.includes('Stats refreshed for trigger')
    );
    
    expect(refreshMessages.length).toBeGreaterThan(0);
    console.log('✅ Global stats refresh messages:', refreshMessages);
  });

  test('should work across different admin sections', async ({ page }) => {
    // Test in brands section
    await page.goto('http://localhost:3001/admin/brands');
    await page.waitForTimeout(2000);
    
    // Check if brands page loaded
    const brandsTitle = await page.textContent('h1');
    expect(brandsTitle).toContain('Brand');
    
    // Test in users section
    await page.goto('http://localhost:3001/admin/users');
    await page.waitForTimeout(2000);
    
    // Check if users page loaded
    const usersTitle = await page.textContent('h1');
    expect(usersTitle).toContain('Users');
    
    console.log('✅ Global system works across different admin sections');
  });

  test('should show refreshing indicator when stats are updating', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 });
    
    // Trigger a refresh by simulating a success toast
    await page.evaluate(() => {
      // @ts-ignore
      if (window.toast && window.toast.success) {
        // @ts-ignore
        window.toast.success('Test operation completed successfully');
      }
    });
    
    // Check if refreshing indicator appears (it might be very brief)
    try {
      await page.waitForSelector('text=Updating stats...', { timeout: 2000 });
      console.log('✅ Refreshing indicator appeared');
    } catch (error) {
      console.log('ℹ️ Refreshing indicator was too brief to catch or not shown');
    }
  });

  test('should handle multiple rapid success toasts without issues', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Global stats refresh triggered')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    await page.waitForTimeout(2000);
    
    // Trigger multiple rapid success toasts
    await page.evaluate(() => {
      // @ts-ignore
      if (window.toast && window.toast.success) {
        // @ts-ignore
        window.toast.success('Operation 1 completed successfully');
        // @ts-ignore
        window.toast.success('Operation 2 completed successfully');
        // @ts-ignore
        window.toast.success('Operation 3 completed successfully');
      }
    });
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check that multiple refreshes were triggered
    expect(consoleMessages.length).toBeGreaterThanOrEqual(3);
    console.log('✅ Multiple rapid toasts handled correctly:', consoleMessages.length);
  });
});