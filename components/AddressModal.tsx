"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { X, MapPin, Home, Briefcase, Hotel, MapPinOff, Loader2 } from "lucide-react"
import toast from "react-hot-toast"



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
  lat?: number;
  lng?: number;
  isDefault?: boolean;
  addressLabel?: string;
  additionalInstructions?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  onUpdateAddress?: (address: Address) => Promise<void>;
  selectedAddress?: Address | null;
  isSubmitting?: boolean;
}

// Helper function to parse Google address components
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

export default function AddressModal({
  isOpen,
  onClose,
  onAddAddress,
  onUpdateAddress,
  selectedAddress,
  isSubmitting = false
}: AddressModalProps) {
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const isUpdatingFromMap = useRef(false);

  // Initialize form with selected address data
  useEffect(() => {
    if (selectedAddress) {
      setAddressForm(selectedAddress);
    } else {
      setAddressForm({
        type: "Home",
        country: "India"
      });
    }
  }, [selectedAddress]);

  // Fetch address from coordinates
  const fetchAddress = (lat: number, lng: number, updateInput: boolean = true) => {
    if (isUpdatingFromMap.current) return;
    
    isUpdatingFromMap.current = true;
    
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "OK" && data.results.length > 0) {
          const result = data.results[0];
          const comps = parseAddressComponents(result.address_components);
          
          // Update the search input with the formatted address
          if (updateInput && inputRef.current) {
            inputRef.current.value = result.formatted_address;
          }
          
          setAddressForm(prev => ({
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
      })
      .catch(error => {
        console.error('Error fetching address:', error);
      })
      .finally(() => {
        setTimeout(() => {
          isUpdatingFromMap.current = false;
        }, 500);
      });
  };

  // Google Maps initialization
  useEffect(() => {
    if (!isOpen) return;
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
      if (!mapRef.current || !window.google || !window.google.maps || isMapInitialized) return;
      
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
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
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
      
      setIsMapInitialized(true);
      
      // Only fetch address if we don't have initial location or if it's from selected address
      if (!hasInitialLocation || selectedAddress) {
        fetchAddress(center.lat, center.lng, true);
      }
      
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        fetchAddress(pos.lat(), pos.lng(), true);
      });
      
      map.addListener("click", (e: any) => {
        marker.setPosition(e.latLng);
        fetchAddress(e.latLng.lat(), e.latLng.lng(), true);
      });
      
      if (inputRef.current) {
        try {
          autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;
            map.panTo(place.geometry.location);
            map.setZoom(16);
            marker.setPosition(place.geometry.location);
            fetchAddress(place.geometry.location.lat(), place.geometry.location.lng(), false);
          });
        } catch (err) {
          console.error('Failed to attach autocomplete:', err);
        }
      }
    }

    loadGoogleMapsScript(initMap);

    return () => {
      if (googleScript && document.body.contains(googleScript)) {
        document.body.removeChild(googleScript);
      }
    };
  }, [isOpen]);

  // Get current location when modal opens
  useEffect(() => {
    if (isOpen && !selectedAddress && !hasInitialLocation) {
      if (!navigator.geolocation) return;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setAddressForm((prev) => ({ ...prev, lat, lng }));
          setHasInitialLocation(true);
          
          if (mapInstance.current && window.google && window.google.maps) {
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(16);
            markerInstance.current.setPosition({ lat, lng });
            fetchAddress(lat, lng, true);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          setHasInitialLocation(true); // Set to true even on error to prevent retries
        }
      );
    }
  }, [isOpen, selectedAddress, hasInitialLocation]);

  // Position Google Places autocomplete dropdown
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (mapInstance.current && window.google && window.google.maps) {
          mapInstance.current.setCenter({ lat, lng });
          mapInstance.current.setZoom(16);
          markerInstance.current.setPosition({ lat, lng });
          fetchAddress(lat, lng, true);
        }
        
        setAddressForm((prev) => ({ ...prev, lat, lng }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please search manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if ((!addressForm.building && !addressForm.area) || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill in all required fields (at least building or area, city, state, and pincode)');
      return;
    }
    
    const now = Date.now();
    const addressData: Address = {
      id: selectedAddress?.id || now,
      type: (addressForm.type as Address['type']) || "Home",
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
      lat: addressForm.lat || undefined,
      lng: addressForm.lng || undefined,
      isDefault: addressForm.isDefault || false,
      addressLabel: addressForm.addressLabel?.trim() || "",
      additionalInstructions: addressForm.additionalInstructions?.trim() || "",
      isActive: true,
      createdAt: selectedAddress?.createdAt || now,
      updatedAt: now,
    };
    
    try {
      if (selectedAddress && onUpdateAddress) {
        await onUpdateAddress(addressData);
      } else {
        await onAddAddress(addressData);
      }
      onClose();
      setAddressForm({});
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setAddressForm({});
    setIsMapInitialized(false);
    setHasInitialLocation(false);
    setIsGettingLocation(false);
    isUpdatingFromMap.current = false;
    
    // Clear the search input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 overflow-y-auto">
      <div className="w-full max-w-4xl mx-2 sm:mx-4 bg-white rounded-lg shadow-xl overflow-hidden h-auto max-h-[95vh] p-0 my-2 sm:my-4">
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-3 border-b flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-base sm:text-lg font-semibold">
              {selectedAddress ? "Edit Address" : "Enter complete address"}
            </h3>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Main Content - Two Column Layout */}
          <div className="flex flex-col md:flex-row">
            {/* Map Area - Left Column */}
            <div className="p-3 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                    placeholder="Search location..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  )}
                </button>
              </div>
              <div className="w-full h-60 sm:h-80 rounded-lg overflow-hidden border border-gray-200 bg-white my-3">
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
              </div>
              <div className="w-full bg-gray-50 rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 mb-2 border border-gray-200">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-1.5 sm:p-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Delivering your order to</div>
                  <div className="font-semibold text-gray-700 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[250px]">
                    {addressForm.area || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Area - Right Column */}
            <div className="p-3 sm:p-4 md:w-1/2 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
              <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="w-full mb-1">
                    <label className="block text-xs font-medium text-gray-700">Save address as *</label>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full">
                    {["Home", "Office", "Hotel", "Other"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm flex-1 ${
                          addressForm.type === type 
                            ? "border-green-500 bg-green-50 text-green-600" 
                            : "border-gray-200 text-gray-600"
                        }`}
                        onClick={() => setAddressForm((prev) => ({ ...prev, type: type as Address['type'] }))}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {type === "Home" && <Home className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {type === "Office" && <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {type === "Hotel" && <Hotel className="w-3 h-3 sm:w-4 sm:h-4" />}
                          {type === "Other" && <MapPinOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                          <span>{type}</span>
                        </div>
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Area / Sector / Locality *</label>
                  <input
                    type="text"
                    name="area"
                    value={addressForm.area || ""}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Your name *</label>
                  <input
                    type="text"
                    name="name"
                    value={addressForm.name || ""}
                    onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Address label (optional)</label>
                  <input
                    type="text"
                    name="addressLabel"
                    value={addressForm.addressLabel || ""}
                    onChange={e => setAddressForm(prev => ({ ...prev, addressLabel: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                    placeholder="e.g., Near main gate, Opposite pharmacy, etc."
                  />
                </div>
                
                <div className="mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Additional delivery instructions (optional)</label>
                  <textarea
                    name="additionalInstructions"
                    value={addressForm.additionalInstructions || ""}
                    onChange={e => setAddressForm(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                    placeholder="E.g., Ring bell twice, call before delivery, etc."
                    rows={2}
                  />
                </div>
                
                {/* Sticky Save/Update Button */}
                <div className="sticky -bottom-4 bg-white pt-3 pb-3 z-10 mt-2 sm:mt-4 border-t border-gray-100">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg font-medium text-xs sm:text-sm ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? "Saving..." : (selectedAddress ? "Update Address" : "Save Address")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}