"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  AlertTriangle, 
  Calendar, 
  Shield, 
  Scale, 
  Info, 
  ExternalLink, 
  FileText, 
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Mail,
  Phone
} from "lucide-react"

export default function DisclaimerPage() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const disclaimerSections = [
    {
      id: "general-disclaimer",
      title: "General Disclaimer",
      icon: Info,
      content: `This disclaimer governs your use of the BazarXpress platform and services:

Information Accuracy:
• We strive to provide accurate product information and pricing
• Product descriptions, images, and specifications are provided by suppliers
• We cannot guarantee 100% accuracy of all product details
• Prices and availability are subject to change without notice
• We reserve the right to correct errors and update information

Service Availability:
• Services are provided on an "as is" and "as available" basis
• We do not guarantee uninterrupted or error-free service
• Maintenance, updates, or technical issues may cause temporary unavailability
• Service areas and delivery times may change based on operational requirements
• We reserve the right to modify or discontinue services with notice

User Responsibility:
• You are responsible for providing accurate delivery information
• Verify product details, quantities, and prices before placing orders
• Check products immediately upon delivery and report issues promptly
• Maintain the security of your account credentials
• Use the platform in accordance with our terms and conditions

Third-Party Content:
• Product reviews and ratings are provided by users and may not reflect our views
• Third-party links and content are provided for convenience only
• We are not responsible for the accuracy or reliability of user-generated content
• External websites and services have their own terms and privacy policies
• We do not endorse or guarantee third-party products or services`
    },
    {
      id: "product-disclaimer",
      title: "Product Information Disclaimer",
      icon: FileText,
      content: `Important information about products and services:

Product Descriptions:
• Product information is provided by manufacturers and suppliers
• We make reasonable efforts to ensure accuracy but cannot guarantee completeness
• Images may not always reflect the exact product appearance
• Product specifications, ingredients, and features may change without notice
• Always check product labels and packaging for the most current information

Pricing and Availability:
• Prices displayed are subject to change without prior notice
• Promotional prices are valid for limited periods and quantities
• Product availability varies by location and time
• We reserve the right to limit quantities and refuse orders
• Price errors will be corrected, and affected orders may be cancelled

Quality and Freshness:
• We strive to deliver fresh, quality products but cannot guarantee perfection
• Perishable items have varying shelf lives and quality standards
• Fresh produce may have natural variations in appearance and quality
• Expiry dates are approximate and may vary from displayed information
• Quality issues should be reported immediately upon delivery

Nutritional Information:
• Nutritional data is provided by manufacturers and may not be current
• We are not responsible for accuracy of nutritional claims
• Consult healthcare professionals for dietary advice
• Allergen information may not be complete or up-to-date
• Always check product packaging for the most accurate information

Brand and Trademark:
• Product brands and trademarks belong to their respective owners
• We are authorized retailers but not manufacturers of branded products
• Brand availability and product lines may change without notice
• We do not guarantee availability of specific brands or variants`
    },
    {
      id: "service-limitations",
      title: "Service Limitations",
      icon: XCircle,
      content: `Understanding the limitations of our services:

Delivery Limitations:
• Delivery times are estimates and may vary due to various factors
• Weather, traffic, and operational constraints may cause delays
• Some areas may have limited delivery windows or restrictions
• We cannot guarantee delivery to all addresses or locations
• Delivery may be suspended during emergencies or adverse conditions

Geographic Restrictions:
• Services are available only in specified cities and areas
• Coverage areas may change based on operational requirements
• Some products may not be available in all locations
• International delivery is not currently available
• Remote or inaccessible areas may not be serviceable

Technical Limitations:
• Platform functionality depends on internet connectivity and device compatibility
• Mobile app features may vary between operating systems
• Some features may not work properly on older devices or browsers
• System maintenance may temporarily affect service availability
• We cannot guarantee compatibility with all devices or software

Order Limitations:
• Minimum and maximum order values may apply
• Some products may have quantity restrictions
• Bulk orders may require special arrangements
• Payment methods may have transaction limits
• Order modifications may not always be possible after confirmation

Age and Legal Restrictions:
• Some products require age verification for purchase
• Certain items may be restricted by local laws and regulations
• We reserve the right to refuse service to minors for restricted products
• Legal compliance requirements may limit product availability
• Identity verification may be required for certain purchases`
    },
    {
      id: "liability-disclaimer",
      title: "Limitation of Liability",
      icon: Scale,
      content: `Our liability limitations and your understanding:

General Liability Limits:
• Our liability is limited to the maximum extent permitted by law
• We are not liable for indirect, incidental, or consequential damages
• Total liability shall not exceed the amount paid for the specific order
• We disclaim liability for losses not directly caused by our negligence
• Force majeure events are beyond our control and responsibility

Product-Related Liability:
• We are not liable for product defects caused by manufacturers
• Liability for product quality issues is limited to replacement or refund
• We are not responsible for allergic reactions or health issues from products
• Misuse of products is the customer's responsibility
• Product recalls and safety issues are handled according to manufacturer guidelines

Service-Related Liability:
• We are not liable for delays caused by factors beyond our control
• Delivery issues due to incorrect address information are customer responsibility
• We are not responsible for losses due to service interruptions
• Third-party service failures are not our liability
• Customer data security is important, but we cannot guarantee absolute protection

Financial Liability:
• Payment processing errors will be corrected but may take time
• We are not liable for bank charges or currency conversion fees
• Refund processing times depend on payment method and bank policies
• We are not responsible for investment losses or financial decisions
• Promotional offers are subject to terms and conditions

Legal Compliance:
• Customers are responsible for compliance with local laws
• We are not liable for legal issues arising from product use
• Import/export restrictions are customer responsibility
• Tax obligations vary by location and are customer responsibility
• Legal disputes are subject to jurisdiction clauses in our terms`
    },
    {
      id: "health-safety",
      title: "Health and Safety Disclaimer",
      icon: Shield,
      content: `Important health and safety information:

Food Safety:
• We follow food safety protocols but cannot guarantee absolute safety
• Perishable items should be consumed within recommended timeframes
• Proper storage and handling after delivery is customer responsibility
• Food allergies and dietary restrictions should be carefully considered
• We are not liable for foodborne illnesses or allergic reactions

Product Safety:
• Non-food products should be used according to manufacturer instructions
• We are not responsible for injuries caused by product misuse
• Safety warnings and age restrictions must be observed
• Hazardous products are handled according to safety regulations
• Product recalls and safety alerts are communicated when received

Personal Safety:
• Delivery personnel follow safety protocols during interactions
• Customers should ensure safe delivery environments
• Report any safety concerns immediately to our support team
• Emergency situations should be handled by appropriate authorities
• We prioritize safety but cannot control all environmental factors

Health Claims:
• We do not make medical or health claims about products
• Nutritional supplements are not evaluated by health authorities
• Consult healthcare professionals for medical advice
• Product benefits are as claimed by manufacturers
• We are not liable for health outcomes from product use

COVID-19 and Health Emergencies:
• We follow government guidelines for health emergencies
• Contactless delivery options are available when requested
• Health and safety protocols may change based on official guidance
• Service modifications during emergencies are for safety purposes
• We cannot guarantee complete protection from health risks`
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property Disclaimer",
      icon: FileText,
      content: `Intellectual property rights and usage:

Our Intellectual Property:
• BazarXpress name, logo, and branding are our trademarks
• Website content, design, and software are protected by copyright
• Unauthorized use of our intellectual property is prohibited
• User-generated content may be used by us for promotional purposes
• We respect intellectual property rights of others

Third-Party Intellectual Property:
• Product brands, trademarks, and copyrights belong to their owners
• We are authorized to sell branded products but do not own the brands
• Product images and descriptions may be provided by brand owners
• We respect and comply with intellectual property laws
• Copyright infringement claims are handled according to legal procedures

User Content:
• Reviews, photos, and comments submitted by users may be used by us
• Users retain ownership of their original content
• By submitting content, users grant us usage rights
• We may moderate, edit, or remove user content at our discretion
• Users are responsible for ensuring their content doesn't infringe rights

Digital Content:
• Digital products and content have specific usage rights
• Software licenses are governed by their respective terms
• We do not guarantee compatibility or performance of digital products
• Digital content may have geographic or device restrictions
• Refunds for digital products may be limited

Fair Use and Attribution:
• We use product information under fair use principles
• Proper attribution is provided where required
• We comply with copyright and trademark laws
• Unauthorized reproduction of our content is prohibited
• Legal action may be taken against intellectual property violations`
    }
  ]

  const importantPoints = [
    {
      title: "No Warranties",
      description: "Services provided 'as is' without warranties",
      icon: XCircle,
      type: "warning"
    },
    {
      title: "Limited Liability",
      description: "Liability limited to order value",
      icon: Scale,
      type: "info"
    },
    {
      title: "User Responsibility",
      description: "Users responsible for account security",
      icon: Shield,
      type: "info"
    },
    {
      title: "Subject to Change",
      description: "Terms and services may change with notice",
      icon: AlertTriangle,
      type: "warning"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <AlertTriangle className="w-12 h-12 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Disclaimer</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Important information about the limitations and responsibilities regarding our services.
          </p>
        </div>

        {/* Important Points */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {importantPoints.map((point, index) => {
            const IconComponent = point.icon
            const colorClass = point.type === 'warning' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100'
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-gray-600 text-sm">{point.description}</p>
              </div>
            )
          })}
        </div>

        {/* Key Disclaimer Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 mb-12">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-orange-900 mb-4">Important Notice</h2>
            <p className="text-orange-800 text-lg leading-relaxed max-w-3xl mx-auto">
              By using BazarXpress services, you acknowledge and agree to the limitations and disclaimers outlined below. 
              Please read this information carefully as it affects your legal rights and our responsibilities.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {disclaimerSections.map((section) => {
            const IconComponent = section.icon
            const isExpanded = expandedSections.includes(section.id)
            
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-orange-600" />
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

        {/* Legal Notice */}
        <div className="mt-16 bg-gray-100 rounded-xl p-8">
          <div className="text-center">
            <Scale className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Information</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h3>
                <p className="text-gray-600 mb-4">
                  This disclaimer is governed by the laws of India. Any disputes arising from or related to this disclaimer 
                  shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Severability</h3>
                <p className="text-gray-600 mb-4">
                  If any provision of this disclaimer is found to be invalid or unenforceable, the remaining provisions 
                  shall continue to be valid and enforceable to the fullest extent permitted by law.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Updates</h3>
                <p className="text-gray-600 mb-4">
                  We reserve the right to update this disclaimer at any time. Changes will be effective immediately upon 
                  posting on our website. Your continued use constitutes acceptance of the updated disclaimer.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
                <p className="text-gray-600 mb-4">
                  If you have questions about this disclaimer or need clarification on any points, please contact our 
                  legal team at legal@bazarxpress.com or call 1800-123-4567.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions About This Disclaimer?</h2>
          <p className="text-gray-600 mb-6">
          If you need clarification on any aspect of this disclaimer or have legal questions, contact our team.
          </p>
          <button 
            onClick={() => router.push('/contact')}
            className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center mx-auto space-x-2"
          >
            <Phone className="w-4 h-4 mr-2" />
            <span>Contact Support</span>
          </button>
        </div>

        {/* Final Warning */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Important Reminder</h3>
              <p className="text-red-800">
                This disclaimer is an integral part of our Terms of Service. By using BazarXpress, you acknowledge that you have read, 
                understood, and agree to be bound by these disclaimers and limitations. If you do not agree with any part of this disclaimer, 
                please discontinue use of our services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}