import { test, expect } from '@playwright/test';

/**
 * Manual Browser Diagnosis Test
 * 
 * This test will take screenshots and explore the actual UI
 * to understand what's happening with the admin authentication
 */

test.describe('Manual Browser Diagnosis', () => {

  test('should explore admin page and understand auth flow', async ({ page }) => {
    console.log('Starting manual diagnosis...');
    
    // Step 1: Navigate to frontend home
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    console.log('Home page loaded, title:', await page.title());
    
    // Take screenshot of home page
    await page.screenshot({ 
      path: 'diagnosis-01-home-page.png',
      fullPage: true 
    });
    
    // Step 2: Try to navigate to admin
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);
    
    console.log('After admin navigation:');
    console.log('- URL:', page.url());
    console.log('- Title:', await page.title());
    
    // Take screenshot of admin page
    await page.screenshot({ 
      path: 'diagnosis-02-admin-page.png',
      fullPage: true 
    });
    
    // Step 3: Check page content
    const pageText = await page.textContent('body');
    console.log('Page contains "login" (case-insensitive):', pageText?.toLowerCase().includes('login') || false);
    console.log('Page contains "admin" (case-insensitive):', pageText?.toLowerCase().includes('admin') || false);
    console.log('Page contains "sign in" (case-insensitive):', pageText?.toLowerCase().includes('sign in') || false);
    console.log('Page contains "dashboard" (case-insensitive):', pageText?.toLowerCase().includes('dashboard') || false);
    
    // Step 4: Check for different types of form elements
    const emailInputs = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count();
    const passwordInputs = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').count();
    const textInputs = await page.locator('input[type="text"]').count();
    const buttons = await page.locator('button').count();
    const forms = await page.locator('form').count();
    
    console.log('Form elements found:');
    console.log('- Email inputs:', emailInputs);
    console.log('- Password inputs:', passwordInputs);  
    console.log('- Text inputs:', textInputs);
    console.log('- Buttons:', buttons);
    console.log('- Forms:', forms);
    
    // Step 5: Check for modal or overlay elements
    const modals = await page.locator('[data-testid*="modal"], .modal, [role="dialog"]').count();
    const overlays = await page.locator('.overlay, .backdrop, [data-testid*="overlay"]').count();
    
    console.log('Overlay elements:');
    console.log('- Modals:', modals);
    console.log('- Overlays:', overlays);
    
    // Step 6: Look for specific admin-related elements
    const adminElements = await page.locator('text="Admin", text="Dashboard", text="Welcome"').count();
    const loginElements = await page.locator('text="Login", text="Sign In", text="Log In"').count();
    
    console.log('Admin/Login elements:');
    console.log('- Admin elements:', adminElements);
    console.log('- Login elements:', loginElements);
    
    // Step 7: Check navigation/header for login links
    const navLinks = page.locator('nav a, header a, .nav a, .header a');
    const navLinkCount = await navLinks.count();
    console.log('Navigation links found:', navLinkCount);
    
    if (navLinkCount > 0) {
      console.log('Navigation link texts:');
      for (let i = 0; i < Math.min(navLinkCount, 10); i++) {
        const linkText = await navLinks.nth(i).textContent();
        const linkHref = await navLinks.nth(i).getAttribute('href');
        console.log(`- "${linkText?.trim()}" -> ${linkHref}`);
      }
    }
    
    // Step 8: Try alternative login approaches
    console.log('Checking alternative login paths...');
    
    const alternativePaths = [
      '/login',
      '/auth/login',
      '/admin/login',
      '/auth/admin',
      '/signin',
      '/auth/signin'
    ];
    
    for (const path of alternativePaths) {
      console.log(`Testing path: ${path}`);
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      const hasEmailField = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
      const hasPasswordField = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false);
      
      console.log(`- URL after navigation: ${currentUrl}`);
      console.log(`- Has email field: ${hasEmailField}`);
      console.log(`- Has password field: ${hasPasswordField}`);
      
      if (hasEmailField && hasPasswordField) {
        console.log(`✅ Found login form at ${path}!`);
        
        // Take screenshot of login form
        await page.screenshot({ 
          path: `diagnosis-03-login-form-${path.replace('/', '')}.png`,
          fullPage: true 
        });
        
        // Try to login
        console.log('Attempting login...');
        await page.locator('input[type="email"], input[name="email"]').fill('admin@bazarxpress.com');
        await page.locator('input[type="password"], input[name="password"]').fill('admin123');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
        } else {
          await page.locator('input[type="password"], input[name="password"]').press('Enter');
        }
        
        await page.waitForTimeout(3000);
        
        console.log('After login attempt:');
        console.log('- URL:', page.url());
        
        // Check if login was successful
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const user = await page.evaluate(() => {
          const userData = localStorage.getItem('user');
          return userData ? JSON.parse(userData) : null;
        });
        
        console.log('- Token exists:', !!token);
        console.log('- User data:', user);
        
        if (token && user) {
          console.log('✅ Login successful! Testing API...');
          
          // Now test the users API
          await page.goto('http://localhost:3000/admin/users');
          await page.waitForTimeout(5000);
          
          await page.screenshot({ 
            path: 'diagnosis-04-after-successful-login-users-page.png',
            fullPage: true 
          });
          
          // Check for error messages
          const hasErrors = await page.locator('text="Request failed", text="Could not load users", text="Error"').isVisible().catch(() => false);
          console.log('- Users page has errors:', hasErrors);
          
          // Check for user data
          const userRows = await page.locator('tr, .user-item, [data-testid="user-row"]').count();
          console.log('- User rows found:', userRows);
          
          // Try to get console errors
          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              console.log('Browser console error:', msg.text());
            }
          });
          
          // Try to get network errors
          page.on('response', (response) => {
            if (response.url().includes('/api/admin/users') && !response.ok()) {
              console.log('API response error:', response.status(), response.statusText());
            }
          });
          
          // Wait a bit more and check again
          await page.waitForTimeout(3000);
          
          const finalErrors = await page.locator('text="Request failed", text="Could not load users", text="Error"').count();
          const finalUserRows = await page.locator('tr, .user-item, [data-testid="user-row"]').count();
          
          console.log('Final state:');
          console.log('- Error messages:', finalErrors);
          console.log('- User rows:', finalUserRows);
          
          if (finalErrors > 0) {
            const errorElement = page.locator('text="Request failed", text="Could not load users", text="Error"').first();
            if (await errorElement.isVisible()) {
              const errorText = await errorElement.textContent();
              console.log('- Error text:', errorText);
            }
          }
        } else {
          console.log('❌ Login failed');
        }
        
        return; // Exit after finding working login
      }
    }
    
    // Step 9: Check if there's a different auth mechanism
    console.log('No standard login form found. Checking localStorage for existing auth...');
    
    await page.goto('http://localhost:3000');
    
    // Try setting auth manually (for testing purposes)
    const testToken = 'test-token';
    const testUser = {
      id: 'test-id',
      email: 'admin@bazarxpress.com',
      role: 'admin',
      name: 'Test Admin'
    };
    
    await page.evaluate(([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, [testToken, testUser]);
    
    console.log('Set test auth data, checking admin page...');
    
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);
    
    console.log('With test auth:');
    console.log('- URL:', page.url());
    console.log('- Title:', await page.title());
    
    await page.screenshot({ 
      path: 'diagnosis-05-with-test-auth.png',
      fullPage: true 
    });
  });
});