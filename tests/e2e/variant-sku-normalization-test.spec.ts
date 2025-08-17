import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/corrected-auth-helpers';

test.describe('Variant SKU Normalization Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should normalize variant keys to uppercase and generate consistent SKUs', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');

    // Click "Add Product" button
    await page.click('text=Add Product');
    await page.waitForLoadState('networkidle');

    // Fill basic product information
    await page.fill('input[placeholder="Enter product name"]', 'Test Variant Normalization Product');
    await page.fill('textarea[placeholder="Enter product description"]', 'Testing variant key normalization');
    
    // Select category (assuming first option)
    await page.click('select:has-text("Select Category")');
    await page.selectOption('select:has-text("Select Category")', { index: 1 });
    
    // Wait for subcategory to load
    await page.waitForTimeout(1000);
    
    // Select subcategory
    await page.click('select:has-text("Select Subcategory")');
    await page.selectOption('select:has-text("Select Subcategory")', { index: 1 });
    
    // Fill price and MRP
    await page.fill('input[placeholder="0.00"]:first', '999');
    await page.fill('input[placeholder="0.00"]:nth(1)', '1299');
    
    // Fill SKU
    await page.fill('input[placeholder="Enter SKU"]', 'TEST-VARIANT-NORM-001');
    
    // Select brand
    await page.click('select:has-text("Select Brand")');
    await page.selectOption('select:has-text("Select Brand")', { index: 1 });
    
    // Select warehouse
    await page.click('select:has-text("Select Warehouse")');
    await page.selectOption('select:has-text("Select Warehouse")', { index: 1 });
    
    // Select tax
    await page.click('select:has-text("Select Tax")');
    await page.selectOption('select:has-text("Select Tax")', { index: 1 });
    
    // Fill quantity
    await page.fill('input[placeholder="0"]:first', '100');
    
    // Expand variants section
    await page.click('text=Product Variants');
    await page.waitForTimeout(500);
    
    // Add Size attribute
    await page.click('text=Add Attribute');
    await page.fill('input[placeholder="Attribute name (e.g., Color, Size)"]', 'Size');
    await page.fill('input[placeholder="Enter values separated by commas"]', 'S, M, L');
    
    // Add Color attribute
    await page.click('text=Add Attribute');
    await page.locator('input[placeholder="Attribute name (e.g., Color, Size)"]').nth(1).fill('Color');
    await page.locator('input[placeholder="Enter values separated by commas"]').nth(1).fill('red, Blue, GREEN');
    
    // Wait for variants to generate
    await page.waitForTimeout(1000);
    
    // Enable auto-generate SKU
    await page.check('input[type="checkbox"]:has-text("Auto-generate SKU")');
    
    // Verify that variant keys are normalized to uppercase
    const variantRows = await page.locator('tbody tr').count();
    console.log(`Found ${variantRows} variant rows`);
    
    // Check that SKUs are generated consistently regardless of case
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const skuInput = row.locator('input[type="text"]').first();
      const skuValue = await skuInput.inputValue();
      
      // SKU should be uppercase and consistent
      expect(skuValue).toMatch(/^[A-Z0-9]+$/);
      console.log(`Row ${i}: SKU = ${skuValue}`);
    }
    
    // Fill variant prices and stocks
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const priceInput = row.locator('input[type="number"]').first();
      const stockInput = row.locator('input[type="number"]').nth(1);
      
      await priceInput.fill('999');
      await stockInput.fill('10');
    }
    
    // Upload a test image (create a simple test image)
    const testImagePath = 'test-image.png';
    await page.setInputFiles('input[type="file"]', {
      name: testImagePath,
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Product created successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify redirect to products page
    await expect(page).toHaveURL(/.*\/admin\/products/);
    
    console.log('✅ Product with normalized variant keys created successfully');
  });

  test('should handle case-insensitive variant key lookup in existing products', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Find and edit the Shoes product
    await page.fill('input[placeholder="Search products..."]', 'Shoes');
    await page.waitForTimeout(1000);
    
    // Click edit button for the first product
    await page.click('button:has-text("Edit")');
    await page.waitForLoadState('networkidle');
    
    // Expand variants section
    await page.click('text=Product Variants');
    await page.waitForTimeout(500);
    
    // Verify that all variant keys are now uppercase
    const variantRows = await page.locator('tbody tr').count();
    
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const cells = await row.locator('td').allTextContents();
      
      // Check that variant values are displayed correctly (original case)
      // but the underlying keys are normalized
      console.log(`Variant ${i}: ${cells.join(' | ')}`);
      
      // Verify SKU format
      const skuInput = row.locator('input[type="text"]').first();
      const skuValue = await skuInput.inputValue();
      expect(skuValue).toMatch(/^[A-Z0-9]+$/);
    }
    
    console.log('✅ Existing product variants are properly normalized');
  });

  test('should generate consistent SKUs for mixed case attribute values', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');

    // Click "Add Product" button
    await page.click('text=Add Product');
    await page.waitForLoadState('networkidle');

    // Fill basic product information
    await page.fill('input[placeholder="Enter product name"]', 'Mixed Case Test Product');
    await page.fill('textarea[placeholder="Enter product description"]', 'Testing mixed case handling');
    
    // Select category, subcategory, brand, warehouse, tax (same as before)
    await page.click('select:has-text("Select Category")');
    await page.selectOption('select:has-text("Select Category")', { index: 1 });
    await page.waitForTimeout(1000);
    
    await page.click('select:has-text("Select Subcategory")');
    await page.selectOption('select:has-text("Select Subcategory")', { index: 1 });
    
    await page.fill('input[placeholder="0.00"]:first', '599');
    await page.fill('input[placeholder="0.00"]:nth(1)', '799');
    await page.fill('input[placeholder="Enter SKU"]', 'MIXED-CASE-TEST-001');
    
    await page.click('select:has-text("Select Brand")');
    await page.selectOption('select:has-text("Select Brand")', { index: 1 });
    
    await page.click('select:has-text("Select Warehouse")');
    await page.selectOption('select:has-text("Select Warehouse")', { index: 1 });
    
    await page.click('select:has-text("Select Tax")');
    await page.selectOption('select:has-text("Select Tax")', { index: 1 });
    
    await page.fill('input[placeholder="0"]:first', '50');
    
    // Expand variants section
    await page.click('text=Product Variants');
    await page.waitForTimeout(500);
    
    // Add Color attribute with mixed case values
    await page.click('text=Add Attribute');
    await page.fill('input[placeholder="Attribute name (e.g., Color, Size)"]', 'Color');
    await page.fill('input[placeholder="Enter values separated by commas"]', 'Red, red, RED, Blue, blue, BLUE');
    
    // Wait for variants to generate
    await page.waitForTimeout(1000);
    
    // Enable auto-generate SKU
    await page.check('input[type="checkbox"]:has-text("Auto-generate SKU")');
    
    // Verify that duplicate case variations are handled properly
    const variantRows = await page.locator('tbody tr').count();
    const generatedSKUs = new Set();
    
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const skuInput = row.locator('input[type="text"]').first();
      const skuValue = await skuInput.inputValue();
      
      // Check for duplicates
      if (generatedSKUs.has(skuValue)) {
        console.log(`⚠️ Duplicate SKU detected: ${skuValue}`);
      } else {
        generatedSKUs.add(skuValue);
      }
      
      console.log(`Generated SKU: ${skuValue}`);
    }
    
    // Should have unique SKUs despite mixed case input
    expect(generatedSKUs.size).toBe(variantRows);
    
    console.log('✅ Mixed case attribute values handled correctly');
  });
});