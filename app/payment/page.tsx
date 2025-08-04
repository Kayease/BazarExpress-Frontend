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
import { useAppSelector } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PromoCodeInput from "@/components/PromoCodeInput";
import AvailablePromocodes from "@/components/AvailablePromocodes";
import toast from "react-hot-toast";
import { calculateDeliveryChargeAPI, formatDeliveryCharge, getDeliveryTimeEstimate, fetchDeliverySettings, DeliveryCalculationResult } from "@/lib/delivery";
import DeliveryAvailabilityChecker from "@/components/DeliveryAvailabilityChecker";
import { validateCartDelivery, CartValidationResponse } from "@/lib/location";
import CartValidationAlert from "@/components/CartValidationAlert";
import { calculateCartTax, CartTaxCalculation, isInterStateTransaction, formatTaxAmount } from "@/lib/tax-calculation";

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

export default function PaymentPage() {
  const { cartItems, cartTotal } = useCartContext();
  const router = useRouter();
  const user = useAppSelector((state: any) => state?.auth?.user);
  const token = useAppSelector((state: any) => state?.auth?.token);

  // Process cart items with COD availability info
  const cartItemsWithCODInfo = cartItems.map((item: any) => ({
    ...item,
    codAvailable: item.codAvailable !== undefined ? item.codAvailable : true
  }));

  // Group cart items by warehouse
  const groupItemsByWarehouse = useCallback((items: CartItem[]) => {
    const grouped: { [warehouseId: string]: { items: CartItem[], warehouse: any } } = {};
    
    items.forEach(item => {
      const warehouseId = item.warehouse?._id || item.warehouse?.id || item.warehouseId || 'unknown';
      const warehouseInfo = item.warehouse || { 
        _id: warehouseId, 
        id: warehouseId,
        name: 'Unknown Warehouse', 
        deliverySettings: { is24x7Delivery: false } 
      };
      
      if (!grouped[warehouseId]) {
        grouped[warehouseId] = {
          items: [],
          warehouse: warehouseInfo
        };
      }
      
      grouped[warehouseId].items.push(item);
    });
    
    return grouped;
  }, []);

  const itemsByWarehouse = useMemo(() => groupItemsByWarehouse(cartItemsWithCODInfo), [cartItemsWithCODInfo, groupItemsByWarehouse]);
  
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
  
  // Mixed warehouse delivery states
  const [mixedWarehouseDelivery, setMixedWarehouseDelivery] = useState<MixedWarehouseDelivery | null>(null);
  const [loadingMixedDelivery, setLoadingMixedDelivery] = useState(false);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidatingPayment, setIsValidatingPayment] = useState(false);
  
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

  // State to trigger delivery calculation retry
  const [shouldRetryDelivery, setShouldRetryDelivery] = useState(false);

  // Helper function to show error toast only if not shown recently
  const showErrorToast = useCallback((message: string, cooldownMs: number = 3000) => {
    const now = Date.now();
    if (lastErrorMessage !== message || (now - lastErrorTime) > cooldownMs) {
      toast.error(message);
      setLastErrorMessage(message);
      setLastErrorTime(now);
    }
  }, [lastErrorMessage, lastErrorTime]);

  // Helper function to show success toast only if not shown recently
  const showSuccessToast = useCallback((message: string, cooldownMs: number = 2000) => {
    const now = Date.now();
    if (lastErrorMessage !== message || (now - lastErrorTime) > cooldownMs) {
      toast.success(message);
      setLastErrorMessage(message);
      setLastErrorTime(now);
    }
  }, [lastErrorMessage, lastErrorTime]);

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
    if (!selectedAddress) {
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

    const itemsWithoutWarehouse = cartItemsForValidation.filter(item => !item.warehouseId);
    if (itemsWithoutWarehouse.length > 0) {
      console.warn('Some cart items missing warehouse information:', itemsWithoutWarehouse);
    }

    const validItems = cartItemsForValidation.filter(item => item.warehouseId);
    if (validItems.length === 0) {
      setValidationErrors(prev => ({
        ...prev,
        deliveryNotAvailable: 'Unable to validate delivery for cart items. Please contact support.'
      }));
      return false;
    }

    setIsValidatingCart(true);
    
    try {
      const selectedAddrObj = addresses.find(a => a.id === selectedAddress);
      if (!selectedAddrObj) {
        setValidationErrors(prev => ({
          ...prev,
          addressRequired: 'Selected address not found.'
        }));
        return false;
      }

      const validation = await validateCartDelivery(validItems, {
        lat: selectedAddrObj.lat!,
        lng: selectedAddrObj.lng!,
        address: `${selectedAddrObj.building}, ${selectedAddrObj.area}, ${selectedAddrObj.city}`,
        pincode: selectedAddrObj.pincode
      });

      setCartValidation(validation);

      if (!validation.success) {
        setValidationErrors(prev => ({
          ...prev,
          deliveryNotAvailable: validation.error || 'Failed to validate cart delivery'
        }));
        return false;
      }

      if (!validation.allItemsDeliverable) {
        const undeliverableNames = validation.undeliverableItems.map(item => item.name).join(', ');
        setValidationErrors(prev => ({
          ...prev,
          deliveryNotAvailable: `Some items cannot be delivered to your address: ${undeliverableNames}. Please select an address within the delivery zone or remove these items from your cart.`
        }));
        return false;
      }

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
      setIsValidatingCart(false);
    }
  };

  const validatePayment = async (): Promise<boolean> => {
    const isCODValid = validateCODAvailability();
    const isDeliveryValid = validateDeliveryArea();
    const isWarehouseOperational = validateWarehouseOperationalHours();
    const isAddressValid = validateAddress();
    
    const isCartValid = await validateCartForDelivery();
    
    return isCODValid && isDeliveryValid && isWarehouseOperational && isAddressValid && isCartValid;
  };

  // Format delivery charges to 2 decimal places
  const formatDeliveryChargeWithDecimals = (charge: number): string => {
    if (charge === 0) {
      return 'FREE';
    }
    return `₹${charge.toFixed(2)}`;
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
    if (showAddressModal || showAddAddressModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddressModal, showAddAddressModal]);

  // Check authentication and fetch addresses
  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }
    fetchUserAddresses();
    loadDeliverySettings();
  }, [user, token, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/');
      return;
    }
  }, [cartItems, router]);

  // Calculate delivery when address or payment method changes
  useEffect(() => {
    if (selectedAddress && addresses.length > 0 && !loadingDelivery && !loadingMixedDelivery) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      if (address) {
        const addressKey = getAddressKey(address);
        if (failedDeliveryAddresses.has(addressKey)) {
          console.log('Skipping delivery calculation for previously failed address:', addressKey);
          return;
        }
        
        const warehouseIds = Object.keys(itemsByWarehouse);
        if (warehouseIds.length > 1) {
          calculateMixedWarehouseDelivery(address);
        } else {
          calculateDelivery(address);
        }
      }
    }
  }, [selectedAddress, addresses, selectedPaymentMethod, itemsByWarehouse, shouldRetryDelivery, failedDeliveryAddresses, loadingDelivery, loadingMixedDelivery, getAddressKey]);

  // Recalculate delivery when discount amount changes (with debounce)
  useEffect(() => {
    if (selectedAddress && addresses.length > 0 && deliveryInfo && !loadingDelivery) {
      const timeoutId = setTimeout(() => {
        const address = addresses.find(addr => addr.id === selectedAddress);
        if (address) {
          const warehouseIds = Object.keys(itemsByWarehouse);
          if (warehouseIds.length > 1) {
            calculateMixedWarehouseDelivery(address);
          } else {
            calculateDelivery(address);
          }
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [discountAmount]);

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

  // Calculate mixed warehouse delivery charges
  const calculateMixedWarehouseDelivery = useCallback(async (address: Address) => {
    if (loadingMixedDelivery) {
      console.log('Mixed warehouse delivery calculation already in progress, skipping...');
      return;
    }

    const addressKey = getAddressKey(address);
    if (failedDeliveryAddresses.has(addressKey)) {
      console.log('Skipping mixed warehouse delivery calculation for previously failed address:', addressKey);
      return;
    }

    if (!address.lat || !address.lng) {
      console.log('Address missing coordinates:', address);
      return;
    }

    if (!address.pincode) {
      console.log('Address missing pincode:', address);
      showErrorToast('Address pincode is required for delivery calculation. Please select a valid address.');
      return;
    }

    const lat = Number(address.lat);
    const lng = Number(address.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates:', { lat, lng });
      return;
    }

    try {
      setLoadingMixedDelivery(true);
      
      const cartItemsByWarehouse: { [warehouseId: string]: any[] } = {};
      Object.entries(itemsByWarehouse).forEach(([warehouseId, { items }]) => {
        cartItemsByWarehouse[warehouseId] = items.map(item => ({
          id: item.id || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          warehouse: item.warehouse
        }));
      });

      console.log('Calculating mixed warehouse delivery:', {
        customerLat: lat,
        customerLng: lng,
        cartItemsByWarehouse,
        paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
        customerPincode: address.pincode
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery/calculate-mixed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerLat: lat,
          customerLng: lng,
          cartItemsByWarehouse,
          paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
          customerPincode: address.pincode
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMixedWarehouseDelivery(data);
        console.log('Mixed warehouse delivery calculated:', data);
        
        const addressKey = getAddressKey(address);
        setFailedDeliveryAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(addressKey);
          return newSet;
        });
      } else {
        console.error('Mixed warehouse delivery calculation failed:', data.error);
        
        const addressKey = getAddressKey(address);
        setFailedDeliveryAddresses(prev => new Set(prev).add(addressKey));
        
        // Handle specific error cases for pincode-based delivery
        let errorMessage = data.error || 'Unable to calculate delivery for mixed warehouse items. Please try a different address.';
        if (errorMessage.includes('No warehouse available')) {
          errorMessage = `Delivery not available to pincode ${address.pincode}. Please check if this pincode is covered by our delivery network or try a different address.`;
        }
        
        showErrorToast(errorMessage);
        setMixedWarehouseDelivery(null);
      }
    } catch (error) {
      console.error('Error calculating mixed warehouse delivery:', error);
      
      const addressKey = getAddressKey(address);
      setFailedDeliveryAddresses(prev => new Set(prev).add(addressKey));
      
      showErrorToast('Unable to calculate delivery for mixed warehouse items. Please try a different address.');
      setMixedWarehouseDelivery(null);
    } finally {
      setLoadingMixedDelivery(false);
    }
  }, [loadingMixedDelivery, getAddressKey, failedDeliveryAddresses, itemsByWarehouse, selectedPaymentMethod, showErrorToast]);

  // Calculate delivery charges
  const calculateDelivery = useCallback(async (address: Address) => {
    if (loadingDelivery) {
      console.log('Delivery calculation already in progress, skipping...');
      return;
    }

    const addressKey = getAddressKey(address);
    if (failedDeliveryAddresses.has(addressKey)) {
      console.log('Skipping delivery calculation for previously failed address:', addressKey);
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
      
      console.log('Calculating delivery for:', { 
        lat: Number(address.lat), 
        lng: Number(address.lng), 
        cartTotal: cartTotal - discountAmount, 
        paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'online',
        pincode: address.pincode
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delivery calculation timeout')), 15000)
      );
      
      try {
        const result = await Promise.race([
          calculateDeliveryChargeAPI(
            lat,
            lng,
            cartTotal - discountAmount,
            selectedPaymentMethod === 'cod' ? 'cod' : 'online',
            undefined, // warehouseId
            address.pincode // customerPincode
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
            errorMessage = `Delivery not available to pincode ${address.pincode}. Please check if this pincode is covered by our delivery network or try a different address.`;
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
          
          const addressKey = getAddressKey(address);
          setFailedDeliveryAddresses(prev => {
            const newSet = new Set(prev);
            newSet.delete(addressKey);
            return newSet;
          });
          
          if (result.calculationMethod === 'osrm') {
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
        
        showErrorToast(error instanceof Error ? error.message : 'Unable to calculate delivery for this address. Please try a different address or contact support.');
        
        setDeliveryInfo(null);
      }
    } catch (error) {
      console.error('Error in delivery calculation:', error);
      
      const addressKey = getAddressKey(address);
      setFailedDeliveryAddresses(prev => new Set(prev).add(addressKey));
      
      showErrorToast(error instanceof Error ? error.message : 'Unable to calculate delivery for this address. Please try a different address or contact support.');
      setDeliveryInfo(null);
    } finally {
      setLoadingDelivery(false);
    }
  }, [loadingDelivery, getAddressKey, failedDeliveryAddresses, showErrorToast, cartTotal, discountAmount, selectedPaymentMethod, showSuccessToast]);

  // Calculate tax for cart items
  const calculateTaxForCart = () => {
    if (!selectedAddress || addresses.length === 0) return null;
    
    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    if (!selectedAddr) return null;
    
    const warehouseState = "Delhi";
    const isInterState = isInterStateTransaction(selectedAddr.state, warehouseState);
    
    const cartItemsForTax = cartItemsWithCODInfo.map((item: any) => ({
      price: item.price,
      priceIncludesTax: item.priceIncludesTax || false,
      tax: item.tax ? {
        id: item.tax._id,
        name: item.tax.name,
        percentage: item.tax.percentage,
        description: item.tax.description
      } : null,
      quantity: item.quantity
    }));
    
    return calculateCartTax(cartItemsForTax, isInterState);
  };

  // Calculate tax when cart items or address changes
  useEffect(() => {
    const taxCalc = calculateTaxForCart();
    setTaxCalculation(taxCalc);
  }, [cartItems, selectedAddress, addresses]);

  // Calculate final total with discount, tax, and delivery
  const subtotalAfterDiscount = cartTotal - discountAmount;
  const taxAmount = taxCalculation?.totalTax || 0;
  
  const deliveryCharge = mixedWarehouseDelivery?.totalDeliveryCharge || deliveryInfo?.deliveryCharge || 0;
  const finalTotalWithDelivery = subtotalAfterDiscount + taxAmount + deliveryCharge;

  const handlePayment = async () => {
    setIsValidatingPayment(true);
    
    const isValid = await validatePayment();
    
    if (!isValid) {
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

    try {
      if (appliedPromoCode && user?._id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promocodes/apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: appliedPromoCode.code,
              userId: user._id,
              orderId: `ORDER_${Date.now()}`
            }),
          });

          if (!response.ok) {
            console.error('Failed to apply promo code');
          }
        } catch (error) {
          console.error('Error applying promo code:', error);
        }
      }

      console.log('Processing payment with method:', selectedPaymentMethod);
      console.log('Final amount:', finalTotalWithDelivery);
      console.log('Delivery info:', deliveryInfo);
      
      toast.success('Payment validation successful! Processing payment...');
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsValidatingPayment(false);
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
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedWallet === wallet.name
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
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                    selectedBank === bank
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
        () => {}
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
      () => {}
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
                  const isCODDisabled = method.id === 'cod' && validationErrors.codNotAvailable;
                  
                  return (
                    <div
                      key={method.id}
                      onClick={() => !isCODDisabled && setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        isCODDisabled 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedPaymentMethod === method.id
                            ? 'border-green-500 bg-green-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            selectedPaymentMethod === method.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
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
                        <ChevronRight className={`h-5 w-5 transition-transform ${
                          selectedPaymentMethod === method.id ? 'rotate-90 text-green-500' : 'text-gray-400'
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

            {/* Validation Errors Display */}
            {Object.values(validationErrors).some(error => error) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Please resolve the following issues:
                </h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {validationErrors.addressRequired && (
                    <li>• {validationErrors.addressRequired}</li>
                  )}
                  {validationErrors.codNotAvailable && (
                    <li>• {validationErrors.codNotAvailable}</li>
                  )}
                  {validationErrors.deliveryNotAvailable && (
                    <li>• {validationErrors.deliveryNotAvailable}</li>
                  )}
                  {validationErrors.warehouseNotOperational && (
                    <li>• {validationErrors.warehouseNotOperational}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Pay Now Button */}
            <Button 
              onClick={handlePayment}
              disabled={isValidatingPayment || loadingDelivery || Object.values(validationErrors).some(error => error)}
              className={`w-full py-4 text-lg rounded-xl shadow-lg transition-all duration-300 ${
                isValidatingPayment || loadingDelivery || Object.values(validationErrors).some(error => error)
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
              ) : Object.values(validationErrors).some(error => error) ? (
                <span className="text-gray-600">Resolve Issues to Continue</span>
              ) : (
                <span className="text-white">Pay ₹{finalTotalWithDelivery.toFixed(2)}</span>
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
              
              {/* Items grouped by warehouse */}
              <div className="space-y-4 mb-5">
                {Object.entries(itemsByWarehouse).map(([warehouseId, { items, warehouse }]) => {
                  const warehouseSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const warehouseType = warehouse.deliverySettings?.is24x7Delivery ? 'Global/24x7' : 'Custom Hour';
                  
                  return (
                    <div key={warehouseId} className="border border-gray-200 rounded-lg p-4">
                      {/* Warehouse Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{warehouse.name}</h3>
                          <Badge variant={warehouse.deliverySettings?.is24x7Delivery ? "default" : "secondary"} className="text-xs">
                            {warehouseType}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          ₹{warehouseSubtotal.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Items from this warehouse */}
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {/* Product Image */}
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-10 h-10"
                                />
                              ) : (
                                <Image
                                  src="/placeholder.svg"
                                  alt="No image"
                                  width={40}
                                  height={40}
                                  className="object-cover w-10 h-10"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm leading-tight">{item.name}</h4>
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Warehouse delivery info */}
                      {mixedWarehouseDelivery?.warehouseResults?.[warehouseId] && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Delivery ({mixedWarehouseDelivery.warehouseResults[warehouseId].distance?.toFixed(1)} km)</span>
                            <span>₹{mixedWarehouseDelivery.warehouseResults[warehouseId].deliveryInfo?.deliveryCharge?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                
                {/* Promo Discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({appliedPromoCode?.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Tax Breakdown */}
                {taxCalculation && taxCalculation.totalTax > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal (after discount)</span>
                      <span>₹{subtotalAfterDiscount.toFixed(2)}</span>
                    </div>
                    
                    {taxCalculation.isInterState ? (
                      <div className="flex justify-between text-gray-600">
                        <span>IGST @ {taxCalculation.taxBreakdown.igst.percentage.toFixed(1)}%</span>
                        <span>{formatTaxAmount(taxCalculation.totalIGST)}</span>
                      </div>
                    ) : (
                      <>
                                                <div className="flex justify-between text-gray-600">
                          <span>CGST @ {taxCalculation.taxBreakdown.cgst.percentage.toFixed(1)}%</span>
                          <span>{formatTaxAmount(taxCalculation.totalCGST)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>SGST @ {taxCalculation.taxBreakdown.sgst.percentage.toFixed(1)}%</span>
                          <span>{formatTaxAmount(taxCalculation.totalSGST)}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between text-gray-800 font-medium">
                      <span>Total Tax</span>
                      <span>{formatTaxAmount(taxCalculation.totalTax)}</span>
                    </div>
                  </div>
                )}
                
                {/* Dynamic Delivery Fee */}
                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Total Delivery Fee</span>
                    {Object.keys(itemsByWarehouse).length > 1 && (
                      <span className="text-xs text-gray-400">
                        ({Object.keys(itemsByWarehouse).length} warehouses)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {(loadingDelivery || loadingMixedDelivery) ? (
                      <span className="text-gray-400">Calculating...</span>
                    ) : mixedWarehouseDelivery ? (
                      <span className="text-gray-900">
                        ₹{mixedWarehouseDelivery.totalDeliveryCharge?.toFixed(2) || '0.00'}
                      </span>
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
                      ₹{finalTotalWithDelivery.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Eligibility Message */}
              {deliveryInfo && (
                <div className={`mt-4 p-4 rounded-xl border ${
                  deliveryInfo.isFreeDelivery 
                    ? 'bg-green-50 border-green-200' 
                    : deliveryInfo.freeDeliveryEligible 
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-sm ${
                    deliveryInfo.isFreeDelivery 
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

              {/* Show retry option for failed delivery calculations */}
              {!loadingDelivery && !deliveryInfo && selectedAddress && addresses.length > 0 && 
               failedDeliveryAddresses.has(getAddressKey(addresses.find(addr => addr.id === selectedAddress)!)) && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-sm text-red-800 mb-3">
                    <div className="font-semibold mb-1">Delivery calculation failed</div>
                    <div>Unable to calculate delivery charges for this address.</div>
                  </div>
                  <Button 
                    onClick={retryDeliveryCalculation}
                    variant="outline" 
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Retry Calculation
                  </Button>
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

            {/* Tax Information - Compact */}
            {taxCalculation && taxCalculation.totalTax > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Tax Information</span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Tax Type:</span>
                    <span className="font-medium">
                      {taxCalculation.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tax:</span>
                    <span className="font-medium">{formatTaxAmount(taxCalculation.totalTax)}</span>
                  </div>
                  {taxCalculation.isInterState ? (
                    <div className="flex justify-between">
                      <span>IGST Rate:</span>
                      <span className="font-medium">{taxCalculation.taxBreakdown.igst.percentage.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST Rate:</span>
                        <span className="font-medium">{taxCalculation.taxBreakdown.cgst.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST Rate:</span>
                        <span className="font-medium">{taxCalculation.taxBreakdown.sgst.percentage.toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Security Info - Compact */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Secure Payment - Your information is encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div ref={modalRef} className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Address</h3>
              <Button
                size="sm"
                onClick={() => setShowAddressModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => {
                    setSelectedAddress(address.id);
                    setShowAddressModal(false);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddress === address.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{address.type}</span>
                        {address.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{address.building}{address.floor && `, Floor ${address.floor}`}, {address.area}{address.landmark && `, Near ${address.landmark}`}</p>
                      <p className="text-xs text-gray-600 mt-1">{address.phone}</p>
                    </div>
                    {selectedAddress === address.id && (
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 -mx-6 px-6 z-10 border-t border-gray-100">
              <Button variant="outline" className="w-full hover:bg-green-50 transition-colors" onClick={() => setShowAddAddressModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </div>
            {/* Inline Add Address Modal */}
            {showAddAddressModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000] p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Add New Address</h3>
                    <Button variant="outline" size="sm" onClick={() => { setShowAddAddressModal(false); setAddressForm({}); }}>✕</Button>
                  </div>
                 {/* Map and search area */}
                 <div className="mb-4">
                   <div className="flex gap-2 mb-2">
                     <input
                       ref={inputRef}
                       type="text"
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                       placeholder="Search location..."
                     />
                     <Button
                       type="button"
                       onClick={handleUseMyLocation}
                       className="px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                     >
                       <MapPin className="w-4 h-4 text-green-600" />
                     </Button>
                   </div>
                   <div className="w-full h-60 rounded-lg overflow-hidden border border-gray-200 bg-white mb-2">
                     <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                   </div>
                   
                   {/* Coordinates indicator */}
                   <div className={`text-xs p-2 rounded-lg mb-2 ${
                     addressForm.lat && addressForm.lng 
                       ? 'bg-green-50 text-green-700 border border-green-200' 
                       : 'bg-orange-50 text-orange-700 border border-orange-200'
                   }`}>
                     {addressForm.lat && addressForm.lng ? (
                       <div className="flex items-center gap-2">
                         <Check className="h-4 w-4" />
                         <span>Location coordinates captured: {addressForm.lat.toFixed(6)}, {addressForm.lng.toFixed(6)}</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2">
                         <MapPin className="h-4 w-4" />
                         <span>Please select your location on the map for accurate delivery calculation</span>
                       </div>
                     )}
                   </div>
                   <div className="w-full bg-gray-50 rounded-lg p-2 flex items-center gap-2 mb-2 border border-gray-200">
                     <div className="flex-shrink-0 bg-green-100 rounded-full p-1.5">
                       <MapPin className="w-4 h-4 text-green-600" />
                     </div>
                     <div>
                       <div className="text-xs text-gray-500">Delivering your order to</div>
                       <div className="font-semibold text-gray-700 text-xs truncate max-w-[200px]">{addressForm.area || "-"}</div>
                     </div>
                   </div>
                 </div>
                  {/* Inline Add Address Form */}
                  <form className="flex flex-col gap-2" onSubmit={async (e) => {
                    e.preventDefault();
                    if ((!addressForm.building && !addressForm.area) || !addressForm.city || !addressForm.state || !addressForm.pincode) {
                      alert('Please fill in all required fields (at least building or area, city, state, and pincode)');
                      return;
                    }
                    
                    if (!addressForm.lat || !addressForm.lng) {
                      const confirmSave = confirm(
                        'Location coordinates are missing. This may affect delivery calculation. ' +
                        'Please use the map to select your exact location, or continue anyway?'
                      );
                      if (!confirmSave) {
                        return;
                      }
                    }
                    const now = Date.now();
                    const addressData = {
                      type: addressForm.type || "Home",
                      building: addressForm.building?.trim() || "",
                      floor: addressForm.floor?.trim() || "",
                      area: addressForm.area?.trim() || "",
                      landmark: addressForm.landmark?.trim() || "",
                      city: addressForm.city?.trim() || "",
                      state: addressForm.state?.trim() || "",
                      country: addressForm.country?.trim() || "India",
                      pincode: addressForm.pincode?.trim() || "",
                      phone: addressForm.phone?.trim() || "",
                      name: addressForm.name?.trim() || "",
                      isDefault: addressForm.isDefault || false,
                      addressLabel: addressForm.addressLabel?.trim() || "",
                      additionalInstructions: addressForm.additionalInstructions?.trim() || "",
                      isActive: true,
                      createdAt: now,
                      updatedAt: now,
                      lat: addressForm.lat || undefined,
                      lng: addressForm.lng || undefined,
                    };
                    await handleAddAddress(addressData);
                    await fetchUserAddresses();
                    setShowAddAddressModal(false);
                  }}>
                    <div className="flex flex-wrap gap-2">
                      <div className="w-full mb-1">
                        <label className="block text-xs font-medium text-gray-700">Save address as *</label>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full">
                        {["Home", "Office", "Hotel", "Other"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`px-2 py-1 rounded-lg border text-xs flex-1 ${addressForm.type === type ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"}`}
                            onClick={() => setAddressForm((prev) => ({ ...prev, type: type as Address['type'] }))}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Flat / House no / Building name *</label>
                      <input
                        type="text"
                        name="building"
                        value={addressForm.building || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, building: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                        required
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Floor (optional)</label>
                      <input
                        type="text"
                        name="floor"
                        value={addressForm.floor || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, floor: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Area / Sector / Locality *</label>
                      <input
                        type="text"
                        name="area"
                        value={addressForm.area || ""}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                        required
                        readOnly
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Nearby landmark (optional)</label>
                      <input
                        type="text"
                        name="landmark"
                        value={addressForm.landmark || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Your name *</label>
                      <input
                        type="text"
                        name="name"
                        value={addressForm.name || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                        required
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Your phone number (optional)</label>
                      <input
                        type="tel"
                        name="phone"
                        value={addressForm.phone || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                        pattern="[0-9]{10}"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Address label (optional)</label>
                      <input
                        type="text"
                        name="addressLabel"
                        value={addressForm.addressLabel || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, addressLabel: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                        placeholder="e.g., Near main gate, Opposite pharmacy, etc."
                      />
                    </div>
                    <div className="mb-1.5">
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Additional delivery instructions (optional)</label>
                      <textarea
                        name="additionalInstructions"
                        value={addressForm.additionalInstructions || ""}
                        onChange={e => setAddressForm(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                        placeholder="E.g., Ring bell twice, call before delivery, etc."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" onClick={() => { setShowAddAddressModal(false); setAddressForm({}); }} className="flex-1">Cancel</Button>
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isAddingAddress}>{isAddingAddress ? 'Saving...' : 'Save Address'}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}