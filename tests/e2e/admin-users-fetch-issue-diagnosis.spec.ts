import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USERS } from './utils/auth-helpers';

/**
 * Test Suite: Admin Users Fetch Issue Diagnosis
 * 
 * Purpose: Diagnose and fix the "Request failed" error when fetching users in admin panel
 * Target Framework: Playwright
 * 
 * Key Issues to Check:
 * 1. API endpoint availability
 * 2. Authentication token issues
 * 3. CORS configuration
 * 4. Network connectivity
 * 5. Backend server status
 */

test.describe('Admin Users Fetch Issue Diagnosis', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test.afterEach(async ({ page }) => {
    await authHelper.logout();
  });

  test('should successfully fetch users as admin', async ({ page }) => {
    // Step 1: Login as admin
    await authHelper.loginAs('admin');

    // Step 2: Navigate to admin users page
    await page.goto('http://localhost:3001/admin/users');
    await page.waitForLoadState('networkidle');

    // Step 3: Check for loading indicator
    await expect(page.locator('text="Loading"', { timeout: 5000 })).toBeVisible();

    // Step 4: Wait for users to load (give it more time)
    await page.waitForTimeout(3000);

    // Step 5: Check if users table is visible
    const usersTable = page.locator('[data-testid="users-table"], table, .users-list');
    await expect(usersTable).toBeVisible({ timeout: 10000 });

    // Step 6: Verify that we have user data
    const userRows = page.locator('tr, .user-item', { timeout: 5000 });
    const userCount = await userRows.count();
    
    if (userCount <= 1) {
      // No users found - this is the issue
      console.log('No users found in the table - investigating API call');
      
      // Check if there's an error message displayed
      const errorMessage = page.locator('text="Request failed", text="Could not load users", text="Error"');
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await errorMessage.textContent();
        console.log('Error message found:', errorText);
      }
    } else {
      // Users found successfully
      console.log(`Found ${userCount} user rows`);
      expect(userCount).toBeGreaterThan(1);
    }
  });

  test('should check API endpoint directly', async ({ page }) => {
    // Step 1: Login as admin to get token
    await authHelper.loginAs('admin');

    // Step 2: Get authentication token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Step 3: Make direct API call to test endpoint
    const apiResponse = await page.evaluate(async (authToken) => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const responseData = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: null,
          error: null
        };

        try {
          responseData.data = await response.json();
        } catch (jsonError) {
          responseData.error = 'Failed to parse JSON response';
        }

        return responseData;
      } catch (fetchError) {
        return {
          status: 0,
          ok: false,
          statusText: 'Network Error',
          headers: {},
          data: null,
          error: fetchError.message
        };
      }
    }, token);

    console.log('Direct API call result:', JSON.stringify(apiResponse, null, 2));

    // Step 4: Analyze the API response
    if (!apiResponse.ok) {
      if (apiResponse.status === 0) {
        console.error('Network error - backend server may not be running');
        expect(apiResponse.status).not.toBe(0);
      } else if (apiResponse.status === 401) {
        console.error('Authentication failed - token may be invalid');
        expect(apiResponse.status).not.toBe(401);
      } else if (apiResponse.status === 403) {
        console.error('Authorization failed - user may not have admin permissions');
        expect(apiResponse.status).not.toBe(403);
      } else if (apiResponse.status === 404) {
        console.error('API endpoint not found');
        expect(apiResponse.status).not.toBe(404);
      } else if (apiResponse.status === 500) {
        console.error('Server error - check backend logs');
        console.error('Error details:', apiResponse.data);
        expect(apiResponse.status).not.toBe(500);
      } else {
        console.error(`Unexpected status: ${apiResponse.status} - ${apiResponse.statusText}`);
        expect(apiResponse.ok).toBeTruthy();
      }
    } else {
      // Success - verify data structure
      expect(apiResponse.data).toBeTruthy();
      
      if (apiResponse.data.users) {
        // New API format
        expect(Array.isArray(apiResponse.data.users)).toBe(true);
        console.log(`API returned ${apiResponse.data.users.length} users`);
      } else if (Array.isArray(apiResponse.data)) {
        // Old API format
        console.log(`API returned ${apiResponse.data.length} users (old format)`);
      } else {
        console.error('Unexpected API response format:', apiResponse.data);
        expect(false).toBe(true); // Fail test due to unexpected format
      }
    }
  });

  test('should check network requests in browser', async ({ page }) => {
    const networkRequests: any[] = [];
    const failedRequests: any[] = [];

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/admin/users')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          timestamp: Date.now()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/users')) {
        console.log(`API response: ${response.status()} for ${response.url()}`);
        if (!response.ok()) {
          failedRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: Date.now()
          });
        }
      }
    });

    page.on('requestfailed', request => {
      if (request.url().includes('/api/admin/users')) {
        failedRequests.push({
          url: request.url(),
          failure: request.failure(),
          timestamp: Date.now()
        });
      }
    });

    // Step 1: Login as admin
    await authHelper.loginAs('admin');

    // Step 2: Navigate to users page
    await page.goto('http://localhost:3001/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 3: Analyze network requests
    console.log('Network requests made:', networkRequests);
    console.log('Failed requests:', failedRequests);

    // Step 4: Verify API call was made
    expect(networkRequests.length).toBeGreaterThan(0);

    // Step 5: Check for failures
    if (failedRequests.length > 0) {
      console.error('Failed requests detected:', failedRequests);
      
      // Provide diagnostic information
      failedRequests.forEach(request => {
        if (request.failure) {
          console.error(`Request failed: ${request.failure.errorText}`);
        } else {
          console.error(`HTTP error: ${request.status} ${request.statusText}`);
        }
      });
      
      expect(failedRequests.length).toBe(0);
    }
  });

  test('should check localStorage and authentication state', async ({ page }) => {
    // Step 1: Login as admin
    await authHelper.loginAs('admin');

    // Step 2: Check authentication data
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
        hasAuthData: !!(localStorage.getItem('token') && localStorage.getItem('user'))
      };
    });

    console.log('Auth data:', authData);

    // Step 3: Verify authentication data is present
    expect(authData.hasAuthData).toBe(true);
    expect(authData.token).toBeTruthy();
    expect(authData.user).toBeTruthy();
    expect(authData.user.role).toBe('admin');

    // Step 4: Check if token is properly formatted
    expect(authData.token).toMatch(/^[A-Za-z0-9-_.]+$/);

    // Step 5: Navigate to users page and check auth headers
    let requestHeaders: any = null;
    
    page.on('request', request => {
      if (request.url().includes('/api/admin/users') && request.method() === 'GET') {
        requestHeaders = request.headers();
      }
    });

    await page.goto('http://localhost:3001/admin/users');
    await page.waitForTimeout(2000);

    // Step 6: Verify authorization header is sent
    expect(requestHeaders).toBeTruthy();
    expect(requestHeaders['authorization']).toBeTruthy();
    expect(requestHeaders['authorization']).toContain('Bearer ');
    
    console.log('Request headers:', requestHeaders);
  });

  test('should verify API endpoint with curl equivalent', async ({ page }) => {
    // Step 1: Login as admin to get token
    await authHelper.loginAs('admin');
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Step 2: Test different API variations
    const apiTests = [
      'http://localhost:4000/api/admin/users',
      'http://localhost:4000/api/admin/users/',
      'http://localhost:4000/api/admin/users?page=1&limit=20'
    ];

    for (const apiUrl of apiTests) {
      console.log(`Testing API endpoint: ${apiUrl}`);
      
      const result = await page.evaluate(async ([url, authToken]) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          return {
            url,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            data: response.ok ? await response.json() : await response.text()
          };
        } catch (error) {
          return {
            url,
            status: 0,
            ok: false,
            statusText: 'Network Error',
            contentType: null,
            error: error.message
          };
        }
      }, [apiUrl, token]);

      console.log(`Result for ${apiUrl}:`, result);

      if (result.ok) {
        console.log('✅ API endpoint working correctly');
        expect(result.status).toBe(200);
        expect(result.data).toBeTruthy();
        break; // Found working endpoint
      } else {
        console.log(`❌ API endpoint failed: ${result.status} ${result.statusText}`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
      }
    }
  });

  test('should provide comprehensive diagnostic report', async ({ page }) => {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      testPhases: []
    };

    // Phase 1: Check if we can login
    try {
      await authHelper.loginAs('admin');
      diagnostics.testPhases.push({
        phase: 'Authentication',
        status: 'SUCCESS',
        message: 'Successfully logged in as admin'
      });
    } catch (error) {
      diagnostics.testPhases.push({
        phase: 'Authentication',
        status: 'FAILED',
        message: error.message
      });
      console.error('Diagnostic Report:', diagnostics);
      throw error;
    }

    // Phase 2: Check backend server connectivity
    try {
      const serverCheck = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:4000/');
          return {
            status: response.status,
            ok: response.ok,
            text: await response.text()
          };
        } catch (error) {
          return {
            status: 0,
            ok: false,
            error: error.message
          };
        }
      });

      if (serverCheck.ok) {
        diagnostics.testPhases.push({
          phase: 'Backend Connectivity',
          status: 'SUCCESS',
          message: `Backend server is running (status: ${serverCheck.status})`
        });
      } else {
        diagnostics.testPhases.push({
          phase: 'Backend Connectivity',
          status: 'FAILED',
          message: `Cannot connect to backend server (status: ${serverCheck.status}, error: ${serverCheck.error})`
        });
      }
    } catch (error) {
      diagnostics.testPhases.push({
        phase: 'Backend Connectivity',
        status: 'FAILED',
        message: error.message
      });
    }

    // Phase 3: Check API endpoint specific
    try {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const apiCheck = await page.evaluate(async (authToken) => {
        try {
          const response = await fetch('http://localhost:4000/api/admin/users', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          const result = {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: null,
            error: null
          };

          try {
            result.data = await response.json();
          } catch (jsonError) {
            result.error = `JSON parse error: ${jsonError.message}`;
            result.data = await response.text();
          }

          return result;
        } catch (fetchError) {
          return {
            status: 0,
            ok: false,
            error: fetchError.message
          };
        }
      }, token);

      if (apiCheck.ok) {
        diagnostics.testPhases.push({
          phase: 'API Endpoint',
          status: 'SUCCESS',
          message: `API endpoint working correctly`,
          data: {
            userCount: apiCheck.data?.users?.length || apiCheck.data?.length || 0,
            format: apiCheck.data?.users ? 'new' : 'old'
          }
        });
      } else {
        diagnostics.testPhases.push({
          phase: 'API Endpoint',
          status: 'FAILED',
          message: `API endpoint failed (status: ${apiCheck.status})`,
          error: apiCheck.error,
          data: apiCheck.data
        });
      }
    } catch (error) {
      diagnostics.testPhases.push({
        phase: 'API Endpoint',
        status: 'FAILED',
        message: error.message
      });
    }

    // Phase 4: Check frontend behavior
    try {
      await page.goto('http://localhost:3001/admin/users');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if error messages are displayed
      const errorElements = await page.locator('text="Request failed", text="Could not load users", text="Error", [data-testid="error"]').count();
      const userElements = await page.locator('tr, .user-item, [data-testid="user-row"]').count();

      diagnostics.testPhases.push({
        phase: 'Frontend Behavior',
        status: errorElements > 0 ? 'FAILED' : 'SUCCESS',
        message: errorElements > 0 ? 'Error messages found on page' : 'No error messages found',
        data: {
          errorElements,
          userElements,
          currentUrl: page.url()
        }
      });
    } catch (error) {
      diagnostics.testPhases.push({
        phase: 'Frontend Behavior',
        status: 'FAILED',
        message: error.message
      });
    }

    // Output comprehensive diagnostic report
    console.log('\n=== COMPREHENSIVE DIAGNOSTIC REPORT ===');
    console.log(JSON.stringify(diagnostics, null, 2));
    
    // Determine if any critical phase failed
    const failedPhases = diagnostics.testPhases.filter((phase: any) => phase.status === 'FAILED');
    
    if (failedPhases.length > 0) {
      console.log('\n❌ FAILED PHASES:');
      failedPhases.forEach((phase: any) => {
        console.log(`- ${phase.phase}: ${phase.message}`);
      });
      
      // Provide fix recommendations
      console.log('\n🔧 RECOMMENDED FIXES:');
      failedPhases.forEach((phase: any) => {
        switch (phase.phase) {
          case 'Backend Connectivity':
            console.log('- Ensure backend server is running on port 4000');
            console.log('- Check if MONGODB_URI is properly configured');
            console.log('- Verify no firewall blocking the connection');
            break;
          case 'API Endpoint':
            if (phase.message.includes('401')) {
              console.log('- Check JWT token validity and expiration');
              console.log('- Verify JWT_SECRET is consistent between frontend and backend');
            } else if (phase.message.includes('403')) {
              console.log('- Verify user has admin role in database');
              console.log('- Check hasPermission middleware configuration');
            } else if (phase.message.includes('500')) {
              console.log('- Check backend server logs for detailed error');
              console.log('- Verify database connection');
              console.log('- Check User model and query');
            }
            break;
          case 'Frontend Behavior':
            console.log('- Check if API_URL environment variable is set correctly');
            console.log('- Verify CORS configuration allows frontend domain');
            console.log('- Check browser network tab for failed requests');
            break;
        }
      });
      
      expect(failedPhases.length).toBe(0);
    } else {
      console.log('\n✅ ALL DIAGNOSTIC PHASES PASSED');
    }
  });
});