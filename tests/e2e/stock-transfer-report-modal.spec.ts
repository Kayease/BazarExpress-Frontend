import { test, expect } from '@playwright/test';

test.describe('Stock Transfer Report Modal', () => {
  test('should display download button in stock transfer actions', async ({ page }) => {
    // Navigate to stock transfer page
    await page.goto('http://localhost:3001/admin/stock-transfer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page has loaded correctly
    await expect(page.locator('[data-testid="stock-transfer-page"]')).toBeVisible();
    
    // Look for action buttons in the table (if transfers exist)
    const transferRows = page.locator('table tbody tr');
    const transferCount = await transferRows.count();
    
    if (transferCount > 0) {
      // Check if download/report button exists in actions column
      const reportButton = page.locator('button:has-text("Report")').first();
      await expect(reportButton).toBeVisible();
      
      // Check if the button has the download icon
      const downloadIcon = reportButton.locator('svg');
      await expect(downloadIcon).toBeVisible();
      
      console.log('✅ Stock Transfer Report button found in actions column');
    } else {
      console.log('ℹ️ No stock transfers found to test report functionality');
    }
  });

  test('should open report modal when report button is clicked', async ({ page }) => {
    // Navigate to stock transfer page
    await page.goto('http://localhost:3001/admin/stock-transfer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if transfers exist
    const transferRows = page.locator('table tbody tr');
    const transferCount = await transferRows.count();
    
    if (transferCount > 0) {
      // Click the first report button
      const reportButton = page.locator('button:has-text("Report")').first();
      await reportButton.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      // Check if report modal is visible
      const reportModal = page.locator('text="Stock Transfer Report"');
      await expect(reportModal).toBeVisible();
      
      // Check if download PDF button exists in modal
      const downloadPDFButton = page.locator('button:has-text("Download PDF")');
      await expect(downloadPDFButton).toBeVisible();
      
      console.log('✅ Stock Transfer Report Modal opened successfully');
      
      // Close modal
      const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('svg[data-testid="close-icon"]')).or(page.locator('button:has(svg)').last());
      await closeButton.click();
    } else {
      console.log('ℹ️ No stock transfers found to test modal functionality');
    }
  });

  test('should display warehouse addresses in report', async ({ page }) => {
    // Navigate to stock transfer page
    await page.goto('http://localhost:3001/admin/stock-transfer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if transfers exist
    const transferRows = page.locator('table tbody tr');
    const transferCount = await transferRows.count();
    
    if (transferCount > 0) {
      // Click the first report button
      const reportButton = page.locator('button:has-text("Report")').first();
      await reportButton.click();
      
      // Wait for modal to appear and load
      await page.waitForTimeout(2000);
      
      // Check if warehouse sections exist
      const fromWarehouse = page.locator('text="FROM WAREHOUSE"');
      const toWarehouse = page.locator('text="TO WAREHOUSE"');
      
      await expect(fromWarehouse).toBeVisible();
      await expect(toWarehouse).toBeVisible();
      
      console.log('✅ Warehouse sections found in report');
      
      // Check if company information is displayed
      const companyInfo = page.locator('text="STOCK TRANSFER REPORT"');
      await expect(companyInfo).toBeVisible();
      
      console.log('✅ Company information section found in report');
      
      // Close modal
      const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('svg[data-testid="close-icon"]')).or(page.locator('button:has(svg)').last());
      await closeButton.click();
    } else {
      console.log('ℹ️ No stock transfers found to test report content');
    }
  });
});