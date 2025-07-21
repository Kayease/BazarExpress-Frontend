import {
  Smartphone,
  Download,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Scale,
  HelpCircle,
  Truck,
  RefreshCw,
  Cookie,
  AlertTriangle,
  Star,
  Award,
  Users,
  Zap,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../lib/config";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use API_URL from config
      const response = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "footer" }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }
      
      toast.success(data.message || "Thank you for subscribing to our newsletter!");
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to subscribe. Please try again."
          : "Failed to subscribe. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLinks = [
    { name: "Blog", href: "/blog", icon: HelpCircle },
    { name: "FAQs", href: "/faq", icon: HelpCircle },
    { name: "About Us", href: "/about", icon: Users },
    { name: "Customer Support", href: "/contact", icon: Phone }
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield },
    { name: "Terms & Conditions", href: "/terms", icon: Scale },
    { name: "Refund Policy", href: "/refund-policy", icon: RefreshCw },
    { name: "Shipping Policy", href: "/shipping-policy", icon: Truck },
    { name: "Cookie Policy", href: "/cookie-policy", icon: Cookie },
    { name: "Disclaimer", href: "/disclaimer", icon: AlertTriangle },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/bazarxpress",
      icon: Facebook,
    },
    { name: "Twitter", href: "https://twitter.com/bazarxpress", icon: Twitter },
    {
      name: "Instagram",
      href: "https://instagram.com/bazarxpress",
      icon: Instagram,
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/bazarxpress",
      icon: Linkedin,
    },
    { name: "YouTube", href: "https://youtube.com/bazarxpress", icon: Youtube },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-5 col-span-1 sm:col-span-2">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo-footer.png"
                  alt="BazarXpress"
                  width={100}
                  height={50}
                  className="mr-2"
                />
              </Link>
            </div>

            <p className="text-gray-300 text-sm mb-6 max-w-md leading-relaxed">
              India's fastest delivery app. Get groceries, medicines,
              electronics, and daily essentials delivered to your doorstep in
              just 8-12 minutes. Available 24/7 in 50+ cities.
            </p>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-300 text-sm">
                <MapPin size={16} className="text-green-400 flex-shrink-0" />
                <span>New Delhi, India - 110001</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 text-sm">
                <Phone size={16} className="text-green-400 flex-shrink-0" />
                <span>1800-BAZARX (24/7 Support)</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 text-sm">
                <Mail size={16} className="text-green-400 flex-shrink-0" />
                <span>support@bazarxpress.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 text-sm">
                <Clock size={16} className="text-green-400 flex-shrink-0" />
                <span>Available 24/7, 365 days</span>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="lg:col-span-2 col-span-1">
            <h4 className="font-semibold text-white mb-4 text-lg">
              Useful Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center space-x-2 text-gray-300 text-sm hover:text-green-400 transition-colors duration-200 group"
                    >
                      <IconComponent
                        size={16}
                        className="group-hover:text-green-400 transition-colors"
                      />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-3 col-span-1">
            {/* Desktop Title */}
            <h4 className="font-semibold text-white mb-4 text-lg">Legal</h4>
            
            {/* All Legal Links - Visible on all screens */}
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
              {legalLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center space-x-2 text-gray-300 text-sm hover:text-green-400 transition-colors duration-200 group"
                  >
                    <IconComponent
                      size={16}
                      className="group-hover:text-green-400 transition-colors"
                    />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Social Media & Newsletter */}
          <div className="lg:col-span-2 col-span-1">
            <h4 className="font-semibold text-white mb-4 text-lg">Follow Us</h4>
            <div className="flex flex-nowrap items-center gap-2 mb-6">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    title={social.name}
                  >
                    <IconComponent
                      size={16}
                      className="text-gray-300 group-hover:text-white transition-colors"
                    />
                  </a>
                );
              })}
            </div>

            {/* Newsletter Signup - Visible on all screens */}
            <div className="space-y-3">
              <h5 className="font-medium text-white">Stay Updated</h5>
              <form onSubmit={handleNewsletterSubmit} className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white text-sm focus:outline-none focus:border-green-400 transition-colors"
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-r-lg transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2024 BazarXpress Technologies Pvt. Ltd. All rights reserved.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Shield size={14} className="text-green-400" />
                <span>Secure & Safe</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Award size={14} className="text-green-400" />
                <span>Quality Assured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
