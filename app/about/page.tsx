"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Zap,
  Users,
  Globe,
  Award,
  Heart,
  Truck,
  Shield,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Target,
  Lightbulb,
  TrendingUp,
  User,
  Sparkles,
  Rocket,
  TrendingDown,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

// Custom hook for intersection observer
const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return [ref, isIntersecting] as const;
};

// Animated Counter Component
interface AnimatedCounterProps {
  end: string;
  duration?: number;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ 
    threshold: 0.3,
    rootMargin: '50px'
  });

  useEffect(() => {
    let animationId: number | null = null;
    let startTime: number | null = null;
    let targetNumber = parseFloat(end.replace(/[^\d.]/g, "")) || 0;

    if (isIntersecting) {
      setIsAnimating(true);
      setCount(0);
      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOutCubic * targetNumber);
        setCount(currentCount);
        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setCount(targetNumber);
          setIsAnimating(false);
        }
      };
      animationId = requestAnimationFrame(animate);
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isIntersecting, end, duration]);

  const formatNumber = (num: number): string => {
    if (end.includes("M+")) return `${num}M+`;
    if (end.includes("K+")) return `${num}K+`;
    if (end.includes("+")) return `${num}+`;
    if (end.includes("%")) return `${num}%`;
    return `${num}${suffix}`;
  };

  return (
    <div ref={ref} className="relative">
      <div
        className={`text-3xl md:text-4xl font-bold mb-2 transition-all duration-500 ${
          isAnimating
            ? "text-green-600"
            : "text-gray-900 hover:text-green-600"
        } hover:scale-105 transform`}
      >
        <span
          className={`inline-block ${
            isAnimating
              ? "animate-number-pop"
              : ""
          }`}
        >
          {formatNumber(count)}
        </span>
      </div>

      {/* Sparkle effects during animation */}
      {isAnimating && (
        <>
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-ping animation-delay-300"></div>
          <div className="absolute top-1/2 -right-4 w-1 h-1 bg-green-400 rounded-full animate-ping animation-delay-600"></div>
        </>
      )}
    </div>
  );
};

