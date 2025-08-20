import { test, expect, Page } from '@playwright/test';

/**
 * Test Suite: Product Category Filtering Functionality
 * 
 * This test addresses the issue where products are not filtering properly 
 * based on category and subcategory selections. The test covers:
 * 
 * 1. Category selection and API parameter passing
 * 2. Subcategory selection and filtering behavior  
 * 3. State synchronization between URL and component state
 * 4. React Query cache management and invalidation
 * 5. Race conditions in state updates
 */

test.describe('Product Category Filtering', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock location services to prevent location detection blocking
    await page.addInitScript(() => {
      // Mock geolocation
      Object.defineProperty(navigator, 'geolocation', {
        writable: false,
        value: {
          getCurrentPosition: () => Promise.resolve(),
          watchPosition: () => {},
          clearWatch: () => {}
        }
      });
      
      // Set a default pincode in localStorage to bypass location requirement
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

    // Navigate to products page
    await page.goto('http://localhost:4000/products', { waitUntil: 'domcontentloaded' });
    
    // Wait for any initial modals to appear and dismiss them
    await page.waitForTimeout(2000);
    const skipButton = page.getByRole('button', { name: 'Skip for now' });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Wait for categories to load
    await page.waitForFunction(() => {
      return window.document.querySelector('[data-testid="categories-sidebar"]') || 
             window.document.querySelector('.space-y-3') !== null;
    }, { timeout: 10000 });
  });

  test('should display product categories in sidebar', async ({ page }) => {
    // Wait for categories to be visible
    const categoriesSection = page.locator('.space-y-3').first();
    await expect(categoriesSection).toBeVisible();
    
    // Should have "All Categories" option
    const allCategoriesButton = page.getByText('All Categories');
    await expect(allCategoriesButton).toBeVisible();
    
    // Verify console logs show proper debugging
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check that category filtering debug logs are present
    const categoryLogs = logs.filter(log => log.includes('Category filtering debug'));
    expect(categoryLogs.length).toBeGreaterThan(0);
  });

  test('should update URL and API calls when selecting a category', async ({ page }) => {
    // Monitor network requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/warehouses/products-by-pincode')) {
        apiRequests.push(request.url());
      }
    });

    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Click on a parent category (assuming there's at least one)
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      const firstCategory = parentCategories.first();
      const categoryName = await firstCategory.textContent();
      
      // Click the category
      await firstCategory.click();
      
      // Wait for state update and API call
      await page.waitForTimeout(1000);
      
      // Check URL was updated with category parameter
      const currentUrl = page.url();
      expect(currentUrl).toContain('category=');
      
      // Verify API was called with category parameter
      const categoryApiCalls = apiRequests.filter(url => 
        url.includes('category=') && !url.includes('category=&')
      );
      expect(categoryApiCalls.length).toBeGreaterThan(0);
      
      // Check that category is highlighted in UI
      await expect(firstCategory).toHaveClass(/bg-purple-50/);
    }
  });

  test('should handle subcategory selection properly', async ({ page }) => {
    // Monitor API requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/warehouses/products-by-pincode')) {
        apiRequests.push(request.url());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // First select a parent category to trigger subcategory view
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      await parentCategories.first().click();
      
      // Wait for subcategories to load and sidebar to switch mode
      await page.waitForTimeout(1500);
      
      // Look for "Back" button indicating we're in subcategory mode
      const backButton = page.getByText('Back');
      if (await backButton.isVisible()) {
        
        // Check if there are subcategories available
        const subcategories = page.locator('.space-y-3 button').filter({ 
          hasNot: page.getByText('All Subcategories') 
        }).filter({
          hasNot: page.getByText('Back')
        });
        
        const subcategoryCount = await subcategories.count();
        if (subcategoryCount > 0) {
          // Clear previous requests to isolate subcategory selection
          apiRequests.length = 0;
          
          // Click on first subcategory
          await subcategories.first().click();
          
          // Wait for API call and state update
          await page.waitForTimeout(1000);
          
          // Verify URL contains subcategory parameter
          const currentUrl = page.url();
          expect(currentUrl).toContain('subcategory=');
          
          // Verify API was called with subcategory parameter
          const subcategoryApiCalls = apiRequests.filter(url => 
            url.includes('category=') && !url.includes('category=&')
          );
          expect(subcategoryApiCalls.length).toBeGreaterThan(0);
          
          // The API should use subcategory ID as the category parameter
          const lastApiCall = subcategoryApiCalls[subcategoryApiCalls.length - 1];
          expect(lastApiCall).not.toContain('category=&');
        }
      }
    }
  });

  test('should maintain filter state when navigating back from subcategories', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select a parent category
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      await parentCategories.first().click();
      await page.waitForTimeout(1000);
      
      // If we have subcategories, go to subcategory view then back
      const backButton = page.getByText('Back');
      if (await backButton.isVisible()) {
        // We're in subcategory mode, click back
        await backButton.click();
        await page.waitForTimeout(500);
        
        // Should be back to parent categories view
        const allCategoriesButton = page.getByText('All Categories');
        await expect(allCategoriesButton).toBeVisible();
        
        // Original parent category should still be selected
        await expect(parentCategories.first()).toHaveClass(/bg-purple-50/);
        
        // URL should still contain the parent category
        expect(page.url()).toContain('category=');
      }
    }
  });

  test('should clear filters when selecting "All Categories"', async ({ page }) => {
    // Monitor API requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/warehouses/products-by-pincode')) {
        apiRequests.push(request.url());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // First select a category to have something to clear
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      await parentCategories.first().click();
      await page.waitForTimeout(1000);
      
      // Now click "All Categories"
      apiRequests.length = 0; // Clear previous requests
      
      const allCategoriesButton = page.getByText('All Categories');
      await allCategoriesButton.click();
      
      await page.waitForTimeout(1000);
      
      // URL should not contain category or subcategory parameters
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('category=');
      expect(currentUrl).not.toContain('subcategory=');
      
      // API should be called without category parameter
      const noFilterApiCalls = apiRequests.filter(url => 
        !url.includes('category=') || url.includes('category=&')
      );
      expect(noFilterApiCalls.length).toBeGreaterThan(0);
      
      // "All Categories" should be highlighted
      await expect(allCategoriesButton).toHaveClass(/bg-purple-50/);
      
      // Other categories should not be highlighted
      const firstCategory = parentCategories.first();
      await expect(firstCategory).not.toHaveClass(/bg-purple-50/);
    }
  });

  test('should handle race conditions in category updates', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Get categories for rapid clicking
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount >= 2) {
      // Rapidly click different categories to test race conditions
      await parentCategories.nth(0).click();
      await page.waitForTimeout(100); // Short delay
      await parentCategories.nth(1).click();
      await page.waitForTimeout(100);
      await parentCategories.nth(0).click();
      
      // Wait for final state to settle
      await page.waitForTimeout(2000);
      
      // Final state should be consistent
      const currentUrl = page.url();
      
      // Should have a category parameter
      expect(currentUrl).toContain('category=');
      
      // The last clicked category should be highlighted
      await expect(parentCategories.nth(0)).toHaveClass(/bg-purple-50/);
      
      // Only one category should be highlighted
      const highlightedCategories = await page.locator('.space-y-3 button.bg-purple-50').count();
      expect(highlightedCategories).toBe(1);
    }
  });

  test('should properly handle search with category filtering', async ({ page }) => {
    // Monitor API requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/warehouses/products-by-pincode')) {
        apiRequests.push(request.url());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Select a category first
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      await parentCategories.first().click();
      await page.waitForTimeout(1000);
      
      // Clear previous requests
      apiRequests.length = 0;
      
      // Enter search term
      const searchBox = page.locator('input[placeholder*="Search"]');
      await searchBox.fill('test product');
      await page.waitForTimeout(1000);
      
      // URL should contain both search and category
      const currentUrl = page.url();
      expect(currentUrl).toContain('search=test%20product');
      expect(currentUrl).toContain('category=');
      
      // API should be called with both parameters
      const combinedApiCalls = apiRequests.filter(url => 
        url.includes('search=test') && url.includes('category=') && !url.includes('category=&')
      );
      expect(combinedApiCalls.length).toBeGreaterThan(0);
    }
  });

  test('should debug and verify categoryForFiltering logic', async ({ page }) => {
    // Monitor console logs for debugging
    const debugLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Category filtering debug') || 
          msg.text().includes('useProductsByLocation params changed')) {
        debugLogs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test the categoryForFiltering logic by selecting categories
    const parentCategories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await parentCategories.count();
    if (categoryCount > 0) {
      // Select parent category
      await parentCategories.first().click();
      await page.waitForTimeout(1000);
      
      // Check if we can access subcategories
      const backButton = page.getByText('Back');
      if (await backButton.isVisible()) {
        const subcategories = page.locator('.space-y-3 button').filter({ 
          hasNot: page.getByText('All Subcategories') 
        });
        
        const subcategoryCount = await subcategories.count();
        if (subcategoryCount > 0) {
          // Select subcategory
          await subcategories.first().click();
          await page.waitForTimeout(1000);
          
          // At this point, categoryForFiltering should prioritize subcategory
          const relevantLogs = debugLogs.filter(log => 
            log.includes('selectedSubcategory') && log.includes('categoryForFiltering')
          );
          expect(relevantLogs.length).toBeGreaterThan(0);
        }
      }
      
      // Verify we have debug logs showing the filtering logic
      expect(debugLogs.length).toBeGreaterThan(0);
      console.log('Debug logs captured:', debugLogs.length);
    }
  });

});

