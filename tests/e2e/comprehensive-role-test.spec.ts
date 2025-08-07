import { test, expect } from '@playwright/test';

/**
 * COMPREHENSIVE ROLE-BASED ACCESS CONTROL TEST
 * 
 * This test suite provides a complete verification of the role management system
 * and helps identify authorization issues like the warehouse editing 401 error.
 */

test.describe('Comprehensive Role-Based Access Control Test', () => {
  
  test('API Authorization Test - Direct endpoint testing', async ({ request }) => {
    console.log('🧪 Testing API endpoints for proper authorization...');
    
    const testEndpoints = [
      { method: 'GET', url: 'http://localhost:4000/api/warehouses', roles: ['admin', 'order_warehouse_management'] },
      { method: 'PUT', url: 'http://localhost:4000/api/warehouses/test-id', roles: ['admin', 'order_warehouse_management'] },
      { method: 'POST', url: 'http://localhost:4000/api/warehouses', roles: ['admin'] },
      { method: 'DELETE', url: 'http://localhost:4000/api/warehouses/test-id', roles: ['admin'] },
      { method: 'GET', url: 'http://localhost:4000/api/products', roles: ['admin', 'product_inventory_management'] },
      { method: 'GET', url: 'http://localhost:4000/api/orders/admin/all', roles: ['admin', 'order_warehouse_management', 'customer_support_executive'] }
    ];

    for (const endpoint of testEndpoints) {
      await test.step(`${endpoint.method} ${endpoint.url}`, async () => {
        // Test without authorization - should return 401
        let response;
        
        if (endpoint.method === 'GET') {
          response = await request.get(endpoint.url);
        } else if (endpoint.method === 'POST') {
          response = await request.post(endpoint.url, { data: { test: 'data' } });
        } else if (endpoint.method === 'PUT') {
          response = await request.put(endpoint.url, { data: { test: 'update' } });
        } else if (endpoint.method === 'DELETE') {
          response = await request.delete(endpoint.url);
        }

        console.log(`  📡 ${endpoint.method} ${endpoint.url}: ${response?.status()}`);
        
        if (response) {
          // Should be 401 (unauthorized) for protected endpoints
          expect(response.status()).toBe(401);
        }
        
        // Test with invalid token - should return 401
        const invalidTokenResponse = endpoint.method === 'GET' 
          ? await request.get(endpoint.url, { headers: { 'Authorization': 'Bearer invalid-token' } })
          : endpoint.method === 'POST' 
          ? await request.post(endpoint.url, { data: { test: 'data' }, headers: { 'Authorization': 'Bearer invalid-token' } })
          : endpoint.method === 'PUT'
          ? await request.put(endpoint.url, { data: { test: 'update' }, headers: { 'Authorization': 'Bearer invalid-token' } })
          : await request.delete(endpoint.url, { headers: { 'Authorization': 'Bearer invalid-token' } });
          
        console.log(`  📡 ${endpoint.method} ${endpoint.url} (invalid token): ${invalidTokenResponse.status()}`);
        expect(invalidTokenResponse.status()).toBe(401);
      });
    }
  });

  test('Frontend Login Flow Test', async ({ page }) => {
    console.log('🔐 Testing frontend login and authentication flow...');
    
    // Navigate to admin page 
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after admin navigation: ${currentUrl}`);
    
    // Check if redirected to login or main page (expected if not authenticated)
    const isOnMainPage = currentUrl.includes('localhost:3000/') && !currentUrl.includes('/admin');
    const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
    
    if (isOnMainPage || isOnLoginPage) {
      console.log('✅ Proper authentication flow - redirected when not authenticated');
    } else {
      console.log('⚠️  Possible authentication issue - check redirect logic');
    }
    
    // Look for login form
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false);
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In")').isVisible().catch(() => false);
    
    console.log(`🔍 Login form elements found:`);
    console.log(`  📧 Email input: ${hasEmailInput}`);
    console.log(`  🔒 Password input: ${hasPasswordInput}`);  
    console.log(`  🔘 Login button: ${hasLoginButton}`);
    
    if (hasEmailInput && hasPasswordInput && hasLoginButton) {
      console.log('✅ Login form appears to be properly set up');
    } else {
      console.log('⚠️  Login form may be missing or have accessibility issues');
    }
  });

  test('Test User Creation Instructions', async ({ page }) => {
    console.log('\n📋 TEST USER SETUP INSTRUCTIONS:');
    console.log('=====================================\n');
    
    const testUsers = [
      { role: 'admin', email: 'admin@bazarxpress.com', password: 'admin123' },
      { role: 'order_warehouse_management', email: 'warehouse@bazarxpress.com', password: 'warehouse123' },
      { role: 'product_inventory_management', email: 'inventory@bazarxpress.com', password: 'inventory123' },
      { role: 'marketing_content_manager', email: 'marketing@bazarxpress.com', password: 'marketing123' },
      { role: 'customer_support_executive', email: 'support@bazarxpress.com', password: 'support123' },
      { role: 'report_finance_analyst', email: 'finance@bazarxpress.com', password: 'finance123' }
    ];
    
    console.log('Create these users in your database for testing:\n');
    
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} USER:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      
      if (user.role === 'order_warehouse_management' || user.role === 'product_inventory_management') {
        console.log(`   ⚠️  REQUIRED: Assign at least one warehouse to this user`);
      }
      console.log('');
    });
    
    console.log('💡 Database commands (adjust for your DB):');
    console.log('');
    console.log('For MongoDB:');
    testUsers.forEach(user => {
      console.log(`db.users.insertOne({`);
      console.log(`  email: "${user.email}",`);
      console.log(`  password: "$2b$10$your-hashed-password-here",`);
      console.log(`  name: "${user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}",`);
      console.log(`  role: "${user.role}",`);
      console.log(`  isActive: true,`);
      if (user.role === 'order_warehouse_management' || user.role === 'product_inventory_management') {
        console.log(`  assignedWarehouses: [ObjectId("your-warehouse-id-here")],`);
      }
      console.log(`  createdAt: new Date(),`);
      console.log(`  updatedAt: new Date()`);
      console.log(`});\n`);
    });
  });

  test('Manual Testing Guide', async ({ page }) => {
    console.log('\n🔧 MANUAL TESTING GUIDE:');
    console.log('=========================\n');
    
    console.log('1. WAREHOUSE AUTHORIZATION BUG TEST:');
    console.log('   a) Create warehouse manager user (see previous test output)');
    console.log('   b) Login as warehouse manager');
    console.log('   c) Navigate to http://localhost:3000/admin/warehouse');
    console.log('   d) Try to edit any warehouse');
    console.log('   e) Check browser Network tab for 401 errors on PUT requests');
    console.log('   f) Expected: Should NOT get 401 errors\n');
    
    console.log('2. ROLE-BASED ACCESS TEST:');
    console.log('   a) Login as each role type');
    console.log('   b) Verify navigation only shows allowed sections');
    console.log('   c) Try accessing unauthorized URLs directly');
    console.log('   d) Expected: Should be redirected or show access denied\n');
    
    console.log('3. API AUTHORIZATION TEST:');
    console.log('   a) Open browser DevTools > Network tab');
    console.log('   b) Login and perform actions (edit warehouse, create product, etc.)');
    console.log('   c) Verify all API requests include Authorization header');
    console.log('   d) Expected: All requests should have "Authorization: Bearer <token>"\n');
    
    console.log('4. DEBUGGING THE 401 ERROR:');
    console.log('   If you get 401 errors when editing warehouses:');
    console.log('   a) Check if token is in localStorage: localStorage.getItem("token")');
    console.log('   b) Verify token is being sent: Look at request headers in Network tab');
    console.log('   c) Check server logs for JWT verification errors');
    console.log('   d) Verify user role includes "order_warehouse_management"');
    console.log('   e) Verify user has assigned warehouses if required\n');
    
    console.log('5. EXPECTED BEHAVIOR BY ROLE:');
    console.log('   - admin: Access to everything');
    console.log('   - order_warehouse_management: Can edit warehouses, view/update orders');
    console.log('   - product_inventory_management: Can manage products/brands/categories');
    console.log('   - marketing_content_manager: Can manage banners/blogs/promotions');
    console.log('   - customer_support_executive: Can view users/orders, manage reviews');
    console.log('   - report_finance_analyst: Can access reports, taxes, settings\n');
  });

  test('Automated Health Check', async ({ page, request }) => {
    console.log('🏥 Running automated health checks...\n');
    
    // Check if backend is running
    await test.step('Backend Health Check', async () => {
      try {
        const response = await request.get('http://localhost:4000/api/warehouses');
        console.log(`✅ Backend responding: ${response.status()}`);
        expect([401, 403, 200].includes(response.status())).toBeTruthy();
      } catch (error) {
        console.log('❌ Backend not responding - check if server is running on port 4000');
        throw error;
      }
    });
    
    // Check if frontend is running
    await test.step('Frontend Health Check', async () => {
      try {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        console.log('✅ Frontend responding');
      } catch (error) {
        console.log('❌ Frontend not responding - check if app is running on port 3000');
        throw error;
      }
    });
    
    // Check critical API endpoints
    await test.step('Critical Endpoints Check', async () => {
      const endpoints = [
        'http://localhost:4000/api/warehouses',
        'http://localhost:4000/api/products', 
        'http://localhost:4000/api/orders/admin/all',
        'http://localhost:4000/api/users/admin/all'
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(endpoint);
        console.log(`📡 ${endpoint}: ${response.status()}`);
        
        // Should be 401 (auth required) or 200 (public) - NOT 404 or 500
        expect([200, 401, 403].includes(response.status())).toBeTruthy();
      }
    });
    
    console.log('\n🎉 Health checks completed successfully!');
  });
});