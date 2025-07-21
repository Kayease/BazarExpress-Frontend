"use client"

import { ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail, Clock, Star, Shield, Truck, CreditCard, RefreshCw, Smartphone, Globe, HelpCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function FAQPage() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [filteredResults, setFilteredResults] = useState<any[]>([])

  const faqs = [

   // General
   {
    id: 1,
    category: "General",
    question: "Which areas do you deliver to?",
    answer: "We currently deliver to 50+ cities across India. You can check if we deliver to your area by entering your pincode on our app or website.",
    icon: Globe,
  },
  {
    id: 2,
    category: "General",
    question: "How do you ensure product quality?",
    answer: "We have strict quality checks at our warehouses, temperature-controlled storage for fresh items, and regular audits of our supply chain to ensure you get the best quality products.",
    icon: Shield,
  },
  {
    id: 3,
    category: "General",
    question: "Do you have customer support?",
    answer: "Yes, we have 24/7 customer support available through chat, email, and phone. You can reach us through the app, website, or call our helpline.",
    icon: HelpCircle,
  },
    {
      id: 4,
      category: "Orders & Delivery",
      question: "Can I track my order?",
      answer: "Yes! You can track your order in real-time through our app or website. You'll receive SMS and push notifications about your order status.",
      icon: Globe,
    },
    {
      id: 5,
      category: "Orders & Delivery",
      question: "What if I'm not available during delivery?",
      answer: "Our delivery partner will call you before arriving. If you're not available, you can reschedule the delivery or ask someone else to receive it on your behalf with the OTP.",
      icon: Phone,
    },

    // Payment
    {
      id: 6,
      category: "Payment",
      question: "What payment methods do you accept?",
      answer: "We accept UPI, Credit/Debit Cards, Net Banking, Digital Wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery. All online payments are secured with 256-bit SSL encryption.",
      icon: CreditCard,
    },
    {
      id: 7,
      category: "Payment",
      question: "Is it safe to save my card details?",
      answer: "Yes, it's completely safe. We use PCI DSS compliant systems and tokenization to store your card details securely. Your actual card number is never stored on our servers.",
      icon: Shield,
    },
    {
      id: 8,
      category: "Payment",
      question: "Can I pay partially with wallet and card?",
      answer: "Yes, you can split payments between your BazarXpress wallet, cashback, and any other payment method during checkout.",
      icon: CreditCard,
    },
    {
      id: 9,
      category: "Payment",
      question: "What if my payment fails?",
      answer: "If your payment fails, the amount will be automatically refunded to your original payment method within 3-5 business days. You can retry the payment or choose a different method.",
      icon: RefreshCw,
    },

    // Account
    {
      id: 10,
      category: "Account",
      question: "How do I create an account?",
      answer: "You can create an account by downloading our app or visiting our website. Simply enter your mobile number, verify with OTP, and complete your profile.",
      icon: Smartphone,
    },
    {
      id: 11,
      category: "Account",
      question: "How do I change my delivery address?",
      answer: "Go to 'Saved Addresses' in your account settings. You can add, edit, or delete addresses. You can also add a new address during checkout.",
      icon: Globe,
    },
    {
      id: 12,
      category: "Account",
      question: "Can I have multiple delivery addresses?",
      answer: "Yes, you can save multiple addresses like home, office, or any other location. You can select the appropriate address during checkout.",
      icon: Globe,
    },
    {
      id: 13,
      category: "Account",
      question: "How do I delete my account?",
      answer: "You can request account deletion by contacting our customer support. Please note that this action is irreversible and will delete all your data permanently.",
      icon: Smartphone,
    },

    // Returns & Refunds
    {
      id: 14,
      category: "Returns & Refunds",
      question: "What is your return policy?",
      answer: "We offer easy returns for damaged, expired, or incorrect items. Contact our support team within 24 hours of delivery. Fresh produce and perishables can be returned within 2 hours.",
      icon: RefreshCw,
    },
    {
      id: 15,
      category: "Returns & Refunds",
      question: "How long does refund take?",
      answer: "Refunds are processed within 24-48 hours for online payments and credited back to your original payment method within 3-7 business days. Wallet refunds are instant.",
      icon: RefreshCw,
    },
    {
      id: 16,
      category: "Returns & Refunds",
      question: "Can I return opened products?",
      answer: "You can return opened products only if they are damaged, expired, or not as described. Hygiene and personal care products cannot be returned once opened unless defective.",
      icon: RefreshCw,
    },
    {
      id: 17,
      category: "Returns & Refunds",
      question: "What if I received wrong items?",
      answer: "If you received wrong items, contact us immediately. We'll arrange for pickup of wrong items and deliver the correct ones at no extra charge.",
      icon: RefreshCw,
    },

    // App & Website
    {
      id: 18,
      category: "App & Website",
      question: "Is there a mobile app available?",
      answer: "Yes! Download the BazarXpress app from Google Play Store or Apple App Store for a better shopping experience with exclusive app-only deals.",
      icon: Smartphone,
    },
    {
      id: 19,
      category: "App & Website",
      question: "Why should I use the app instead of website?",
      answer: "The app offers faster checkout, push notifications for offers, better user experience, and exclusive app-only deals. You also get early access to new features.",
      icon: Smartphone,
    },
    {
      id: 20,
      category: "App & Website",
      question: "The app is not working properly. What should I do?",
      answer: "Try clearing the app cache, updating to the latest version, or restarting your device. If the problem persists, contact our technical support team.",
      icon: Smartphone,
    },

    // Membership & Offers
    {
      id: 21,
      category: "Membership & Offers",
      question: "What is BazarXpress Plus?",
      answer: "BazarXpress Plus is our premium membership offering unlimited free deliveries, exclusive deals, priority customer support, and early access to sales for ₹99/month.",
      icon: Star,
    },
    {
      id: 22,
      category: "Membership & Offers",
      question: "How do I apply coupon codes?",
      answer: "You can apply coupon codes at checkout. Enter the code in the 'Apply Coupon' section, and the discount will be automatically applied to your order total.",
      icon: Star,
    },
    {
      id: 23,
      category: "Membership & Offers",
      question: "Why didn't my coupon work?",
      answer: "Coupons may not work due to expiry, minimum order requirements, product restrictions, or if you've already used it. Check the coupon terms and conditions.",
      icon: Star,
    },
    // Orders & Delivery
    {
      id: 24,
      category: "Orders & Delivery",
      question: "How fast is the delivery?",
      answer: "We deliver groceries in 8-12 minutes on average. Our delivery partners are strategically located to ensure quick delivery to your doorstep. During peak hours or adverse weather conditions, delivery might take up to 15-20 minutes.",
      icon: Truck,
    },
    {
      id: 25,
      category: "Orders & Delivery",
      question: "What are the delivery charges?",
      answer: "Delivery is free on orders above ₹99. For orders below ₹99, a delivery charge of ₹25 applies. We also offer BazarXpress Plus membership for unlimited free deliveries.",
      icon: Truck,
    },
    {
      id: 26,
      category: "Orders & Delivery",
      question: "What are your delivery hours?",
      answer: "We deliver 24/7 in most areas. However, some locations have specific delivery windows from 6 AM to 11 PM. You can check your area's delivery hours in the app.",
      icon: Clock,
    },
  ]

  // Filter FAQs whenever search query or category changes
  useEffect(() => {
    const results = faqs.filter((faq) => {
      const matchesSearch = 
        searchQuery === "" || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    
    setFilteredResults(results)
  }, [searchQuery, selectedCategory])

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const categories = [...new Set(faqs.map((faq) => faq.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col md:flex-row items-center justify-center md:space-x-3 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 md:mb-0">
              <HelpCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about BazarXpress. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="grid gap-6 max-w-4xl mx-auto">
          {filteredResults.map((faq) => {
            const IconComponent = faq.icon
            return (
              <div key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-xs text-green-600 font-medium uppercase tracking-wide">{faq.category}</span>
                      <h3 className="font-semibold text-gray-900 mt-1 text-lg">{faq.question}</h3>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {expandedItems.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-6 pl-20">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* No Results Found - Contact Support */}
        {filteredResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-4xl mx-auto my-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              We couldn't find any FAQs matching "{searchQuery}". Please try different keywords or contact our support team for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Clear Search
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Contact Support</span>
              </button>
            </div>
            
            {/* Contact Options */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Other ways to get help</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-gray-900 mb-1">Live Chat</h5>
                  <p className="text-sm text-gray-600">Available 24/7</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Phone className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-gray-900 mb-1">Call Us</h5>
                  <p className="text-sm text-gray-600">1800-123-4567</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-gray-900 mb-1">Email</h5>
                  <p className="text-sm text-gray-600">support@bazarxpress.com</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
