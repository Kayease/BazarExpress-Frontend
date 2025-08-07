// Admin role authentication utilities

export const ADMIN_ROLES = [
  'admin',
  'product_inventory_management',
  'order_warehouse_management', 
  'marketing_content_manager',
  'customer_support_executive',
  'report_finance_analyst'
] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

/**
 * Check if a user has admin access
 */
export const isAdminUser = (userRole?: string): boolean => {
  if (!userRole) return false;
  return ADMIN_ROLES.includes(userRole as AdminRole);
};

/**
 * Check if a user has access to a specific admin section
 */
export const hasAccessToSection = (userRole?: string, section?: string): boolean => {
  if (!userRole || !section) return false;
  
  // Admin has access to everything
  if (userRole === 'admin') return true;
  
  // Define role-based section access
  const rolePermissions: Record<string, string[]> = {
    'marketing_content_manager': [
      'banners', 'promocodes', 'blog', 'newsletter', 'notices'
    ],
    'customer_support_executive': [
      'users', 'enquiry', 'reviews', 'orders', 'contacts'
    ],
    'report_finance_analyst': [
      'reports', 'invoice-settings', 'taxes', 'delivery'
    ],
    'order_warehouse_management': [
      'orders', 'warehouse'
    ],
    'product_inventory_management': [
      'products', 'brands', 'categories'
    ]
  };
  
  const allowedSections = rolePermissions[userRole] || [];
  return allowedSections.includes(section);
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role?: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'marketing_content_manager':
      return 'Marketing Manager';
    case 'customer_support_executive':
      return 'Support Executive';
    case 'report_finance_analyst':
      return 'Finance Analyst';
    case 'order_warehouse_management':
      return 'Warehouse Manager';
    case 'product_inventory_management':
      return 'Inventory Manager';
    default:
      return 'User';
  }
};