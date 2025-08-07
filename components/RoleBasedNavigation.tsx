'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoleAccess } from './RoleBasedAccess';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Tag,
  Warehouse,
  FileText,
  MessageSquare,
  Star,
  Megaphone,
  Receipt,
  Truck,
  Percent,
  BookOpen,
  Mail,
  Bell
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  section: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    section: 'dashboard'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    section: 'users'
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    section: 'products'
  },
  {
    name: 'Brands',
    href: '/admin/brands',
    icon: Tag,
    section: 'brands'
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: FileText,
    section: 'categories'
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    section: 'orders',
    children: [
      {
        name: 'All Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        section: 'orders'
      },
      {
        name: 'New Orders',
        href: '/admin/orders/new',
        icon: ShoppingCart,
        section: 'orders'
      },
      {
        name: 'Processing Orders',
        href: '/admin/orders/processing',
        icon: ShoppingCart,
        section: 'orders'
      },
      {
        name: 'Shipped Orders',
        href: '/admin/orders/shipped',
        icon: Truck,
        section: 'orders'
      },
      {
        name: 'Delivered Orders',
        href: '/admin/orders/delivered',
        icon: ShoppingCart,
        section: 'orders'
      },
      {
        name: 'Cancelled Orders',
        href: '/admin/orders/cancelled',
        icon: ShoppingCart,
        section: 'orders'
      },
      {
        name: 'Refunded Orders',
        href: '/admin/orders/refunded',
        icon: ShoppingCart,
        section: 'orders'
      }
    ]
  },
  {
    name: 'Warehouses',
    href: '/admin/warehouses',
    icon: Warehouse,
    section: 'warehouse'
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: Megaphone,
    section: 'marketing',
    children: [
      {
        name: 'Banners',
        href: '/admin/banners',
        icon: Megaphone,
        section: 'banners'
      },
      {
        name: 'Promocodes',
        href: '/admin/promocodes',
        icon: Percent,
        section: 'promocodes'
      },
      {
        name: 'Blog',
        href: '/admin/blog',
        icon: BookOpen,
        section: 'blog'
      },
      {
        name: 'Newsletter',
        href: '/admin/newsletter',
        icon: Mail,
        section: 'newsletter'
      },
      {
        name: 'Notices',
        href: '/admin/notices',
        icon: Bell,
        section: 'notice'
      }
    ]
  },
  {
    name: 'Customer Support',
    href: '/admin/support',
    icon: MessageSquare,
    section: 'support',
    children: [
      {
        name: 'Enquiries',
        href: '/admin/enquiries',
        icon: MessageSquare,
        section: 'enquiry'
      },
      {
        name: 'Reviews',
        href: '/admin/reviews',
        icon: Star,
        section: 'reviews'
      }
    ]
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    section: 'reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    section: 'settings',
    children: [
      {
        name: 'Invoice Settings',
        href: '/admin/invoice-settings',
        icon: Receipt,
        section: 'invoice-settings'
      },
      {
        name: 'Taxes',
        href: '/admin/taxes',
        icon: Percent,
        section: 'taxes'
      },
      {
        name: 'Delivery Settings',
        href: '/admin/delivery-settings',
        icon: Truck,
        section: 'delivery'
      }
    ]
  }
];

const RoleBasedNavigation: React.FC = () => {
  const pathname = usePathname();
  const { canAccessSection, user } = useRoleAccess();

  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      // Admin can access everything
      if (user?.role === 'admin') return true;
      
      // Check if user can access this section
      if (!canAccessSection(item.section)) return false;
      
      // If item has children, filter them too
      if (item.children) {
        const filteredChildren = filterNavigationItems(item.children);
        return filteredChildren.length > 0;
      }
      
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterNavigationItems(item.children) : undefined
    }));
  };

  const filteredNavigation = filterNavigationItems(navigationItems);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <div key={item.href}>
        <Link
          href={item.href}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            level > 0 ? 'ml-4' : ''
          } ${
            active
              ? 'bg-purple-100 text-purple-900 border-r-2 border-purple-500'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className={`mr-3 h-5 w-5 ${active ? 'text-purple-500' : 'text-gray-400'}`} />
          {item.name}
        </Link>
        
        {item.children && item.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="space-y-1">
      {/* Role indicator */}
      <div className="px-4 py-2 mb-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Role
        </div>
        <div className="mt-1 text-sm font-medium text-gray-900 capitalize">
          {user.role.replace(/_/g, ' ')}
        </div>
      </div>
      
      {/* Navigation items */}
      {filteredNavigation.map(item => renderNavigationItem(item))}
      
      {/* Role-specific notices */}
      {user.role === 'product_inventory_management' && (
        <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Warehouse Access
          </div>
          <div className="text-xs text-blue-600">
            You can only manage products from your assigned warehouse(s)
          </div>
        </div>
      )}
      
      {user.role === 'order_warehouse_management' && (
        <div className="mt-6 px-4 py-3 bg-green-50 rounded-md">
          <div className="text-xs font-medium text-green-800 mb-1">
            Order Management
          </div>
          <div className="text-xs text-green-600">
            You can manage orders from your assigned warehouse(s) only
          </div>
        </div>
      )}
    </nav>
  );
};

export default RoleBasedNavigation;