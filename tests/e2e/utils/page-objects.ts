import { Page, Locator, expect } from '@playwright/test';

export class AdminDashboard {
  constructor(private page: Page) {}

  get navigationMenu() {
    return this.page.locator('[data-testid="admin-navigation"]');
  }

  get userMenu() {
    return this.page.locator('[data-testid="user-menu"]');
  }

  async navigateToSection(section: string) {
    await this.page.click(`[data-testid="nav-${section}"]`);
  }

  async expectSectionVisible(section: string) {
    await expect(this.page.locator(`[data-testid="nav-${section}"]`)).toBeVisible();
  }

  async expectSectionHidden(section: string) {
    await expect(this.page.locator(`[data-testid="nav-${section}"]`)).toBeHidden();
  }
}

export class WarehousePage {
  constructor(private page: Page) {}

  get warehouseList() {
    return this.page.locator('[data-testid="warehouse-list"]');
  }

  get addWarehouseButton() {
    return this.page.locator('[data-testid="add-warehouse-button"]');
  }

  get warehouseFormModal() {
    return this.page.locator('[data-testid="warehouse-form-modal"]');
  }

  async openAddWarehouseModal() {
    await this.addWarehouseButton.click();
    await expect(this.warehouseFormModal).toBeVisible();
  }

  async editWarehouse(warehouseId: string) {
    await this.page.click(`[data-testid="edit-warehouse-${warehouseId}"]`);
    await expect(this.warehouseFormModal).toBeVisible();
  }

  async fillWarehouseForm(warehouseData: any) {
    await this.page.fill('[data-testid="warehouse-name"]', warehouseData.name);
    await this.page.fill('[data-testid="warehouse-address"]', warehouseData.address);
    await this.page.fill('[data-testid="warehouse-city"]', warehouseData.city);
    await this.page.fill('[data-testid="warehouse-state"]', warehouseData.state);
    await this.page.fill('[data-testid="warehouse-pincode"]', warehouseData.pincode);
    await this.page.fill('[data-testid="warehouse-phone"]', warehouseData.phone);
    await this.page.fill('[data-testid="warehouse-email"]', warehouseData.email);
  }

  async saveWarehouse() {
    await this.page.click('[data-testid="save-warehouse-button"]');
  }

  async expectWarehouseInList(warehouseName: string) {
    await expect(this.page.locator(`text="${warehouseName}"`)).toBeVisible();
  }
}

export class ProductPage {
  constructor(private page: Page) {}

  get productList() {
    return this.page.locator('[data-testid="product-list"]');
  }

  get addProductButton() {
    return this.page.locator('[data-testid="add-product-button"]');
  }

  get warehouseFilter() {
    return this.page.locator('[data-testid="warehouse-filter"]');
  }

  async filterByWarehouse(warehouseName: string) {
    await this.warehouseFilter.selectOption({ label: warehouseName });
  }

  async expectProductInList(productName: string) {
    await expect(this.page.locator(`text="${productName}"`)).toBeVisible();
  }

  async expectProductNotInList(productName: string) {
    await expect(this.page.locator(`text="${productName}"`)).toBeHidden();
  }
}

export class BrandPage {
  constructor(private page: Page) {}

  get brandList() {
    return this.page.locator('[data-testid="brand-list"]');
  }

  get addBrandButton() {
    return this.page.locator('[data-testid="add-brand-button"]');
  }

  async createBrand(brandName: string) {
    await this.addBrandButton.click();
    await this.page.fill('[data-testid="brand-name-input"]', brandName);
    await this.page.click('[data-testid="save-brand-button"]');
  }

  async editBrand(brandName: string) {
    await this.page.click(`[data-testid="edit-brand-${brandName}"]`);
  }

  async deleteBrand(brandName: string) {
    await this.page.click(`[data-testid="delete-brand-${brandName}"]`);
  }

  async expectEditButtonVisible(brandName: string) {
    await expect(this.page.locator(`[data-testid="edit-brand-${brandName}"]`)).toBeVisible();
  }

  async expectEditButtonHidden(brandName: string) {
    await expect(this.page.locator(`[data-testid="edit-brand-${brandName}"]`)).toBeHidden();
  }

  async expectDeleteButtonVisible(brandName: string) {
    await expect(this.page.locator(`[data-testid="delete-brand-${brandName}"]`)).toBeVisible();
  }

  async expectDeleteButtonHidden(brandName: string) {
    await expect(this.page.locator(`[data-testid="delete-brand-${brandName}"]`)).toBeHidden();
  }
}

export class OrderPage {
  constructor(private page: Page) {}

  get orderList() {
    return this.page.locator('[data-testid="order-list"]');
  }

  get statusFilter() {
    return this.page.locator('[data-testid="order-status-filter"]');
  }

  get warehouseFilter() {
    return this.page.locator('[data-testid="order-warehouse-filter"]');
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption({ value: status });
  }

  async filterByWarehouse(warehouseName: string) {
    await this.warehouseFilter.selectOption({ label: warehouseName });
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    await this.page.click(`[data-testid="order-${orderId}-status-button"]`);
    await this.page.selectOption(`[data-testid="order-${orderId}-status-select"]`, newStatus);
    await this.page.click(`[data-testid="update-order-${orderId}-status"]`);
  }

  async expectOrderInList(orderId: string) {
    await expect(this.page.locator(`[data-testid="order-${orderId}"]`)).toBeVisible();
  }

  async expectOrderNotInList(orderId: string) {
    await expect(this.page.locator(`[data-testid="order-${orderId}"]`)).toBeHidden();
  }

  async expectStatusUpdateEnabled(orderId: string) {
    await expect(this.page.locator(`[data-testid="order-${orderId}-status-button"]`)).toBeEnabled();
  }

  async expectStatusUpdateDisabled(orderId: string) {
    await expect(this.page.locator(`[data-testid="order-${orderId}-status-button"]`)).toBeDisabled();
  }
}