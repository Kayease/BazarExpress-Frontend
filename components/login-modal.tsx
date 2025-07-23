"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import CompleteProfileModal from "./CompleteProfileModal";
import OTPInput from "./OTPInput";
import { useAppDispatch } from '../lib/store';
import { fetchProfile, setToken } from '../lib/slices/authSlice';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState(""); // For demo, in real app, don't store OTP on frontend
  const [sessionId, setSessionId] = useState(""); // For backend session/OTP tracking
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (step === "otp" && seconds > 0) {
      const timer = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, seconds]);

  if (!isOpen) return null;

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

  // Send OTP handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      // Call backend to generate and send OTP
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      setOtp(""); // Clear OTP field when resending
      setSessionId(data.sessionId || "");
      setSeconds(30); // Start 30-second countdown
      toast.success("OTP sent successfully");
      // For demo: setServerOtp(data.otp) if you want to show OTP for testing
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) return;
    
    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      // Call backend to verify OTP
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      
      // Set the token in Redux store
      dispatch(setToken(data.token));
      
      toast.success("Login successful!");
      setStep("phone");
      setPhone("");
      setOtp("");
      setSessionId("");
      // Check if user needs to complete profile
      if (!data.user?.name || !data.user?.email) {
        setLoggedInUser(data.user);
        setShowCompleteProfile(true);
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        // Fetch and update user profile in Redux
        dispatch(fetchProfile());
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-xl p-6 w-11/12 max-w-md relative shadow-xl" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          
          <div className="mb-8 text-center">
            <img 
              src="/logo.png" 
              alt="BazarXpress" 
              className="h-14 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {step === "phone" ? "India's last minute app" : "OTP Verification"}
            </h2>
            <p className="text-gray-600">
              {step === "phone" 
                ? "Log in or Sign up" 
                : `We have sent a verification code to +91-${phone}`}
            </p>
          </div>
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-gray-800 text-lg"
                    placeholder="Enter mobile number"
                    maxLength={10}
                    required
                  />
              </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-brand-primary text-white py-4 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? "Sending..." : "Continue"}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-brand-primary hover:underline">Terms of service</a>
                {" "}& {" "}
                <a href="/privacy" className="text-brand-primary hover:underline">Privacy policy</a>
              </p>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex flex-col items-center space-y-4">
                  <OTPInput
                    value={otp}
                    onChange={async (value) => {
                    setOtp(value);
                    // Only trigger auto-submit if we have all 6 digits and not already loading
                    if (value.length === 6 && !loading) {
                      // Use the new value directly instead of relying on state
                      const verifyOtp = async () => {
                        if (loading) return;
                        
                        setLoading(true);
                        try {
                          const res = await fetch(`${API_URL}/verify-otp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone, otp: value, sessionId }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Invalid OTP");
                          
                          dispatch(setToken(data.token));
                          toast.success("Login successful!");
                          setStep("phone");
                          setPhone("");
                          setOtp("");
                          setSessionId("");
                          
                          if (!data.user?.name || !data.user?.email) {
                            setLoggedInUser(data.user);
                            setShowCompleteProfile(true);
                            if (data.token) {
                              localStorage.setItem("token", data.token);
                            }
                          } else {
                            if (data.token) {
                              localStorage.setItem("token", data.token);
                            }
                            dispatch(fetchProfile());
                            onClose();
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Invalid OTP");
                          setOtp("");  // Clear OTP on error
                        } finally {
                          setLoading(false);
                        }
                      };
                      
                      verifyOtp();
                    }
                  }}
                  disabled={loading}
                />
                </div>
                
                <div className="text-center space-y-4 mt-6">
                  <button
                    type="button"
                    className="text-brand-primary hover:text-brand-primary-dark text-sm font-medium"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend Code {seconds > 0 && `(${seconds}s)`}
                  </button>
                  
                  <div>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center justify-center w-full"
                      onClick={() => { setStep("phone"); setOtp(""); }}
                      disabled={loading}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Change phone number
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      <CompleteProfileModal
        isOpen={showCompleteProfile}
        onClose={() => { setShowCompleteProfile(false); onClose(); }}
        user={loggedInUser}
        onProfileUpdated={(updated) => {
          setShowCompleteProfile(false);
          setLoggedInUser(null);
          // Fetch and update user profile in Redux
          dispatch(fetchProfile());
          onClose();
        }}
      />
    </>
  );
}
