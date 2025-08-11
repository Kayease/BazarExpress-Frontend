"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, User, Clock, CheckCircle, XCircle } from "lucide-react"
import toast from 'react-hot-toast'
import { apiPatch, apiGet } from "../../../lib/api-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PasswordResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [isValidLink, setIsValidLink] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  const userId = searchParams.get('userId')
  const role = searchParams.get('role')
  const expires = searchParams.get('expires')

  useEffect(() => {
    verifyResetLink()
  }, [userId, role, expires])

  const verifyResetLink = async () => {
    if (!userId || !role || !expires) {
      setIsValidLink(false)
      setVerifying(false)
      return
    }

    // Check if link has expired (10 minutes)
    const expiryTime = parseInt(expires)
    const currentTime = Date.now()
    
    if (currentTime > expiryTime) {
      setIsValidLink(false)
      setVerifying(false)
      toast.error("Password reset link has expired")
      return
    }

    // Validate role (only non-user roles can reset passwords)
    const validRoles = ['admin', 'product_inventory_management', 'order_warehouse_management', 'marketing_content_manager', 'customer_support_executive', 'report_finance_analyst']
    
    if (!validRoles.includes(role)) {
      setIsValidLink(false)
      setVerifying(false)
      toast.error("Invalid reset link - unauthorized role")
      return
    }

    // Create mock user info for display (we don't need to fetch from API)
    setUserInfo({
      id: userId,
      role: role,
      name: `${getRoleDisplayName(role)} User`,
      phone: 'N/A'
    })
    
    setIsValidLink(true)
    setVerifying(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      // Use the public password reset endpoint
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
          expires,
          password: formData.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }
      
      toast.success("Password updated successfully!")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'product_inventory_management': 'Product & Inventory Management',
      'order_warehouse_management': 'Order & Warehouse Management',
      'marketing_content_manager': 'Marketing & Content Manager',
      'customer_support_executive': 'Customer Support Executive',
      'report_finance_analyst': 'Report & Finance Analyst'
    };
    return roleMap[role] || role;
  };

  const getTimeRemaining = () => {
    if (!expires) return "Unknown"
    
    const expiryTime = parseInt(expires)
    const currentTime = Date.now()
    const timeLeft = expiryTime - currentTime
    
    if (timeLeft <= 0) return "Expired"
    
    const minutes = Math.floor(timeLeft / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired. Please request a new one from your administrator.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Lock className="h-12 w-12 text-brand-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set a new password for your account
          </p>
        </div>

        {/* User Info Card */}
        {userInfo && (
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(userInfo.role)}</p>
                <p className="text-xs text-gray-500">{userInfo.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Link expires in: {getTimeRemaining()}</span>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.password && formData.password.length < 6 && (
                <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || formData.password.length < 6 || formData.password !== formData.confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-brand-primary hover:text-brand-primary/80"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}