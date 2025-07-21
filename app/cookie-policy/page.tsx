"use client"

import { useState } from "react"
import { 
  Cookie, 
  Calendar, 
  Settings, 
  Eye, 
  Shield, 
  BarChart3, 
  Target, 
  Globe,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  X,
  Info
} from "lucide-react"

export default function CookiePolicyPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleCookieToggle = (type: keyof typeof cookieSettings) => {
    if (type === 'essential') return // Essential cookies cannot be disabled
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const cookieSections = [
    {
      id: "what-are-cookies",
      title: "What Are Cookies?",
      icon: Cookie,
      content: `Cookies are small text files that are stored on your device when you visit our website or use our mobile app. They help us provide you with a better experience by remembering your preferences and improving our services.

Types of Information Stored:
• Login status and authentication tokens
• Shopping cart contents and preferences
• Language and location settings
• Website performance and usage data
• Personalization preferences

How Cookies Work:
• Stored locally on your device (computer, phone, tablet)
• Sent back to our servers when you visit our site
• Help us recognize you as a returning user
• Enable personalized features and content
• Improve website functionality and performance

Cookie Lifespan:
• Session cookies: Deleted when you close your browser
• Persistent cookies: Remain until expiry date or manual deletion
• Secure cookies: Only transmitted over encrypted connections
• HttpOnly cookies: Cannot be accessed by client-side scripts

We use cookies responsibly and in compliance with applicable privacy laws. You have control over cookie settings and can manage them through your browser or our cookie preference center.`
    },
    {
      id: "types-of-cookies",
      title: "Types of Cookies We Use",
      icon: Settings,
      content: `We use different types of cookies for various purposes:

Essential Cookies (Always Active):
• Required for basic website functionality
• Enable secure login and authentication
• Maintain shopping cart contents
• Remember your delivery address
• Process payments securely
• Cannot be disabled as they're necessary for service operation

Analytics Cookies (Optional):
• Track website usage and performance
• Understand user behavior patterns
• Identify popular products and pages
• Monitor site speed and errors
• Help us improve user experience
• Generate aggregated usage statistics

Marketing Cookies (Optional):
• Show relevant advertisements
• Track campaign effectiveness
• Personalize marketing messages
• Prevent duplicate ad displays
• Measure conversion rates
• Enable social media sharing features

Preference Cookies (Optional):
• Remember your language settings
• Store display preferences (theme, layout)
• Maintain notification preferences
• Remember recently viewed products
• Customize content based on interests
• Enable personalized recommendations

Third-Party Cookies:
• Google Analytics for website analytics
• Facebook Pixel for advertising
• Payment gateway cookies for transactions
• Social media integration cookies
• Customer support chat cookies`
    },
    {
      id: "cookie-purposes",
      title: "How We Use Cookies",
      icon: Target,
      content: `We use cookies for specific purposes to enhance your experience:

Website Functionality:
• Maintain your login session
• Remember items in your shopping cart
• Store your delivery preferences
• Enable secure checkout process
• Provide customer support features

Personalization:
• Show relevant product recommendations
• Remember your favorite categories
• Display content in your preferred language
• Customize homepage based on your interests
• Maintain your notification preferences

Performance Optimization:
• Monitor website loading times
• Identify and fix technical issues
• Optimize page performance
• Track error rates and crashes
• Improve mobile app functionality

Analytics and Insights:
• Understand how you use our website
• Track popular products and categories
• Measure marketing campaign effectiveness
• Analyze user journey and behavior
• Generate reports for business improvement

Security:
• Detect and prevent fraudulent activities
• Protect against unauthorized access
• Verify user identity during login
• Monitor for suspicious behavior
• Ensure secure data transmission

Marketing and Advertising:
• Show relevant ads on other websites
• Track conversion from marketing campaigns
• Personalize promotional content
• Measure advertising effectiveness
• Enable social media sharing and integration`
    },
    {
      id: "third-party-cookies",
      title: "Third-Party Cookies",
      icon: Globe,
      content: `We work with trusted third-party services that may set their own cookies:

Google Services:
• Google Analytics: Website traffic analysis
• Google Ads: Advertising and remarketing
• Google Maps: Location services
• Google Pay: Payment processing
• Firebase: App analytics and crash reporting

Social Media Platforms:
• Facebook: Social login and sharing
• Instagram: Content integration
• Twitter: Social sharing features
• WhatsApp: Customer support integration
• LinkedIn: Professional networking features

Payment Processors:
• Razorpay: Payment processing
• Paytm: Digital wallet integration
• PhonePe: UPI payments
• PayU: Credit card processing
• Stripe: International payments

Marketing and Analytics:
• Hotjar: User behavior analysis
• Mixpanel: Product analytics
• Branch: Deep linking and attribution
• Clevertap: User engagement
• Appsflyer: Mobile attribution

Customer Support:
• Zendesk: Help desk integration
• Intercom: Live chat support
• Freshworks: Customer service
• Twilio: Communication services

These third parties have their own privacy policies and cookie practices. We recommend reviewing their policies to understand how they use cookies and your data.`
    }
  ]

  const cookieTypes = [
    {
      name: "Essential Cookies",
      description: "Required for basic website functionality",
      icon: Shield,
      required: true,
      enabled: cookieSettings.essential
    },
    {
      name: "Analytics Cookies",
      description: "Help us understand how you use our website",
      icon: BarChart3,
      required: false,
      enabled: cookieSettings.analytics
    },
    {
      name: "Marketing Cookies",
      description: "Used to show you relevant advertisements",
      icon: Target,
      required: false,
      enabled: cookieSettings.marketing
    },
    {
      name: "Preference Cookies",
      description: "Remember your settings and preferences",
      icon: Settings,
      required: false,
      enabled: cookieSettings.preferences
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Cookie className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn about how we use cookies to improve your experience and how you can control them.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {cookieSections.map((section) => {
            const IconComponent = section.icon
            const isExpanded = expandedSections.includes(section.id)
            
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pl-22">
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Browser Instructions */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <Info className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Browser Cookie Settings</h2>
            <p className="text-blue-800">
              You can manage cookies directly through your browser settings
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Chrome</h3>
              <p className="text-sm text-gray-600">Settings → Privacy and Security → Cookies</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Firefox</h3>
              <p className="text-sm text-gray-600">Settings → Privacy & Security → Cookies</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Safari</h3>
              <p className="text-sm text-gray-600">Preferences → Privacy → Cookies</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Edge</h3>
              <p className="text-sm text-gray-600">Settings → Cookies and Site Permissions</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-900 mb-2">Important Information</h3>
              <ul className="text-yellow-800 space-y-2">
                <li>• Disabling essential cookies may affect website functionality</li>
                <li>• Some features may not work properly without certain cookies</li>
                <li>• Third-party cookies are governed by their respective privacy policies</li>
                <li>• Cookie preferences are stored locally and may need to be reset on new devices</li>
                <li>• We regularly review and update our cookie practices</li>
                <li>• Contact us if you have questions about our cookie usage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions About Cookies?</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about our cookie policy or need help managing your preferences, contact us.
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}