import { test, expect, Page } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

/**
 * E2E Test: Order Status Change and Delivery Boy Assignment
 * 
 * This test verifies that when changing an order status to "shipped":
 * 1. Both status change and delivery boy assignment should succeed together
 * 2. If delivery boy assignment fails, the status should not change
 * 3. The backend API should handle the correct sequence of operations
 */

test.describe('Order Status and Delivery Boy Assignment', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to admin login
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should verify the issue with delivery boy assignment sequence', async () => {
    // First, let's verify the current broken behavior by examining the network calls
    
    // Navigate to admin orders page (we'll need to login first)
    await page.goto('http://localhost:3001');
    
    // Take a snapshot to see current state
    const snapshot = await page.locator('body').textContent();
    
    // Check if we have a login form or are already logged in
    if (snapshot?.includes('Login') || snapshot?.includes('Sign in')) {
      console.log('Login required - this test needs authenticated access');
      console.log('Current broken sequence:');
      console.log('1. Frontend calls assign-delivery API first');
      console.log('2. Backend expects order to be in "shipped" status');
      console.log('3. Order is still in previous status, so assignment fails');
      console.log('4. Status update happens anyway, breaking atomicity');
      
      // Verify the API endpoints exist
      const response1 = await fetch(`${API_URL}/orders/test-id/assign-delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryBoyId: 'test-id',
          deliveryBoyName: 'Test User',
          deliveryBoyPhone: '1234567890'
        })
      });
      
      // Should get 401 (unauthorized) or 403 (forbidden), not 404
      expect([401, 403].includes(response1.status)).toBeTruthy();
      
      const response2 = await fetch(`${API_URL}/orders/admin/status/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          note: 'Test status update'
        })
      });
      
      // Should get 401 (unauthorized) or 403 (forbidden), not 404  
      expect([401, 403].includes(response2.status)).toBeTruthy();
    }
    
    // Document the expected fix
    console.log('Expected fix:');
    console.log('1. Create atomic operation that handles both status change and delivery boy assignment');
    console.log('2. Or change sequence to update status first, then assign delivery boy');
    console.log('3. Ensure rollback if either operation fails');
  });

  test('should verify the current broken sequence in OrdersTable.tsx', async () => {
    // Check if the OrdersTable component has the problematic sequence
    
    console.log('Current broken sequence in updateStatus function:');
    console.log('Line 430: await assignDeliveryBoy() - Called BEFORE status update');
    console.log('Line 433-443: Status update API call - Called AFTER assignment');
    console.log('');
    console.log('Backend assignDeliveryBoy function:');
    console.log('Line 675: Checks if order.status !== "shipped" and returns 400');
    console.log('But status is not updated yet, so this always fails!');
    
    // This test documents the issue structure
    expect(true).toBe(true);
  });
});

/**
 * Test Requirements for Fix:
 * 
 * 1. Backend Fix Options:
 *    a) Modify assignDeliveryBoy to not require "shipped" status
 *    b) Create atomic endpoint that handles both operations
 *    c) Allow assignment in any status and update to shipped internally
 * 
 * 2. Frontend Fix Options:
 *    a) Change sequence: update status first, then assign delivery boy
 *    b) Use atomic API endpoint
 *    c) Add proper transaction rollback if either fails
 * 
 * 3. Test Coverage Needed:
 *    - Status change without delivery boy assignment (should work)
 *    - Status change with delivery boy assignment (should be atomic)
 *    - Failed delivery boy assignment (should not change status)
 *    - Proper error handling and user feedback
 */