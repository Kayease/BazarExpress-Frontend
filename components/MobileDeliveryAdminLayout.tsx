"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  Truck,
  CheckCircle,
  RefreshCw,
  Menu,
  X,
  LogOut,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from '../lib/store'
import { logout as reduxLogout } from '../lib/slices/authSlice'
import Image from "next/image"

interface MobileDeliveryAdminLayoutProps {
  children: React.ReactNode
}

// Mobile-optimized menu items for delivery agents
const getDeliveryAgentMenuItems = () => [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Overview & Stats"
  },
  {
    title: "All Orders",
    href: "/admin/orders",
    icon: Package,
    description: "View all assigned orders"
  },
  {
    title: "Shipped Orders",
    href: "/admin/orders/shipped",
    icon: Truck,
    description: "Orders ready for delivery"
  },
  {
    title: "Delivered Orders",
    href: "/admin/orders/delivered",
    icon: CheckCircle,
    description: "Completed deliveries"
  },
  {
    title: "Return Orders",
    href: "/admin/returns",
    icon: RefreshCw,
    description: "Handle return pickups"
  }
]

export default function MobileDeliveryAdminLayout({ children }: MobileDeliveryAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user)
  const dispatch = useAppDispatch()

  // Get menu items
  const menuItems = getDeliveryAgentMenuItems()

  const handleLogout = () => {
    dispatch(reduxLogout())
    router.push("/")
  }

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 mb-6">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Link href="/">
                <Image src="/logo.svg" alt="logo" width={48} height={48} className="rounded-full" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Delivery Agent</h1>
                <p className="text-xs text-gray-500">BazarXpress</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <Image src="/logo-footer.svg" alt="logo" width={40} height={40} className="rounded-full" />
                </Link>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delivery Agent</h2>
                  <p className="text-sm text-gray-500">BazarXpress</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.name || 'Delivery Agent'}</h3>
                  <p className="text-sm text-gray-500">Delivery Agent</p>
                  <p className="text-xs text-gray-400">{user?.phone || 'No phone'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-orange-100 text-orange-700 border-l-4 border-orange-500"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-24 px-4">
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 h-16">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.title.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
