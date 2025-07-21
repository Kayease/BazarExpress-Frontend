"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import { API_URL } from "../../../lib/config"

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [userEmail, setUserEmail] = useState(email || "")
  
  // Auto-submit if email is provided in URL
  useEffect(() => {
    if (email && status === "idle") {
      handleUnsubscribe();
    }
  }, [email]);
  
  // Handle form submission
  const handleUnsubscribe = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!userEmail) {
      setMessage("Please enter your email address");
      setStatus("error");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setMessage("Please enter a valid email address");
      setStatus("error");
      return;
    }
    
    setIsSubmitting(true);
    setStatus("loading");
    
    try {
      const response = await fetch(`${API_URL}/newsletter/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to unsubscribe");
      }
      
      setStatus("success");
      setMessage(data.message || "You have been successfully unsubscribed from our newsletter.");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setMessage(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to unsubscribe. Please try again."
          : "Failed to unsubscribe. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-[45vh] bg-gray-50 flex flex-col items-center pt-6 sm:pt-10 md:pt-10 pb-0 sm:pb-8 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8 mx-auto">
        {status === "success" ? (
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-1 sm:mb-2">Unsubscribed Successfully</h2>
            <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">{message}</p>
            <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-800 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              Return to Homepage
            </Link>
          </div>
        ) : status === "loading" ? (
          <div className="text-center py-3 sm:py-6">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-red-500 mx-auto mb-2 sm:mb-3"></div>
            <p className="text-gray-500 text-sm sm:text-base">Processing your request...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-2 sm:mb-5">
              <div className="bg-red-100 rounded-full w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">Unsubscribe from Newsletter</h1>
              <p className="text-gray-500 text-xs sm:text-sm md:text-base px-1">
                We're sorry to see you go. Please confirm your email address below to unsubscribe.
              </p>
            </div>
            
            <form onSubmit={handleUnsubscribe} className="space-y-2 sm:space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              {status === "error" && (
                <div className="bg-red-50 border-l-4 border-red-400 p-1.5 sm:p-2 rounded text-xs sm:text-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-xs sm:text-sm text-red-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-0.5 sm:pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 sm:py-2 px-3 sm:px-4 rounded-md transition-colors flex items-center justify-center text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-1.5 sm:mr-2"></div>
                      Unsubscribing...
                    </>
                  ) : (
                    "Unsubscribe"
                  )}
                </button>
              </div>
              
              <div className="text-center mt-1.5 sm:mt-2">
                <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">
                  Cancel and return to homepage
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 