"use client"

import { useState } from "react"
import { FileText, Calendar, Scale, Shield, Truck, CreditCard, RefreshCw, AlertTriangle, CheckCircle, Download, ExternalLink } from "lucide-react"

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: Scale,
      content: `By accessing and using the BazarXpress platform (website, mobile application, or any other digital platform), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.

These Terms of Service ("Terms") govern your use of our website located at www.bazarxpress.com and our mobile application (together or individually "Service") operated by BazarXpress Technologies Private Limited ("us", "we", or "our").

Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.`
    },
    {
      id: "definitions",
      title: "2. Definitions",
      icon: FileText,
      content: `For the purposes of these Terms:
      
• "Company" (referred to as "we", "us" or "our") refers to BazarXpress Technologies Private Limited.
• "You" refers to the individual accessing or using the Service.
• "Service" refers to the BazarXpress platform including website and mobile application.
• "Products" refers to goods available for purchase through our platform.
• "Order" refers to a request to purchase Products from us.
• "Account" refers to a unique account created for you to access our Service.`
    },
    {
      id: "eligibility",
      title: "3. Eligibility",
      icon: CheckCircle,
      content: `To use our Service, you must:
      
• Be at least 18 years old or have parental/guardian consent
• Provide accurate and complete information during registration
• Have the legal capacity to enter into binding contracts
• Not be prohibited from using the Service under applicable laws
• Maintain the security of your account credentials

We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.`
    },
    {
      id: "account",
      title: "4. Account Registration and Security",
      icon: Shield,
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for maintaining the confidentiality of your account.

You agree to:
• Provide accurate, current and complete information during registration
• Maintain and promptly update your account information
• Maintain the security of your password and identification
• Notify us immediately of any unauthorized use of your account
• Accept responsibility for all activities under your account

We reserve the right to suspend or terminate your account if any information provided is inaccurate, false, or incomplete.`
    },
    {
      id: "orders",
      title: "5. Orders and Delivery",
      icon: Truck,
      content: `Order Placement:
• All orders are subject to acceptance and availability
• We reserve the right to refuse or cancel orders at any time
• Order confirmation does not guarantee product availability

Delivery Terms:
• We strive to deliver orders within 10-15 minutes in most areas
• Delivery times may vary based on product availability, weather conditions, traffic, and demand
• Delivery is available only in our serviceable areas
• You must be available to receive the delivery at the specified address
• If you're unavailable, we may attempt redelivery or cancel the order

Delivery charges apply as per our current pricing policy. Free delivery may be available on orders above a certain amount.`
    },
    {
      id: "pricing",
      title: "6. Pricing and Payment",
      icon: CreditCard,
      content: `Pricing:
• All prices are in Indian Rupees (INR) and include applicable taxes
• Prices are subject to change without notice
• We reserve the right to correct pricing errors
• Promotional prices are valid for limited periods

Payment Terms:
• Payment must be made at the time of placing the order
• We accept various payment methods including UPI, cards, net banking, and COD
• All payments are processed through secure, PCI DSS compliant systems
• Failed payments may result in order cancellation
• Refunds will be processed as per our refund policy

We reserve the right to modify payment terms and accepted payment methods.`
    },
    {
      id: "returns",
      title: "7. Returns and Refunds",
      icon: RefreshCw,
      content: `Return Policy:
• We accept returns for damaged, expired, or incorrect items
• Returns must be initiated within 24 hours of delivery
• Fresh produce and perishables must be returned within 2 hours
• Items must be in original condition and packaging
• Certain products may not be eligible for return due to hygiene reasons

Refund Process:
• Refunds are processed within 24-48 hours of return approval
• Online payment refunds are credited to the original payment method
• Refund timeline varies by payment method (3-7 business days for cards)
• Wallet refunds are processed instantly
• We reserve the right to inspect returned items before processing refunds`
    },
    {
      id: "prohibited",
      title: "8. Prohibited Uses",
      icon: AlertTriangle,
      content: `You may not use our Service:
      
• For any unlawful purpose or to solicit others to perform unlawful acts
• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
• To infringe upon or violate our intellectual property rights or the intellectual property rights of others
• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
• To submit false or misleading information
• To upload or transmit viruses or any other type of malicious code
• To collect or track personal information of others
• To spam, phish, pharm, pretext, spider, crawl, or scrape
• For any obscene or immoral purpose
• To interfere with or circumvent security features of the Service

We reserve the right to terminate your use of the Service for violating any prohibited uses.`
    },
    {
      id: "intellectual",
      title: "9. Intellectual Property Rights",
      icon: Shield,
      content: `The Service and its original content, features, and functionality are and will remain the exclusive property of BazarXpress Technologies Private Limited and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.

You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes. This license does not include any resale or commercial use of the Service or its contents.`
    },
    {
      id: "limitation",
      title: "10. Limitation of Liability",
      icon: Scale,
      content: `In no event shall BazarXpress Technologies Private Limited, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.

Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.

Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for consequential or incidental damages, so the above limitations may not apply to you.`
    },
    {
      id: "termination",
      title: "11. Termination",
      icon: AlertTriangle,
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including but not limited to a breach of the Terms.

If you wish to terminate your account, you may simply discontinue using the Service or contact our customer support.

Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive termination.`
    },
    {
      id: "governing",
      title: "12. Governing Law",
      icon: Scale,
      content: `These Terms shall be interpreted and governed by the laws of India. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.

If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions will remain in effect.`
    },
    {
      id: "changes",
      title: "13. Changes to Terms",
      icon: FileText,
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.

What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.`
    },
    {
      id: "contact",
      title: "14. Contact Information",
      icon: FileText,
      content: `If you have any questions about these Terms and Conditions, please contact us:

Email: legal@bazarxpress.com
Phone: 1800-123-4567
Address: BazarXpress Technologies Private Limited
         123 Business Park, Sector 18
         Gurugram, Haryana 122015, India

Customer Support: support@bazarxpress.com
Business Hours: Monday to Sunday, 9:00 AM to 9:00 PM IST`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FileText className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms and Conditions</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these terms and conditions carefully before using our service. By using BazarXpress, you agree to these terms.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section) => {
            const IconComponent = section.icon
            const isActive = activeSection === section.id
            
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
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <AlertTriangle className="w-5 h-5 text-gray-500 transform rotate-180" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {isActive && (
                  <div className="px-6 pb-6 pl-22">
                    <div className="prose max-w-none">
                      <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Important Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-900 mb-2">Important Notice</h3>
              <p className="text-yellow-800 mb-4">
                These terms and conditions constitute a legally binding agreement between you and BazarXpress Technologies Private Limited. 
                Please read them carefully and contact us if you have any questions before using our service.
              </p>
            </div>
          </div>
        </div>

        {/* Acceptance Confirmation */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">By using BazarXpress, you agree to these terms</h3>
          <p className="text-green-800 mb-4">
            Your continued use of our platform constitutes acceptance of these terms and conditions.
          </p>
        </div>
      </div>
    </div>
  )
}
