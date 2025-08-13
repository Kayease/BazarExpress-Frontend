import { Page, expect } from '@playwright/test';

/**
 * CORRECTED TEST USERS FOR PHONE-BASED AUTHENTICATION
 * 
 * Updated to match the actual authentication system:
 * - Uses phone numbers instead of email
 * - Admin users require passwords, customers don't
 * - All users need OTP for final verification
 */
export const TEST_USERS = {
  admin: {
    phone: '9876543210',      // Replace with actual admin phone
    password: 'admin123',     // Replace with actual admin password
    name: 'Super Admin',
    role: 'admin',
    requiresPassword: true
  },
  warehouseManager: {
    phone: '9876543211',      // Replace with actual phone
    password: 'warehouse123', // Replace with actual password
    name: 'Warehouse Manager',
    role: 'order_warehouse_management',
    requiresPassword: true
  },
  inventoryManager: {
    phone: '9876543212',      // Replace with actual phone
    password: 'inventory123', // Replace with actual password
    name: 'Inventory Manager',
    role: 'product_inventory_management',
    requiresPassword: true
  },
  marketingManager: {
    phone: '9876543213',      // Replace with actual phone
    password: 'marketing123', // Replace with actual password
    name: 'Marketing Manager',
    role: 'marketing_content_manager',
    requiresPassword: true
  },
  supportExecutive: {
    phone: '9876543214',      // Replace with actual phone
    password: 'support123',   // Replace with actual password
    name: 'Support Executive',
    role: 'customer_support_executive',
    requiresPassword: true
  },
  financeAnalyst: {
    phone: '9876543215',      // Replace with actual phone
    password: 'finance123',   // Replace with actual password
    name: 'Finance Analyst',
    role: 'report_finance_analyst',
    requiresPassword: true
  },
  deliveryBoy: {
    phone: '9876543216',      // Replace with actual phone
    password: 'delivery123',  // Replace with actual password
    name: 'Delivery Boy',
    role: 'delivery_boy',
    requiresPassword: true
  },
  customer: {
    phone: '9876543217',      // Replace with actual phone
    name: 'Test Customer',
    role: 'user',
    requiresPassword: false   // Customers don't need passwords
  }
};

export interface TestUser {
  phone: string;
  password?: string;
  name: string;
  role: string;
  requiresPassword: boolean;
  otp?: string;
}

