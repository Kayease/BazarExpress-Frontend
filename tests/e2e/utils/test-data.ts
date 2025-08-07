export const TEST_WAREHOUSES = {
  warehouse1: {
    name: 'Test Warehouse 1',
    address: 'Test Address 1',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    phone: '1234567890',
    email: 'warehouse1@test.com',
    deliveryRadius: 10,
    lat: 12.9716,
    lng: 77.5946
  },
  warehouse2: {
    name: 'Test Warehouse 2',
    address: 'Test Address 2',
    city: 'Test City 2',
    state: 'Test State 2',
    pincode: '654321',
    phone: '0987654321',
    email: 'warehouse2@test.com',
    deliveryRadius: 15,
    lat: 19.0760,
    lng: 72.8777
  }
};

export const TEST_PRODUCTS = {
  product1: {
    name: 'Test Product 1',
    description: 'Test product description',
    category: 'Test Category',
    brand: 'Test Brand',
    price: 100,
    stock: 50,
    sku: 'TEST-001'
  },
  product2: {
    name: 'Test Product 2',
    description: 'Another test product',
    category: 'Test Category 2',
    brand: 'Test Brand 2',
    price: 200,
    stock: 25,
    sku: 'TEST-002'
  }
};

export const TEST_BRANDS = {
  brand1: {
    name: 'Test Brand 1',
    description: 'Test brand description'
  },
  brand2: {
    name: 'Test Brand 2',
    description: 'Another test brand'
  }
};

export const TEST_CATEGORIES = {
  category1: {
    name: 'Test Category 1',
    description: 'Test category description'
  },
  category2: {
    name: 'Test Category 2',
    description: 'Another test category'
  }
};

export const TEST_ORDERS = {
  order1: {
    orderId: 'ORD-001',
    customerName: 'Test Customer',
    status: 'new',
    total: 150.00
  },
  order2: {
    orderId: 'ORD-002',
    customerName: 'Another Customer',
    status: 'processing',
    total: 300.00
  }
};

export const SECTION_URLS = {
  // Admin sections
  dashboard: '/admin/dashboard',
  products: '/admin/products',
  brands: '/admin/brands',
  categories: '/admin/categories',
  warehouses: '/admin/warehouses',
  orders: '/admin/orders',
  users: '/admin/users',
  banners: '/admin/banners',
  promocodes: '/admin/promocodes',
  blog: '/admin/blog',
  newsletter: '/admin/newsletter',
  notices: '/admin/notices',
  reports: '/admin/reports',
  invoiceSettings: '/admin/invoice-settings',
  taxes: '/admin/taxes',
  delivery: '/admin/delivery',
  enquiry: '/admin/enquiry',
  reviews: '/admin/reviews'
};

export const ROLE_PERMISSIONS = {
  'admin': Object.values(SECTION_URLS),
  'product_inventory_management': [
    SECTION_URLS.dashboard,
    SECTION_URLS.products,
    SECTION_URLS.brands,
    SECTION_URLS.categories
  ],
  'order_warehouse_management': [
    SECTION_URLS.dashboard,
    SECTION_URLS.orders,
    SECTION_URLS.warehouses
  ],
  'marketing_content_manager': [
    SECTION_URLS.dashboard,
    SECTION_URLS.banners,
    SECTION_URLS.promocodes,
    SECTION_URLS.blog,
    SECTION_URLS.newsletter,
    SECTION_URLS.notices
  ],
  'customer_support_executive': [
    SECTION_URLS.dashboard,
    SECTION_URLS.users,
    SECTION_URLS.orders,
    SECTION_URLS.enquiry,
    SECTION_URLS.reviews
  ],
  'report_finance_analyst': [
    SECTION_URLS.dashboard,
    SECTION_URLS.reports,
    SECTION_URLS.invoiceSettings,
    SECTION_URLS.taxes,
    SECTION_URLS.delivery
  ]
};

export const getUnauthorizedSections = (role: keyof typeof ROLE_PERMISSIONS): string[] => {
  const authorizedSections = ROLE_PERMISSIONS[role];
  const allSections = Object.values(SECTION_URLS);
  return allSections.filter(section => !authorizedSections.includes(section));
};