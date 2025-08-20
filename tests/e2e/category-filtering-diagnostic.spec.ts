import { test, expect } from '@playwright/test';

/**
 * Simple diagnostic test to understand the category filtering issue
 * and identify the root cause without complex test setup
 */

test.describe('Category Filtering Diagnostic', () => {
  
  test('basic server connection and products page loading', async ({ page }) => {
    // Set a basic console listener for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    // Check if server is accessible
    try {
      await page.goto('http://localhost:4000/products', { waitUntil: 'load', timeout: 15000 });
      console.log('✅ Successfully connected to server');
    } catch (error) {
      console.log('❌ Failed to connect to server:', error);
      throw error;
    }

    // Check if page loads at all
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBeTruthy();

    // Take a screenshot for debugging
    await page.screenshot({ path: 'diagnostic-page-load.png', fullPage: true });
    console.log('📸 Screenshot saved as diagnostic-page-load.png');

    // Wait a bit and see what's on the page
    await page.waitForTimeout(3000);

    // Check basic page structure
    const bodyText = await page.textContent('body').catch(() => 'No body content');
    console.log('Page contains text:', bodyText.substring(0, 200) + '...');

    // Look for specific elements that should be present
    const hasCategories = await page.locator('.space-y-3').count();
    console.log('Category sections found:', hasCategories);

    const hasProductsHeader = await page.locator('h1').count();
    console.log('H1 headers found:', hasProductsHeader);

    if (hasProductsHeader > 0) {
      const headers = await page.locator('h1').allTextContents();
      console.log('Headers:', headers);
    }

    // Check for location modal or blocking elements
    const modals = await page.locator('[role="dialog"]').count();
    console.log('Modals/dialogs found:', modals);

    if (modals > 0) {
      const modalTexts = await page.locator('[role="dialog"]').allTextContents();
      console.log('Modal content:', modalTexts);
    }
    
    console.log('✅ Basic diagnostic complete');
  });

  test('check location and pincode handling', async ({ page }) => {
    // Mock localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('locationState', JSON.stringify({
        pincode: '110001',
        isLocationDetected: true,
        deliveryMode: 'global',
        deliveryMessage: 'Test location',
        showOverlay: false,
        overlayMessage: '',
        matchedWarehouse: null,
        isGlobalMode: false
      }));
    });

    await page.goto('http://localhost:4000/products', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Check if location state is properly set
    const locationState = await page.evaluate(() => {
      return localStorage.getItem('locationState');
    });

    console.log('Location state:', locationState);

    // Check if products section is now visible
    const productsVisible = await page.locator('text=/\\d+ products found/').isVisible().catch(() => false);
    console.log('Products section visible:', productsVisible);

    if (productsVisible) {
      const productText = await page.locator('text=/\\d+ products found/').textContent();
      console.log('Product count text:', productText);
    }

    // Take another screenshot
    await page.screenshot({ path: 'diagnostic-with-location.png', fullPage: true });
    console.log('📸 Screenshot with location saved');
  });

  test('analyze category filtering logic manually', async ({ page }) => {
    // Set up monitoring for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('api') || url.includes('products') || url.includes('categories')) {
        apiCalls.push(`${request.method()} ${url}`);
        console.log('API Call:', `${request.method()} ${url}`);
      }
    });

    // Mock location
    await page.addInitScript(() => {
      localStorage.setItem('locationState', JSON.stringify({
        pincode: '110001',
        isLocationDetected: true,
        deliveryMode: 'global',
        deliveryMessage: 'Test location',
        showOverlay: false,
        overlayMessage: '',
        matchedWarehouse: null,
        isGlobalMode: false
      }));
    });

    await page.goto('http://localhost:4000/products', { timeout: 15000 });
    await page.waitForTimeout(5000); // Give it more time

    console.log('API calls made during page load:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call}`);
    });

    // Try to manually trigger location
    const locationButton = page.locator('button:has-text("location"), button:has-text("pincode"), button:has-text("Detecting")').first();
    const locationButtonExists = await locationButton.isVisible().catch(() => false);
    
    if (locationButtonExists) {
      console.log('Found location button, clicking...');
      await locationButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for categories manually
    console.log('\nLooking for category elements...');
    
    const categoryButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', categoryButtons.filter(text => text.trim()));

    // Look for specific category-related elements
    const categoryElements = await page.locator('[class*="category"], [class*="sidebar"], .space-y-3 button').count();
    console.log('Category-related elements found:', categoryElements);

    if (categoryElements > 0) {
      const categoryTexts = await page.locator('[class*="category"], [class*="sidebar"], .space-y-3 button').allTextContents();
      console.log('Category texts found:', categoryTexts.filter(text => text.trim()).slice(0, 10));
    }

    await page.screenshot({ path: 'diagnostic-manual-analysis.png', fullPage: true });
  });

});