/**
 * CORRECTED AuthHelper for Phone-Based Authentication
 * 
 * This replaces the old email-based authentication helper
 * and works with the actual modal-based phone authentication system
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Login using the corrected phone-based authentication
   */
  async loginAs(userType: keyof typeof TEST_USERS, otp?: string) {
    const user = TEST_USERS[userType];
    console.log(`🔐 Logging in as ${user.name} (${user.role}) with phone: ${user.phone}`);
    
    // Check if already logged in with correct role
    if (await this.isLoggedInAs(user.role)) {
      console.log('✅ Already logged in with correct role');
      return;
    }

    // Clear any existing authentication
    await this.logout();

    // Navigate to home page
    await this.page.goto('http://localhost:3000');
    await this.waitForPageLoad();

    // Clear interfering overlays
    await this.clearOverlays();

    // Open login modal
    await this.openLoginModal();

    // Step 1: Fill phone number
    await this.fillPhoneNumber(user.phone);

    // Step 2: Handle password step (admin users only)
    if (user.requiresPassword && user.password) {
      await this.handlePasswordStep(user.password);
    }

    // Step 3: Handle OTP step
    if (otp) {
      await this.handleOtpStep(otp);
      await this.verifyLoginSuccess();
      console.log(`✅ Successfully logged in as ${user.name}`);
    } else {
      console.log('⚠️  OTP not provided - test will pause at OTP verification step');
      console.log('📱 Please provide OTP or check your phone/test service');
      throw new Error(`OTP required for ${user.name} but not provided`);
    }
  }

  /**
   * Clear overlays that interfere with login (location services, delivery check, etc.)
   */
  private async clearOverlays() {
    console.log('🧹 Clearing interfering overlays...');
    
    const overlayHandlers = [
      // Location services modal
      async () => {
        const locationBtn = this.page.locator('button:has-text("Use Current Location")');
        if (await locationBtn.isVisible()) {
          const closeBtn = this.page.locator('[data-state="open"] button').last();
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      },
      
      // Delivery check modal
      async () => {
        const deliveryBtn = this.page.locator('button:has-text("Check Delivery")');
        if (await deliveryBtn.isVisible()) {
          const closeBtn = this.page.locator('button[aria-label="Close"]');
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      },
      
      // Generic modal closer
      async () => {
        const anyOpenModal = this.page.locator('[data-state="open"]');
        if (await anyOpenModal.isVisible()) {
          const closeBtn = anyOpenModal.locator('button').last();
          if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
          }
        }
      }
    ];

    for (const handler of overlayHandlers) {
      try {
        await handler();
        await this.page.waitForTimeout(500);
      } catch (e) {
        // Ignore individual overlay errors
      }
    }
  }

  /**
   * Open the login modal
   */
  private async openLoginModal() {
    console.log('🚪 Opening login modal...');
    
    const loginButton = this.page.locator('button:has-text("Login")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    
    // Try multiple click strategies
    let clicked = false;
    const clickStrategies = [
      () => loginButton.click({ timeout: 3000 }),
      () => loginButton.click({ force: true }),
      () => loginButton.click({ button: 'left', force: true })
    ];

    for (const strategy of clickStrategies) {
      try {
        await strategy();
        clicked = true;
        break;
      } catch (e) {
        console.log('⚠️  Click strategy failed, trying next...');
      }
    }

    if (!clicked) {
      throw new Error('Could not open login modal - all click strategies failed');
    }

    // Wait for modal to appear
    const modalVisible = await Promise.race([
      this.page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
      this.page.locator('input[type="tel"]').waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 6000))
    ]);

    if (!modalVisible) {
      throw new Error('Login modal did not appear after clicking login button');
    }

    console.log('✅ Login modal opened');
  }

  /**
   * Fill and submit phone number
   */
  private async fillPhoneNumber(phone: string) {
    console.log(`📱 Filling phone number: ${phone}`);
    
    const phoneInput = this.page.locator('input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 5000 });
    
    // Clear and fill phone number
    await phoneInput.clear();
    await phoneInput.fill(phone);
    
    // Verify it was filled correctly
    const filledValue = await phoneInput.inputValue();
    if (filledValue !== phone) {
      throw new Error(`Phone number not filled correctly. Expected: ${phone}, Got: ${filledValue}`);
    }

    // Submit phone number
    const continueButton = this.page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    
    try {
      await continueButton.click();
    } catch (e) {
      console.log('⚠️  Continue button click failed, trying Enter key...');
      await phoneInput.press('Enter');
    }
    
    // Wait for next step
    await this.page.waitForTimeout(3000);
    console.log('✅ Phone number submitted');
  }

  /**
   * Handle password step for admin users
   */
  private async handlePasswordStep(password: string) {
    console.log('🔑 Handling password step...');
    
    const passwordInput = this.page.locator('input[type="password"]');
    
    try {
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      console.log('✅ Password step appeared');
    } catch (e) {
      console.log('⚠️  Password step not found - might have gone directly to OTP');
      return;
    }

    // Fill password
    await passwordInput.fill(password);
    
    // Submit password
    const verifyButton = this.page.locator('button:has-text("Verify Password"), button[type="submit"]').first();
    await expect(verifyButton).toBeVisible({ timeout: 5000 });
    await verifyButton.click();
    
    // Wait for OTP step
    await this.page.waitForTimeout(3000);
    console.log('✅ Password verified');
  }

  /**
   * Handle OTP verification step
   */
  private async handleOtpStep(otp: string) {
    console.log(`📨 Handling OTP verification with: ${otp}`);
    
    // Find OTP input with multiple selectors
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
        console.log(`✅ OTP input found with selector: ${selector}`);
        break;
      }
    }

    if (!otpInput) {
      throw new Error('OTP input field not found');
    }

    // Fill OTP
    await otpInput.fill(otp);
    
    // Submit OTP (might auto-submit or need button click)
    const submitButton = this.page.locator('button:has-text("Verify"), button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      console.log('⚠️  No submit button found - OTP might auto-submit');
    }
    
    // Wait for verification to complete
    await this.page.waitForTimeout(3000);
    console.log('✅ OTP submitted');
  }

  /**
   * Verify login was successful
   */
  private async verifyLoginSuccess() {
    console.log('🔍 Verifying login success...');
    
    const successIndicators = [
      () => this.page.evaluate(() => localStorage.getItem('token') !== null),
      () => this.page.locator('button:has-text("Logout"), button:has-text("Sign out")').isVisible(),
      () => this.page.url() !== 'http://localhost:3000/',
    ];

    let success = false;
    for (const indicator of successIndicators) {
      try {
        if (await indicator()) {
          success = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    if (!success) {
      throw new Error('Login verification failed - no success indicators found');
    }

    console.log('✅ Login success verified');
  }

  /**
   * Check if user is logged in with specific role
   */
  async isLoggedInAs(role: string): Promise<boolean> {
    try {
      const hasToken = await this.page.evaluate(() => {
        return localStorage.getItem('token') !== null;
      });
      
      if (!hasToken) {
        return false;
      }
      
      const currentUser = await this.page.evaluate(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
      });
      
      return currentUser?.role === role;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if any user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const hasToken = await this.page.evaluate(() => {
        return localStorage.getItem('token') !== null;
      });
      return hasToken;
    } catch (e) {
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    console.log('🚪 Logging out...');
    
    // Clear authentication data
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to home to ensure clean state
    await this.page.goto('http://localhost:3000');
    await this.waitForPageLoad();
    
    console.log('✅ Logged out');
  }

  /**
   * Navigate to admin section (will work after login)
   */
  async navigateToAdmin() {
    await this.page.goto('http://localhost:3000/admin');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to specific admin section
   */
  async navigateToAdminSection(section: string) {
    await this.page.goto(`http://localhost:3000/admin/${section}`);
    await this.waitForPageLoad();
  }
}

/**
 * Usage Examples:
 * 
 * // Basic login
 * const authHelper = new AuthHelper(page);
 * await authHelper.loginAs('admin', '123456'); // phone-based with OTP
 * 
 * // Navigate to admin after login
 * await authHelper.navigateToAdmin();
 * 
 * // Login as different user types
 * await authHelper.loginAs('inventoryManager', '654321');
 * await authHelper.loginAs('customer', '111111'); // No password required
 */