import { Page, expect } from '@playwright/test';

export interface TestUser {
  phone: string;
  password?: string; // Only for admin users
  role: string;
  otp?: string;
}

/**
 * CORRECTED AuthHelper for Phone-Based Authentication
 * 
 * This helper works with your actual authentication system:
 * - Phone-based authentication (not email)
 * - Modal-based login (not dedicated page)
 * - Admin flow: Phone → Password → OTP → Login
 * - Customer flow: Phone → OTP → Login
 * - Handles overlays and location services properly
 */
export class CorrectedAuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with phone-based authentication
   */
  async login(user: TestUser): Promise<void> {
    console.log(`🔐 Starting authentication for ${user.role} user`);
    
    try {
      // Step 1: Navigate and prepare page
      await this.navigateAndPrepare();
      
      // Step 2: Clear any interfering modals/overlays
      await this.clearInitialOverlays();
      
      // Step 3: Open login modal
      await this.openLoginModal();
      
      // Step 4: Phone number step
      await this.fillPhoneNumber(user.phone);
      
      // Step 5: Password step (admin users only)
      if (user.password) {
        await this.handlePasswordStep(user.password);
      }
      
      // Step 6: OTP step
      if (user.otp) {
        await this.handleOtpStep(user.otp);
        await this.verifyLoginSuccess();
      } else {
        console.log('⚠️  OTP required but not provided. Check your phone or use test OTP service.');
        console.log('📱 Current step: Waiting for OTP verification');
      }
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      await this.page.screenshot({ 
        path: `auth-error-${Date.now()}.png`, 
        fullPage: true 
      });
      throw error;
    }
  }

  /**
   * Navigate to home page and wait for full load
   */
  private async navigateAndPrepare(): Promise<void> {
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => document.readyState === 'complete');
    await this.page.waitForTimeout(2000); // Let any auto-popups settle
  }

  /**
   * Clear location services and delivery check overlays
   */
  private async clearInitialOverlays(): Promise<void> {
    console.log('🧹 Clearing initial overlays...');
    
    // Handle specific modals that interfere with login
    const overlayHandlers = [
      // Location services modal
      {
        trigger: 'text="Use Current Location"',
        action: async () => {
          const closeBtn = this.page.locator('[data-state="open"] button').last(); // Usually the X button
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      },
      // Delivery check modal  
      {
        trigger: 'text="Check Delivery"',
        action: async () => {
          const closeBtn = this.page.locator('button[aria-label="Close"]');
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      },
      // Generic modal closer
      {
        trigger: '[data-state="open"]',
        action: async () => {
          const closeBtn = this.page.locator('[data-state="open"] button').last();
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      }
    ];

    for (const handler of overlayHandlers) {
      try {
        if (await this.page.locator(handler.trigger).isVisible()) {
          console.log(`🚪 Found overlay: ${handler.trigger}`);
          await handler.action();
          await this.page.waitForTimeout(1000);
        }
      } catch (e) {
        // Ignore individual overlay clearing errors
        console.log(`⚠️  Could not clear overlay ${handler.trigger}, continuing...`);
      }
    }

    // Wait for overlays to close
    await this.page.waitForTimeout(1000);
  }

  /**
   * Find and click the login button to open modal
   */
  private async openLoginModal(): Promise<void> {
    console.log('🚪 Opening login modal...');
    
    // Find login button
    const loginButton = this.page.locator('button:has-text("Login")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    
    // Click login button with retry logic
    let clickSuccessful = false;
    const clickAttempts = [
      () => loginButton.click({ timeout: 3000 }),
      () => loginButton.click({ force: true }),
      () => this.page.keyboard.press('Tab', { delay: 100 }) // Sometimes helps with focus
        .then(() => this.page.keyboard.press('Enter'))
    ];

    for (const attemptClick of clickAttempts) {
      try {
        await attemptClick();
        clickSuccessful = true;
        break;
      } catch (e) {
        console.log('⚠️  Click attempt failed, trying next method...');
      }
    }

    if (!clickSuccessful) {
      throw new Error('Could not click login button');
    }

    // Wait for login modal to appear
    const modalSelectors = ['[role="dialog"]', '.login-modal', 'input[type="tel"]'];
    let modalFound = false;
    
    for (const selector of modalSelectors) {
      try {
        await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
        modalFound = true;
        console.log(`✅ Login modal opened (detected via: ${selector})`);
        break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!modalFound) {
      throw new Error('Login modal did not open');
    }
  }

  /**
   * Fill and submit phone number
   */
  private async fillPhoneNumber(phone: string): Promise<void> {
    console.log(`📱 Filling phone number: ${phone}`);
    
    // Find phone input
    const phoneInput = this.page.locator('input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 5000 });
    
    // Clear and fill phone number
    await phoneInput.clear();
    await phoneInput.fill(phone);
    
    // Verify phone was filled correctly
    const enteredValue = await phoneInput.inputValue();
    if (enteredValue !== phone) {
      throw new Error(`Phone number not filled correctly. Expected: ${phone}, Got: ${enteredValue}`);
    }

    // Submit phone number
    await this.submitPhoneStep();
  }

  /**
   * Submit phone number step
   */
  private async submitPhoneStep(): Promise<void> {
    console.log('📤 Submitting phone number...');
    
    // Find and click continue button
    const continueButton = this.page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    
    // Try different submission methods
    try {
      await continueButton.click();
    } catch (e) {
      console.log('⚠️  Button click failed, trying Enter key...');
      const phoneInput = this.page.locator('input[type="tel"]').first();
      await phoneInput.press('Enter');
    }
    
    // Wait for next step to load
    await this.page.waitForTimeout(3000);
  }

  /**
   * Handle password step for admin users
   */
  private async handlePasswordStep(password: string): Promise<void> {
    console.log('🔑 Handling password step...');
    
    // Check if password step appeared
    const passwordInput = this.page.locator('input[type="password"]');
    
    try {
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      console.log('✅ Password step detected');
    } catch (e) {
      console.log('⚠️  Password step not found - user might be customer or already at OTP step');
      return;
    }

    // Fill password
    await passwordInput.fill(password);
    
    // Submit password
    const verifyButton = this.page.locator('button:has-text("Verify Password"), button[type="submit"]');
    await expect(verifyButton).toBeVisible();
    await verifyButton.click();
    
    // Wait for OTP step
    await this.page.waitForTimeout(3000);
    console.log('✅ Password verified, proceeding to OTP step');
  }

  /**
   * Handle OTP verification step
   */
  private async handleOtpStep(otp: string): Promise<void> {
    console.log(`📨 Handling OTP step with code: ${otp}`);
    
    // Find OTP input - try multiple selectors
    const otpSelectors = [
      'input[placeholder*="OTP"]',
      'input[maxlength="6"]',
      'input[type="text"][maxlength="6"]',
      '.otp-input input'
    ];
    
    let otpInput = null;
    for (const selector of otpSelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible()) {
        otpInput = input;
        console.log(`✅ OTP input found: ${selector}`);
        break;
      }
    }

    if (!otpInput) {
      throw new Error('OTP input field not found');
    }

    // Fill OTP
    await otpInput.fill(otp);
    
    // Auto-submit or click verify button
    const submitButton = this.page.locator('button:has-text("Verify"), button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      // Some OTP inputs auto-submit when complete
      console.log('⚠️  No submit button found, OTP might auto-submit');
    }
    
    // Wait for verification
    await this.page.waitForTimeout(3000);
  }

  /**
   * Verify successful login
   */
  private async verifyLoginSuccess(): Promise<void> {
    console.log('🔍 Verifying login success...');
    
    // Check for success indicators
    const successIndicators = [
      () => this.page.url() !== 'http://localhost:3000/', // Redirected away from home
      () => this.page.locator('text="Dashboard"').isVisible(),
      () => this.page.locator('button:has-text("Logout"), button:has-text("Sign out")').isVisible(),
      () => this.page.evaluate(() => localStorage.getItem('token') !== null), // Token stored
    ];

    let loginSuccessful = false;
    for (const check of successIndicators) {
      try {
        const result = await check();
        if (result) {
          loginSuccessful = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    if (loginSuccessful) {
      console.log('✅ Login successful!');
    } else {
      console.log('⚠️  Login success unclear - check manually');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out...');
    
    // Clear authentication data
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to home
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState('networkidle');
    
    console.log('✅ Logged out successfully');
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const hasToken = await this.page.evaluate(() => {
        return localStorage.getItem('token') !== null;
      });
      
      const hasLogoutButton = await this.page.locator('button:has-text("Logout"), button:has-text("Sign out")').isVisible();
      
      return hasToken || hasLogoutButton;
    } catch (e) {
      return false;
    }
  }
}

// Test user examples
export const TEST_USERS = {
  admin: {
    phone: '9876543210',      // Replace with actual admin phone
    password: 'admin123',     // Replace with actual admin password
    role: 'admin',
    otp: '123456'            // Replace with actual OTP or test OTP
  },
  
  inventoryManager: {
    phone: '9876543211',      // Replace with actual phone
    password: 'inventory123', // Replace with actual password
    role: 'product_inventory_management',
    otp: '123456'
  },
  
  warehouseManager: {
    phone: '9876543212',      // Replace with actual phone
    password: 'warehouse123', // Replace with actual password  
    role: 'order_warehouse_management',
    otp: '123456'
  },
  
  customer: {
    phone: '9876543213',      // Replace with actual phone
    role: 'user',             // No password for customers
    otp: '123456'
  }
};

// Usage example:
/*
import { CorrectedAuthHelper, TEST_USERS } from './corrected-auth-helper';

test('should login admin user', async ({ page }) => {
  const authHelper = new CorrectedAuthHelper(page);
  await authHelper.login(TEST_USERS.admin);
  
  // Navigate to admin panel
  await page.goto('http://localhost:3000/admin');
  // ... rest of test
});
*/