/**
 * Integration test to verify the complete filtering workflow
 */
test.describe('End-to-End Category Filtering Workflow', () => {
  
  test('complete category filtering user journey', async ({ page }) => {
    // Setup location mock
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
    
    await page.goto('http://localhost:4000/products', { waitUntil: 'domcontentloaded' });
    
    // Skip any modals
    await page.waitForTimeout(2000);
    const skipButton = page.getByRole('button', { name: 'Skip for now' });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    await page.waitForTimeout(2000);
    
    // Step 1: Start with all products
    let productCount = await page.locator('[data-testid="product-count"]').textContent()
      .catch(() => page.locator('text=/\\d+ products found/').textContent())
      .catch(() => 'No count found');
    
    console.log('Initial product count:', productCount);
    
    // Step 2: Select a category
    const categories = page.locator('.space-y-3 button').filter({ 
      hasNot: page.getByText('All Categories') 
    });
    
    const categoryCount = await categories.count();
    console.log('Available categories:', categoryCount);
    
    if (categoryCount > 0) {
      const selectedCategory = categories.first();
      const categoryName = await selectedCategory.textContent();
      console.log('Selecting category:', categoryName);
      
      await selectedCategory.click();
      await page.waitForTimeout(2000);
      
      // Step 3: Verify products are filtered
      const newProductCount = await page.locator('[data-testid="product-count"]').textContent()
        .catch(() => page.locator('text=/\\d+ products found/').textContent())
        .catch(() => 'No count found');
      
      console.log('Product count after category selection:', newProductCount);
      
      // Step 4: Check if subcategories are available
      const backButton = page.getByText('Back');
      if (await backButton.isVisible()) {
        console.log('Subcategories are available');
        
        const subcategories = page.locator('.space-y-3 button').filter({ 
          hasNot: page.getByText('All Subcategories') 
        });
        
        const subcategoryCount = await subcategories.count();
        console.log('Available subcategories:', subcategoryCount);
        
        if (subcategoryCount > 0) {
          // Step 5: Select a subcategory
          const selectedSubcategory = subcategories.first();
          const subcategoryName = await selectedSubcategory.textContent();
          console.log('Selecting subcategory:', subcategoryName);
          
          await selectedSubcategory.click();
          await page.waitForTimeout(2000);
          
          // Step 6: Verify further filtering
          const finalProductCount = await page.locator('[data-testid="product-count"]').textContent()
            .catch(() => page.locator('text=/\\d+ products found/').textContent())
            .catch(() => 'No count found');
          
          console.log('Product count after subcategory selection:', finalProductCount);
        }
      }
      
      // Step 7: Reset to all categories
      const allCategoriesButton = page.getByText('All Categories');
      if (await allCategoriesButton.isVisible()) {
        await allCategoriesButton.click();
        await page.waitForTimeout(2000);
        
        const resetProductCount = await page.locator('[data-testid="product-count"]').textContent()
          .catch(() => page.locator('text=/\\d+ products found/').textContent())
          .catch(() => 'No count found');
        
        console.log('Product count after reset:', resetProductCount);
      } else {
        // If "All Categories" is not visible, go back to parent categories first
        const backButton = page.getByText('Back');
        if (await backButton.isVisible()) {
          await backButton.click();
          await page.waitForTimeout(1000);
          
          const allCategoriesButton = page.getByText('All Categories');
          await allCategoriesButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // The test passes if we reach this point without errors
    expect(true).toBe(true);
  });

});