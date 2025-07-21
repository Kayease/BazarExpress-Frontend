"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react"

export default function SecurityPage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const isLoggedIn = true
  const user = { name: "John Doe", email: "user@BazarXpress.com" }

  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All your data is encrypted using industry-standard SSL/TLS protocols to ensure maximum security.",
    },
    {
      icon: Shield,
      title: "Secure Payment Processing",
      description: "We use PCI DSS compliant payment gateways to protect your financial information.",
    },
    {
      icon: Eye,
      title: "Privacy Protection",
      description: "Your personal information is never shared with third parties without your explicit consent.",
    },
    {
      icon: CheckCircle,
      title: "Regular Security Audits",
      description: "Our systems undergo regular security audits and penetration testing by certified professionals.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={() => {}}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Security & Trust</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your security and privacy are our top priorities. Learn about the measures we take to protect your data and
            ensure a safe shopping experience.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {securityFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Security Best Practices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices for Users</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Security</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use a strong, unique password</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Enable two-factor authentication</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Log out from shared devices</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Regularly update your password</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Safe Shopping</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Verify delivery person identity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Check order details before payment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Report suspicious activities</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep app updated to latest version</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Report Security Issues */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Report Security Issues</h3>
              <p className="text-red-800 mb-4">
                If you discover a security vulnerability or have concerns about your account security, please contact us
                immediately.
              </p>
              <div className="space-y-2">
                <p className="text-red-800">
                  <strong>Security Email:</strong> security@BazarXpress.com
                </p>
                <p className="text-red-800">
                  <strong>Emergency Hotline:</strong> 1800-SECURITY (24/7)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
