import { test, expect } from '@playwright/test';

test.describe('Stock Transfer Variant Functionality', () => {
  test('should handle variant stock transfers correctly', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:3001/test-variants');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click to open stock transfer modal
    await page.click('button:has-text("Open Stock Transfer Modal")');
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="stock-transfer-modal"]', { timeout: 10000 });
    
    // Test 1: Verify variant products show expandable rows
    await expect(page.locator('[data-testid="product-row"]')).toBeVisible();
    
    // Test 2: Expand variant product
    await page.click('[data-testid="expand-variants-btn"]');
    
    // Test 3: Verify variant rows are visible
    await expect(page.locator('[data-testid="variant-row"]')).toBeVisible();
    
    // Test 4: Select variant quantities
    await page.fill('[data-testid="variant-quantity-input"]', '2');
    
    // Test 5: Verify total quantity updates
    const totalQuantity = await page.locator('[data-testid="total-quantity"]').textContent();
    expect(totalQuantity).toContain('2');
    
    // Test 6: Select warehouses
    await page.selectOption('[data-testid="from-warehouse"]', { index: 1 });
    await page.selectOption('[data-testid="to-warehouse"]', { index: 2 });
    
    // Test 7: Submit transfer
    await page.click('[data-testid="submit-transfer"]');
    
    // Test 8: Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should display full SKU for variants in details modal', async ({ page }) => {
    // This test would verify that variant SKUs are displayed correctly
    // in the stock transfer details modal
    
    // Navigate to stock transfers page
    await page.goto('http://localhost:3001/admin/stock-transfers');
    
    // Wait for transfers to load
    await page.waitForLoadState('networkidle');
    
    // Click on a transfer with variants
    await page.click('[data-testid="view-transfer-btn"]');
    
    // Wait for details modal
    await page.waitForSelector('[data-testid="transfer-details-modal"]');
    
    // Verify variant SKU is displayed correctly
    const variantSku = await page.locator('[data-testid="variant-sku"]').textContent();
    expect(variantSku).toMatch(/SKU-.*-.*::.*/); // Should contain variant key
  });
});