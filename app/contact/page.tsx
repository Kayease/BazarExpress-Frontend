"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Headphones,
  Globe,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general", // Default category
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");

  // Update formData when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Make sure category is included in the form data
    const submissionData = {
      ...formData,
      category: selectedCategory, // Ensure we're using the latest selected category
      categoryLabel: supportCategories.find(c => c.id === selectedCategory)?.label || "General Inquiry"
    };

    console.log("Form submission data:", submissionData);

    try {
      // Get the API URL from environment variables or use a default
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bazarxpress.com";
      
      // Actual API call
      const response = await fetch(`${API_URL}/contacts/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData), // Send the enhanced data
      });

      // Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Show success message
      toast.success(
        data.message || "Thank you for your message! We'll get back to you soon."
      );
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
      });
      setSelectedCategory("general");
      
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Show error message
      toast.error(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
              "Failed to send message. Please try again."
          : "Failed to send message. Please try again."
      );
      
      // For development/testing purposes - show success even if backend fails
      // Remove this in production
      if (process.env.NODE_ENV === "development") {
        toast.success("Development mode: Message would be sent in production");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallNow = () => {
    // In a real app, this could use tel: protocol
    toast.success("Calling 1800-123-BAZAR...");
    // window.location.href = "tel:18001232297";
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our customer service team",
      contact: "1800-123-BAZAR (24/7)",
      color: "bg-blue-100 text-blue-600",
      gradient: "from-blue-500 to-blue-600",
      action: () => {
        window.location.href = "tel:18001232297"; // Using tel: protocol to initiate a call
      }
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 2 hours",
      contact: "support@bazarxpress.com",
      color: "bg-green-100 text-green-600",
      gradient: "from-green-500 to-green-600",
      action: () => {
        window.location.href = "mailto:support@bazarxpress.com";
      }
    },
    {
      icon: MapPin,
      title: "Office Address",
      description: "Visit our headquarters",
      contact: "BazarXpress Technologies, Connaught Place, New Delhi, India",
      color: "bg-orange-100 text-orange-600",
      gradient: "from-orange-500 to-orange-600",
      action: () => {
        window.open("https://maps.google.com/?q=Connaught+Place,+New+Delhi,+India", "_blank");
      }
    },
  ];

  const supportCategories = [
    { id: "general", label: "General Inquiry", icon: MessageCircle },
    { id: "order", label: "Order Support", icon: CheckCircle },
    { id: "technical", label: "Technical Issue", icon: Zap },
    { id: "feedback", label: "Feedback", icon: Heart },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      message:
        "Amazing customer service! They resolved my issue within minutes.",
      rating: 5,
      location: "Mumbai",
    },
    {
      name: "Rajesh Kumar",
      message: "The support team is incredibly helpful and professional.",
      rating: 5,
      location: "Delhi",
    },
    {
      name: "Anita Patel",
      message: "Quick response and effective solutions. Highly recommended!",
      rating: 5,
      location: "Bangalore",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Get in
            <span className="text-yellow-300"> Touch</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            We're here to help you 24/7. Reach out to us through any channel and
            experience our world-class customer support.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={index}
                  onClick={method.action}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 md:p-6 text-center hover:shadow-xl transition group cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r ${method.gradient} rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 md:mb-3">
                    {method.description}
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {method.contact}
                  </p>
                  <div className="mt-3 md:mt-4">
                    <button className="text-green-600 hover:text-green-700 font-medium flex items-center justify-center space-x-1 mx-auto group-hover:translate-x-1 transition-transform">
                      <span>Contact Now</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 mb-6 md:mb-8">
                We'll get back to you within 2 hours
              </p>

              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What can we help you with?
                </label>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {supportCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryChange(category.id)}
                        className={`p-2 md:p-3 rounded-lg border-2 transition flex items-center space-x-2 ${
                          selectedCategory === category.id
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <IconComponent size={16} />
                        <span className="text-xs md:text-sm font-medium">
                          {category.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Selected category: <span className="font-medium text-green-600">{supportCategories.find(c => c.id === selectedCategory)?.label}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Hidden input for category */}
                <input 
                  type="hidden" 
                  name="category" 
                  value={selectedCategory} 
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                    placeholder="Please provide details about your inquiry..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 md:py-4 rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 md:space-y-6">
              {/* Business Hours */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-5 md:p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-600 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    Business Hours
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Customer Support
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      24/7
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Delivery Service
                    </span>
                    <span className="text-gray-900 font-semibold">
                      6:00 AM - 2:00 AM
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Office Hours
                    </span>
                    <span className="text-gray-900 font-semibold">
                      9:00 AM - 6:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-5 md:p-6 border border-purple-200">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  <span>Quick Help</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Frequently Asked Questions", href: "/faq" },
                    { label: "Disclaimer", href: "/disclaimer" },
                    { label: "Return & Refund Policy", href: "/refund-policy" },
                    { label: "Terms & Conditions", href: "/terms" },
                    { label: "Privacy Policy", href: "/privacy" },
                  ].map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="flex items-center text-purple-700 hover:text-purple-800 font-medium space-x-2 group"
                    >
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-5 md:p-6 border border-red-200">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                  <span>Emergency Support</span>
                </h3>
                <p className="text-gray-700 mb-3">
                  For urgent issues with your orders or account
                </p>
                <div 
                  className="bg-white rounded-lg p-4 border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => window.location.href = "tel:18001238743"}
                >
                  <p className="text-red-600 font-bold text-lg">
                    1800-123-URGENT
                  </p>
                  <p className="text-gray-600 text-sm">
                    Available 24/7 for critical issues
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Real feedback from real customers about our support experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-5 md:p-6 border border-gray-200"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic text-sm md:text-base">
                  "{testimonial.message}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Still Have Questions?</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90">
            Our support team is standing by to help you with anything you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/faq')}
              className="border-2 border-white text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold hover:bg-white hover:text-green-600 transition"
            >
              Browse FAQ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
