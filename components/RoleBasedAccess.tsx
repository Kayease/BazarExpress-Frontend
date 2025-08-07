'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: string;
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
  section
}) => {
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user);

  // If no user is logged in, don't show anything
  if (!user) {
    return <>{fallback}</>;
  }

  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(user.role);

  // If user doesn't have access, show fallback or nothing
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  // User has access, show the children
  return <>{children}</>;
};

// Hook for checking role-based access in components
export const useRoleAccess = () => {
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user);

  const hasRole = (allowedRoles: string[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const canAccessSection = (section: string) => {
    if (!user) return false;

    const sectionRoleMap: { [key: string]: string[] } = {
      // Admin Dashboard
      'users': ['admin', 'customer_support_executive'],
      'reports': ['admin', 'report_finance_analyst'],
      'notices': ['admin', 'marketing_content_manager'],

      // Products
      'brands': ['admin', 'product_inventory_management'],
      'warehouse': ['admin', 'order_warehouse_management'],
      'categories': ['admin', 'product_inventory_management'],
      'products': ['admin', 'product_inventory_management'],
      'promocodes': ['admin', 'marketing_content_manager'],
      'taxes': ['admin', 'report_finance_analyst'],
      'delivery': ['admin', 'report_finance_analyst'],

      // Orders
      'orders': ['admin', 'customer_support_executive', 'order_warehouse_management'],

      // Other
      'banners': ['admin', 'marketing_content_manager'],
      'blog': ['admin', 'marketing_content_manager'],
      'newsletter': ['admin', 'marketing_content_manager'],
      'enquiry': ['admin', 'customer_support_executive'],
      'reviews': ['admin', 'customer_support_executive'],
      'invoice-settings': ['admin', 'report_finance_analyst'],
    };

    const allowedRoles = sectionRoleMap[section] || [];
    return allowedRoles.includes(user.role);
  };

  const isWarehouseRestricted = () => {
    return user?.role === 'product_inventory_management' || user?.role === 'order_warehouse_management';
  };

  const canCreateWarehouse = () => {
    return user?.role === 'admin';
  };

  const canCreateTax = () => {
    return user?.role === 'admin' || user?.role === 'report_finance_analyst';
  };

  const canEditOwnContent = (createdBy: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return createdBy === user._id;
  };

  return {
    user,
    hasRole,
    canAccessSection,
    isWarehouseRestricted,
    canCreateWarehouse,
    canCreateTax,
    canEditOwnContent
  };
};

export default RoleBasedAccess;