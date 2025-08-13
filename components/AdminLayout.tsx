"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Package,
  Building2,
  Tag,
  Grid3X3,
  ShoppingBag,
  Percent,
  ShoppingCart,
  Truck,
  CheckCircle,
  X,
  RefreshCw,
  ImageIcon,
  Sparkles,
  BookOpen,
  HelpCircle,
  Mail,
  Phone,
  UserPlus,
  Star,
  Menu,
  ChevronLeft,
  LogOut,
  Send,
  Warehouse,
  FileText,
  Settings,
  Receipt,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from '../lib/store'
import { logout as reduxLogout } from '../lib/slices/authSlice'
import Image from "next/image"

interface AdminLayoutProps {
  children: React.ReactNode
}

// Define role-based menu items
const getRoleBasedMenuItems = (userRole: string) => {
  const allMenuItems = [
    {
      title: "Admin Dashboard",
      items: [
        { name: "Home", href: "/admin", icon: Home, roles: ['admin', 'marketing_content_manager', 'customer_support_executive', 'report_finance_analyst', 'order_warehouse_management', 'product_inventory_management', 'delivery_boy'] },
        { name: "Users", href: "/admin/users", icon: Users, roles: ['admin', 'customer_support_executive'] },
        { name: "Reports", href: "/admin/reports", icon: BarChart3, roles: ['admin', 'report_finance_analyst'] },
        { name: "Notice", href: "/admin/notices", icon: Bell, roles: ['admin', 'marketing_content_manager'] },
      ],
    },
    {
      title: "PRODUCTS",
      items: [
        { name: "Brand", href: "/admin/brands", icon: Tag, roles: ['admin', 'product_inventory_management'] },
        { name: "Warehouses", href: "/admin/warehouse", icon: Building2, roles: ['admin', 'order_warehouse_management'] },
        { name: "Categories", href: "/admin/categories", icon: Grid3X3, roles: ['admin', 'product_inventory_management'] },
        { name: "Products", href: "/admin/products", icon: Package, roles: ['admin', 'product_inventory_management'] },
        { name: "Promocodes", href: "/admin/promocodes", icon: Percent, roles: ['admin', 'marketing_content_manager'] },
        { name: "Taxes", href: "/admin/taxes", icon: function TaxesIcon(props: any) {
            // Custom icon: a document with a percent sign
            return (
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M9 9h6" />
                <path d="M9 13h6" />
                <circle cx="9" cy="17" r="1" />
                <circle cx="15" cy="17" r="1" />
                <path d="M8 7l8 10" />
              </svg>
            );
          }, roles: ['admin', 'report_finance_analyst']
        },
        { name: "Delivery Settings", href: "/admin/delivery", icon: Truck, roles: ['admin', 'report_finance_analyst'] },
      ],
    },
    {
      title: "ORDERS",
      items: [
        { name: "All Orders", href: "/admin/orders", icon: ShoppingCart, roles: ['admin', 'customer_support_executive', 'order_warehouse_management', 'delivery_boy'] },
        { name: "New Orders", href: "/admin/orders/new", icon: ShoppingBag, roles: ['admin', 'customer_support_executive', 'order_warehouse_management'] },
        { name: "Processing Orders", href: "/admin/orders/processing", icon: Package, roles: ['admin', 'customer_support_executive', 'order_warehouse_management'] },
        { name: "Shipped Orders", href: "/admin/orders/shipped", icon: Truck, roles: ['admin', 'customer_support_executive', 'order_warehouse_management', 'delivery_boy'] },
        { name: "Delivered Orders", href: "/admin/orders/delivered", icon: CheckCircle, roles: ['admin', 'customer_support_executive', 'order_warehouse_management', 'delivery_boy'] },
        { name: "Cancelled Orders", href: "/admin/orders/cancelled", icon: X, roles: ['admin', 'customer_support_executive', 'order_warehouse_management'] },
        { name: "Refunded Orders", href: "/admin/orders/refunded", icon: RefreshCw, roles: ['admin', 'customer_support_executive', 'order_warehouse_management'] },
      ],
    },

    {
      title: "OTHER",
      items: [
        { name: "Banners", href: "/admin/banners", icon: ImageIcon, roles: ['admin', 'marketing_content_manager'] },
        { name: "Blog", href: "/admin/blog", icon: BookOpen, roles: ['admin', 'marketing_content_manager'] },
        { name: "Newsletter", href: "/admin/newsletter", icon: Send, roles: ['admin', 'marketing_content_manager'] },
        { name: "Enquiry", href: "/admin/enquiry", icon: Mail, roles: ['admin', 'customer_support_executive'] },
        { name: "Rating & Reviews", href: "/admin/reviews", icon: Star, roles: ['admin', 'customer_support_executive'] },
        { name: "Invoice Settings", href: "/admin/invoice-settings", icon: Receipt, roles: ['admin', 'report_finance_analyst'] },
      ],
    },
  ];

  // Filter menu items based on user role
  return allMenuItems.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(userRole))
  })).filter(section => section.items.length > 0);
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminSidebarOpen');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef(0);
  const pathname = usePathname()
  const router = useRouter()
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user)
  const dispatch = useAppDispatch();

  // Get role-based menu items
  const menuItems = getRoleBasedMenuItems(user?.role || 'admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSidebarOpen', sidebarOpen ? 'true' : 'false');
    }
  }, [sidebarOpen]);

  // Load saved scroll position from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSidebarScrollPosition');
      if (saved !== null) {
        savedScrollPosition.current = parseInt(saved, 10);
      }
    }
  }, []);

  // Save scroll position continuously and restore after navigation
  useEffect(() => {
    const sidebarElement = sidebarScrollRef.current;
    if (!sidebarElement) return;

    // Save scroll position continuously
    const handleScroll = () => {
      savedScrollPosition.current = sidebarElement.scrollTop;
      // Also save to localStorage for persistence across page refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSidebarScrollPosition', savedScrollPosition.current.toString());
      }
    };

    // Restore scroll position immediately
    const restoreScrollPosition = () => {
      if (savedScrollPosition.current >= 0) {
        sidebarElement.scrollTop = savedScrollPosition.current;
      }
    };

    // Add scroll listener
    sidebarElement.addEventListener('scroll', handleScroll, { passive: true });
    
    // Restore position immediately and after a small delay to handle async rendering
    restoreScrollPosition();
    const timeoutId = setTimeout(restoreScrollPosition, 50);

    return () => {
      sidebarElement.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pathname]); // Re-run on pathname change to restore position after navigation

  const handleLogout = () => {
    dispatch(reduxLogout());
    router.push("/");
  }

  return (
    <div className="h-screen bg-surface-secondary flex overflow-x-hidden">
      {/* Sidebar */}
      <div
        className={`bg-gradient-to-br from-fuchsia-700 via-purple-700 via-60% to-blue-600 text-white transition-all duration-300 shadow-2xl border-r border-purple-900/40 ${sidebarOpen ? "w-64" : "w-16"
          } flex flex-col no-scrollbar scrollbar-hide overflow-y-hidden relative z-20`}
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-900/30 bg-purple-800/80 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <Image src="/logo-footer.png" alt="logo" width={40} height={40} className="rounded-full shadow-md" />
              <span className="font-bold text-xl tracking-wide">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-purple-700/30 rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-purple-900/20 bg-purple-900/10">
          <div className="w-10 h-10 p-4 rounded-full bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-400 flex items-center justify-center text-lg font-bold shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-semibold text-white leading-tight">{user?.name || 'Admin'}</div>
              <div className="text-xs text-purple-200/80">
                {user?.role === 'admin' ? 'Administrator' :
                 user?.role === 'marketing_content_manager' ? 'Marketing Manager' :
                 user?.role === 'customer_support_executive' ? 'Support Executive' :
                 user?.role === 'report_finance_analyst' ? 'Finance Analyst' :
                 user?.role === 'order_warehouse_management' ? 'Warehouse Manager' :
                 user?.role === 'product_inventory_management' ? 'Inventory Manager' :
                 user?.role === 'delivery_boy' ? 'Delivery Agent' :
                 'User'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto py-4">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-7">
              {sidebarOpen && (
                <h3 className="px-6 text-xs font-bold text-purple-200/80 uppercase tracking-widest mb-3">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-all group relative ${isActive
                        ? "bg-purple-900/60 text-white shadow border-l-4 border-pink-400"
                        : "text-purple-100 hover:bg-purple-700/40 hover:text-white hover:border-l-4 hover:border-pink-300 border-l-4 border-transparent"
                        } ${!sidebarOpen ? "justify-center" : ""}`}
                      title={!sidebarOpen ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span className="ml-4 truncate">{item.name}</span>}
                      {isActive && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-pink-400 rounded-r-lg" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer - Logout Button (Always Visible for All Admin Roles) */}
        <div className="px-4 py-5 border-t border-purple-900/30 bg-purple-900/20">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-base font-medium text-purple-200 hover:bg-purple-700/40 hover:text-white rounded-lg transition-colors gap-3"
            title={!sidebarOpen ? "Logout" : undefined}
            type="button"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-purple-50 to-white overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 shadow-sm border-b border-purple-200 px-8 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.flatMap((section) => section.items).find((item) => item.href === pathname)?.name ||
                "Dashboard"}
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 no-scrollbar overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}