"use client"

import { useState } from "react"
import { 
  Truck, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Phone, 
  Mail,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Zap,
  Globe
} from "lucide-react"

export default function ShippingPolicyPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const shippingSections = [
    {
      id: "delivery-areas",
      title: "Delivery Areas & Coverage",
      icon: MapPin,
      content: `We deliver to 50+ cities across India with expanding coverage:

Metro Cities (10-15 minutes):
• Delhi NCR (Gurgaon, Noida, Faridabad, Ghaziabad)
• Mumbai (Mumbai, Navi Mumbai, Thane)
• Bangalore (Bangalore Urban)
• Hyderabad (Hyderabad, Secunderabad)
• Chennai (Chennai, Tambaram)
• Pune (Pune, Pimpri-Chinchwad)
• Kolkata (Kolkata, Howrah)

Tier-1 Cities (15-25 minutes):
• Ahmedabad, Surat, Vadodara
• Jaipur, Jodhpur
• Lucknow, Kanpur
• Kochi, Thiruvananthapuram
• Coimbatore, Madurai
• Indore, Bhopal
• Chandigarh, Ludhiana

Tier-2 Cities (20-30 minutes):
• Agra, Meerut, Varanasi
• Nagpur, Nashik, Aurangabad
• Patna, Ranchi
• Bhubaneswar, Cuttack
• Dehradun, Haridwar
• Mysore, Mangalore

Check delivery availability by entering your pincode on our app or website.`
    },
    {
      id: "delivery-times",
      title: "Delivery Timeframes",
      icon: Clock,
      content: `Our delivery promise varies by location and product type:

Express Delivery (8-12 minutes):
• Available in select metro areas
• Everyday essentials and groceries
• Fresh produce and dairy
• Limited to nearby dark stores
• Premium service with higher priority

Standard Delivery (10-20 minutes):
• Available in most serviceable areas
• Wide range of products
• Most popular delivery option
• Reliable and consistent timing
• Free on orders above ₹99

Extended Delivery (20-30 minutes):
• Tier-2 cities and suburban areas
• All product categories available
• Slightly longer due to distance
• Same quality and service standards
• Weather-dependent adjustments

Scheduled Delivery:
• Choose specific time slots
• Available for next-day delivery
• Perfect for bulk orders
• 2-hour delivery windows
• Premium feature with small fee

Factors affecting delivery time:
• Weather conditions (rain, storms)
• Traffic and road conditions
• High demand periods (festivals, sales)
• Product availability at nearest store
• Address accessibility and location`
    },
    {
      id: "delivery-charges",
      title: "Delivery Charges & Fees",
      icon: Package,
      content: `Transparent pricing with no hidden charges:

Free Delivery:
• Orders above ₹99 qualify for free delivery
• BazarXpress Plus members get unlimited free delivery
• Special promotions may offer free delivery on lower amounts
• Fresh produce orders above ₹149 always free

Standard Delivery Charges:
• Orders below ₹99: ₹25 delivery fee
• Express delivery: Additional ₹15 fee
• Scheduled delivery: ₹20 convenience fee
• Bulk orders (above ₹2000): Free delivery

Distance-Based Pricing:
• Within 3km: Standard rates apply
• 3-5km: Additional ₹10 charge
• 5-7km: Additional ₹20 charge
• Beyond 7km: Case-by-case pricing

Special Circumstances:
• Apartment complex delivery: No extra charge
• High-rise buildings (above 10th floor): ₹10 extra
• Gated communities: Standard rates
• Commercial addresses: ₹15 extra during business hours

BazarXpress Plus Benefits:
• Unlimited free deliveries
• Priority delivery slots
• No distance-based charges
• Express delivery at standard rates
• Monthly subscription: ₹99`
    },
    {
      id: "order-tracking",
      title: "Order Tracking & Updates",
      icon: Globe,
      content: `Stay informed about your order every step of the way:

Real-Time Tracking:
• Live GPS tracking of delivery partner
• Estimated arrival time updates
• Route optimization for faster delivery
• Traffic-adjusted time estimates
• Push notifications for status changes

Order Status Updates:
• Order confirmed and being prepared
• Picked up from store/warehouse
• Out for delivery with partner details
• Delivered with photo confirmation
• Any delays or issues immediately communicated

Communication Channels:
• SMS updates at each milestone
• Push notifications through app
• Email confirmations and receipts
• WhatsApp updates (opt-in)
• Call from delivery partner before arrival

Delivery Partner Information:
• Name and photo of delivery person
• Contact number for direct communication
• Vehicle details and registration
• Real-time location sharing
• Estimated time of arrival

Proof of Delivery:
• Photo of delivered items
• Digital signature or OTP verification
• Delivery timestamp and location
• Feedback option post-delivery
• Issue reporting if problems arise`
    },
    {
      id: "delivery-instructions",
      title: "Delivery Instructions & Guidelines",
      icon: CheckCircle,
      content: `Help us deliver better with clear instructions:

Address Guidelines:
• Provide complete address with landmarks
• Include apartment/house number clearly
• Mention floor number and building name
• Add nearby landmarks for easy location
• Keep contact number updated and reachable

Special Instructions:
• Gate codes or security instructions
• Preferred delivery location (door/reception)
• Time preferences if you have any
• Contact person if different from orderer
• Any access restrictions or guidelines

Delivery Preparation:
• Be available during estimated delivery time
• Keep phone accessible for partner calls
• Have exact change ready for COD orders
• Prepare space for grocery placement
• Check items immediately upon delivery

Safety Protocols:
• Contactless delivery available on request
• Sanitized packaging and handling
• Delivery partner health screening
• Mask and gloves worn by delivery team
• Social distancing maintained during handover

What to Expect:
• Delivery partner will call before arriving
• Items will be checked for quality and quantity
• Payment collection (if COD)
• Feedback request and rating
• Issue resolution if any problems`
    },
    {
      id: "special-deliveries",
      title: "Special Delivery Services",
      icon: Star,
      content: `Additional services for enhanced convenience:

Bulk Order Delivery:
• Orders above ₹2000 get priority handling
• Dedicated delivery team for large orders
• Scheduled delivery slots available
• Free delivery regardless of location
• Special packaging for bulk items

Corporate Delivery:
• Office and business address delivery
• Bulk ordering for teams and events
• Invoice and GST billing available
• Scheduled recurring deliveries
• Dedicated account manager for large accounts

Gift Delivery:
• Send groceries as gifts to family/friends
• Special gift packaging available
• Personalized message cards
• Surprise delivery coordination
• Confirmation to sender upon delivery

Emergency Delivery:
• Urgent medicine and baby care items
• Available 24/7 in select areas
• Premium charges apply
• Fastest possible delivery
• Priority over regular orders

Festival & Special Occasion:
• Extended delivery hours during festivals
• Special product collections
• Gift hampers and combos
• Decorative packaging options
• Pre-order facility for festival essentials

Subscription Delivery:
• Weekly/monthly recurring orders
• Customizable product lists
• Automatic delivery scheduling
• Flexible modification options
• Subscription management through app`
    }
  ]

  const deliveryFeatures = [
    {
      title: "Lightning Fast",
      description: "8-12 minute average delivery time",
      icon: Zap
    },
    {
      title: "Wide Coverage",
      description: "50+ cities across India",
      icon: Globe
    },
    {
      title: "Real-time Tracking",
      description: "Track your order live on map",
      icon: MapPin
    },
    {
      title: "Quality Assured",
      description: "Fresh products, careful handling",
      icon: Shield
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Truck className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Shipping & Delivery Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fast, reliable delivery to your doorstep. Learn about our delivery areas, timings, and policies.
          </p>
        </div>

        {/* Delivery Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {deliveryFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Delivery Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Delivery Promise</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">8-12</div>
                <div className="text-gray-700">Minutes Average Delivery</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
                <div className="text-gray-700">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-700">Service Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {shippingSections.map((section) => {
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


      {/* Contact Information */}
       <div className="mt-16 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Delivery Support</h2>
          <p className="text-gray-600 mb-6">
          Need help with your delivery? Our support team is available 24/7 to assist you.
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium">
            Contact Support
          </button>
        </div>

        {/* Important Delivery Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-900 mb-2">Important Delivery Information</h3>
              <ul className="text-yellow-800 space-y-2">
                <li>• Delivery times may vary during peak hours, festivals, and adverse weather</li>
                <li>• Please be available during the estimated delivery window</li>
                <li>• Ensure your phone is reachable for delivery partner coordination</li>
                <li>• Check items immediately upon delivery and report any issues</li>
                <li>• Delivery charges are clearly displayed before order confirmation</li>
                <li>• We reserve the right to modify delivery areas and timings with notice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}