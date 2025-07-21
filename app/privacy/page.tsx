"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Eye,
  Lock,
  Database,
  UserCheck,
  Settings,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Globe,
  Smartphone,
  CreditCard,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
} from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"policy" | "rights" | "settings">(
    "policy"
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const privacySections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: Database,
      content: `We collect several types of information to provide and improve our services:

Personal Information:
• Name, email address, phone number
• Delivery addresses and location data
• Date of birth and demographic information
• Profile pictures and preferences

Transaction Information:
• Purchase history and order details
• Payment information (processed securely by third-party providers)
• Refund and return requests
• Customer service interactions

Technical Information:
• Device information (model, operating system, unique identifiers)
• IP address and location data
• App usage patterns and preferences
• Cookies and similar tracking technologies
• Log files and crash reports

We only collect information that is necessary to provide our services and improve your experience.`,
    },
    {
      id: "information-use",
      title: "How We Use Your Information",
      icon: Settings,
      content: `We use your information for the following purposes:

Service Delivery:
• Process and fulfill your orders
• Provide customer support and resolve issues
• Send order confirmations and delivery updates
• Manage your account and preferences

Personalization:
• Recommend products based on your preferences
• Customize your shopping experience
• Show relevant offers and promotions
• Improve our product recommendations

Business Operations:
• Analyze usage patterns to improve our services
• Conduct research and analytics
• Prevent fraud and ensure security
• Comply with legal obligations
• Communicate important updates about our services

We never sell your personal information to third parties for their marketing purposes.`,
    },
    {
      id: "information-sharing",
      title: "Information Sharing and Disclosure",
      icon: Globe,
      content: `We may share your information in the following circumstances:

Service Providers:
• Delivery partners for order fulfillment
• Payment processors for transaction processing
• Cloud storage providers for data hosting
• Analytics providers for service improvement
• Customer service platforms

Legal Requirements:
• When required by law or legal process
• To protect our rights and property
• To prevent fraud or security threats
• In connection with business transfers or mergers

With Your Consent:
• When you explicitly agree to share information
• For marketing partnerships (opt-in only)
• For social media integrations

We ensure all third parties maintain appropriate security measures and use your information only for specified purposes.`,
    },
    {
      id: "data-security",
      title: "Data Security and Protection",
      icon: Shield,
      content: `We implement comprehensive security measures to protect your information:

Technical Safeguards:
• 256-bit SSL encryption for data transmission
• Advanced encryption for data storage
• Regular security audits and penetration testing
• Multi-factor authentication for admin access
• Secure API endpoints and data validation

Operational Safeguards:
• Employee training on data protection
• Limited access to personal information
• Regular security awareness programs
• Incident response procedures
• Data backup and recovery systems

Physical Safeguards:
• Secure data centers with restricted access
• Environmental controls and monitoring
• Redundant systems and failover protection

While we strive to protect your information, no method of transmission over the internet is 100% secure. We continuously update our security practices to address emerging threats.`,
    },
    {
      id: "data-retention",
      title: "Data Retention and Deletion",
      icon: Calendar,
      content: `We retain your information only as long as necessary:

Account Information:
• Retained while your account is active
• Deleted within 30 days of account closure (unless legally required)
• Some information may be retained for legal compliance

Transaction Data:
• Order history retained for 7 years for tax and legal purposes
• Payment information deleted after transaction completion
• Delivery information retained for 1 year for customer service

Technical Data:
• Log files retained for 90 days
• Analytics data aggregated and anonymized after 2 years
• Crash reports deleted after issue resolution

You can request deletion of your data at any time, subject to legal requirements. We will confirm deletion within 30 days of your request.`,
    },
    {
      id: "cookies-tracking",
      title: "Cookies and Tracking Technologies",
      icon: Eye,
      content: `We use cookies and similar technologies to enhance your experience:

Essential Cookies:
• Required for basic website functionality
• Remember your login status and preferences
• Maintain your shopping cart contents
• Enable secure transactions

Analytics Cookies:
• Track website usage and performance
• Understand user behavior and preferences
• Improve our services and user experience
• Generate aggregated usage statistics

Marketing Cookies:
• Show relevant advertisements
• Track campaign effectiveness
• Personalize marketing messages
• Prevent duplicate ad displays

You can control cookie settings through your browser preferences. Disabling certain cookies may affect website functionality.`,
    },
    {
      id: "third-party",
      title: "Third-Party Services and Links",
      icon: ExternalLink,
      content: `Our service may contain links to third-party websites and integrate with external services:

Payment Processors:
• We use trusted payment gateways (Razorpay, Paytm, etc.)
• They have their own privacy policies
• We don't store complete payment card information

Social Media:
• Optional integration with social platforms
• Governed by their respective privacy policies
• You control what information is shared

Analytics Services:
• Google Analytics for website performance
• Firebase for app analytics and crash reporting
• Data is anonymized and aggregated

We are not responsible for the privacy practices of third-party services. Please review their privacy policies before using their services.`,
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      icon: Globe,
      content: `Your information may be transferred and processed in countries other than India:

Data Processing Locations:
• Primary data storage in India
• Backup systems may be located internationally
• Cloud services may process data globally
• Customer support may be provided from multiple locations

Safeguards:
• We ensure adequate protection for international transfers
• Use of standard contractual clauses
• Compliance with applicable data protection laws
• Regular assessment of transfer mechanisms

We will notify you of any significant changes to our data transfer practices and ensure appropriate safeguards are in place.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information.
          </p>
        </div>

        {/* Privacy Policy Tab (only this section is kept) */}
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              BazarXpress Technologies Private Limited ("we," "our," or "us")
              is committed to protecting your privacy and personal
              information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              platform.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By using our services, you agree to the collection and use of
              information in accordance with this policy. We will not use or
              share your information with anyone except as described in this
              Privacy Policy.
            </p>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-6">
            {privacySections.map((section) => {
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
        </div>

        {/* Contact Information (Support Button) */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Questions About Privacy?
            </h2>
            <p className="text-gray-600 mb-6">
              Our privacy team is here to help you understand how we protect
              your information and exercise your rights.
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
      </div>
    </div>
  );
}
