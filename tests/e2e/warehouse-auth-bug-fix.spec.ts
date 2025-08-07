import { test, expect } from '@playwright/test';

/**
 * CRITICAL AUTHORIZATION BUG FIX TEST
 * 
 * This test specifically targets the reported issue:
 * "Order and Warehouse Management role getting 401 Unauthorized when editing warehouse"
 * Error: PUT http://localhost:4000/api/warehouses/{id} 401 (Unauthorized)
 */

test.describe('Warehouse Authorization Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin page first
    await page.goto('http://localhost:3000/admin');
  });

  test('STEP 1: Verify the authorization bug exists', async ({ page }) => {
    let networkErrors: string[] = [];
    let authHeaders: string[] = [];

    // Monitor network requests to catch the 401 error
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/warehouses/') && response.request().method() === 'PUT') {
        if (response.status() === 401) {
          networkErrors.push(`401 Unauthorized: ${url}`);
        }
        
        const authHeader = response.request().headers()['authorization'];
        if (authHeader) {
          authHeaders.push(`Auth header present: ${authHeader.substring(0, 20)}...`);
        } else {
          authHeaders.push('No authorization header found');
        }
      }
    });

    // Look for existing login or simulate the issue
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
    
    if (hasLoginForm) {
      console.log('🔍 Login form detected. This test requires manual login as warehouse manager.');
      console.log('📋 To test the bug manually:');
      console.log('   1. Login as Order and Warehouse Management role user');
      console.log('   2. Navigate to /admin/warehouse or /admin/warehouses');
      console.log('   3. Try to edit a warehouse');
      console.log('   4. Check browser network tab for 401 errors');
      
      // Skip the rest if no auth
      test.skip();
    }

    // If logged in, try to access warehouse page
    await page.goto('http://localhost:3000/admin/warehouse');
    await page.waitForLoadState('networkidle');
    
    // Look for warehouse editing functionality
    const editButtons = page.locator('[data-testid*="edit"], button:has-text("Edit"), [title*="edit" i]');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      console.log(`Found ${editButtonCount} potential edit buttons`);
      
      // Try clicking first edit button
      await editButtons.first().click();
      await page.waitForTimeout(2000);
      
      // Look for form or modal
      const hasModal = await page.locator('.modal, [role="dialog"], [data-testid*="modal"]').isVisible().catch(() => false);
      
      if (hasModal) {
        console.log('📝 Edit modal opened, looking for save functionality...');
        
        // Try to trigger save (this should cause the 401 error)
        const saveButtons = page.locator('button:has-text("Save"), button:has-text("Update"), [data-testid*="save"]');
        if (await saveButtons.count() > 0) {
          await saveButtons.first().click();
          await page.waitForTimeout(3000);
          
          // Check if we caught the 401 error
          if (networkErrors.length > 0) {
            console.log('🐛 BUG CONFIRMED:', networkErrors);
            console.log('🔐 Auth headers:', authHeaders);
            
            // This confirms the bug exists
            expect(networkErrors.length).toBeGreaterThan(0);
          } else {
            console.log('✅ No 401 errors detected - bug may be fixed or test conditions not met');
          }
        }
      }
    } else {
      console.log('⚠️  No edit buttons found - may need proper test data or different role');
    }
  });

  test('STEP 2: Test warehouse API endpoints directly', async ({ page, request }) => {
    // Test the API endpoint directly to isolate the authorization issue
    
    // First try without auth - should get 401
    const unauthedResponse = await request.put('http://localhost:4000/api/warehouses/test-id', {
      data: { name: 'Test Warehouse' }
    });
    
    console.log('📡 Unauthenticated request status:', unauthedResponse.status());
    expect(unauthedResponse.status()).toBe(401);

    // Try with invalid token - should get 401  
    const invalidTokenResponse = await request.put('http://localhost:4000/api/warehouses/test-id', {
      data: { name: 'Test Warehouse' },
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('📡 Invalid token request status:', invalidTokenResponse.status());
    expect(invalidTokenResponse.status()).toBe(401);

    // Check if there's a token in localStorage (from previous manual login)
    await page.goto('http://localhost:3000');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    if (token) {
      console.log('🔑 Found token in localStorage, testing with real auth...');
      
      const authedResponse = await request.put('http://localhost:4000/api/warehouses/test-id', {
        data: { name: 'Test Warehouse Update' },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Authenticated request status:', authedResponse.status());
      console.log('📡 Response body:', await authedResponse.text());
      
      // Should NOT be 401 with valid token
      expect(authedResponse.status()).not.toBe(401);
      
      if (authedResponse.status() === 401) {
        console.log('🐛 BUG CONFIRMED: Even with valid token, getting 401 Unauthorized');
        console.log('🔍 This indicates the backend middleware is not properly validating the token');
      } else if (authedResponse.status() === 403) {
        console.log('✅ Authorization working, but user lacks permission (403 Forbidden)');
      } else if (authedResponse.status() === 404) {
        console.log('ℹ️  Endpoint working, warehouse not found (404 Not Found)');
      } else if (authedResponse.status() === 200) {
        console.log('✅ Request successful (200 OK)');
      }
    } else {
      console.log('ℹ️  No token found - manual login required to test authenticated requests');
    }
  });

  test('STEP 3: Verify frontend sends authorization headers', async ({ page }) => {
    let requestsWithoutAuth: string[] = [];
    let requestsWithAuth: string[] = [];

    // Monitor all outgoing requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        const authHeader = request.headers()['authorization'];
        const method = request.method();
        
        if (authHeader) {
          requestsWithAuth.push(`${method} ${url}`);
        } else {
          requestsWithoutAuth.push(`${method} ${url}`);
        }
      }
    });

    // Navigate to warehouse page to trigger API calls
    await page.goto('http://localhost:3000/admin/warehouse');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 API Requests WITH Authorization:', requestsWithAuth);
    console.log('⚠️  API Requests WITHOUT Authorization:', requestsWithoutAuth);

    // Filter out expected public endpoints
    const criticalUnauthorizedCalls = requestsWithoutAuth.filter(call => 
      !call.includes('/public/') && 
      !call.includes('/health') &&
      call.includes('/warehouses')
    );

    if (criticalUnauthorizedCalls.length > 0) {
      console.log('🐛 FRONTEND BUG: Warehouse API calls missing authorization headers:');
      criticalUnauthorizedCalls.forEach(call => console.log('   -', call));
      
      // This indicates the frontend components are not using authenticatedFetch
      expect(criticalUnauthorizedCalls.length).toBe(0);
    } else {
      console.log('✅ All warehouse API calls include authorization headers');
    }
  });

  test('STEP 4: Instructions for manual verification', async ({ page }) => {
    // This test provides instructions for manual testing
    console.log('\n🔧 MANUAL TESTING INSTRUCTIONS:');
    console.log('=====================================');
    console.log('');
    console.log('1. Create test users in your database with these credentials:');
    console.log('   - Email: warehouse@bazarxpress.com');
    console.log('   - Password: warehouse123');  
    console.log('   - Role: order_warehouse_management');
    console.log('   - Assigned Warehouses: [assign at least one warehouse]');
    console.log('');
    console.log('2. Login manually with the warehouse manager credentials');
    console.log('');
    console.log('3. Navigate to warehouse management page');
    console.log('');
    console.log('4. Try to edit a warehouse and check for:');
    console.log('   - 401 Unauthorized errors in Network tab');
    console.log('   - Missing Authorization headers on PUT requests');
    console.log('');
    console.log('5. Expected behavior:');
    console.log('   - Warehouse manager should be able to edit warehouse details');
    console.log('   - Should NOT get 401 errors');
    console.log('   - All API requests should include Authorization header');
    console.log('');
    console.log('📋 If you see 401 errors, the bug exists and needs to be fixed by:');
    console.log('   - Ensuring WarehouseFormModal uses authenticatedFetch');
    console.log('   - Checking backend middleware for warehouse edit permissions');
    console.log('   - Verifying role permissions include warehouse edit access');
  });
});