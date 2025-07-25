"use client";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/components/app-provider";
import { useAppSelector } from "@/lib/store";
import { Button } from "@/components/ui/button";
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

interface PaymentMethod {
  id: string;
  type: 'wallet' | 'card' | 'netbanking' | 'upi' | 'cod';
  name: string;
  icon: any;
  description?: string;
  popular?: boolean;
}

const paymentMethods: PaymentMethod[] = [
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
  const { cartItems, cartTotal } = useAppContext();
  const router = useRouter();
  const user = useAppSelector((state: any) => state?.auth?.user);
  const token = useAppSelector((state: any) => state?.auth?.token);
  
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
  // Add this for Add Address Modal form state
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  // For map and autocomplete
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Utility function to set token as cookie
  const setTokenCookie = () => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;
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
        
        // Set default address as selected
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
        // Refresh addresses
        await fetchUserAddresses();
        // Select the new address if it's set as default
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
  }, [user, token, router]);

  const handlePayment = () => {
    // Payment processing logic here
    console.log('Processing payment with method:', selectedPaymentMethod);
    // Redirect to success page or show success message
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
            
            {/* Existing UPI ID */}
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

            {/* Add new UPI ID */}
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

            {/* UPI Apps */}
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
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Pay when you receive</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    You can pay in cash to our delivery partner when your order arrives.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    Additional charges: ₹20 (handling fee)
                  </p>
                </div>
              </div>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods - Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h2>
              
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
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

            {/* Pay Now Button */}
            <Button 
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Pay ₹{selectedPaymentMethod === 'cod' ? cartTotal + 20 : cartTotal}
            </Button>
          </div>

          {/* Order Summary - Right Panel */}
          <div className="lg:col-span-1 space-y-6">
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
              
              <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-cover w-12 h-12"
                        />
                      ) : (
                        <Image
                          src="/placeholder.svg"
                          alt="No image"
                          width={48}
                          height={48}
                          className="object-cover w-12 h-12"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">{item.name}</h3>
                      <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600">FREE</span>
                </div>
                {selectedPaymentMethod === 'cod' && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Handling Fee</span>
                    <span>₹20</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{selectedPaymentMethod === 'cod' ? cartTotal + 20 : cartTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your payment information is encrypted and secure.
              </p>
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
                  {/* Inline Add Address Form (copied and adapted from addresses page) */}
                  <form className="flex flex-col gap-2" onSubmit={async (e) => {
                    e.preventDefault();
                    // Validate required fields
                    if ((!addressForm.building && !addressForm.area) || !addressForm.city || !addressForm.state || !addressForm.pincode) {
                      alert('Please fill in all required fields (at least building or area, city, state, and pincode)');
                      return;
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