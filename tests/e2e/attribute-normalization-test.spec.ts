import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/corrected-auth-helpers';

test.describe('Attribute Normalization Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should normalize attribute values to uppercase and generate correct variant keys', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');

    // Click "Add Product" button
    await page.click('text=Add Product');
    await page.waitForLoadState('networkidle');

    // Fill basic product information
    await page.fill('input[placeholder="Enter product name"]', 'Attribute Normalization Test Product');
    await page.fill('textarea[placeholder="Enter product description"]', 'Testing attribute normalization');
    
    // Select category (assuming first option)
    await page.click('select:has-text("Select Category")');
    await page.selectOption('select:has-text("Select Category")', { index: 1 });
    
    // Wait for subcategory to load
    await page.waitForTimeout(1000);
    
    // Select subcategory
    await page.click('select:has-text("Select Subcategory")');
    await page.selectOption('select:has-text("Select Subcategory")', { index: 1 });
    
    // Fill price and MRP
    await page.fill('input[placeholder="0.00"]:first', '599');
    await page.fill('input[placeholder="0.00"]:nth(1)', '799');
    
    // Fill SKU
    await page.fill('input[placeholder="Enter SKU"]', 'ATTR-NORM-TEST-001');
    
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
    
    // Add Color attribute with mixed case values
    await page.click('text=Add Attribute');
    await page.fill('input[placeholder="Attribute name (e.g., Color, Size)"]', 'Color');
    
    // Add mixed case color values
    const colorInput = page.locator('input[placeholder="Add Color"]');
    await colorInput.fill('red');
    await colorInput.press('Enter');
    
    await colorInput.fill('Blue');
    await colorInput.press('Enter');
    
    await colorInput.fill('GREEN');
    await colorInput.press('Enter');
    
    // Add Size attribute with mixed case values
    await page.click('text=Add Attribute');
    await page.locator('input[placeholder="Attribute name (e.g., Color, Size)"]').nth(1).fill('Size');
    
    const sizeInput = page.locator('input[placeholder="Add Size"]');
    await sizeInput.fill('s');
    await sizeInput.press('Enter');
    
    await sizeInput.fill('M');
    await sizeInput.press('Enter');
    
    await sizeInput.fill('xl');
    await sizeInput.press('Enter');
    
    // Wait for variants to generate
    await page.waitForTimeout(2000);
    
    // Verify that attribute values are displayed as uppercase
    await expect(page.locator('text=RED')).toBeVisible();
    await expect(page.locator('text=BLUE')).toBeVisible();
    await expect(page.locator('text=GREEN')).toBeVisible();
    await expect(page.locator('text=S')).toBeVisible();
    await expect(page.locator('text=M')).toBeVisible();
    await expect(page.locator('text=XL')).toBeVisible();
    
    // Enable auto-generate SKU
    await page.check('input[type="checkbox"]:has-text("Auto-generate SKU")');
    await page.waitForTimeout(1000);
    
    // Verify that variant table shows normalized values
    const variantRows = await page.locator('tbody tr').count();
    console.log(`Found ${variantRows} variant rows`);
    
    // Check that all variant combinations are present and SKUs are generated
    const expectedCombinations = [
      ['RED', 'S'],
      ['RED', 'M'], 
      ['RED', 'XL'],
      ['BLUE', 'S'],
      ['BLUE', 'M'],
      ['BLUE', 'XL'],
      ['GREEN', 'S'],
      ['GREEN', 'M'],
      ['GREEN', 'XL']
    ];
    
    expect(variantRows).toBe(expectedCombinations.length);
    
    // Verify SKU generation for each variant
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const skuInput = row.locator('input[type="text"]').first();
      const skuValue = await skuInput.inputValue();
      
      // SKU should be uppercase and follow the pattern
      expect(skuValue).toMatch(/^[A-Z]+$/);
      console.log(`Row ${i}: SKU = ${skuValue}`);
    }
    
    // Fill variant prices and stocks
    for (let i = 0; i < variantRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const priceInput = row.locator('input[type="number"]').first();
      const stockInput = row.locator('input[type="number"]').nth(1);
      
      await priceInput.fill('599');
      await stockInput.fill('10');
    }
    
    // Upload a test image
    await page.setInputFiles('input[type="file"]', {
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message or error
    try {
      await expect(page.locator('text=Product created successfully')).toBeVisible({ timeout: 10000 });
      console.log('✅ Product created successfully with normalized attributes');
    } catch (error) {
      // Check for any error messages
      const errorMessage = await page.locator('.Toastify__toast--error').textContent();
      console.log(`❌ Error: ${errorMessage}`);
      throw error;
    }
  });

  test('should handle numeric size attributes correctly', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    
    // Navigate to products page
    await page.goto('http://localhost:3001/admin/products');
    await page.waitForLoadState('networkidle');

    // Click "Add Product" button
    await page.click('text=Add Product');
    await page.waitForLoadState('networkidle');

    // Fill basic product information
    await page.fill('input[placeholder="Enter product name"]', 'Numeric Size Test Product');
    await page.fill('textarea[placeholder="Enter product description"]', 'Testing numeric size handling');
    
    // Select category, subcategory, brand, warehouse, tax (same as before)
    await page.click('select:has-text("Select Category")');
    await page.selectOption('select:has-text("Select Category")', { index: 1 });
    await page.waitForTimeout(1000);
    
    await page.click('select:has-text("Select Subcategory")');
    await page.selectOption('select:has-text("Select Subcategory")', { index: 1 });
    
    await page.fill('input[placeholder="0.00"]:first', '299');
    await page.fill('input[placeholder="0.00"]:nth(1)', '399');
    await page.fill('input[placeholder="Enter SKU"]', 'NUMERIC-SIZE-TEST-001');
    
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
    
    // Add Size attribute with numeric values
    await page.click('text=Add Attribute');
    await page.fill('input[placeholder="Attribute name (e.g., Color, Size)"]', 'Size');
    
    const sizeInput = page.locator('input[placeholder="Add Size"]');
    await sizeInput.fill('7, 8, 9, 10, 12.5');
    await sizeInput.press('Enter');
    
    // Add Color attribute
    await page.click('text=Add Attribute');
    await page.locator('input[placeholder="Attribute name (e.g., Color, Size)"]').nth(1).fill('Color');
    
    const colorInput = page.locator('input[placeholder="Add Color"]');
    await colorInput.fill('red, blue');
    await colorInput.press('Enter');
    
    // Wait for variants to generate
    await page.waitForTimeout(2000);
    
    // Verify that numeric sizes are preserved and colors are uppercase
    await expect(page.locator('text=7')).toBeVisible();
    await expect(page.locator('text=8')).toBeVisible();
    await expect(page.locator('text=9')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible();
    await expect(page.locator('text=12.5')).toBeVisible();
    await expect(page.locator('text=RED')).toBeVisible();
    await expect(page.locator('text=BLUE')).toBeVisible();
    
    // Enable auto-generate SKU
    await page.check('input[type="checkbox"]:has-text("Auto-generate SKU")');
    await page.waitForTimeout(1000);
    
    // Verify variant combinations
    const variantRows = await page.locator('tbody tr').count();
    expect(variantRows).toBe(10); // 5 sizes × 2 colors = 10 variants
    
    console.log('✅ Numeric sizes preserved correctly');
  });
});