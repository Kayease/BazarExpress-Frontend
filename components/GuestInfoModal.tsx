"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Gift, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface GuestInfo {
  phone: string;
}

interface GuestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInfoSubmit: (info: GuestInfo) => void;
}

export default function GuestInfoModal({ isOpen, onClose, onInfoSubmit }: GuestInfoModalProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhone = (): boolean => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    } else if (phone.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) return;

    setIsSubmitting(true);
    
    try {
      // Store in localStorage
      localStorage.setItem('guest_info', JSON.stringify({
        phone,
        submittedAt: new Date().toISOString()
      }));

      // Call the callback
      onInfoSubmit({ phone });
      
      // Close modal
      onClose();
      
      // Show success message
      toast.success('Phone number saved successfully!');
      
    } catch (error) {
      console.error('Error saving phone number:', error);
      toast.error('Failed to save phone number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 10) {
      setPhone(digitsOnly);
      // Clear error when user starts typing
      if (error) {
        setError('');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] sm:w-[95vw] max-w-sm sm:max-w-md mx-auto p-3 sm:p-5 z-[10050] pointer-events-auto max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2 flex-wrap">
            <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-brand-primary flex-shrink-0" />
            <span className="text-center">Welcome to BazarXpress!</span>
          </DialogTitle>
          <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2 px-2">
            Get exclusive offers and track your shopping journey
          </p>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6">
          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Shield className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span>Why share your phone number?</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Get exclusive offers and discounts</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Track your abandoned cart items</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Personalized product recommendations</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Faster checkout process</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Phone Number - Required */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number *</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-xs sm:text-sm">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`pl-12 text-sm sm:text-base ${error ? 'border-red-500' : ''}`}
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}
              <p className="text-xs text-gray-500">
                We'll send you order updates and exclusive offers
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-2 sm:py-3 text-sm sm:text-lg font-semibold"
            >
              {isSubmitting ? 'Saving...' : 'Get Started'}
            </Button>

            {/* Skip Option */}
            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip for now
              </button>
            </div>
          </form>

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 text-center border-t pt-3 sm:pt-4">
            <p className="px-2">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-brand-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-brand-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
