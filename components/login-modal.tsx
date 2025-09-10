"use client"

import type React from "react"
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import OTPInput from "./OTPInput";
import { useAppDispatch } from '../lib/store';
import { fetchProfile, setToken } from '../lib/slices/authSlice';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<'phone' | 'password' | 'otp'>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState(""); // For demo, in real app, don't store OTP on frontend
  const [sessionId, setSessionId] = useState(""); // For backend session/OTP tracking
  // Inline Complete Profile state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp" && seconds > 0) {
      const timer = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, seconds]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all form fields when modal opens
      setStep("phone");
      setPhone("");
      setPassword("");
      setOtp("");
      setSessionId("");
      setRequiresPassword(false);
      setUserRole(null);
      setSeconds(0);
      setLoading(false);
      setProfileName("");
      setProfileEmail("");
    }
  }, [isOpen]);

  // Auto-focus password field when step changes to password
  useEffect(() => {
    if (step === "password" && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

  // Complete profile submit
  const handleCompleteProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profileName || !profileEmail) {
      toast.error("Name and email are required");
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update profile");
      toast.success("Profile updated");
      // Refresh profile in store and close modal
      dispatch(fetchProfile());
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close with form reset
  const handleClose = () => {
    // Reset all form fields when closing
    setStep("phone");
    setPhone("");
    setPassword("");
    setOtp("");
    setSessionId("");
    setRequiresPassword(false);
    setUserRole(null);
    setSeconds(0);
    setLoading(false);
    onClose();
  };

  // Send OTP handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      // Call backend to check if user requires password and send OTP
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setSessionId(data.sessionId || "");
      setRequiresPassword(data.requiresPassword || false);
      setUserRole(data.userRole);
      
      if (data.requiresPassword) {
        // User needs to enter password first - no OTP sent yet
        setStep("password");
        toast.success("Please enter your password to continue");
      } else {
        // Regular user - proceed directly to OTP
        setStep("otp");
        setOtp(""); // Clear OTP field when resending
        setSeconds(30); // Start 30-second countdown
        toast.success("OTP sent successfully");
      }
      // For demo: setServerOtp(data.otp) if you want to show OTP for testing
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Password verification handler
  const handleVerifyPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!password || password.length < 6) {
      toast.error("Please enter a valid password (minimum 6 characters)");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid password");
      
      // Password verified, OTP sent
      setSessionId(data.sessionId);
      setStep("otp");
      setOtp("");
      setSeconds(30);
      toast.success("OTP sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Invalid password");
      setPassword(""); // Clear password field on error
      // Focus the password field after clearing
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
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
      if (!res.ok) throw new Error(data.message || data.error || "Invalid OTP");
      
      // Set the token in Redux store
      dispatch(setToken(data.token));
      
      toast.success("Login successful!");
      setStep("phone");
      setPhone("");
      setPassword("");
      setOtp("");
      setSessionId("");
      setRequiresPassword(false);
      setUserRole(null);
      // Check if user needs to complete profile
      if (!data.user?.name || !data.user?.email) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        // Prefill fields and show inline complete profile step
        setProfileName(data.user?.name || "");
        setProfileEmail(data.user?.email || "");
        setStep("completeProfile" as any);
      } else {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        // Fetch and update user profile in Redux
        dispatch(fetchProfile());
        handleClose();
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
        className="fixed inset-0 flex items-center justify-center bg-black/20 z-[999] p-4"
      >
        <div 
          className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md relative shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 z-10"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          
          <div className="mb-6 sm:mb-8 text-center">
            <Image 
              src="/logo.svg" 
              alt="BazarXpress" 
              width={64}
              height={64}
              style={{ height: 'auto' }}
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20"
            />
            {step === "phone" ? (
              <div className="flex justify-center mb-2">
                <Image
                  src="/need_click_express.png"
                  alt="Need Click Express"
                  width={260}
                  height={48}
                  style={{ height: 'auto' }}
                  className="w-56 sm:w-64 h-auto"
                  priority
                />
              </div>
            ) : (
              <h2 
                className="text-xl sm:text-2xl font-bold text-gray-800 mb-2"
              >
                {step === "password" ? "Enter Password" : "OTP Verification"}
              </h2>
            )}
            <p className="text-sm sm:text-base text-gray-600 px-2">
              {step === "phone" 
                ? "Log in or Sign up" 
                : step === "password"
                ? `Enter your password for ${phone}`
                : `We have sent a verification code}`}
            </p>
          </div>
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm sm:text-base">+91</span>
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-gray-800 text-base sm:text-lg"
                        placeholder="Enter mobile number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="w-full bg-brand-primary text-white py-3 sm:py-4 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? "Sending..." : "Continue"}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-4 px-2">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="text-brand-primary hover:underline">Terms of service</a>
                    {" "}& {" "}
                    <a href="/privacy" className="text-brand-primary hover:underline">Privacy policy</a>
                  </p>
                </form>
              )}
              {step === "password" && (
                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div>
                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-gray-800 text-base sm:text-lg"
                      placeholder="Enter your password"
                      minLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || password.length < 6}
                    className="w-full bg-brand-primary text-white py-3 sm:py-4 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? "Verifying..." : "Verify Password"}
                  </button>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center justify-center w-full"
                      onClick={() => { 
                        setStep("phone"); 
                        setPassword(""); 
                        setRequiresPassword(false);
                        setUserRole(null);
                      }}
                      disabled={loading}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Change phone number
                    </button>
                  </div>
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
                        if (value.length === 6 && !loading) {
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
                              if (!res.ok) throw new Error(data.message || data.error || "Invalid OTP");
                              dispatch(setToken(data.token));
                              toast.success("Login successful!");
                              setStep("phone");
                              setPhone("");
                              setPassword("");
                              setOtp("");
                              setSessionId("");
                              setRequiresPassword(false);
                              setUserRole(null);
                              if (!data.user?.name || !data.user?.email) {
                                if (data.token) {
                                  localStorage.setItem("token", data.token);
                                }
                                setProfileName(data.user?.name || "");
                                setProfileEmail(data.user?.email || "");
                                setStep("completeProfile" as any);
                              } else {
                                if (data.token) {
                                  localStorage.setItem("token", data.token);
                                }
                                dispatch(fetchProfile());
                                handleClose();
                              }
                            } catch (err: any) {
                              toast.error(err.message || "Invalid OTP");
                              setOtp("");
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
                        onClick={requiresPassword ? handleVerifyPassword : handleSendOtp}
                        disabled={loading || seconds > 0}
                      >
                        {`Resend ${requiresPassword ? 'Verification code' : 'Code'} ${seconds > 0 ? `(${seconds}s)` : ''}`}
                      </button>
                      <div>
                        <button
                          type="button"
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center justify-center w-full"
                          onClick={() => { 
                            setStep("phone"); 
                            setOtp(""); 
                            setPassword("");
                            setRequiresPassword(false);
                            setUserRole(null);
                          }}
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {step === ("completeProfile" as any) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-[999] p-4">
            <motion.div
              key="complete-profile"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md relative shadow-xl max-h-[90vh] overflow-y-auto"
            >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 z-10"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
              <p className="text-sm sm:text-base text-gray-600 px-2">Please provide your details to continue</p>
            </div>
            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-gray-800 text-base sm:text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-gray-800 text-base sm:text-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-3 sm:py-4 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}