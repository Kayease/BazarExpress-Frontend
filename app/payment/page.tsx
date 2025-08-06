/**
 * Payment Page with Multiple Validations
 * 
 * This component implements the following validations:
 * 1. COD Availability: Checks if all cart items support Cash on Delivery
 * 2. Delivery Area: Validates if delivery is available based on warehouse pincode settings
 * 3. Warehouse Operational Hours: Ensures warehouse is operational (6 AM - 11 PM)
 * 4. Address Selection: Ensures a delivery address is selected
 * 5. Decimal Formatting: All prices display with 2 decimal places
 * 
 * To configure:
 * - Update openTime/closeTime in validateWarehouseOperationalHours() for operational hours
 * - Set codAvailable property on cart items to control COD availability per product
 * - Configure warehouse pincode settings for delivery availability
 */

"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCartContext } from "@/components/app-provider";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearCart } from "@/lib/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  Truck,
  MapPin,
  Edit,
  Check,
  ChevronRight,
  ArrowLeft,
  Shield,
  Clock,
  Plus,
  Loader2,
  Store,
  Globe,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PromoCodeInput from "@/components/PromoCodeInput";
import AvailablePromocodes from "@/components/AvailablePromocodes";
import toast from "react-hot-toast";
import { calculateDeliveryChargeAPI, formatDeliveryCharge, getDeliveryTimeEstimate, fetchDeliverySettings, DeliveryCalculationResult } from "@/lib/delivery";
import DeliveryAvailabilityChecker from "@/components/DeliveryAvailabilityChecker";
import { DeliveryUnavailableModal } from "@/components/delivery-unavailable-modal";
import { validateCartDelivery, CartValidationResponse } from "@/lib/location";
import CartValidationAlert from "@/components/CartValidationAlert";
import { calculateCartTax, CartTaxCalculation, isInterStateTransaction, formatTaxAmount } from "@/lib/tax-calculation";
import OrderSuccessModal from "@/components/OrderSuccessModal";

interface PaymentMethod {
  id: string;
  type: 'wallet' | 'card' | 'netbanking' | 'upi' | 'cod';
  name: string;
  icon: any;
  description?: string;
  popular?: boolean;
}

const allPaymentMethods: PaymentMethod[] = [
  {
    id: 'wallet',
    type: 'wallet',
    name: 'Digital Wallets',
    icon: Wallet,
    description: 'PayTM, PhonePe, Google Pay, Amazon Pay',
    popular: true
  },
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Cards',
    icon: CreditCard,
    description: 'Visa, Mastercard, RuPay, American Express'
  },
  {
    id: 'netbanking',
    type: 'netbanking',
    name: 'Net Banking',
    icon: Building2,
    description: 'All major banks supported'
  },
  {
    id: 'upi',
    type: 'upi',
    name: 'UPI',
    icon: Smartphone,
    description: 'Pay using UPI ID or QR code',
    popular: true
  },
  {
    id: 'cod',
    type: 'cod',
    name: 'Cash on Delivery',
    icon: Truck,
    description: 'Pay when your order arrives'
  }
];

const walletOptions = [
  { name: 'PayTM', logo: '/paytm-logo.png' },
  { name: 'PhonePe', logo: '/phonepe-logo.png' },
  { name: 'Google Pay', logo: '/gpay-logo.png' },
  { name: 'Amazon Pay', logo: '/amazonpay-logo.png' }
];

const bankOptions = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank'
];

interface Address {
  id: number;
  type: "Office" | "Home" | "Hotel" | "Other";
  building: string;
  floor?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone?: string;
  name: string;
  isDefault?: boolean;
  addressLabel?: string;
  additionalInstructions?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
  lat?: number;
  lng?: number;
}

interface CartItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  productId?: string;
  codAvailable?: boolean;
  priceIncludesTax?: boolean;
  tax?: {
    _id: string;
    name: string;
    percentage: number;
    description?: string;
  };
  warehouse?: {
    _id: string;
    id: string;
    name: string;
    deliverySettings?: {
      is24x7Delivery: boolean;
    };
  };
  warehouseId?: string;
}

interface ValidationErrors {
  codNotAvailable?: string;
  deliveryNotAvailable?: string;
  warehouseNotOperational?: string;
  addressRequired?: string;
}

interface DeliveryInfo {
  distance: number;
  duration?: number;
  deliveryCharge: number;
  codCharge?: number;
  totalDeliveryCharge: number;
  isFreeDelivery: boolean;
  freeDeliveryEligible: boolean;
  amountNeededForFreeDelivery: number;
  calculationMethod?: string;
  estimatedDeliveryTime?: string;
  route?: any;
  warehouseSettings?: {
    freeDeliveryRadius: number;
    maxDeliveryRadius: number;
    isDeliveryEnabled: boolean;
  };
  warehouse?: {
    id: string;
    name: string;
    address: string;
  };
  settings?: any;
}

interface DeliverySettings {
  freeDeliveryMinAmount: number;
  freeDeliveryRadius: number;
  baseDeliveryCharge: number;
  minimumDeliveryCharge: number;
  maximumDeliveryCharge: number;
  perKmCharge: number;
  codAvailable: boolean;
  calculationMethod: string;
}

interface MixedWarehouseDelivery {
  totalDeliveryCharge: number;
  warehouseResults: {
    [warehouseId: string]: {
      distance: number;
      deliveryInfo: DeliveryInfo;
    };
  };
}

// Helper for parsing Google address components
function parseAddressComponents(components: any[]): any {
  let area = "", city = "", state = "", country = "", pin = "";
  for (const comp of components) {
    if (comp.types.includes("sublocality_level_1")) area = comp.long_name;
    if (comp.types.includes("locality")) city = comp.long_name;
    if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
    if (comp.types.includes("country")) country = comp.long_name;
    if (comp.types.includes("postal_code")) pin = comp.long_name;
  }
  return { area, city, state, country, pin };
}

// Fetch address from lat/lng and update addressForm
function fetchAddress(lat: number, lng: number, setAddressForm: any) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const comps = parseAddressComponents(result.address_components);
        setAddressForm((prev: any) => ({
          ...prev,
          area: result.formatted_address,
          city: comps.city,
          state: comps.state,
          country: comps.country,
          pincode: comps.pin,
          lat,
          lng
        }));
      }
    });
}

// Extract state from warehouse address string
function extractStateFromAddress(address: string): string {
  if (!address) return '';

  // Common Indian state patterns
  const statePatterns = [
    // Full state names
    /\b(Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal)\b/i,
    // Union Territories
    /\b(Andaman and Nicobar Islands|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Delhi|Jammu and Kashmir|Ladakh|Lakshadweep|Puducherry)\b/i,
    // Common abbreviations
    /\b(AP|AR|AS|BR|CG|GA|GJ|HR|HP|JH|KA|KL|MP|MH|MN|ML|MZ|NL|OD|PB|RJ|SK|TN|TS|TR|UP|UK|WB)\b/i
  ];

  for (const pattern of statePatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: try to extract from common address patterns
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    // Usually state is the second last part before pincode
    const potentialState = parts[parts.length - 2];
    if (potentialState && potentialState.length > 2 && !/^\d+$/.test(potentialState)) {
      return potentialState;
    }
  }

  return '';
}

