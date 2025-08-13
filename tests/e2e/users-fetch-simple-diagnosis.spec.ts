import { test, expect } from '@playwright/test';

/**
 * Simplified Users Fetch Diagnosis Test
 * 
 * This test will check basic connectivity and authentication
 * without complex auth helpers to isolate the issue
 */

test.describe('Simple Users Fetch Diagnosis', () => {

  test('should check if frontend loads', async ({ page }) => {
    console.log('Testing frontend connectivity...');
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      console.log('Frontend loaded successfully, title:', title);
      
      expect(title).toBeTruthy();
    } catch (error) {
      console.error('Frontend connection failed:', error.message);
      throw error;
    }
  });

  test('should check backend API connectivity', async ({ page }) => {
    console.log('Testing backend API connectivity...');
    
    const backendCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:4000/', {
          method: 'GET'
        });
        
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
    
    console.log('Backend check result:', backendCheck);
    
    if (backendCheck.ok) {
      console.log('✅ Backend is accessible');
      expect(backendCheck.status).toBe(200);
    } else {
      console.error('❌ Backend connection failed');
      console.error('Status:', backendCheck.status);
      console.error('Error:', backendCheck.error);
      expect(backendCheck.ok).toBe(true);
    }
  });

  test('should manually login and test API', async ({ page }) => {
    console.log('Manual login test...');
    
    // Step 1: Go to admin login
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('Current URL after admin navigation:', page.url());
    
    // Step 2: Try to find login form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // Check if login form is visible
    if (await emailInput.isVisible().catch(() => false) && 
        await passwordInput.isVisible().catch(() => false)) {
      
      console.log('Login form found, filling credentials...');
      
      // Fill login form
      await emailInput.fill('admin@bazarxpress.com');
      await passwordInput.fill('admin123');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
      } else {
        await passwordInput.press('Enter');
      }
      
      // Wait for login
      await page.waitForTimeout(3000);
      
      console.log('URL after login attempt:', page.url());
      
      // Check if login was successful
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const user = await page.evaluate(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
      });
      
      console.log('Token exists:', !!token);
      console.log('User data:', user);
      
      if (token && user) {
        console.log('✅ Login successful');
        
        // Step 3: Test the API call
        console.log('Testing API call...');
        
        const apiResult = await page.evaluate(async (authToken) => {
          try {
            console.log('Making API call with token:', authToken.substring(0, 10) + '...');
            
            const response = await fetch('http://localhost:4000/api/admin/users', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('API Response status:', response.status);
            console.log('API Response ok:', response.ok);
            
            if (response.ok) {
              const data = await response.json();
              console.log('API Response data keys:', Object.keys(data));
              console.log('Users array length:', data.users ? data.users.length : data.length);
              
              return {
                status: response.status,
                ok: response.ok,
                data,
                userCount: data.users ? data.users.length : (Array.isArray(data) ? data.length : 0)
              };
            } else {
              const errorText = await response.text();
              console.log('API Error response:', errorText);
              
              return {
                status: response.status,
                ok: response.ok,
                error: errorText
              };
            }
          } catch (error) {
            console.error('API Call error:', error.message);
            return {
              status: 0,
              ok: false,
              error: error.message
            };
          }
        }, token);
        
        console.log('API call result:', apiResult);
        
        if (apiResult.ok) {
          console.log(`✅ API call successful, found ${apiResult.userCount} users`);
          expect(apiResult.status).toBe(200);
          expect(apiResult.userCount).toBeGreaterThanOrEqual(0);
        } else {
          console.error('❌ API call failed');
          console.error('Status:', apiResult.status);
          console.error('Error:', apiResult.error);
          
          // Analyze specific errors
          if (apiResult.status === 401) {
            console.error('Authentication failed - check JWT token');
          } else if (apiResult.status === 403) {
            console.error('Authorization failed - user may not have admin permissions');
          } else if (apiResult.status === 500) {
            console.error('Server error - check backend logs');
          } else if (apiResult.status === 0) {
            console.error('Network error - backend may not be running');
          }
          
          expect(apiResult.ok).toBe(true);
        }
        
        // Step 4: Test frontend page
        console.log('Testing frontend users page...');
        
        await page.goto('http://localhost:3000/admin/users');
        await page.waitForTimeout(3000);
        
        // Look for error messages
        const errorMessages = await page.locator('text="Request failed", text="Could not load users", text="Error"').count();
        const userRows = await page.locator('tr, .user-item, [data-testid="user-row"]').count();
        
        console.log('Error messages on page:', errorMessages);
        console.log('User rows on page:', userRows);
        
        if (errorMessages > 0) {
          // Try to get the exact error message
          const errorElement = page.locator('text="Request failed", text="Could not load users", text="Error"').first();
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            console.error('Error message on page:', errorText);
          }
          
          console.log('❌ Frontend shows error messages');
        } else {
          console.log('✅ No error messages on frontend');
        }
        
        if (userRows > 1) {
          console.log(`✅ Frontend shows ${userRows} user rows`);
        } else {
          console.log('❌ Frontend shows no user data');
        }
        
      } else {
        console.error('❌ Login failed');
        console.error('Current URL:', page.url());
        
        // Check for error messages
        const loginError = page.locator('text="Invalid", text="Error", text="Failed"');
        if (await loginError.isVisible().catch(() => false)) {
          const errorText = await loginError.textContent();
          console.error('Login error:', errorText);
        }
        
        expect(false).toBe(true); // Fail the test
      }
      
    } else {
      console.error('❌ Login form not found');
      console.error('Current URL:', page.url());
      console.error('Page title:', await page.title());
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'login-form-not-found.png',
        fullPage: true 
      });
      
      expect(false).toBe(true); // Fail the test
    }
  });
});