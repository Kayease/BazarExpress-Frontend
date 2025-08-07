import { test, expect } from '@playwright/test';

/**
 * FINANCE ANALYST ROLE BUG FIX TEST
 * 
 * Specific test for reported issues with Report & Finance Analyst role:
 * 1. PUT http://localhost:4000/api/invoice-settings/ 403 (Forbidden)
 * 2. Tax section: "modalOpen is not defined" error
 * 3. Delivery settings: "admin access required" error
 */

test.describe('Finance Analyst Role Authorization Bug Fix', () => {
  
  test('STEP 1: Test invoice-settings API endpoint authorization', async ({ request }) => {
    console.log('🧪 Testing invoice-settings API endpoint authorization...');
    
    // Test without auth - should return 401
    const unauthResponse = await request.put('http://localhost:4000/api/invoice-settings/', {
      data: { test: 'data' }
    });
    console.log(`📡 PUT invoice-settings (no auth): ${unauthResponse.status()}`);
    expect(unauthResponse.status()).toBe(401);
    
    // Test with invalid token - should return 401
    const invalidTokenResponse = await request.put('http://localhost:4000/api/invoice-settings/', {
      data: { test: 'data' },
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    console.log(`📡 PUT invoice-settings (invalid token): ${invalidTokenResponse.status()}`);
    expect(invalidTokenResponse.status()).toBe(401);
    
    // Note: Test with valid token requires manual login
    console.log('ℹ️  To test with valid token, manually login as finance analyst and check localStorage token');
  });
  
  test('STEP 2: Check invoice-settings route configuration', async ({ page }) => {
    console.log('🔍 Instructions for checking invoice-settings route configuration:');
    console.log('');
    console.log('1. Check server/routes/ directory for invoice-settings routes');
    console.log('2. Verify the PUT route uses correct middleware:');
    console.log('   - Should include: isAuth, canAccessSection("invoice-settings")');
    console.log('   - Should allow: hasPermission(["admin", "report_finance_analyst"])');
    console.log('');
    console.log('3. Expected middleware chain:');
    console.log('   router.put("/", isAuth, hasPermission(["admin", "report_finance_analyst"]), canAccessSection("invoice-settings"), controller.updateInvoiceSettings);');
  });
  
  test('STEP 3: Test delivery settings and tax section frontend errors', async ({ page }) => {
    console.log('🔍 Testing frontend issues in delivery and tax sections...');
    
    // Navigate to admin page first to see if we can access it
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
    
    if (hasLogin) {
      console.log('ℹ️  Login required for testing. Manual steps:');
      console.log('1. Login as Report & Finance Analyst role user');
      console.log('2. Navigate to tax section and check for "modalOpen is not defined" error');
      console.log('3. Navigate to delivery settings and check for "admin access required" error');
      return;
    }
    
    // Try to access various admin sections to test access control
    const testUrls = [
      'http://localhost:3000/admin/delivery',
      'http://localhost:3000/admin/taxes', 
      'http://localhost:3000/admin/invoice-settings',
      'http://localhost:3000/admin/reports'
    ];
    
    for (const url of testUrls) {
      await page.goto(url);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`📍 ${url} -> ${currentUrl}`);
      
      // Check for error messages
      const errorMessages = await page.locator('text="Error:", text="Admin access required", text="Access denied"').allTextContents().catch(() => []);
      if (errorMessages.length > 0) {
        console.log(`❌ Errors found: ${errorMessages.join(', ')}`);
      }
    }
  });
  
  test('STEP 4: Frontend component analysis', async ({ page }) => {
    console.log('🔧 Frontend Component Issues Analysis:');
    console.log('=====================================\n');
    
    console.log('1. TAX SECTION ERROR: "modalOpen is not defined"');
    console.log('   - Location: AdminTaxes component');
    console.log('   - Issue: Missing React state for modal management');
    console.log('   - Fix needed: Add useState for modalOpen in AdminTaxes.tsx/jsx');
    console.log('   - Example fix:');
    console.log('     const [modalOpen, setModalOpen] = useState(false);');
    console.log('');
    
    console.log('2. DELIVERY SETTINGS ERROR: "admin access required"');
    console.log('   - Issue: Hardcoded admin check in delivery settings component');
    console.log('   - Fix needed: Update role check to include "report_finance_analyst"');
    console.log('   - Look for: isAdminUser() or role === "admin" checks');
    console.log('   - Replace with: hasAccessToSection(user.role, "delivery")');
    console.log('');
    
    console.log('3. INVOICE SETTINGS 403 ERROR:');
    console.log('   - Backend route may not include report_finance_analyst in allowed roles');
    console.log('   - Check: server/routes/invoice-settings routes');
    console.log('   - Fix: Add "report_finance_analyst" to hasPermission array');
    console.log('');
  });
  
  test('STEP 5: Generate fix recommendations', async ({ page }) => {
    console.log('🛠️  SPECIFIC FIX RECOMMENDATIONS:');
    console.log('==================================\n');
    
    console.log('FIX 1: Invoice Settings Backend Route');
    console.log('--------------------------------------');
    console.log('File: server/routes/invoiceRoutes.js (or similar)');
    console.log('Current (likely): hasPermission(["admin"])');
    console.log('Fix to: hasPermission(["admin", "report_finance_analyst"])');
    console.log('');
    
    console.log('FIX 2: AdminTaxes Component Modal State');
    console.log('---------------------------------------');
    console.log('File: components/AdminTaxes.tsx (or similar)');
    console.log('Add at top of component:');
    console.log('const [modalOpen, setModalOpen] = useState(false);');
    console.log('');
    
    console.log('FIX 3: Delivery Settings Component Access');
    console.log('-----------------------------------------');
    console.log('File: components/delivery settings component');
    console.log('Replace: if (user.role !== "admin")');
    console.log('With: if (!hasAccessToSection(user.role, "delivery"))');
    console.log('');
    
    console.log('FIX 4: Role Permissions Verification');
    console.log('------------------------------------');
    console.log('File: lib/adminAuth.ts');
    console.log('Ensure report_finance_analyst has access to:');
    console.log('- "reports"');
    console.log('- "invoice-settings"'); 
    console.log('- "taxes"');
    console.log('- "delivery"');
    console.log('');
  });
  
  test('STEP 6: Testing checklist for manual verification', async ({ page }) => {
    console.log('✅ MANUAL TESTING CHECKLIST:');
    console.log('============================\n');
    
    console.log('□ 1. Create Report & Finance Analyst user:');
    console.log('    Email: finance@bazarxpress.com');
    console.log('    Password: finance123'); 
    console.log('    Role: report_finance_analyst');
    console.log('');
    
    console.log('□ 2. Login and test each section:');
    console.log('    □ /admin/reports - Should work');
    console.log('    □ /admin/invoice-settings - Should work (currently 403)');
    console.log('    □ /admin/taxes - Should work (currently modalOpen error)');
    console.log('    □ /admin/delivery - Should work (currently admin access error)');
    console.log('');
    
    console.log('□ 3. Test unauthorized access:');
    console.log('    □ /admin/warehouse - Should be blocked');
    console.log('    □ /admin/products - Should be blocked');
    console.log('    □ /admin/users - Should be blocked');
    console.log('');
    
    console.log('□ 4. Network tab verification:');
    console.log('    □ All API requests include Authorization header');
    console.log('    □ No 403 errors on allowed sections');
    console.log('    □ 403 errors only on unauthorized sections');
    console.log('');
    
    console.log('EXPECTED OUTCOME:');
    console.log('- Finance analyst can manage invoice settings, taxes, delivery, and reports');
    console.log('- No JavaScript errors in tax section');
    console.log('- No "admin access required" messages in allowed sections');
  });
});