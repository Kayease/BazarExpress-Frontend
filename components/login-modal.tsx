"use client"

import type React from "react"

import { useState, useRef } from "react";
import { X } from "lucide-react";
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
  const dispatch = useAppDispatch();

  if (!isOpen) return null;

  // For testing, use full backend URL (remember to revert to relative URLs for production)
  const API_URL = "http://localhost:4000/api/auth";

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
      toast.success("OTP sent to your phone");
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
        <div className="bg-surface-primary rounded-lg p-6 w-11/12 max-w-md relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In</h2>
            <p className="text-text-secondary">Sign in with your phone number</p>
          </div>
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                  placeholder="Enter your 10-digit phone number"
                  maxLength={10}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-inverse py-2 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Enter 6-digit OTP
                </label>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-inverse py-2 rounded-lg hover:bg-brand-primary-dark transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button
                type="button"
                className="w-full mt-2 text-brand-primary hover:underline text-sm"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                type="button"
                className="w-full mt-2 text-brand-primary hover:underline text-sm"
                onClick={() => { setStep("phone"); setOtp(""); }}
                disabled={loading}
              >
                Change phone number
              </button>
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
