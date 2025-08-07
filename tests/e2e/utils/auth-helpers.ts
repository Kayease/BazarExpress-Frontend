import { Page, expect } from '@playwright/test';

export const TEST_USERS = {
  admin: {
    email: 'admin@bazarxpress.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'admin'
  },
  warehouseManager: {
    email: 'warehouse@bazarxpress.com', 
    password: 'warehouse123',
    name: 'Warehouse Manager',
    role: 'order_warehouse_management'
  },
  inventoryManager: {
    email: 'inventory@bazarxpress.com',
    password: 'inventory123', 
    name: 'Inventory Manager',
    role: 'product_inventory_management'
  },
  marketingManager: {
    email: 'marketing@bazarxpress.com',
    password: 'marketing123',
    name: 'Marketing Manager', 
    role: 'marketing_content_manager'
  },
  supportExecutive: {
    email: 'support@bazarxpress.com',
    password: 'support123',
    name: 'Support Executive',
    role: 'customer_support_executive'
  },
  financeAnalyst: {
    email: 'finance@bazarxpress.com',
    password: 'finance123',
    name: 'Finance Analyst',
    role: 'report_finance_analyst'
  }
};

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAs(userType: keyof typeof TEST_USERS) {
    const user = TEST_USERS[userType];
    
    // Navigate to admin page (will redirect to login if not authenticated)
    await this.page.goto('http://localhost:3000/admin');
    await this.waitForPageLoad();
    
    // Check if we're already logged in
    const currentUrl = this.page.url();
    if (!currentUrl.includes('login') && !currentUrl.includes('auth')) {
      // Check if we're logged in as the right user
      const existingUser = await this.page.evaluate(() => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      });
      
      if (existingUser && existingUser.email === user.email) {
        return; // Already logged in as correct user
      } else {
        // Logout first
        await this.logout();
      }
    }

    // Try to find login form or navigate to it
    let loginFormVisible = false;
    
    // Check if login form is visible
    const loginForm = this.page.locator('[data-testid="login-form"], form, input[type="email"], input[name="email"]').first();
    loginFormVisible = await loginForm.isVisible().catch(() => false);

    if (!loginFormVisible) {
      // Look for login button or link
      const loginButton = this.page.locator('text="Login", text="Sign In", [data-testid="login-button"]').first();
      if (await loginButton.isVisible().catch(() => false)) {
        await loginButton.click();
        await this.waitForPageLoad();
      } else {
        // Try navigating to auth login page
        await this.page.goto('http://localhost:3000/auth/login');
        await this.waitForPageLoad();
      }
    }

    // Fill login form
    await this.fillLoginForm(user.email, user.password);
    
    // Submit form
    await this.submitLoginForm();
    
    // Wait for successful login
    await this.waitForLogin();
    
    // Verify we're logged in as correct user
    await this.verifyUserLogin(user);
  }

  async fillLoginForm(email: string, password: string) {
    // Try different possible selectors for email field
    const emailSelectors = [
      '[data-testid="email"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];

    let emailFilled = false;
    for (const selector of emailSelectors) {
      const emailField = this.page.locator(selector).first();
      if (await emailField.isVisible().catch(() => false)) {
        await emailField.fill(email);
        emailFilled = true;
        break;
      }
    }

    if (!emailFilled) {
      throw new Error('Could not find email input field');
    }

    // Try different possible selectors for password field  
    const passwordSelectors = [
      '[data-testid="password"]',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      const passwordField = this.page.locator(selector).first();
      if (await passwordField.isVisible().catch(() => false)) {
        await passwordField.fill(password);
        passwordFilled = true;
        break;
      }
    }

    if (!passwordFilled) {
      throw new Error('Could not find password input field');
    }
  }

  async submitLoginForm() {
    const submitSelectors = [
      '[data-testid="login-submit"]',
      '[data-testid="submit-button"]',
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Log In")'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      const submitButton = this.page.locator(selector).first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        submitted = true;
        break;
      }
    }

    if (!submitted) {
      // Try pressing Enter on password field
      const passwordField = this.page.locator('input[type="password"]').first();
      if (await passwordField.isVisible().catch(() => false)) {
        await passwordField.press('Enter');
      } else {
        throw new Error('Could not find submit button or password field');
      }
    }
  }

  async waitForLogin() {
    // Wait for redirect or success indication
    await this.page.waitForTimeout(2000);
    
    // Check for successful login indicators
    const successIndicators = [
      () => this.page.url().includes('/admin'),
      () => this.page.locator('text="Dashboard", text="Welcome"').first().isVisible(),
      () => this.page.evaluate(() => localStorage.getItem('token') !== null),
      () => this.page.evaluate(() => localStorage.getItem('user') !== null)
    ];

    let loginSuccessful = false;
    for (const check of successIndicators) {
      try {
        if (await check()) {
          loginSuccessful = true;
          break;
        }
      } catch (e) {
        // Continue to next check
      }
    }

    if (!loginSuccessful) {
      // Check for error messages
      const errorMessage = this.page.locator('text="Invalid", text="Error", text="Failed", [data-testid="error"]').first();
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      
      throw new Error('Login may have failed - no success indicators found');
    }
  }

  async verifyUserLogin(expectedUser: any) {
    const user = await this.page.evaluate(() => {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    });

    if (!user) {
      throw new Error('No user data found in localStorage after login');
    }

    if (user.email !== expectedUser.email) {
      throw new Error(`Logged in as wrong user. Expected: ${expectedUser.email}, Got: ${user.email}`);
    }
  }

  async logout() {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to find logout button if on admin page
    const currentUrl = this.page.url();
    if (currentUrl.includes('/admin')) {
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        'text="Logout"',
        'text="Sign Out"',
        'text="Log Out"'
      ];

      for (const selector of logoutSelectors) {
        const logoutButton = this.page.locator(selector).first();
        if (await logoutButton.isVisible().catch(() => false)) {
          await logoutButton.click();
          break;
        }
      }
    }

    // Navigate away from admin
    await this.page.goto('http://localhost:3000');
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  async expectUnauthorized() {
    // Check for various unauthorized indicators
    const unauthorizedIndicators = [
      'text="Access Denied"',
      'text="Unauthorized"', 
      'text="You don\'t have permission"',
      'text="403"',
      'text="Not authorized"',
      '[data-testid="unauthorized"]'
    ];

    let foundUnauthorized = false;
    for (const selector of unauthorizedIndicators) {
      if (await this.page.locator(selector).isVisible().catch(() => false)) {
        foundUnauthorized = true;
        break;
      }
    }

    // Also check if redirected to login
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl === 'http://localhost:3000/') {
      foundUnauthorized = true;
    }

    if (!foundUnauthorized) {
      throw new Error('Expected unauthorized access but page loaded normally');
    }
  }

  // Helper method to create test users if they don't exist
  async createTestUserIfNeeded(userType: keyof typeof TEST_USERS) {
    const user = TEST_USERS[userType];
    
    // This would typically require admin access to create users
    // For now, we'll document that test users need to be created manually
    console.log(`Test user needed: ${user.email} with role: ${user.role}`);
    
    // In a real implementation, you might:
    // 1. Check if user exists via API
    // 2. Create user via admin API if doesn't exist
    // 3. Or provide instructions for manual creation
  }
}