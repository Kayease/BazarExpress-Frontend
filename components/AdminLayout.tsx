"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from '../lib/store'
import { logout as reduxLogout } from '../lib/slices/authSlice'
import Image from "next/image"

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: "Admin Dashboard",
    items: [
      { name: "Home", href: "/admin", icon: Home },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Notice", href: "/admin/notices", icon: Bell },
    ],
  },
  {
    title: "PRODUCTS",
    items: [
      { name: "Brand", href: "/admin/brands", icon: Tag },
      { name: "Warehouses", href: "/admin/warehouse", icon: Building2 },
      { name: "Categories", href: "/admin/categories", icon: Grid3X3 },
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Promocodes", href: "/admin/promocodes", icon: Percent },
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
        }
      },
    ],
  },
  {
    title: "ORDERS",
    items: [
      { name: "All Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "New Orders", href: "/admin/orders/new", icon: ShoppingBag },
      { name: "Shipped Orders", href: "/admin/orders/shipped", icon: Truck },
      { name: "Delivered Orders", href: "/admin/orders/delivered", icon: CheckCircle },
      { name: "Cancelled Orders", href: "/admin/orders/cancelled", icon: X },
      { name: "Refunded Orders", href: "/admin/orders/refunded", icon: RefreshCw },
    ],
  },
  {
    title: "OTHER",
    items: [
      { name: "Banners", href: "/admin/banners", icon: ImageIcon },
      { name: "Blogs", href: "/admin/blog", icon: BookOpen },
      { name: "Enquiry", href: "/admin/enquiry", icon: Mail },
      { name: "Rating & Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminSidebarOpen');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });
  const pathname = usePathname()
  const router = useRouter()
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user)
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSidebarOpen', sidebarOpen ? 'true' : 'false');
    }
  }, [sidebarOpen]);

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
              <div className="text-xs text-purple-200/80">Administrator</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
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

        {/* Footer */}
        <div className="px-4 py-5 border-t border-purple-900/30 bg-purple-900/20">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-base font-medium text-purple-200 hover:bg-purple-700/40 hover:text-white rounded-lg transition-colors gap-3"
            title={!sidebarOpen ? "Logout" : undefined}
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