// Animated Section Component
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = "",
  delay = 0,
}) => {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: isIntersecting ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

// Type definitions
interface StatItem {
  number: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
}

interface ValueItem {
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  title: string;
  description: string;
  color: string;
}

interface MilestoneItem {
  year: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

interface FeatureItem {
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  title: string;
  description: string;
}

export default function AboutPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mission" | "vision" | "values">(
    "mission"
  );
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactClick = () => {
    router.push("/contact");
  };

  const handleDownloadClick = () => {
    try {
      // Add your app download logic here
      window.open("https://play.google.com/store", "_blank");
    } catch (error) {
      console.error("Error opening app store:", error);
      // Fallback or error handling
    }
  };

  const stats: StatItem[] = [
    { number: "10M+", label: "Happy Customers", icon: Users },
    { number: "500K+", label: "Products Available", icon: Globe },
    { number: "50+", label: "Cities Covered", icon: Target },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
  ];

  const values: ValueItem[] = [
    {
      icon: Zap,
      title: "Speed & Efficiency",
      description:
        "Lightning-fast delivery in minutes, not hours. We understand that time is precious.",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Every decision we make puts our customers at the center. Your satisfaction is our success.",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description:
        "Secure transactions, quality products, and reliable service you can count on.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "Constantly evolving with cutting-edge technology to serve you better.",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const team: TeamMember[] = [
    {
      name: "Rajesh Kumar",
      role: "CEO & Founder",
      image: "/api/placeholder/300/300",
      description:
        "Visionary leader with 15+ years in e-commerce and technology innovation.",
    },
    {
      name: "Priya Sharma",
      role: "CTO",
      image: "/api/placeholder/300/300",
      description:
        "Tech expert driving our platform's scalability and performance excellence.",
    },
    {
      name: "Amit Patel",
      role: "Head of Operations",
      image: "/api/placeholder/300/300",
      description:
        "Operations mastermind ensuring seamless delivery across all cities.",
    },
    {
      name: "Sneha Gupta",
      role: "Head of Customer Experience",
      image: "/api/placeholder/300/300",
      description:
        "Customer advocate focused on creating delightful shopping experiences.",
    },
  ];

  const features: FeatureItem[] = [
    {
      icon: Clock,
      title: "10-Minute Delivery",
      description: "Ultra-fast delivery for your everyday essentials",
    },
    {
      icon: Shield,
      title: "Quality Assured",
      description: "Rigorous quality checks on every product",
    },
    {
      icon: Truck,
      title: "Wide Coverage",
      description: "Serving 50+ cities across India",
    },
    {
      icon: Star,
      title: "24/7 Support",
      description: "Round-the-clock customer assistance",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <main role="main">
        {/* Floating Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute w-2 h-2 bg-green-400 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${mousePosition.x * 0.01}%`,
              top: `${mousePosition.y * 0.01}%`,
              transition: "all 0.3s ease-out",
            }}
          />
          <div
            className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-40 animate-bounce"
            style={{
              left: `${100 - mousePosition.x * 0.02}%`,
              top: `${100 - mousePosition.y * 0.02}%`,
              transition: "all 0.5s ease-out",
            }}
          />
        </div>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-yellow-300/20 rounded-full animate-ping"></div>
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-blue-300/20 rounded-full animate-pulse"></div>

          {/* Floating Icons */}
          <div className="absolute top-20 left-10 animate-float">
            <Sparkles className="w-8 h-8 text-yellow-300 opacity-60" />
          </div>
          <div className="absolute top-40 right-20 animate-float-delayed">
            <Rocket className="w-6 h-6 text-blue-300 opacity-60" />
          </div>
          <div className="absolute bottom-20 left-1/3 animate-float">
            <Zap className="w-7 h-7 text-yellow-400 opacity-50" />
          </div>

          <AnimatedSection className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="inline-block">
                  Revolutionizing
                </span>
                <span className="block text-yellow-300">
                  Quick Commerce
                </span>
              </h1>
            </div>

            <div className="animate-fade-in-up">
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
                We're not just delivering products – we're delivering
                convenience, speed, and reliability to millions of customers
                across India.
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Enhanced Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-blue-50/30 to-purple-50/50"></div>
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-green-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>

          <AnimatedSection className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Our <span className="text-green-600">Impact</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Numbers that tell our story of growth, trust, and excellence
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <AnimatedSection
                    key={index}
                    delay={index * 150}
                    className="text-center group cursor-pointer"
                  >
                    <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 hover:border-green-200">
                      {/* Icon Container */}
                      <div className="relative mb-6">
                        <div className="bg-gradient-to-br from-green-100 to-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-xl relative overflow-hidden">
                          <IconComponent className="w-10 h-10 text-green-600 group-hover:animate-bounce z-10" />
                          {/* Animated background effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                        </div>
                        {/* Floating indicator */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-green-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                      </div>

                      {/* Counter */}
                      <div className="mb-4">
                        <AnimatedCounter end={stat.number} duration={2500} />
                      </div>

                      {/* Label */}
                      <div className="text-gray-600 font-semibold group-hover:text-green-600 transition-colors duration-300 text-sm md:text-base">
                        {stat.label}
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>

            {/* Additional decorative elements */}
            <div className="flex justify-center mt-12">
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Mission, Vision, Values Tabs */}
        <section className="py-16 bg-gray-50 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent"></div>
          <AnimatedSection className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
                What Drives Us
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                Our core principles that guide every decision and innovation
              </p>
            </div>

            {/* Creative Circular Tab Navigation */}
            <AnimatedSection delay={400} className="flex justify-center mb-12">
              <div className="relative">
                {/* Background glow effect */}
                {/* <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div> */}
                
                {/* Main container */}
                <div className="relative bg-white/90 backdrop-blur-md rounded-full p-3 shadow-2xl border border-gray-200/50">
                  <div className="flex items-center space-x-2 gap-8 px-10">
                    {(
                      [
                        { id: "mission", label: "Mission", icon: Target, color: "from-green-500 to-green-600", bgColor: "bg-green-50", textColor: "text-green-600" },
                        { id: "vision", label: "Vision", icon: Globe, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", textColor: "text-blue-600" },
                        { id: "values", label: "Values", icon: Heart, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-50", textColor: "text-purple-600" },
                      ] as const
                    ).map((tab, index) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      
                      return (
                        <div key={tab.id} className="relative group">                          
                          {/* Tab button */}
                          <button
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={isActive}
                            aria-label={`View ${tab.label} section`}
                            className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-500 transform hover:scale-110 ${
                              isActive
                                ? "bg-gradient-to-br " + tab.color + " text-white shadow-xl scale-105"
                                : "bg-gray-50 hover:" + tab.bgColor + " " + tab.textColor + " hover:shadow-lg"
                            } group-hover:z-10`}
                          >
                            {/* Icon container */}
                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                              isActive 
                                ? "bg-white/20" 
                                : "bg-white group-hover:bg-white/80"
                            }`}>
                              <IconComponent 
                                size={24} 
                                className={`transition-all duration-300 ${
                                  isActive 
                                    ? "text-white " 
                                    : tab.textColor + " group-hover:scale-110"
                                }`} 
                              />
                              
                              {/* Floating sparkles for active tab */}
                              {isActive && (
                                <>
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping animation-delay-300"></div>
                                </>
                              )}
                            </div>
                            
                            {/* Label */}
                            <span className={`text-sm font-semibold transition-all duration-300 ${
                              isActive 
                                ? "text-white" 
                                : "text-gray-700 group-hover:" + tab.textColor
                            }`}>
                              {tab.label}
                            </span>
                            
                            {/* Hover glow effect */}
                            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-br ${tab.color} blur-md`}></div>
                          </button>
                          
                          {/* Connection line to next tab */}
                          {index < 2 && (
                            <div className="absolute top-1/2 -right-1 w-2 h-0.5 bg-gradient-to-r from-gray-300 to-transparent transform -translate-y-1/2 z-0"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
                
                {/* Floating decorative elements */}
                <div className="absolute -top-4 -left-4 w-3 h-3 bg-green-400 rounded-full animate-bounce opacity-60"></div>
                <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-500 opacity-60"></div>
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping animation-delay-1000 opacity-60"></div>
              </div>
            </AnimatedSection>

            {/* Tab Content */}
            <AnimatedSection
              delay={600}
              className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 backdrop-blur-sm"
            >
              {activeTab === "mission" && (
                <div className="text-center animate-fade-in-up">
                  <div className="relative inline-block mb-6">
                    <Target className="w-16 h-16 text-green-600 mx-auto animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 animate-slide-in-left">
                    Our Mission
                  </h3>
                  <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                    To revolutionize the way India shops by providing instant
                    access to everyday essentials through cutting-edge
                    technology, exceptional service, and an unwavering
                    commitment to customer satisfaction. We believe that
                    convenience should never come at the cost of quality.
                  </p>
                </div>
              )}

              {activeTab === "vision" && (
                <div className="text-center animate-fade-in-up">
                  <div className="relative inline-block mb-6">
                    <Globe className="w-16 h-16 text-green-600 mx-auto animate-spin-slow" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 animate-slide-in-right">
                    Our Vision
                  </h3>
                  <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                    To become the world's most trusted and efficient quick
                    commerce platform, setting new standards for speed,
                    reliability, and customer experience. We envision a future
                    where getting what you need, when you need it, is as simple
                    as a tap on your phone.
                  </p>
                </div>
              )}

              {activeTab === "values" && (
                <div className="animate-fade-in-up">
                  <h3 className="text-3xl font-bold text-gray-900 text-center mb-12 animate-slide-in-up">
                    Our Values
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {values.map((value, index) => {
                      const IconComponent = value.icon;
                      return (
                        <div
                          key={index}
                          className="flex space-x-4 group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                          style={{ animationDelay: `${index * 150}ms` }}
                        >
                          <div
                            className={`w-12 h-12 ${value.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg`}
                          >
                            <IconComponent className="w-6 h-6 group-hover:animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                              {value.title}
                            </h4>
                            <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                              {value.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </AnimatedSection>
          </AnimatedSection>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-blue-50/50"></div>
          <AnimatedSection className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
                Why Choose BazarXpress?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                Experience the difference with our unique features and services
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <AnimatedSection
                    key={index}
                    delay={index * 150}
                    className="group bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-gray-100 hover:border-green-300 relative overflow-hidden"
                  >
                    {/* Background Animation */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                      <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                        <IconComponent className="w-8 h-8 text-green-600 group-hover:animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover Decoration */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300"></div>
                  </AnimatedSection>
                );
              })}
            </div>
          </AnimatedSection>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30"></div>
          <AnimatedSection className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
                Meet Our Leadership
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                The visionaries and innovators driving BazarXpress forward
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <AnimatedSection
                  key={index}
                  delay={index * 200}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-gray-100 hover:border-purple-300"
                >
                  <div
                    className="aspect-square bg-gray-200 relative overflow-hidden"
                    role="img"
                    aria-label={`${member.name} - ${member.role}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center group-hover:from-purple-400 group-hover:to-purple-600 transition-all duration-500">
                      <User className="w-20 h-20 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Floating Elements */}
                    <div
                      className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300"
                      aria-hidden="true"
                    ></div>
                    <div
                      className="absolute bottom-4 left-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500"
                      aria-hidden="true"
                    ></div>
                  </div>
                  <div className="p-6 relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-green-600 font-medium mb-3 group-hover:text-purple-500 transition-colors duration-300">
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
                      {member.description}
                    </p>

                    {/* Hover Decoration */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-all duration-300"></div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 -translate-x-32 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 translate-x-48 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-yellow-300/20 rounded-full animate-ping"></div>

          {/* Floating Icons */}
          <div className="absolute top-10 left-10 animate-float">
            <Sparkles className="w-6 h-6 text-yellow-300 opacity-60" />
          </div>
          <div className="absolute top-20 right-20 animate-float-delayed">
            <Star className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
          <div className="absolute bottom-10 left-1/4 animate-float">
            <Heart className="w-7 h-7 text-pink-300 opacity-60" />
          </div>

          <AnimatedSection className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Ready to Experience the
                <span className="block text-yellow-300 animate-pulse">
                  Future of Shopping?
                </span>
              </h2>
            </div>

            <div className="animate-fade-in-up animation-delay-300">
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
                Join millions of satisfied customers who trust BazarXpress for
                their daily needs. Experience lightning-fast delivery and
                premium quality.
              </p>
            </div>
          </AnimatedSection>
        </section>
      </main>
    </div>
  );
}
