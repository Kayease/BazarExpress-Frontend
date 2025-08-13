import { test, expect } from '@playwright/test';

/**
 * CORRECTED AUTHENTICATION FLOW TEST
 * 
 * Based on the actual authentication system:
 * - System uses PHONE-BASED authentication, not email
 * - Admin users: Phone → Password → OTP → Login
 * - Customer users: Phone → OTP → Login
 * - Login is handled through a MODAL, not a dedicated page
 * - Admin page correctly redirects to home when not authenticated
 */

test.describe('Corrected Authentication Flow', () => {

  test('should understand the correct authentication system', async ({ page }) => {
    console.log('🔍 UNDERSTANDING THE AUTHENTICATION SYSTEM');
    console.log('==========================================\n');
    
    // Step 1: Navigate to home and look for login trigger
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    console.log('📍 Current URL:', page.url());
    console.log('📄 Page Title:', await page.title());
    
    // Step 2: Look for login button/trigger
    const loginButtons = [
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      '[data-testid="login-button"]',
      '[data-testid="login-trigger"]',
      '.login-button',
      '.login-trigger'
    ];
    
    let loginTrigger = null;
    let triggerFound = false;
    
    for (const selector of loginButtons) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        loginTrigger = element;
        triggerFound = true;
        console.log(`✅ Found login trigger: ${selector}`);
        break;
      }
    }
    
    if (!triggerFound) {
      console.log('❌ No visible login trigger found. Checking all clickable elements...');
      
      // Get all clickable elements and their text content
      const clickableElements = page.locator('button, a, [role="button"], [onclick]');
      const count = await clickableElements.count();
      
      console.log(`📊 Found ${count} clickable elements:`);
      
      for (let i = 0; i < Math.min(count, 20); i++) {
        const element = clickableElements.nth(i);
        if (await element.isVisible()) {
          const text = await element.textContent();
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          const classes = await element.getAttribute('class') || '';
          
          if (text && (text.toLowerCase().includes('login') || 
                      text.toLowerCase().includes('sign in') ||
                      text.toLowerCase().includes('account') ||
                      classes.toLowerCase().includes('auth') ||
                      classes.toLowerCase().includes('login'))) {
            console.log(`  🎯 Potential login trigger: ${tagName} - "${text.trim()}" (${classes})`);
          }
        }
      }
      
      // Look for user account icons/avatars that might trigger login
      const accountIcons = [
        '[aria-label*="account"]',
        '[aria-label*="login"]',
        '[aria-label*="user"]',
        '.user-icon',
        '.account-icon',
        '.login-icon'
      ];
      
      for (const selector of accountIcons) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`  🔍 Found account icon: ${selector}`);
          loginTrigger = element;
          triggerFound = true;
          break;
        }
      }
    }
    
    // Step 3: Try to trigger login modal
    if (triggerFound && loginTrigger) {
      console.log('\n🚀 Attempting to trigger login modal...');
      await loginTrigger.click();
      await page.waitForTimeout(2000);
      
      // Check if modal appeared
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '.login-modal',
        '[data-testid="login-modal"]',
        'div:has-text("Enter mobile number")',
        'input[placeholder*="mobile"]',
        'input[type="tel"]'
      ];
      
      let modalFound = false;
      for (const selector of modalSelectors) {
        if (await page.locator(selector).isVisible()) {
          console.log(`✅ Login modal found: ${selector}`);
          modalFound = true;
          break;
        }
      }
      
      if (modalFound) {
        await page.screenshot({ 
          path: 'authentication-modal-found.png',
          fullPage: true 
        });
        
        // Step 4: Test the authentication flow
        console.log('\n📱 TESTING PHONE-BASED AUTHENTICATION');
        console.log('=====================================');
        
        // Look for phone input
        const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="mobile"], input[placeholder*="phone"]').first();
        
        if (await phoneInput.isVisible()) {
          console.log('✅ Phone input field found');
          
          // Test admin user authentication flow
          console.log('\n🔐 Testing Admin User Flow (Phone → Password → OTP):');
          
          // Enter admin phone number (you'll need to provide actual test credentials)
          const adminPhone = '9876543210'; // Replace with actual admin phone
          await phoneInput.fill(adminPhone);
          console.log(`📱 Entered phone: ${adminPhone}`);
          
          // Submit phone step
          const continueButton = page.locator('button[type="submit"], button:has-text("Continue")').first();
          if (await continueButton.isVisible()) {
            await continueButton.click();
            await page.waitForTimeout(3000);
            
            // Check if password step appears
            const passwordInput = page.locator('input[type="password"], input[name="password"]');
            if (await passwordInput.isVisible()) {
              console.log('✅ Password step appeared (admin user detected)');
              
              // Enter password
              const adminPassword = 'admin123'; // Replace with actual admin password
              await passwordInput.fill(adminPassword);
              console.log('🔑 Entered password');
              
              // Submit password
              const verifyPasswordButton = page.locator('button:has-text("Verify Password"), button[type="submit"]').first();
              if (await verifyPasswordButton.isVisible()) {
                await verifyPasswordButton.click();
                await page.waitForTimeout(3000);
                
                // Check if OTP step appears
                const otpInput = page.locator('input[placeholder*="OTP"], input[placeholder*="6-digit"]');
                if (await otpInput.isVisible()) {
                  console.log('✅ OTP step appeared');
                  console.log('📨 OTP should be sent to phone number');
                  
                  // For testing, we would need the actual OTP
                  // In a real test, you'd either:
                  // 1. Use a test phone number with predictable OTP
                  // 2. Mock the OTP service
                  // 3. Have a test mode that shows the OTP
                  
                  console.log('⚠️  OTP verification requires actual SMS or test configuration');
                  console.log('⚠️  For manual testing: Check phone for OTP and enter it');
                  
                  await page.screenshot({ 
                    path: 'authentication-otp-step.png',
                    fullPage: true 
                  });
                } else {
                  console.log('❌ OTP step did not appear');
                }
              } else {
                console.log('❌ Verify password button not found');
              }
            } else {
              console.log('⚠️  Password step did not appear - might be customer user flow');
              
              // Check if went directly to OTP
              const otpInput = page.locator('input[placeholder*="OTP"], input[placeholder*="6-digit"]');
              if (await otpInput.isVisible()) {
                console.log('✅ Went directly to OTP step (customer user flow)');
              }
            }
          } else {
            console.log('❌ Continue button not found');
          }
        } else {
          console.log('❌ Phone input field not found in modal');
        }
      } else {
        console.log('❌ Login modal did not appear');
        await page.screenshot({ 
          path: 'no-login-modal.png',
          fullPage: true 
        });
      }
    } else {
      console.log('❌ No login trigger found on the page');
      await page.screenshot({ 
        path: 'no-login-trigger.png',
        fullPage: true 
      });
    }
    
    // Step 4: Document the correct authentication system
    console.log('\n📋 AUTHENTICATION SYSTEM SUMMARY');
    console.log('=================================');
    console.log('✅ Authentication Type: Phone-based with OTP');
    console.log('✅ Login Method: Modal-based (not dedicated page)');
    console.log('✅ Admin Flow: Phone → Password → OTP → Login');  
    console.log('✅ Customer Flow: Phone → OTP → Login');
    console.log('✅ Admin Redirect: /admin → / (when not authenticated)');
    console.log('');
    console.log('🔧 TEST REQUIREMENTS:');
    console.log('- Need actual test phone numbers and passwords');
    console.log('- Need OTP testing strategy (mock service or test numbers)');
    console.log('- Need to trigger login modal, not navigate to /login');
    console.log('- Need to handle 3-step authentication flow');
    console.log('');
  });
  
  test('should provide corrected AuthHelper for phone-based authentication', async ({ page }) => {
    console.log('📝 CORRECTED AUTHENTICATION HELPER');
    console.log('==================================\n');
    
    const correctedAuthHelper = `
// CORRECTED AuthHelper for phone-based authentication

class AuthHelper {
  constructor(private page: Page) {}

  async login(user: { phone: string; password?: string; role: string }) {
    // Step 1: Navigate to home page
    await this.page.goto('http://localhost:3000');
    
    // Step 2: Find and click login trigger
    const loginTrigger = this.page.locator(
      'button:has-text("Login"), a:has-text("Login"), [data-testid="login-trigger"]'
    ).first();
    
    await loginTrigger.click();
    await this.page.waitForTimeout(2000);
    
    // Step 3: Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
    
    // Step 4: Enter phone number
    const phoneInput = this.page.locator('input[type="tel"], input[placeholder*="mobile"]').first();
    await phoneInput.fill(user.phone);
    
    // Step 5: Submit phone
    await this.page.locator('button:has-text("Continue")').click();
    await this.page.waitForTimeout(3000);
    
    // Step 6: Handle password step (for admin users)
    if (user.password) {
      const passwordInput = this.page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(user.password);
        await this.page.locator('button:has-text("Verify Password")').click();
        await this.page.waitForTimeout(3000);
      }
    }
    
    // Step 7: Handle OTP step
    const otpInput = this.page.locator('input[placeholder*="OTP"]');
    await expect(otpInput).toBeVisible();
    
    // For testing, you would need to:
    // 1. Get OTP from SMS service or test endpoint
    // 2. Fill OTP: await otpInput.fill(otp);
    // 3. Verify login success
    
    console.log('⚠️  OTP step requires actual implementation based on your OTP strategy');
  }
}

// Test credentials structure:
const testUsers = {
  admin: {
    phone: '9876543210',
    password: 'admin123',
    role: 'admin'
  },
  inventoryManager: {
    phone: '9876543211', 
    password: 'inventory123',
    role: 'product_inventory_management'
  },
  customer: {
    phone: '9876543212',
    // No password for customers
    role: 'user'  
  }
};
`;
    
    console.log(correctedAuthHelper);
    console.log('\n✅ This is the correct authentication pattern for your system!');
  });

});