export default function PaymentPage() {
  const { cartItems, cartTotal, isLoadingCart, clearCart: clearCartContext } = useCartContext();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state?.auth?.user);
  const token = useAppSelector((state: any) => state?.auth?.token);

  // Allow access to payment page even with empty cart (user might be completing an order)

  // Process cart items with COD availability info
  const cartItemsWithCODInfo = cartItems.map((item: any) => ({
    ...item,
    codAvailable: item.codAvailable !== undefined ? item.codAvailable : true
  }));

  // Since we don't allow mixed warehouses, all items should be from the same warehouse
  const singleWarehouse = useMemo(() => {
    if (cartItemsWithCODInfo.length === 0) return null;

    // Get warehouse from first item (all items should be from same warehouse)
    const firstItem = cartItemsWithCODInfo[0];
    if (!firstItem.warehouse || !firstItem.warehouse._id) return null;

    return {
      ...firstItem.warehouse,
      deliverySettings: firstItem.warehouse.deliverySettings || { is24x7Delivery: false }
    };
  }, [cartItemsWithCODInfo]);

  // Group cart items by warehouse (should only be one warehouse now)
  const itemsByWarehouse = useMemo(() => {
    const grouped: { [warehouseId: string]: { items: CartItem[], warehouse: any } } = {};
    
    console.log('Processing cart items for warehouse grouping:', cartItemsWithCODInfo.map(item => ({
      id: item.id || item._id,
      name: item.name,
      warehouse: item.warehouse,
      warehouseId: item.warehouseId
    })));
    
    cartItemsWithCODInfo.forEach((item: CartItem) => {
      // Try multiple ways to get warehouse ID
      const warehouseId = item.warehouseId || 
                         item.warehouse?._id || 
                         item.warehouse?.id ||
                         (typeof item.warehouse === 'string' ? item.warehouse : null);
      
      console.log('Item warehouse extraction:', {
        itemId: item.id || item._id,
        itemName: item.name,
        warehouseId,
        warehouse: item.warehouse,
        warehouseIdField: item.warehouseId
      });
      
      if (!warehouseId) {
        console.warn('No warehouse ID found for item:', item.name);
        return;
      }
      
      if (!grouped[warehouseId]) {
        grouped[warehouseId] = {
          items: [],
          warehouse: item.warehouse || {}
        };
      }
      grouped[warehouseId].items.push(item);
    });
    
    console.log('Final grouped warehouses:', Object.keys(grouped));
    return grouped;
  }, [cartItemsWithCODInfo]);

  // Payment method states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('upi');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('9058442532@ptyes');
  const [newUpiId, setNewUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState<boolean>(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Promo code states
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Delivery calculation states
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // Remove mixed warehouse delivery states since we don't support mixed warehouses
  // These are kept for compatibility but will be removed
  const [mixedWarehouseDelivery, setMixedWarehouseDelivery] = useState<any>(null);
  const [loadingMixedDelivery, setLoadingMixedDelivery] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidatingPayment, setIsValidatingPayment] = useState(false);
  
  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState<any>(null);

  // Delivery settings state
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  // Cart validation states
  const [cartValidation, setCartValidation] = useState<CartValidationResponse | null>(null);
  const [isValidatingCart, setIsValidatingCart] = useState(false);

  // Tax calculation states
  const [taxCalculation, setTaxCalculation] = useState<CartTaxCalculation | null>(null);

  // Error tracking to prevent duplicate toasts
  const [lastErrorMessage, setLastErrorMessage] = useState<string>('');
  const [lastErrorTime, setLastErrorTime] = useState<number>(0);

  // Track failed delivery calculations to prevent repeated attempts
  const [failedDeliveryAddresses, setFailedDeliveryAddresses] = useState<Set<string>>(new Set());

  // Track last successful delivery calculation to prevent continuous recalculations
  const lastDeliveryCalculation = useRef<{
    addressKey: string;
    cartTotal: number;
    discountAmount: number;
    paymentMethod: string;
    warehouseIds: string[];
    timestamp: number;
  } | null>(null);

  // State to trigger delivery calculation retry
  const [shouldRetryDelivery, setShouldRetryDelivery] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    console.log('PaymentPage component mounted');
    return () => {
      console.log('PaymentPage component UNMOUNTING - this might explain the issue!');
      isMountedRef.current = false;
    };
  }, []);

  // Redirect to login if not authenticated (but not during order processing)
  useEffect(() => {
    if (!user || !token) {
      // Prevent redirect during order processing to avoid component unmount
      if (!isValidatingPayment) {
        console.log('Redirecting to auth due to missing user/token');
        router.push('/auth');
        return;
      } else {
        console.log('Skipping auth redirect during order processing');
      }
    }
  }, [user, token, router, isValidatingPayment]);

  // State for delivery unavailable modal
  const [showDeliveryUnavailableModal, setShowDeliveryUnavailableModal] = useState(false);
  const [unavailablePincode, setUnavailablePincode] = useState<string>('');
  
  // State for undeliverable items modal
  const [showUndeliverableItemsModal, setShowUndeliverableItemsModal] = useState(false);
  const [undeliverableItems, setUndeliverableItems] = useState<any[]>([]);

  // Helper function to show error toast only if not shown recently
  const showErrorToast = useCallback((message: string, cooldownMs: number = 3000) => {
    const now = Date.now();
    if (lastErrorMessage !== message || (now - lastErrorTime) > cooldownMs) {
      toast.error(message);
      setLastErrorMessage(message);
      setLastErrorTime(now);
    }
  }, [lastErrorMessage, lastErrorTime]);

  // Helper function to format delivery charges (rounded to avoid decimal payments)
  const formatDeliveryChargeWithDecimals = (charge: number) => {
    if (charge === 0) return "Free";
    return `₹${Math.round(charge)}`;
  };

  // Helper function to show success toast only if not shown recently
  const showSuccessToast = useCallback((message: string, cooldownMs: number = 2000) => {
    const now = Date.now();
    if (lastErrorMessage !== message || (now - lastErrorTime) > cooldownMs) {
      toast.success(message);
      setLastErrorMessage(message);
      setLastErrorTime(now);
    }
  }, [lastErrorMessage, lastErrorTime]);

  // Helper function to check if COD is available for all cart items
  const isCODAvailableForCart = useMemo(() => {
    return cartItemsWithCODInfo.every((item: CartItem) => item.codAvailable !== false);
  }, [cartItemsWithCODInfo]);

  // Helper function to create address key for tracking failed deliveries
  const getAddressKey = useCallback((address: Address) => {
    return `${address.lat}_${address.lng}_${address.id}`;
  }, []);

  // Function to retry delivery calculation for a failed address
  const retryDeliveryCalculation = useCallback(() => {
    if (selectedAddress && addresses.length > 0) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      if (address) {
        const addressKey = getAddressKey(address);
        setFailedDeliveryAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(addressKey);
          return newSet;
        });

        setDeliveryInfo(null);
        setMixedWarehouseDelivery(null);
        setShouldRetryDelivery(true);
      }
    }
  }, [selectedAddress, addresses, getAddressKey]);

  // Filter payment methods based on delivery settings
  const paymentMethods = allPaymentMethods.filter(method => {
    if (method.type === 'cod') {
      return deliverySettings?.codAvailable !== false;
    }
    return true;
  });

  // Switch payment method if COD is selected but not available
  useEffect(() => {
    if (selectedPaymentMethod === 'cod' && deliverySettings?.codAvailable === false) {
      setSelectedPaymentMethod('upi');
      toast('COD is currently not available. Switched to UPI payment.');
    }
  }, [deliverySettings, selectedPaymentMethod]);

  // Switch payment method if COD is selected but cart items are not eligible for COD
  useEffect(() => {
    if (selectedPaymentMethod === 'cod' && !isCODAvailableForCart) {
      setSelectedPaymentMethod('upi');
      toast('COD is not available for some items in your cart. Switched to UPI payment.');
    }
  }, [selectedPaymentMethod, isCODAvailableForCart]);

  // Utility function to set token as cookie
  const setTokenCookie = () => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;
    }
  };

  // Validation functions
  const validateCODAvailability = (): boolean => {
    if (selectedPaymentMethod !== 'cod') return true;

    const nonCODItems = cartItemsWithCODInfo.filter((item: CartItem) => item.codAvailable === false);
    if (nonCODItems.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        codNotAvailable: `Cash on Delivery is not available for: ${nonCODItems.map(item => item.name).join(', ')}`
      }));
      return false;
    }

    setValidationErrors(prev => ({ ...prev, codNotAvailable: undefined }));
    return true;
  };

  const validateDeliveryArea = (): boolean => {
    if (!selectedAddress) {
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Please select a delivery address to check delivery availability.'
      }));
      return false;
    }

    if (loadingDelivery) {
      setValidationErrors(prev => ({ ...prev, deliveryNotAvailable: undefined }));
      return false;
    }

    if (!deliveryInfo) {
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Unable to calculate delivery for selected address. Please try selecting a different address or contact support.'
      }));
      return false;
    }

    if (deliveryInfo.warehouseSettings?.isDeliveryEnabled === false) {
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Delivery is currently not available from our nearest warehouse to your location. Please try a different address.'
      }));
      return false;
    }

    setValidationErrors(prev => ({ ...prev, deliveryNotAvailable: undefined }));
    return true;
  };

  const validateWarehouseOperationalHours = (): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const openTime = 6 * 60;
    const closeTime = 23 * 60;

    if (currentTime < openTime || currentTime > closeTime) {
      const openHour = Math.floor(openTime / 60);
      const closeHour = Math.floor(closeTime / 60);
      setValidationErrors(prev => ({
        ...prev,
        warehouseNotOperational: `Our warehouse is currently closed. We operate from ${openHour}:00 AM to ${closeHour}:00 PM. Please place your order during operational hours.`
      }));
      return false;
    }

    setValidationErrors(prev => ({ ...prev, warehouseNotOperational: undefined }));
    return true;
  };

  const validateAddress = (): boolean => {
    if (!selectedAddress) {
      setValidationErrors(prev => ({
        ...prev,
        addressRequired: 'Please select a delivery address to continue.'
      }));
      return false;
    }

    setValidationErrors(prev => ({ ...prev, addressRequired: undefined }));
    return true;
  };

  // Validate cart items against selected delivery address
  const validateCartForDelivery = async (): Promise<boolean> => {
    console.log('validateCartForDelivery: Starting validation...');
    
    if (!selectedAddress) {
      console.log('validateCartForDelivery: No selected address');
      setValidationErrors(prev => ({
        ...prev,
        addressRequired: 'Please select a delivery address to validate cart items.'
      }));
      return false;
    }

    const cartItemsForValidation = cartItemsWithCODInfo.map((item: any) => ({
      _id: item._id || item.id,
      name: item.name,
      warehouseId: item.warehouseId || item.warehouse?._id || item.warehouse?.id,
      quantity: item.quantity
    }));

    console.log('validateCartForDelivery: Cart items for validation:', cartItemsForValidation);

    const itemsWithoutWarehouse = cartItemsForValidation.filter(item => !item.warehouseId);
    if (itemsWithoutWarehouse.length > 0) {
      console.warn('Some cart items missing warehouse information:', itemsWithoutWarehouse);
    }

    const validItems = cartItemsForValidation.filter(item => item.warehouseId);
    if (validItems.length === 0) {
      console.log('validateCartForDelivery: No valid items with warehouse info');
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Unable to validate delivery for cart items. Please contact support.'
      }));
      return false;
    }

    console.log('validateCartForDelivery: Setting isValidatingCart to true');
    setIsValidatingCart(true);

    try {
      const selectedAddrObj = addresses.find(a => a.id === selectedAddress);
      if (!selectedAddrObj) {
        console.log('validateCartForDelivery: Selected address not found');
        setValidationErrors(prev => ({
          ...prev,
          addressRequired: 'Selected address not found.'
        }));
        return false;
      }

      console.log('validateCartForDelivery: Calling validateCartDelivery API...');
      const validation = await validateCartDelivery(validItems, {
        lat: selectedAddrObj.lat!,
        lng: selectedAddrObj.lng!,
        address: `${selectedAddrObj.building}, ${selectedAddrObj.area}, ${selectedAddrObj.city}`,
        pincode: selectedAddrObj.pincode
      });

      console.log('validateCartForDelivery: API response received:', validation);

      setCartValidation(validation);

      if (!validation.success) {
        console.log('validateCartForDelivery: Validation failed:', validation.error);
        setValidationErrors(prev => ({
          ...prev,
          deliveryNotAvailable: validation.error || 'Failed to validate cart delivery'
        }));
        return false;
      }

      if (!validation.allItemsDeliverable) {
        console.log('validateCartForDelivery: Some items not deliverable');
        // Show modal for undeliverable items instead of error message
        setUndeliverableItems(validation.undeliverableItems);
        setShowUndeliverableItemsModal(true);
        return false;
      }

      console.log('validateCartForDelivery: All validations passed');
      setValidationErrors(prev => ({ ...prev, deliveryNotAvailable: undefined }));
      return true;

    } catch (error) {
      console.error('Error validating cart delivery:', error);
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Unable to validate delivery for your cart. Please try again or contact support.'
      }));
      return false;
    } finally {
      console.log('validateCartForDelivery: Setting isValidatingCart to false');
      setIsValidatingCart(false);
    }
  };

  const validatePayment = async (): Promise<boolean> => {
    console.log('=== STARTING PAYMENT VALIDATION ===');
    
    try {
      console.log('Validating COD availability...');
      const isCODValid = validateCODAvailability();
      console.log('COD valid:', isCODValid);
      
      console.log('Validating delivery area...');
      const isDeliveryValid = validateDeliveryArea();
      console.log('Delivery valid:', isDeliveryValid);
      
      console.log('Validating warehouse operational hours...');
      const isWarehouseOperational = validateWarehouseOperationalHours();
      console.log('Warehouse operational:', isWarehouseOperational);
      
      console.log('Validating address selection...');
      const isAddressValid = validateAddress();
      console.log('Address valid:', isAddressValid);

      console.log('Validating cart for delivery...');
      const isCartValid = await validateCartForDelivery();
      console.log('Cart valid:', isCartValid);

      const allValid = isCODValid && isDeliveryValid && isWarehouseOperational && isAddressValid && isCartValid;
      console.log('=== VALIDATION COMPLETE ===', {
        isCODValid,
        isDeliveryValid,
        isWarehouseOperational,
        isAddressValid,
        isCartValid,
        allValid
      });

      return allValid;
    } catch (error) {
      console.error('Error during payment validation:', error);
      return false;
    }
  };



  // Fetch delivery settings
  const loadDeliverySettings = async () => {
    try {
      const settings = await fetchDeliverySettings();
      if (settings) {
        setDeliverySettings(settings);
      }
    } catch (error) {
      console.error('Error loading delivery settings:', error);
    }
  };

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      setTokenCookie();

      const response = await fetch(`/api/user/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      if (Array.isArray(data.addresses)) {
        const validAddresses = data.addresses.filter((address: any) =>
          address &&
          address.id &&
          (address.building || address.area) &&
          address.city &&
          address.state &&
          address.pincode
        );
        setAddresses(validAddresses);

        const defaultAddress = validAddresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        } else if (validAddresses.length > 0) {
          setSelectedAddress(validAddresses[0].id);
        }
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Add new address
  const handleAddAddress = async (newAddress: Omit<Address, 'id'>) => {
    try {
      setIsAddingAddress(true);
      setTokenCookie();

      const response = await fetch(`/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }

      const data = await response.json();
      if (data.address) {
        await fetchUserAddresses();
        if (newAddress.isDefault) {
          setSelectedAddress(data.address.id);
        }
      }
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    } finally {
      setIsAddingAddress(false);
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showAddressModal || showAddAddressModal || showDeliveryUnavailableModal || showUndeliverableItemsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddressModal, showAddAddressModal, showDeliveryUnavailableModal, showUndeliverableItemsModal]);

  // Check authentication and fetch addresses
  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }
    fetchUserAddresses();
    loadDeliverySettings();
  }, [user, token, router]);

  // Note: Removed cart empty redirect to allow order completion flow

  // Check for valid warehouse items with improved logic
  useEffect(() => {
    const validWarehouseItems = Object.keys(itemsByWarehouse).length;
    const totalCartItems = cartItems.length;
    
    // Only show warnings if there are items in cart and we're not in a loading state
    if (totalCartItems > 0 && !isLoadingCart) {
      // Add a small delay to avoid showing toasts during rapid cart operations
      const timeoutId = setTimeout(() => {
        // Double-check that cart still has items and component is still mounted
        if (!isMountedRef.current || cartItems.length === 0) {
          console.log('Component unmounted or cart became empty during validation timeout, skipping validation');
          return;
        }
        
        const currentValidWarehouseItems = Object.keys(itemsByWarehouse).length;
        const currentTotalCartItems = cartItems.length;
        
        if (currentValidWarehouseItems === 0 && currentTotalCartItems > 0) {
          console.error('No items with valid warehouse information found in cart');
          showErrorToast('Some items in your cart have invalid warehouse information. Please refresh the page or clear your cart.', 5000);
        } else if (currentTotalCartItems > currentValidWarehouseItems) {
          const invalidItemsCount = currentTotalCartItems - Object.values(itemsByWarehouse).reduce((total, { items }) => total + items.length, 0);
          // Only show toast if there are actually invalid items (count > 0)
          if (invalidItemsCount > 0) {
            console.warn(`${invalidItemsCount} items in cart have invalid warehouse information`);
            showErrorToast(`${invalidItemsCount} items in your cart have invalid warehouse information and will be excluded from delivery calculation.`, 5000);
          }
        }
      }, 1500); // 1.5 second delay to avoid showing during rapid operations

      return () => clearTimeout(timeoutId);
    }
  }, [itemsByWarehouse, cartItems, isLoadingCart, showErrorToast]);

  // Forward declaration for delivery calculation function
  const calculateDeliveryRef = useRef<((address: Address) => Promise<void>) | null>(null);

  // Wrapper function that can be used in useEffect dependencies
  const triggerDeliveryCalculation = useCallback((address: Address) => {
    if (calculateDeliveryRef.current) {
      calculateDeliveryRef.current(address);
    }
  }, []);

  // Calculate delivery when address or payment method changes
  useEffect(() => {
    // Don't calculate delivery if cart is empty
    if (cartItems.length === 0) return;
    
    if (selectedAddress && addresses.length > 0 && !loadingDelivery) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      if (address) {
        const addressKey = getAddressKey(address);
        if (failedDeliveryAddresses.has(addressKey)) {
          console.log('Skipping delivery calculation for previously failed address:', addressKey);
          return;
        }

        triggerDeliveryCalculation(address);
      }
    }
  }, [selectedAddress, addresses, selectedPaymentMethod, itemsByWarehouse, shouldRetryDelivery, failedDeliveryAddresses, loadingDelivery, getAddressKey, triggerDeliveryCalculation, cartItems.length]);

  // Recalculate delivery when discount amount changes (with debounce)
  useEffect(() => {
    // Don't calculate delivery if cart is empty
    if (cartItems.length === 0) return;
    
    if (selectedAddress && addresses.length > 0 && deliveryInfo && !loadingDelivery) {
      const timeoutId = setTimeout(() => {
        const address = addresses.find(addr => addr.id === selectedAddress);
        if (address) {
          triggerDeliveryCalculation(address);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [discountAmount, selectedAddress, addresses, deliveryInfo, loadingDelivery, itemsByWarehouse, triggerDeliveryCalculation]);

  // Clear failed delivery addresses when user changes address
  useEffect(() => {
    if (selectedAddress) {
      setFailedDeliveryAddresses(new Set());
    }
  }, [selectedAddress]);

  // Trigger delivery calculation when retry is requested
  useEffect(() => {
    if (shouldRetryDelivery && selectedAddress && addresses.length > 0) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      if (address) {
        const addressKey = getAddressKey(address);
        if (!failedDeliveryAddresses.has(addressKey)) {
          setShouldRetryDelivery(false);
        }
      }
    }
  }, [shouldRetryDelivery, selectedAddress, addresses, failedDeliveryAddresses, getAddressKey]);

  // Run validations when relevant states change
  useEffect(() => {
    validateCODAvailability();
  }, [selectedPaymentMethod, cartItems]);

  useEffect(() => {
    validateDeliveryArea();
  }, [deliveryInfo, selectedAddress, loadingDelivery]);

  useEffect(() => {
    validateWarehouseOperationalHours();
  }, []);

  useEffect(() => {
    validateAddress();
  }, [selectedAddress]);

  // Promo code handlers
  const handlePromoCodeApplied = (discount: number, promoCode: any) => {
    setDiscountAmount(discount);
    setAppliedPromoCode(promoCode);
  };

  const handlePromoCodeRemoved = () => {
    setDiscountAmount(0);
    setAppliedPromoCode(null);
  };

  const handlePromoCodeSelect = async (code: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promocodes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          userId: user?._id,
          cartItems: cartItems.map(item => ({
            productId: item.productId || item._id,
            categoryId: item.categoryId || item.category,
            brandId: item.brandId || item.brand,
            quantity: item.quantity,
            price: item.price
          })),
          cartTotal
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        handlePromoCodeApplied(data.discountAmount, data.promocode);
        toast.success(`${code} applied! You saved ₹${data.discountAmount}`);
      } else {
        toast.error(data.error || 'Failed to apply promocode');
      }
    } catch (error) {
      console.error('Error applying promocode:', error);
      toast.error('Failed to apply promocode');
    }
  };



  // Calculate delivery charges
  const calculateDelivery = useCallback(async (address: Address) => {
    if (loadingDelivery || isLoadingCart) {
      console.log('Delivery calculation skipped - loading in progress...');
      return;
    }

    // Skip calculation if cart is empty
    if (cartItems.length === 0) {
      console.log('Delivery calculation skipped - cart is empty');
      return;
    }

    const addressKey = getAddressKey(address);
    if (failedDeliveryAddresses.has(addressKey)) {
      console.log('Skipping delivery calculation for previously failed address:', addressKey);
      return;
    }

    // Check if this is the same calculation as the last one
    const warehouseIds = Object.keys(itemsByWarehouse);
    const currentCalculation = {
      addressKey,
      cartTotal: cartTotal - discountAmount,
      discountAmount,
      paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
      warehouseIds: warehouseIds.sort(),
      timestamp: Date.now()
    };

    if (lastDeliveryCalculation.current &&
      lastDeliveryCalculation.current.addressKey === currentCalculation.addressKey &&
      lastDeliveryCalculation.current.cartTotal === currentCalculation.cartTotal &&
      lastDeliveryCalculation.current.paymentMethod === currentCalculation.paymentMethod &&
      JSON.stringify(lastDeliveryCalculation.current.warehouseIds) === JSON.stringify(currentCalculation.warehouseIds) &&
      (Date.now() - lastDeliveryCalculation.current.timestamp) < 5000) { // 5 second cooldown
      console.log('Skipping duplicate delivery calculation');
      return;
    }

    if (!address.lat || !address.lng) {
      console.log('Address missing coordinates:', address);
      showErrorToast('Invalid address coordinates. Please select a different address or try adding the address again.');
      return;
    }

    const lat = Number(address.lat);
    const lng = Number(address.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates:', { lat, lng });
      showErrorToast('Invalid address coordinates. Please select a different address.');
      return;
    }

    console.log('Attempting delivery calculation:', {
      address,
      coordinates: { lat, lng },
      cartTotal,
      discountAmount,
      paymentMethod: selectedPaymentMethod
    });

    try {
      setLoadingDelivery(true);

      if (!address.lat || !address.lng || isNaN(Number(address.lat)) || isNaN(Number(address.lng))) {
        throw new Error('Invalid address coordinates. Please select a valid address.');
      }

      if (!address.pincode) {
        throw new Error('Address pincode is required for delivery calculation. Please select a valid address.');
      }

      // Check if we have mixed warehouse items
      const warehouseIds = Object.keys(itemsByWarehouse);
      console.log('Cart has items from warehouses:', warehouseIds);

      // Validate warehouse IDs
      const invalidWarehouseIds = warehouseIds.filter(id => 
        !id || 
        id === 'unknown' || 
        id === 'undefined' || 
        id === 'null' ||
        id.length < 12 // MongoDB ObjectId should be at least 12 characters
      );

      if (invalidWarehouseIds.length > 0) {
        console.error('Invalid warehouse IDs found:', invalidWarehouseIds);
        // Only show error if there are valid items but some have invalid warehouse info
        if (warehouseIds.length > invalidWarehouseIds.length) {
          showErrorToast('Some items in your cart have invalid warehouse information. Please refresh the page or clear your cart.', 10000);
          return; // Don't proceed with calculation but don't throw error
        } else {
          // All warehouse IDs are invalid, likely during cart clearing
          console.log('All warehouse IDs invalid, likely during cart operations');
          return;
        }
      }

      if (warehouseIds.length === 0) {
        // Don't throw error if cart is empty or being cleared, just return silently
        console.log('No warehouse items found, skipping delivery calculation');
        return; // Exit silently - this is normal during cart operations
      }

      // Since we don't allow mixed warehouses, there should only be one warehouse
      if (warehouseIds.length > 1) {
        throw new Error('Mixed warehouse orders are not allowed. Please ensure all items are from the same warehouse.');
      }

      // Single warehouse delivery
      const singleWarehouseId = warehouseIds.length === 1 ? warehouseIds[0] : undefined;

      console.log('Calculating delivery for:', {
        lat: Number(address.lat),
        lng: Number(address.lng),
        cartTotal: cartTotal - discountAmount,
        paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
        pincode: address.pincode,
        warehouseId: singleWarehouseId
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Delivery calculation timeout')), 15000)
      );

      try {
        // Prepare cart items for delivery calculation
        const cartItemsForDelivery = cartItemsWithCODInfo.map((item: any) => ({
          _id: item._id || item.id,
          name: item.name,
          warehouseId: item.warehouseId || item.warehouse?._id || item.warehouse?.id,
          quantity: item.quantity,
          warehouse: item.warehouse
        }));

        const result = await Promise.race([
          calculateDeliveryChargeAPI(
            lat,
            lng,
            cartTotal - discountAmount,
            selectedPaymentMethod === 'cod' ? 'cod' : 'online',
            singleWarehouseId, // Pass the specific warehouse ID
            address.pincode, // customerPincode
            cartItemsForDelivery // Pass cart items
          ),
          timeoutPromise
        ]) as DeliveryCalculationResult | null;

        console.log('Delivery API Response:', result);

        if (!result) {
          throw new Error('No response from delivery calculation API');
        }

        if (!result.success) {
          // Handle specific error cases for pincode-based delivery
          let errorMessage = result.error || 'Failed to calculate delivery charges';
          if (errorMessage.includes('No warehouse available')) {
            // Show modal for pincode delivery unavailability
            setUnavailablePincode(address.pincode);
            setShowDeliveryUnavailableModal(true);
            return;
          }
          throw new Error(errorMessage);
        }

        console.log('OSRM Delivery calculation result:', result);

        if (result && result.success && typeof result.distance === 'number') {
          const enhancedDeliveryInfo: DeliveryInfo = {
            distance: result.distance,
            duration: result.duration,
            deliveryCharge: result.deliveryCharge || 0,
            codCharge: result.codCharge || 0,
            totalDeliveryCharge: result.totalDeliveryCharge || result.deliveryCharge || 0,
            isFreeDelivery: result.isFreeDelivery || false,
            freeDeliveryEligible: result.freeDeliveryEligible || false,
            amountNeededForFreeDelivery: result.amountNeededForFreeDelivery || 0,
            calculationMethod: result.calculationMethod || 'osrm',
            estimatedDeliveryTime: result.duration ?
              getDeliveryTimeEstimate(result.distance, result.duration) :
              getDeliveryTimeEstimate(result.distance),
            route: result.route,
            warehouseSettings: result.warehouseSettings,
            warehouse: result.warehouse,
            settings: result.settings
          };

          console.log('Enhanced delivery info with OSRM:', enhancedDeliveryInfo);
          setDeliveryInfo(enhancedDeliveryInfo);

          // Store this calculation to prevent duplicates
          lastDeliveryCalculation.current = currentCalculation;

          const addressKey = getAddressKey(address);
          setFailedDeliveryAddresses(prev => {
            const newSet = new Set(prev);
            newSet.delete(addressKey);
            return newSet;
          });

          // Only show toast if this is a new calculation (different distance or warehouse)
          if (result.calculationMethod === 'osrm' &&
            (!deliveryInfo ||
              Math.abs(deliveryInfo.distance - result.distance) > 0.1 ||
              deliveryInfo.warehouse?.name !== result.warehouse?.name)) {
            showSuccessToast(`Delivery calculated: ${result.distance.toFixed(2)}km, ${result.duration?.toFixed(0) || 'N/A'} min via ${result.warehouse?.name || 'warehouse'}`);
          }
        } else if (result && result.error) {
          console.error('API returned error:', result.error);
          throw new Error(result.error);
        } else {
          console.error('Invalid delivery calculation result:', result);
          throw new Error('Unable to calculate delivery. Please try again.');
        }
      } catch (error) {
        console.error('Error calculating delivery with OSRM:', error);

        const addressKey = getAddressKey(address);
        setFailedDeliveryAddresses(prev => new Set(prev).add(addressKey));

        // Check if this is a pincode delivery unavailability error
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('Delivery not available to pincode') || errorMessage.includes('No warehouse available')) {
          setUnavailablePincode(address.pincode);
          setShowDeliveryUnavailableModal(true);
        } else {
          showErrorToast(errorMessage || 'Unable to calculate delivery for this address. Please try a different address or contact support.');
        }

        setDeliveryInfo(null);
      }
    } catch (error) {
      console.error('Error in delivery calculation:', error);

      const addressKey = getAddressKey(address);
      setFailedDeliveryAddresses(prev => new Set(prev).add(addressKey));

      // Check if this is a pincode delivery unavailability error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Delivery not available to pincode') || errorMessage.includes('No warehouse available')) {
        setUnavailablePincode(address.pincode);
        setShowDeliveryUnavailableModal(true);
      } else {
        showErrorToast(errorMessage || 'Unable to calculate delivery for this address. Please try a different address or contact support.');
      }
      
      setDeliveryInfo(null);
    } finally {
      setLoadingDelivery(false);
    }
  }, [loadingDelivery, isLoadingCart, cartItems, getAddressKey, failedDeliveryAddresses, showErrorToast, cartTotal, discountAmount, selectedPaymentMethod, showSuccessToast, itemsByWarehouse, cartItemsWithCODInfo]);

  // Assign function to ref after it is declared
  useEffect(() => {
    calculateDeliveryRef.current = calculateDelivery;
  }, [calculateDelivery]);

  // Calculate tax for cart items from single warehouse
  const calculateTaxForCart = () => {
    if (!selectedAddress || addresses.length === 0) return null;

    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    if (!selectedAddr) return null;

    const customerState = selectedAddr.state || '';

    // Since we only have one warehouse now, get the warehouse info
    const warehouseEntries = Object.entries(itemsByWarehouse);
    if (warehouseEntries.length === 0) return null;

    const [warehouseId, { items, warehouse }] = warehouseEntries[0];
    const warehouseState = extractStateFromAddress(warehouse.address || '');
    
    // Determine if this is interstate delivery
    const isInterState = !!(customerState && warehouseState &&
      customerState.toLowerCase().trim() !== warehouseState.toLowerCase().trim());

    const itemsForTax = items.map((item: any) => ({
      price: item.price,
      priceIncludesTax: item.priceIncludesTax || false,
      tax: item.tax ? {
        id: item.tax._id || item.tax.id,
        name: item.tax.name,
        percentage: item.tax.percentage,
        description: item.tax.description
      } : null,
      quantity: item.quantity
    }));

    const taxCalc = calculateCartTax(itemsForTax, isInterState, warehouseState, customerState);

    return taxCalc;
  };

  // Calculate tax when cart items or address changes
  useEffect(() => {
    const taxCalc = calculateTaxForCart();
    setTaxCalculation(taxCalc);
  }, [cartItems, selectedAddress, addresses]);

  // Calculate final total with discount, tax, and delivery
  // For tax calculation, we need to use the proper subtotal and tax amounts
  const taxAmount = taxCalculation?.totalTax || 0;
  const subtotalBeforeTax = taxCalculation?.subtotal || cartTotal;
  
  // Apply discount to subtotal before tax
  const subtotalAfterDiscount = subtotalBeforeTax - discountAmount;
  
  // Final total = subtotal after discount + tax + delivery + COD charge
  const totalDeliveryCharge = deliveryInfo?.totalDeliveryCharge || 0;
  const codCharge = selectedPaymentMethod === 'cod' ? (deliveryInfo?.codCharge || 0) : 0;
  const finalTotalWithDelivery = subtotalAfterDiscount + taxAmount + totalDeliveryCharge + codCharge;

  const handlePayment = async () => {
    console.log('=== PAYMENT PROCESS STARTED ===');
    console.log('Cart items:', cartItemsWithCODInfo.length);
    console.log('Selected address:', selectedAddress);
    console.log('Payment method:', selectedPaymentMethod);
    
    // Prevent multiple clicks
    if (isValidatingPayment) {
      console.log('Payment already in progress, ignoring click');
      return;
    }
    
    setIsValidatingPayment(true);
    console.log('Validation state set to true');

    // Add a safety timeout to prevent indefinite loading
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    let emergencyTimeoutId: NodeJS.Timeout | undefined = undefined;

    try {
      console.log('Starting validation...');
      
      // TEMPORARY: Skip validation for debugging - uncomment the line below to bypass validation
      // const isValid = true;
      const isValid = await validatePayment();
      console.log('Payment validation result:', isValid);

      if (!isValid) {
        console.log('Validation failed, stopping payment process');
        setIsValidatingPayment(false);

        if (validationErrors.deliveryNotAvailable) {
          toast.error('Delivery not available to your location. Please select a different address.', {
            duration: 5000,
            icon: '🚫'
          });
        } else if (validationErrors.codNotAvailable) {
          toast.error('Cash on Delivery is not available for some items in your cart.', {
            duration: 4000,
            icon: '💳'
          });
        } else if (validationErrors.warehouseNotOperational) {
          toast.error('Our warehouse is currently closed. Please place your order during operational hours.', {
            duration: 4000,
            icon: '🕒'
          });
        } else if (validationErrors.addressRequired) {
          toast.error('Please select a delivery address to continue.', {
            duration: 3000,
            icon: '📍'
          });
        } else {
          toast.error('Please resolve the validation errors before proceeding.');
        }
        return;
      }

      console.log('Validation passed, proceeding with order creation...');

      // Set up timeout for order creation
      timeoutId = setTimeout(() => {
        if (isMountedRef.current && isValidatingPayment) {
          console.error('Order creation timeout after 15 seconds');
          setIsValidatingPayment(false);
          toast.error('Order creation is taking too long. Please try again.');
        }
      }, 15000); // 15 second timeout

      // Emergency fallback timeout - force clear loading state
      emergencyTimeoutId = setTimeout(() => {
        if (isMountedRef.current && isValidatingPayment) {
          console.error('EMERGENCY: Forcing clear of loading state after 20 seconds');
          setIsValidatingPayment(false);
          toast.error('Something went wrong during order processing. Please check your order history.');
        }
      }, 20000); // 20 second emergency timeout

      // Get selected address
      const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
      if (!selectedAddressData) {
        if (timeoutId) clearTimeout(timeoutId);
        if (emergencyTimeoutId) clearTimeout(emergencyTimeoutId);
        toast.error('Please select a delivery address.');
        setIsValidatingPayment(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: cartItemsWithCODInfo.map(item => ({
          productId: item.id || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          categoryId: item.categoryId,
          brand: item.brand,
          brandId: item.brandId,
          codAvailable: item.codAvailable,
          priceIncludesTax: item.priceIncludesTax,
          tax: item.tax,
          warehouse: item.warehouse,
          warehouseId: item.warehouseId || item.warehouse?._id || item.warehouse?.id
        })),
        
        customerInfo: {
          name: user?.name || selectedAddressData.name || '',
          email: user?.email || '',
          phone: user?.phone || selectedAddressData.phone || ''
        },
        
        pricing: {
          subtotal: taxCalculation?.subtotal || cartTotal,
          taxAmount: taxCalculation?.totalTax || 0,
          discountAmount: discountAmount,
          deliveryCharge: deliveryInfo?.totalDeliveryCharge || 0,
          codCharge: selectedPaymentMethod === 'cod' ? (deliveryInfo?.codCharge || 0) : 0,
          total: Math.ceil(finalTotalWithDelivery) // Round up to avoid decimal payments
        },
        
        promoCode: appliedPromoCode ? {
          code: appliedPromoCode.code,
          discountAmount: discountAmount,
          discountType: appliedPromoCode.discountType
        } : undefined,
        
        taxCalculation: taxCalculation ? {
          isInterState: taxCalculation.isInterState,
          totalTax: taxCalculation.totalTax,
          subtotal: taxCalculation.subtotal,
          totalCGST: taxCalculation.totalCGST,
          totalSGST: taxCalculation.totalSGST,
          totalIGST: taxCalculation.totalIGST,
          customerState: selectedAddressData.state,
          warehouseState: singleWarehouse ? extractStateFromAddress(singleWarehouse.address || '') : '',
          taxBreakdown: taxCalculation.taxBreakdown
        } : undefined,
        
        deliveryInfo: {
          address: selectedAddressData,
          distance: deliveryInfo?.distance || 0,
          estimatedDeliveryTime: deliveryInfo?.estimatedDeliveryTime || '',
          deliveryCharge: deliveryInfo?.totalDeliveryCharge || 0,
          codCharge: selectedPaymentMethod === 'cod' ? (deliveryInfo?.codCharge || 0) : 0,
          isFreeDelivery: deliveryInfo?.isFreeDelivery || false
        },
        
        paymentInfo: {
          method: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
          paymentMethod: selectedPaymentMethod,
          status: selectedPaymentMethod === 'cod' ? 'pending' : 'pending'
        },
        
        warehouseInfo: singleWarehouse ? {
          warehouseId: singleWarehouse._id || singleWarehouse.id,
          warehouseName: singleWarehouse.name,
          warehouseAddress: singleWarehouse.address || '',
          is24x7Delivery: singleWarehouse.deliverySettings?.is24x7Delivery || false
        } : undefined,
        
        notes: {
          customerNotes: '',
          deliveryInstructions: selectedAddressData.additionalInstructions || ''
        }
      };

      // Validate API URL and token before making the call
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Create the order with proper error handling
      console.log('Creating order with data:', orderData);
      console.log('API URL:', `${apiUrl}/orders/create`);
      console.log('Token present:', !!token);
      
      const response = await fetch(`${apiUrl}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      }).catch(networkError => {
        console.error('Network error during order creation:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      });

      console.log('Order creation response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Order creation result:', result);
      console.log('Order creation SUCCESS! Processing success flow...');

      // Apply promo code if exists
      if (appliedPromoCode && user?._id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promocodes/apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: appliedPromoCode.code,
              userId: user._id,
              orderId: result.order.orderId
            }),
          });
        } catch (error) {
          console.error('Error applying promo code:', error);
        }
      }

      // Prepare success modal data BEFORE clearing cart to avoid state issues
      console.log('Preparing success modal data...');
      const successData = {
        orderId: result?.order?.orderId || 'Unknown',
        total: Math.ceil(finalTotalWithDelivery || 0), // Use Math.ceil to match backend calculation
        paymentMethod: selectedPaymentMethod,
        estimatedDelivery: deliveryInfo?.estimatedDeliveryTime,
        itemCount: cartItemsWithCODInfo.length
      };
      console.log('Success data prepared:', successData);

      // Clear both timeouts since we succeeded
      if (timeoutId) {
        console.log('Clearing timeout...');
        clearTimeout(timeoutId);
      }
      if (emergencyTimeoutId) clearTimeout(emergencyTimeoutId);

      // Handle success regardless of component mount state
      console.log('Checking if component is mounted:', isMountedRef.current);
      
      if (isMountedRef.current) {
        console.log('Component mounted - Setting success modal state...');
        setIsValidatingPayment(false); // Stop loading first
        console.log('Loading state set to false');
        
        setSuccessOrderData(successData);
        console.log('Success order data set');
        
        setShowSuccessModal(true);
        console.log('Success modal visibility set to true');

        // Clear the cart after setting success modal (prevents state access issues)
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log('Clearing cart context and Redux...');
            dispatch(clearCart());
            clearCartContext();
          }
        }, 100);
      } else {
        console.log('Component not mounted - Still showing success modal...');
        // Component unmounted during order creation, but order was successful
        // Clear cart but still show the modal by persisting data
        dispatch(clearCart());
        clearCartContext();
        
        // Store success data in localStorage to persist across navigation
        localStorage.setItem('orderSuccessData', JSON.stringify(successData));
        
        // Redirect to home page and trigger modal there
        setTimeout(() => {
          router.push('/?showOrderSuccess=true');
        }, 1000);
      }

    } catch (error) {
      // Clear both timeouts since we're handling the error
      if (timeoutId) clearTimeout(timeoutId);
      if (emergencyTimeoutId) clearTimeout(emergencyTimeoutId);
      
      console.error('Order creation error:', error);
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
        toast.error(errorMessage);
        setIsValidatingPayment(false);
      }
    }
  };

  const renderPaymentMethodContent = () => {
    switch (selectedPaymentMethod) {
      case 'wallet':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Select Wallet</h3>
            <div className="grid grid-cols-2 gap-3">
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.name}
                  onClick={() => setSelectedWallet(wallet.name)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedWallet === wallet.name
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-medium">{wallet.name}</span>
                    </div>
                    <span className="text-sm font-medium">{wallet.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Add Credit/Debit Card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Your card details are encrypted and secure</span>
            </div>
          </div>
        );

      case 'netbanking':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Select Your Bank</h3>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {bankOptions.map((bank) => (
                <div
                  key={bank}
                  onClick={() => setSelectedBank(bank)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${selectedBank === bank
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <span className="font-medium">{bank}</span>
                  {selectedBank === bank && <Check className="h-5 w-5 text-green-500" />}
                </div>
              ))}
            </div>
          </div>
        );

      case 'upi':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">UPI Payment</h3>

            <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">UPI</div>
                  <span className="font-semibold">{upiId}</span>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-green-700 mt-2">Ready to pay with this UPI ID</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Or add new UPI ID</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Button
                  onClick={() => {
                    if (newUpiId) {
                      setUpiId(newUpiId);
                      setNewUpiId('');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Popular UPI Apps</h4>
              <div className="flex gap-3">
                {['GPay', 'PhonePe', 'BHIM', 'Paytm'].map((app) => (
                  <div key={app} className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium">
                    {app}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cod':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Cash on Delivery</h3>
            {validationErrors.codNotAvailable ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-1">
                    <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800">COD Not Available</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {validationErrors.codNotAvailable}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Cash on Delivery</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Pay cash to our delivery partner when your order arrives.
                    </p>

                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Google Maps logic for Add Address Modal
  useEffect(() => {
    if (!showAddAddressModal) return;
    let map: any;
    let marker: any;
    let autocomplete: any;
    let googleScript: HTMLScriptElement | null = null;

    function loadGoogleMapsScript(callback: () => void) {
      if (window.google && window.google.maps) {
        callback();
        return;
      }
      googleScript = document.createElement("script");
      googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleScript.async = true;
      googleScript.onload = callback;
      document.body.appendChild(googleScript);
    }

    function initMap() {
      if (!mapRef.current || !window.google || !window.google.maps) return;
      const center = {
        lat: addressForm.lat || 28.6139,
        lng: addressForm.lng || 77.2090
      };
      map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        rotateControl: false,
        scaleControl: false,
      });
      mapInstance.current = map;
      marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });
      markerInstance.current = marker;
      fetchAddress(center.lat, center.lng, setAddressForm);
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        fetchAddress(pos.lat(), pos.lng(), setAddressForm);
      });
      map.addListener("click", (e: any) => {
        marker.setPosition(e.latLng);
        fetchAddress(e.latLng.lat(), e.latLng.lng(), setAddressForm);
      });
      if (inputRef.current) {
        try {
          autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
          console.log('[Autocomplete] Attached to inputRef', inputRef.current);
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            console.log('[Autocomplete] place_changed event:', place);
            if (!place.geometry) {
              console.warn('[Autocomplete] No geometry for selected place:', place);
              return;
            }
            map.panTo(place.geometry.location);
            map.setZoom(16);
            marker.setPosition(place.geometry.location);
            fetchAddress(place.geometry.location.lat(), place.geometry.location.lng(), setAddressForm);
          });
        } catch (err) {
          console.error('[Autocomplete] Failed to attach:', err);
        }
      } else {
        console.warn('[Autocomplete] inputRef.current is null, cannot attach Autocomplete');
      }
    }

    loadGoogleMapsScript(initMap);

    return () => {
      if (googleScript) {
        document.body.removeChild(googleScript);
      }
    };
  }, [showAddAddressModal]);

  // Fetch current location automatically when adding a new address
  useEffect(() => {
    if (showAddAddressModal) {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setAddressForm((prev) => ({ ...prev, lat, lng }));
          if (mapInstance.current && window.google && window.google.maps) {
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(16);
            markerInstance.current.setPosition({ lat, lng });
            fetchAddress(lat, lng, setAddressForm);
          }
        },
        () => { }
      );
    }
  }, [showAddAddressModal]);

  // Ensure Google Places Autocomplete dropdown is positioned correctly
  useEffect(() => {
    if (!showAddAddressModal) return;
    let observer: MutationObserver | null = null;
    function positionPacContainer() {
      const input = inputRef.current;
      const pac = document.querySelector('.pac-container') as HTMLElement;
      if (input && pac) {
        const rect = input.getBoundingClientRect();
        pac.style.width = rect.width + 'px';
        pac.style.position = 'fixed';
        pac.style.left = rect.left + 'px';
        pac.style.top = rect.bottom + 'px';
        pac.style.zIndex = '99999';
      }
    }
    observer = new MutationObserver(positionPacContainer);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', positionPacContainer, true);
    window.addEventListener('resize', positionPacContainer);
    setTimeout(positionPacContainer, 500);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', positionPacContainer, true);
      window.removeEventListener('resize', positionPacContainer);
    };
  }, [showAddAddressModal]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (mapInstance.current && window.google && window.google.maps) {
          mapInstance.current.setCenter({ lat, lng });
          mapInstance.current.setZoom(16);
          markerInstance.current.setPosition({ lat, lng });
          fetchAddress(lat, lng, setAddressForm);
        }
      },
      () => { }
    );
  }

  // Show loading if user is not authenticated
  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
          {/* Payment Methods - Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h2>

              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  const isCODDisabled = method.id === 'cod' && (!isCODAvailableForCart || validationErrors.codNotAvailable);

                  return (
                    <div
                      key={method.id}
                      onClick={() => !isCODDisabled && setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-xl transition-all ${isCODDisabled
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedPaymentMethod === method.id
                            ? 'border-green-500 bg-green-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${selectedPaymentMethod === method.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{method.name}</h3>
                              {method.popular && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-transform ${selectedPaymentMethod === method.id ? 'rotate-90 text-green-500' : 'text-gray-400'
                          }`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Details */}
              <div className="border-t pt-6">
                {renderPaymentMethodContent()}
              </div>
            </div>

            {/* Loading Delivery Calculation */}
            {loadingDelivery && selectedAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Calculating Delivery</h3>
                    <p className="text-sm text-blue-700">Please wait while we calculate delivery charges for your selected address...</p>
                  </div>
                </div>
              </div>
            )}



            {/* Pay Now Button */}
            <Button
              onClick={handlePayment}
              disabled={isValidatingPayment || loadingDelivery || Object.values(validationErrors).some(error => error)}
              className={`w-full py-4 text-lg rounded-xl shadow-lg transition-all duration-300 ${isValidatingPayment || loadingDelivery || Object.values(validationErrors).some(error => error)
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-xl hover:scale-105'
                }`}
            >
              {isValidatingPayment ? (
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validating...
                </div>
              ) : loadingDelivery ? (
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculating Delivery...
                </div>
              ) : (
                <span className={Object.values(validationErrors).some(error => error) ? "text-gray-600" : "text-white"}>
                  {selectedPaymentMethod === 'cod' 
                    ? `Place Your Order - ₹${Math.ceil(finalTotalWithDelivery)}`
                    : `Pay ₹${Math.ceil(finalTotalWithDelivery)}`
                  }
                </span>
              )}
            </Button>
          </div>

          {/* Order Summary - Right Panel */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-4 lg:max-h-screen lg:overflow-y-auto">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  disabled={isLoadingAddresses}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Change
                </Button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No delivery address found</p>
                  <Button
                    onClick={() => {
                      setAddressForm({});
                      setShowAddAddressModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
              ) : (
                <>
                  {selectedAddress && addresses.find(addr => addr.id === selectedAddress) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-bold text-gray-900">
                          {addresses.find(addr => addr.id === selectedAddress)?.type}
                        </span>
                        {addresses.find(addr => addr.id === selectedAddress)?.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        <p>
                          {addresses.find(addr => addr.id === selectedAddress)?.building}
                          {addresses.find(addr => addr.id === selectedAddress)?.floor && `, Floor ${addresses.find(addr => addr.id === selectedAddress)?.floor}`},
                          {addresses.find(addr => addr.id === selectedAddress)?.area}
                          {addresses.find(addr => addr.id === selectedAddress)?.landmark && `, Near ${addresses.find(addr => addr.id === selectedAddress)?.landmark}`}
                        </p>

                      </div>
                      {addresses.find(addr => addr.id === selectedAddress)?.phone && (
                        <p className="text-sm font-bold text-gray-600 flex items-center gap-1">
                          <Smartphone className="h-4 w-4 mr-1 text-gray-500" />
                          {addresses.find(addr => addr.id === selectedAddress)?.phone}
                        </p>
                      )}
                      {addresses.find(addr => addr.id === selectedAddress)?.additionalInstructions && (
                        <p className="text-sm text-gray-600 italic">
                          Note: {addresses.find(addr => addr.id === selectedAddress)?.additionalInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Single Warehouse Order Items */}
              {Object.entries(itemsByWarehouse).map(([warehouseId, { items, warehouse }]) => {
                const isGlobal = warehouse.deliverySettings?.is24x7Delivery === true;
                
                return (
                  <div key={warehouseId} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {isGlobal ? (
                          <Globe className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Store className="h-4 w-4 text-green-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                      </div>
                      {isGlobal && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          24x7 Delivery
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {items.map((item: CartItem, index: number) => (
                        <div key={`${item.id || item._id}-${index}`} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          {item.image && (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500 mb-1">
                              {warehouse.name || 'Unknown Warehouse'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>Qty: {item.quantity}</span>
                              {item.tax && item.tax.percentage && (
                                <>
                                  <span>•</span>
                                  <span>{item.tax.percentage}%-{item.priceIncludesTax ? 'Incl.' : 'Excl.'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="border-t pt-4 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-lg">
                  <span className="text-gray-700">Subtotal (Before Tax)</span>
                  <span className="font-semibold text-gray-900">₹{subtotalBeforeTax.toFixed(2)}</span>
                </div>

                {/* Discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Tax Breakdown */}
                {taxCalculation && (
                  <div className="space-y-2">
                    {taxCalculation.isInterState ? (
                      // Interstate - Show IGST
                      taxCalculation.totalIGST > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            IGST
                          </span>
                          <span className="text-gray-900">₹{taxCalculation.totalIGST.toFixed(2)}</span>
                        </div>
                      )
                    ) : (
                      // Intrastate - Show CGST + SGST
                      <>
                        {taxCalculation.totalCGST > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              CGST
                            </span>
                            <span className="text-gray-900">₹{taxCalculation.totalCGST.toFixed(2)}</span>
                          </div>
                        )}
                        {taxCalculation.totalSGST > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              SGST
                            </span>
                            <span className="text-gray-900">₹{taxCalculation.totalSGST.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {taxCalculation.totalTax > 0 && (
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span className="text-gray-700">Total Tax</span>
                        <span className="text-gray-900">₹{taxCalculation.totalTax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Charges */}
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">Delivery Charges</span>
                  </div>
                  <div className="text-right">
                    {loadingDelivery ? (
                      <span className="text-gray-400">Calculating...</span>
                    ) : deliveryInfo ? (
                      <span className={deliveryInfo.isFreeDelivery ? "text-green-600 font-medium" : "text-gray-900"}>
                        {formatDeliveryChargeWithDecimals(deliveryInfo.deliveryCharge)}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{Math.ceil(finalTotalWithDelivery)}
                    </span>
                  </div>
                </div>
              </div>


              {/* Delivery Eligibility Message */}
              {deliveryInfo && (
                <div className={`mt-4 p-4 rounded-xl border ${deliveryInfo.isFreeDelivery
                    ? 'bg-green-50 border-green-200'
                    : deliveryInfo.freeDeliveryEligible
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className={`text-sm ${deliveryInfo.isFreeDelivery
                      ? 'text-green-800'
                      : deliveryInfo.freeDeliveryEligible
                        ? 'text-blue-800'
                        : 'text-gray-800'
                    }`}>
                    {deliveryInfo.isFreeDelivery ? (
                      <>
                        <div className="font-semibold mb-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          🎉 Free Delivery!
                        </div>
                        <div>Your order qualifies for free delivery!</div>
                        <div className="text-xs mt-2 flex items-center gap-1 text-green-600">
                          <Clock className="h-3 w-3" />
                          Estimated delivery: {getDeliveryTimeEstimate(deliveryInfo.distance)}
                        </div>
                      </>
                    ) : deliveryInfo.freeDeliveryEligible && deliveryInfo.amountNeededForFreeDelivery > 0 && deliveryInfo.distance <= 25 ? (
                      <>
                        <div className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Add ₹{deliveryInfo.amountNeededForFreeDelivery.toFixed(2)} more to get free delivery
                        </div>
                        <Link href="/search" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-sm font-medium">
                          Continue shopping →
                        </Link>
                        <div className="text-xs mt-2 flex items-center gap-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          Estimated delivery: {getDeliveryTimeEstimate(deliveryInfo.distance)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold mb-1 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Charge: {formatDeliveryChargeWithDecimals(deliveryInfo.deliveryCharge)}
                        </div>
                        <div className="mb-2">Distance: {deliveryInfo.distance.toFixed(1)} km from warehouse</div>
                        <div className="text-xs flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          Estimated delivery: 30-45 minutes
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {loadingDelivery && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Calculating delivery charges...
                  </div>
                </div>
              )}



              {/* Promo Code Section - Compact */}
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="space-y-2">
                  <PromoCodeInput
                    cartTotal={cartTotal}
                    cartItems={cartItems}
                    userId={user?._id}
                    onPromoCodeApplied={handlePromoCodeApplied}
                    onPromoCodeRemoved={handlePromoCodeRemoved}
                    appliedPromoCode={appliedPromoCode}
                  />
                </div>

                {/* Available Promocodes - Collapsible */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    <span>View available offers</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto">
                    <AvailablePromocodes
                      cartTotal={cartTotal}
                      cartItems={cartItems}
                      userId={user?._id}
                      onPromoCodeSelect={handlePromoCodeSelect}
                      appliedPromoCode={appliedPromoCode}
                    />
                  </div>
                </details>
              </div>
            </div>



          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Select Delivery Address</h2>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No addresses found</p>
                  <Button
                    onClick={() => {
                      setAddressForm({});
                      setShowAddAddressModal(true);
                      setShowAddressModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedAddress === address.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedAddress(address.id);
                        setShowAddressModal(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{address.type}</span>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            <p>
                              {address.building}
                              {address.floor && `, Floor ${address.floor}`},
                              {address.area}
                              {address.landmark && `, Near ${address.landmark}`}
                            </p>
                            <p className="text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                          {address.phone && (
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              {address.phone}
                            </p>
                          )}
                        </div>
                        {selectedAddress === address.id && (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => {
                      setAddressForm({});
                      setShowAddAddressModal(true);
                      setShowAddressModal(false);
                    }}
                    variant="outline"
                    className="w-full mt-4 border-dashed border-2 border-gray-300 hover:border-green-500 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add New Address</h2>
                <button
                  onClick={() => setShowAddAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                // Basic validation
                if (!addressForm.name || !addressForm.building || !addressForm.area || 
                    !addressForm.city || !addressForm.state || !addressForm.pincode) {
                  toast.error('Please fill in all required fields');
                  return;
                }
                handleAddAddress(addressForm as Omit<Address, 'id'>);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type *
                    </label>
                    <select
                      value={addressForm.type || 'Home'}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressForm.name || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building/House No. *
                  </label>
                  <input
                    type="text"
                    value={addressForm.building || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, building: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressForm.floor || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, floor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area/Locality *
                    </label>
                    <input
                      type="text"
                      value={addressForm.area || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, area: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.landmark || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={addressForm.pincode || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    value={addressForm.additionalInstructions || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="setDefault"
                    checked={addressForm.isDefault || false}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="setDefault" className="text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddAddressModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingAddress}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isAddingAddress ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Address'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Unavailable Modal */}
      <DeliveryUnavailableModal
        isOpen={showDeliveryUnavailableModal}
        onClose={() => setShowDeliveryUnavailableModal(false)}
        unavailablePincode={unavailablePincode}
        onShowAddressModal={() => setShowAddressModal(true)}
      />

      {/* Undeliverable Items Modal */}
      {showUndeliverableItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Store className="h-6 w-6 text-orange-500" />
                  Delivery Options Available
                </h2>
                <button
                  onClick={() => setShowUndeliverableItemsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-orange-800 text-sm font-semibold mb-2">
                    Some items in your cart cannot be delivered to your current address:
                  </p>
                  <ul className="text-orange-700 text-sm space-y-1">
                    {undeliverableItems.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Choose how you'd like to proceed:</h3>
                  
                  <button
                    onClick={() => {
                      setShowUndeliverableItemsModal(false);
                      // Switch to online payment method
                      setSelectedPaymentMethod('upi');
                      toast.success('Switched to online payment. Complete your order and we\'ll arrange delivery for all items.');
                    }}
                    className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">
                          Pay Online & Get All Items Delivered
                        </div>
                        <div className="text-sm text-gray-600">
                          Complete your order with online payment. We'll arrange delivery for all items including those not available for COD.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUndeliverableItemsModal(false);
                      // Here you would implement logic to remove undeliverable items
                      // For now, we'll show a toast with guidance
                      toast('Please remove the highlighted items from your cart to proceed with COD delivery.', {
                        duration: 5000,
                        icon: '📦'
                      });
                    }}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">
                          Remove Items & Continue with COD
                        </div>
                        <div className="text-sm text-gray-600">
                          Remove the items that can't be delivered and proceed with Cash on Delivery for the remaining items.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUndeliverableItemsModal(false);
                      setShowAddressModal(true);
                    }}
                    className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">
                          Try Different Address
                        </div>
                        <div className="text-sm text-gray-600">
                          Select a different delivery address that might be within the delivery zone for all items.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUndeliverableItemsModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isValidatingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Your Order
            </h3>
            <p className="text-gray-600 mb-4">
              Please wait while we create your order...
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successOrderData && (
        <OrderSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('/');
          }}
          orderData={successOrderData}
          onViewOrder={() => {
            setShowSuccessModal(false);
            router.push('/account?tab=orders');
          }}
        />
      )}
    </div>
  );
}
