"use client"

import { useState, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "../../lib/store"

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
import { Home, Building2, Hotel, MapPin, Plus, X, MapPinOff, Briefcase, Edit, Trash2, MoreVertical, FileText, Tag, Check } from "lucide-react"
import Link from "next/link"
import Layout from "../../components/Layout"
import GoogleMapsModal from "../../components/GoogleMapsModal"
import toast from "react-hot-toast";

// Addresses will be fetched from the API

// Move parseAddressComponents definition to top-level so it is available everywhere
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

export default function AddressesPage() {
  const router = useRouter();
  // Fix: Use correct selector for persisted state shape
  const user = useAppSelector((state: any) => state?.auth?.user);
  const token = useAppSelector((state: any) => state?.auth?.token);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address menu states
  const [activeAddressMenu, setActiveAddressMenu] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'instruction' | 'label' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Utility function to set token as cookie
  const setTokenCookie = () => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;
      console.log('Token cookie set:', token.substring(0, 20) + '...');
    } else {
      console.log('No token available to set as cookie');
    }
  };

  // Protect this page
  useEffect(() => {
    if (!user || !token) {
      router.push("/");
    }
  }, [user, token, router]);

  const fetchUserAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      
      // Set token as cookie before making the request
      setTokenCookie();
      
      const response = await fetch(`/api/user/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This is important for sending cookies
        cache: 'no-store' // Disable cache to always get fresh data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      if (Array.isArray(data.addresses)) {
        // Filter out any addresses that are missing essential data
        // Only filter out addresses that are completely invalid or missing critical fields
        const validAddresses = data.addresses.filter((address: any) => 
          address && 
          address.id &&
          (address.building || address.area) && // At least one location identifier
          address.city && 
          address.state && 
          address.pincode
          // Removed name requirement as it might be optional
        );
        console.log('Fetched addresses:', data.addresses);
        console.log('Valid addresses after filtering:', validAddresses);
        setSavedAddresses(validAddresses);
      } else {
        console.error('Invalid address data format:', data);
        throw new Error('Invalid address data received');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Remove initial addresses on error
      setSavedAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
      };
  
  const handleAddAddress = async (newAddress: Omit<Address, 'id'>) => {
    try {
      setIsSubmitting(true);
      // Set token as cookie before making the request
      setTokenCookie();

      const response = await fetch(`/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAddress)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }

      const data = await response.json();
      // Refresh the addresses list
      await fetchUserAddresses();
      setShowAddressModal(false);
      setSelectedAddress(null);
      setAddressForm({});
      toast.success('Address added successfully!');
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to add address: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress({ ...address, name: address.name || "" });
    setAddressForm({ ...address });
    setShowAddressModal(true);
  };

  const handleUpdateAddress = async (updatedAddress: Address) => {
    try {
      setIsSubmitting(true);
      // Set token as cookie before making the request
      setTokenCookie();

      console.log('Updating address:', updatedAddress);
      console.log('Address ID:', updatedAddress.id);

      const response = await fetch(`/api/user/addresses?id=${updatedAddress.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedAddress)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update error data:', errorData);
        throw new Error(errorData.error || 'Failed to update address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Update success:', result);

      // Refresh the addresses list
      await fetchUserAddresses();
      setShowAddressModal(false);
      setSelectedAddress(null);
      setAddressForm({});
      toast.success('Address updated successfully!');
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to update address: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      // Set token as cookie before making the request
      setTokenCookie();

      console.log('Deleting address with ID:', addressId);

      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Delete success:', result);

      // Close modal first for better UX
      setShowDeleteModal(false);
      setAddressToDelete(null);
      
      // Show success message
      toast.success('Address deleted permanently!');
      
      // Refresh the addresses list
      await fetchUserAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to delete address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteAddress = (addressId: number) => {
    console.log('confirmDeleteAddress called with ID:', addressId);
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
    setActiveAddressMenu(null);
  };

  // Address menu handlers
  const handleAddressMenuClick = (addressId: string) => {
    console.log('Menu clicked for address:', addressId);
    setActiveAddressMenu(activeAddressMenu === addressId ? null : addressId);
  };

  const handleEditInstruction = (address: Address) => {
    console.log('Edit instruction clicked for address:', address);
    setEditingAddressId(address.id.toString());
    setEditingField('instruction');
    setEditingValue(address.additionalInstructions || '');
    setActiveAddressMenu(null);
  };

  const handleEditLabel = (address: Address) => {
    console.log('Edit label clicked for address:', address);
    setEditingAddressId(address.id.toString());
    setEditingField('label');
    setEditingValue(address.addressLabel || '');
    setActiveAddressMenu(null);
  };

  const handleSetDefault = async (addressId: number) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      setTokenCookie();

      // Find the address to be set as default
      const addressToUpdate = savedAddresses.find(addr => addr.id === addressId);
      if (!addressToUpdate) {
        throw new Error('Address not found');
      }

      console.log('Setting address as default:', addressId);
      
      // Create an update object with all current address data plus isDefault: true
      const updateData = {
        ...addressToUpdate,
        isDefault: true,
        updatedAt: Date.now()
      };

      console.log('Full update data:', updateData);

      // Update the address with all its data, not just isDefault
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      console.log('Set default response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Set default error:', errorData);
        throw new Error(errorData.error || 'Failed to set default address');
      }

      // Optimistically update the UI
      setSavedAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );

      toast.success('Address set as default successfully!');
      
      // Refresh addresses to ensure consistency
      await fetchUserAddresses();
      setActiveAddressMenu(null);
    } catch (error) {
      console.error('Error setting default address:', error);
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
      toast.error(`Failed to set default address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAddressEdit = async () => {
    if (!editingAddressId || !editingField) {
      console.log('Missing required data:', { editingAddressId, editingField });
      return;
    }

    if (isUpdating) return;

    try {
      setIsUpdating(true);
      console.log('Saving address edit:', { editingAddressId, editingField, editingValue });
      setTokenCookie();
      
      const updateData: any = {};
      
      if (editingField === 'instruction') {
        updateData.additionalInstructions = editingValue;
      } else if (editingField === 'label') {
        updateData.addressLabel = editingValue;
      }

      console.log('Update data:', updateData);

      const response = await fetch(`/api/user/addresses?id=${editingAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update error:', errorData);
        throw new Error(errorData.error || 'Failed to update address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Update success:', result);

      toast.success(`Address ${editingField} updated successfully!`);
      await fetchUserAddresses(); // Refresh addresses
      
      // Reset editing state
      setEditingAddressId(null);
      setEditingField(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to update address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null);
    setEditingField(null);
    setEditingValue('');
  };

  // New: handle map location select
  const handleMapLocationSelect = (loc: { lat: number; lng: number; address: string; city: string; state: string; country: string; pin: string }) => {
    setAddressForm((prev) => ({
      ...prev,
      area: loc.address,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      pincode: loc.pin,
      lat: loc.lat,
      lng: loc.lng,
    }));
    setShowMap(false);
  };

  useEffect(() => {
    if (user && token) {
      fetchUserAddresses();
    }
  }, [user, token]);

  // Close address menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeAddressMenu) {
        setActiveAddressMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeAddressMenu]);

  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (!showAddressModal) return;
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

    function fetchAddress(lat: number, lng: number) {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            const comps = parseAddressComponents(result.address_components);
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
        });
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
      fetchAddress(center.lat, center.lng);
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        fetchAddress(pos.lat(), pos.lng());
      });
      map.addListener("click", (e: any) => {
        marker.setPosition(e.latLng);
        fetchAddress(e.latLng.lat(), e.latLng.lng());
      });
      if (inputRef.current) {
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
        autocomplete.bindTo("bounds", map);
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;
          map.panTo(place.geometry.location);
          map.setZoom(16);
          marker.setPosition(place.geometry.location);
          fetchAddress(place.geometry.location.lat(), place.geometry.location.lng());
        });
      }
    }

    loadGoogleMapsScript(initMap);

    return () => {
      if (googleScript) {
        document.body.removeChild(googleScript);
      }
    };
  // eslint-disable-next-line
}, [showAddressModal]);

  // Fetch current location automatically when adding a new address
  useEffect(() => {
    if (showAddressModal && !selectedAddress) {
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
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
              .then(res => res.json())
              .then(data => {
                if (data.status === "OK" && data.results.length > 0) {
                  const result = data.results[0];
                  const comps = parseAddressComponents(result.address_components);
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
              });
          }
        },
        () => {}
      );
    }
  }, [showAddressModal, selectedAddress]);

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
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === "OK" && data.results.length > 0) {
                const result = data.results[0];
                const comps = parseAddressComponents(result.address_components);
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
            });
        }
      },
      () => {}
    );
  }

  useEffect(() => {
    if (!showAddressModal) return;
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

    // Observe DOM changes to reposition the dropdown
    observer = new MutationObserver(positionPacContainer);
    observer.observe(document.body, { childList: true, subtree: true });

    // Also reposition on scroll/resize
    window.addEventListener('scroll', positionPacContainer, true);
    window.addEventListener('resize', positionPacContainer);

    // Initial position
    setTimeout(positionPacContainer, 500);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', positionPacContainer, true);
      window.removeEventListener('resize', positionPacContainer);
    };
  }, [showAddressModal]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showAddressModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddressModal]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Addresses Tab */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-codGray flex items-center">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Saved Addresses {!isLoadingAddresses && `(${savedAddresses.length})`}</span>
                </h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="text-center py-10 sm:py-16">
                  <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading addresses...</p>
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="text-center py-10 sm:py-16">
                  <MapPinOff className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                    No addresses saved yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add your first delivery address to get started!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-4 sm:p-6 border border-gray-200 rounded-xl hover:border-brand-primary transition-colors relative"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {address.type === "Home" && <Home className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                          {address.type === "Office" && <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                          {address.type === "Hotel" && <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                          {address.type === "Other" && <MapPinOff className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                          <span className="font-semibold capitalize text-sm sm:text-base">{address.type}</span>
                        </div>
                        
                        {/* Edit and Delete Buttons */}
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Address"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteAddress(address.id)}
                            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 relative">
                        {/* Name and Default Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {address.name && (
                            <p className="text-gray-900 font-medium text-sm sm:text-base">{address.name}</p>
                          )}
                          {address.isDefault && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-600 text-xs rounded font-medium">Default</span>
                          )}
                        </div>
                        
                        {/* Address Details */}
                        <div className="text-gray-600 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                          {address.building && <p>{address.building}{address.floor ? `, Floor ${address.floor}` : ''}</p>}
                          {address.area && <p className="break-words">{address.area}</p>}
                          {address.landmark && <p>Near {address.landmark}</p>}
                          {/* Avoid duplicating city, state, pincode if already present in area */}
                          {address.area && (
                            (address.area.includes(address.city) || address.area.includes(address.state) || address.area.includes(address.pincode))
                              ? null
                              : <p>{`${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()}</p>
                          )}
                          {!address.area && (
                            <p>{`${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()}</p>
                          )}
                          {address.phone && (
                            <p className="text-gray-700 mt-1">📞 {address.phone}</p>
                          )}
                          {address.additionalInstructions && (
                            <p className="text-gray-500 italic mt-1 text-xs break-words">📝 {address.additionalInstructions}</p>
                          )}
                        </div>
                        
                        {/* Address Label and Set as Default button */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          {address.addressLabel && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200 font-medium">
                              {address.addressLabel}
                            </span>
                          )}
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address.id)}
                              disabled={isUpdating}
                              className={`text-xs sm:text-sm flex items-center gap-1 ${
                                isUpdating 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-brand-primary hover:text-brand-primary-dark'
                              }`}
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{isUpdating ? 'Setting...' : 'Set as Default'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 overflow-y-auto">
            <div className="w-full max-w-4xl mx-2 sm:mx-4 bg-white rounded-lg shadow-xl overflow-hidden h-auto max-h-[95vh] p-0 my-2 sm:my-4">
              <div className="flex flex-col">
                {/* Header */}
                <div className="p-3 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                  <h3 className="text-base sm:text-lg font-semibold">{selectedAddress ? "Edit Address" : "Enter complete address"}</h3>
                  <button 
                    onClick={() => {
                      setShowAddressModal(false);
                      setSelectedAddress(null);
                      setAddressForm({});
                    }}
                    className="text-gray-500 hover:text-gray-700">
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                          placeholder="Search location..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </button>
                    </div>
                    <div className="w-full h-60 sm:h-80 rounded-lg overflow-hidden border border-gray-200 bg-white my-3">
                      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div className="w-full bg-gray-50 rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 mb-2 border border-gray-200">
                      <div className="flex-shrink-0 bg-brand-primary/10 rounded-full p-1.5 sm:p-2">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Delivering your order to</div>
                        <div className="font-semibold text-gray-700 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[250px]">{addressForm.area || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Form Area - Right Column */}
                  <div className="p-3 sm:p-4 md:w-1/2 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
                    <form className="flex flex-col gap-2" onSubmit={async (e: FormEvent<HTMLFormElement>) => {
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
                        lat: addressForm.lat,
                        lng: addressForm.lng,
                        isDefault: addressForm.isDefault || false,
                        addressLabel: addressForm.addressLabel?.trim() || "",
                        additionalInstructions: addressForm.additionalInstructions?.trim() || "",
                        isActive: true,
                        createdAt: selectedAddress?.createdAt || now,
                        updatedAt: now,
                      };
                      
                      if (selectedAddress) {
                        await handleUpdateAddress(addressData);
                      } else {
                        await handleAddAddress(addressData);
                      }
                    }}>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <div className="w-full mb-1">
                          <label className="block text-xs font-medium text-gray-700">Save address as *</label>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full">
                          {["Home", "Office", "Hotel", "Other"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm flex-1 ${addressForm.type === type ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-gray-200 text-gray-600"}`}
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
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
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
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div className="mb-1.5">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Area / Sector / Locality *</label>
                        <input
                          type="text"
                          name="area"
                          value={addressForm.area || ""}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
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
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div className="mb-1.5">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Your name *</label>
                        <input
                          type="text"
                          name="name"
                          value={addressForm.name || ""}
                          onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
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
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div className="mb-1.5">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Address label (optional)</label>
                        <input
                          type="text"
                          name="addressLabel"
                          value={addressForm.addressLabel || ""}
                          onChange={e => setAddressForm(prev => ({ ...prev, addressLabel: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                          placeholder="e.g., Near main gate, Opposite pharmacy, etc."
                        />
                      </div>
                      
                      <div className="mb-1.5">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Additional delivery instructions (optional)</label>
                        <textarea
                          name="additionalInstructions"
                          value={addressForm.additionalInstructions || ""}
                          onChange={e => setAddressForm(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-xs sm:text-sm"
                          placeholder="E.g., Ring bell twice, call before delivery, etc."
                          rows={2}
                        />
                      </div>
                      
                      {/* Sticky Save/Update Button */}
                      <div className="sticky -bottom-4 bg-white pt-3 pb-3 z-10 mt-2 sm:mt-4 border-t border-gray-100">
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressModal(false);
                              setSelectedAddress(null);
                              setAddressForm({});
                            }}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-xs sm:text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg font-medium text-xs sm:text-sm ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary-dark'}`}
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
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-red-600">Delete Address Permanently</h3>
            <p className="text-sm text-gray-700 mb-4 sm:mb-6">
              Are you sure you want to permanently delete this address? This will completely remove the address from your account and cannot be undone.
            </p>
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={() => addressToDelete && handleDeleteAddress(addressToDelete)}
                disabled={isUpdating}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isUpdating ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAddressToDelete(null);
                }}
                disabled={isUpdating}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editingAddressId && editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
              {editingField === 'instruction' ? 'Add Additional Instruction' : 'Edit Address Label'}
            </h3>
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              placeholder={
                editingField === 'instruction' 
                  ? 'Enter delivery instructions...' 
                  : 'Enter address label...'
              }
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none text-xs sm:text-sm"
              rows={editingField === 'instruction' ? 4 : 2}
            />
            <div className="flex space-x-2 sm:space-x-3 mt-3 sm:mt-4">
              <button
                onClick={handleSaveAddressEdit}
                disabled={isUpdating}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                }`}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelAddressEdit}
                disabled={isUpdating}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

