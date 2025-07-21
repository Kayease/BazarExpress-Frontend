"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  IndianRupee,
} from "lucide-react";

export default function RefundPolicyPage() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const refundSections = [
    {
      id: "eligibility",
      title: "Refund Eligibility",
      icon: CheckCircle,
      content: `Items eligible for refund:

Damaged Products:
• Products damaged during delivery
• Manufacturing defects or quality issues
• Packaging damage affecting product integrity
• Items not matching the description

Incorrect Orders:
• Wrong product delivered
• Missing items from your order
• Quantity discrepancies
• Expired or near-expiry products

Quality Issues:
• Fresh produce not meeting quality standards
• Frozen items delivered thawed
• Products with quality concerns

Non-Refundable Items:
• Personal care and hygiene products (once opened)
• Perishable items after 2 hours of delivery
• Items consumed or used
• Products without original packaging
• Custom or personalized items`,
    },
    {
      id: "timeframes",
      title: "Refund Timeframes",
      icon: Clock,
      content: `Different categories have different refund windows:

Fresh Produce & Perishables:
• Must be reported within 2 hours of delivery
• Immediate inspection required
• Photo evidence may be requested
• Quick resolution within 4-6 hours

Packaged Foods:
• Report within 24 hours of delivery
• Check expiry dates and packaging
• Resolution within 24-48 hours

Non-Food Items:
• Report within 48 hours of delivery
• Items must be in original condition
• Resolution within 2-3 business days

Electronics & Appliances:
• Report within 7 days of delivery
• Original packaging and accessories required
• May require manufacturer inspection`,
    },
    {
      id: "process",
      title: "Refund Process",
      icon: RefreshCw,
      content: `Step-by-step refund process:

Step 1: Report Issue
• Contact customer support via app, website, or phone
• Provide order number and issue details
• Upload photos if requested
• Describe the problem clearly

Step 2: Verification
• Our team reviews your request
• May schedule inspection for high-value items
• Quality team assessment for fresh products
• Decision communicated within specified timeframe

Step 3: Approval & Processing
• Approved refunds processed immediately
• Refund method depends on original payment
• Confirmation sent via SMS and email
• Tracking information provided

Step 4: Refund Credit
• Online payments: 3-7 business days
• Wallet refunds: Instant
• Cash on delivery: Wallet credit or bank transfer
• Credit card refunds may take longer during weekends`,
    },
    {
      id: "methods",
      title: "Refund Methods",
      icon: CreditCard,
      content: `Refund will be processed based on your original payment method:

UPI Payments:
• Refunded to original UPI ID
• Processing time: 1-3 business days
• Instant refunds during business hours
• SMS confirmation sent

Credit/Debit Cards:
• Refunded to original card
• Processing time: 3-7 business days
• May take longer on weekends/holidays
• Bank processing time varies

Net Banking:
• Refunded to original bank account
• Processing time: 2-5 business days
• Confirmation via email
• Bank statement will show credit

Digital Wallets:
• Refunded to original wallet
• Processing time: 1-2 business days
• Instant for same-platform wallets
• Notification from wallet provider

Cash on Delivery:
• Credited to BazarXpress wallet (instant)
• Bank transfer option available
• Processing time: 3-5 business days for bank transfer
• Choose preferred method during refund`,
    },
    {
      id: "partial-refunds",
      title: "Partial Refunds",
      icon: IndianRupee,
      content: `When partial refunds apply:

Mixed Order Issues:
• Only affected items refunded
• Delivery charges adjusted proportionally
• Remaining items delivered as planned
• Separate refund for each affected item

Quality Concerns:
• Percentage refund based on quality assessment
• Fresh produce may get 50-100% refund
• Packaged items typically full refund
• Case-by-case evaluation

Promotional Discounts:
• Refund amount considers applied discounts
• Coupon value may be restored to account
• Cashback adjustments if applicable
• Loyalty points recalculated

Delivery Charges:
• Free delivery threshold recalculated
• Delivery charges may be deducted from refund
• Full delivery refund for non-delivery
• Proportional refund for partial delivery`,
    },
    {
      id: "special-cases",
      title: "Special Cases",
      icon: AlertTriangle,
      content: `Special refund scenarios:

Non-Delivery:
• Full refund including delivery charges
• Processed within 24 hours
• Alternative delivery option offered
• Compensation for inconvenience

Late Delivery:
• Delivery charge refund
• Compensation credits
• Fresh items quality check
• Option to cancel with full refund

Festival/Sale Orders:
• Same refund policy applies
• May take longer due to high volume
• Priority processing for perishables
• Extended support hours during sales

Bulk Orders:
• Individual item assessment
• Proportional refund calculation
• Business customer priority
• Dedicated support team

Technical Issues:
• App/website payment failures
• Double charge reversals
• Processing within 48 hours
• Technical team investigation`,
    },
  ];

  const refundSteps = [
    {
      step: 1,
      title: "Report Issue",
      description: "Contact us within the specified timeframe",
      icon: Phone,
    },
    {
      step: 2,
      title: "Verification",
      description: "Our team reviews and verifies your request",
      icon: CheckCircle,
    },
    {
      step: 3,
      title: "Processing",
      description: "Approved refunds are processed immediately",
      icon: RefreshCw,
    },
    {
      step: 4,
      title: "Credit",
      description: "Refund credited to your original payment method",
      icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <RefreshCw className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Refund Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We want you to be completely satisfied with your purchase. Learn
            about our hassle-free refund process.
          </p>
        </div>

        {/* Quick Overview */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">
                Fast Processing
              </h3>
              <p className="text-green-700 text-sm">
                Most refunds processed within 24-48 hours
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">100% Secure</h3>
              <p className="text-green-700 text-sm">
                Safe and secure refund process
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">
                Easy Returns
              </h3>
              <p className="text-green-700 text-sm">
                Simple process with minimal hassle
              </p>
            </div>
          </div>
        </div>

        {/* Refund Process Steps */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            How Refunds Work
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {refundSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.step} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-green-600" />
                    </div>
                  
                    {index < refundSteps.length - 1 && (
                      <ArrowRight className="hidden md:block absolute top-6 -right-8 w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {refundSections.map((section) => {
            const IconComponent = section.icon;
            const isExpanded = expandedSections.includes(section.id);

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {section.title}
                    </h3>
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
            );
          })}
        </div>

        {/* Contact for Refunds */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Need Help with Refunds?
            </h2>
            <p className="text-gray-600 mb-6">
              Our customer support team is available 24/7 to help you with
              refunds and returns.
            </p>  
            <button 
              onClick={() => router.push('/contact')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center mx-auto space-x-2"
            >
              <Phone className="w-4 h-4 mr-2" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-900 mb-2">
                Important Notes
              </h3>
              <ul className="text-yellow-800 space-y-2">
                <li>
                  • Refund processing times may vary during festivals and sale
                  periods
                </li>
                <li>
                  • Bank processing times are beyond our control and may cause
                  delays
                </li>
                <li>
                  • Keep your order confirmation and delivery receipt for faster
                  processing
                </li>
                <li>
                  • Photo evidence may be required for quality-related refund
                  requests
                </li>
                <li>
                  • Refunds are processed only to the original payment method
                  used
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
