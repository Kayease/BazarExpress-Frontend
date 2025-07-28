import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, MapPin, Truck, Clock, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from '@/lib/store';

interface Warehouse {
  _id?: string;
  name: string;
  address: string;
  location: { lat: number | null; lng: number | null };
  contactPhone: string;
  email: string;
  capacity: number;
  status: "active" | "inactive";
  deliverySettings?: {
    maxDeliveryRadius: number;
    freeDeliveryRadius: number;
    isDeliveryEnabled: boolean;
    deliveryDays: string[];
    deliveryHours: {
      start: string;
      end: string;
    };
  };
}

interface WarehouseFormModalProps {
  open: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
  onSuccess: (warehouse: Warehouse) => void;
}

const defaultWarehouse: Warehouse = {
  name: "",
  address: "",
  location: { lat: null, lng: null },
  contactPhone: "",
  email: "",
  capacity: 0,
  status: "active",
  deliverySettings: {
    maxDeliveryRadius: 50,
    freeDeliveryRadius: 3,
    isDeliveryEnabled: true,
    deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    deliveryHours: {
      start: '09:00',
      end: '21:00'
    }
  }
};

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export default function WarehouseFormModal({ open, onClose, warehouse, onSuccess }: WarehouseFormModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [form, setForm] = useState<Warehouse>(warehouse || defaultWarehouse);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [marker, setMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'delivery'>('basic');
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load Google Maps script
  useEffect(() => {
    if (!open) return;
    // Only add the script if it hasn't been added yet
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    if (document.getElementById('google-maps-script')) {
      // Script is already in the DOM, wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }
    const script = document.createElement("script");
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
    // Do not remove the script on unmount
  }, [open]);

  // Fetch current location on open
  useEffect(() => {
    if (!open || !mapLoaded) return;
    if (warehouse && warehouse.location && warehouse.location.lat && warehouse.location.lng) {
      setMapCenter({ lat: warehouse.location.lat, lng: warehouse.location.lng });
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setMapCenter({ lat: 28.6139, lng: 77.2090 }); // Default: Delhi
        }
      );
    } else {
      setMapCenter({ lat: 28.6139, lng: 77.2090 });
    }
  }, [open, mapLoaded, warehouse]);

  // Initialize map and marker
  useEffect(() => {
    if (!open || !mapLoaded || !mapCenter || !mapRef.current) return;
    const gMap = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
    });
    setMap(gMap);
    const gMarker = new window.google.maps.Marker({
      position: mapCenter,
      map: gMap,
      draggable: true,
    });
    setMarker(gMarker);
    // Update address on marker drag
    gMarker.addListener("dragend", () => {
      const pos = gMarker.getPosition();
      if (pos) {
        fetchAddress(pos.lat(), pos.lng());
      }
    });
    // Update form on map click
    gMap.addListener("click", (e: any) => {
      gMarker.setPosition(e.latLng);
      fetchAddress(e.latLng.lat(), e.latLng.lng());
    });
    // Set initial address
    fetchAddress(mapCenter.lat, mapCenter.lng);
    // Autocomplete
    if (inputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current);
      ac.bindTo("bounds", gMap);
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        gMap.panTo(place.geometry.location);
        gMap.setZoom(16);
        gMarker.setPosition(place.geometry.location);
        fetchAddress(place.geometry.location.lat(), place.geometry.location.lng());
      });
      setAutocomplete(ac);
    }
  }, [open, mapLoaded, mapCenter]);

  // Fetch address from lat/lng
  function fetchAddress(lat: number, lng: number) {
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "OK" && data.results.length > 0) {
          setForm(f => ({ ...f, address: data.results[0].formatted_address, location: { lat, lng } }));
        }
      });
  }

  // Use My Location handler
  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (map && marker) {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });
          fetchAddress(lat, lng);
        }
      },
      () => {}
    );
  }

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleDeliverySettingChange = (field: string, value: any) => {
    setForm(f => ({
      ...f,
      deliverySettings: {
        ...f.deliverySettings!,
        [field]: value
      }
    }));
  };

  const handleDeliveryHoursChange = (field: 'start' | 'end', value: string) => {
    setForm(f => ({
      ...f,
      deliverySettings: {
        ...f.deliverySettings!,
        deliveryHours: {
          ...f.deliverySettings!.deliveryHours,
          [field]: value
        }
      }
    }));
  };

  const handleDeliveryDaysChange = (day: string, checked: boolean) => {
    setForm(f => ({
      ...f,
      deliverySettings: {
        ...f.deliverySettings!,
        deliveryDays: checked 
          ? [...f.deliverySettings!.deliveryDays, day]
          : f.deliverySettings!.deliveryDays.filter(d => d !== day)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let method = warehouse && warehouse._id ? "PUT" : "POST";
      let url = warehouse && warehouse._id ? `${API_URL}/warehouses/${warehouse._id}` : `${API_URL}/warehouses`;
      let payload = { ...form };
      if (method === "POST" && user && user.id) {
        payload = { ...payload, userId: user.id } as any;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save warehouse");
      const data = await res.json();
      toast.success(warehouse ? "Warehouse updated" : "Warehouse added");
      onSuccess(data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error saving warehouse");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl z-10"
          aria-label="Close"
        >
          <X />
        </button>
        
        <div className="text-xl font-semibold mb-6">{warehouse ? "Edit" : "Add"} Warehouse</div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Map and Search */}
          <div className="lg:w-1/2 w-full flex flex-col" style={{ minHeight: '420px' }}>
            <div className="flex gap-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary text-sm"
                placeholder="Search location..."
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                title="Use my location"
              >
                <MapPin className="w-4 h-4 text-brand-primary" />
              </button>
            </div>
            <div className="w-full flex-1 rounded-lg overflow-hidden border border-gray-200 bg-white mb-2" style={{ minHeight: '380px', height: '100%' }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Click on the map or drag the marker to set warehouse location. Use the search box to find specific addresses.
            </p>
          </div>
          
          {/* Right: Form with Tabs */}
          <div className="lg:w-1/2 w-full">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Basic Info
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('delivery')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'delivery'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery Settings
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Warehouse Name *"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[80px]"
                    placeholder="Full Address *"
                    name="address"
                    value={form.address}
                    onChange={handleChange as any}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Contact Phone"
                      name="contactPhone"
                      value={form.contactPhone}
                      onChange={handleChange}
                    />
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Product Capacity"
                      name="capacity"
                      value={form.capacity || ''}
                      onChange={handleChange}
                      min={0}
                      required
                    />
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  {form.location.lat && form.location.lng && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Coordinates:</strong> {form.location.lat.toFixed(6)}, {form.location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Settings Tab */}
              {activeTab === 'delivery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-medium text-sm">Enable Delivery</label>
                      <p className="text-xs text-gray-500">Allow deliveries from this warehouse</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.deliverySettings?.isDeliveryEnabled}
                        onChange={(e) => handleDeliverySettingChange('isDeliveryEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Delivery Radius (km)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="50"
                        value={form.deliverySettings?.maxDeliveryRadius || ''}
                        onChange={(e) => handleDeliverySettingChange('maxDeliveryRadius', Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Free Delivery Radius (km)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="3"
                        value={form.deliverySettings?.freeDeliveryRadius || ''}
                        onChange={(e) => handleDeliverySettingChange('freeDeliveryRadius', Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Delivery Start Time</label>
                      <input
                        type="time"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        value={form.deliverySettings?.deliveryHours.start || '09:00'}
                        onChange={(e) => handleDeliveryHoursChange('start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Delivery End Time</label>
                      <input
                        type="time"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        value={form.deliverySettings?.deliveryHours.end || '21:00'}
                        onChange={(e) => handleDeliveryHoursChange('end', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Days</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <label key={day} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            checked={form.deliverySettings?.deliveryDays.includes(day)}
                            onChange={(e) => handleDeliveryDaysChange(day, e.target.checked)}
                          />
                          <span className="capitalize">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Delivery Coverage</p>
                        <p>This warehouse can deliver within {form.deliverySettings?.maxDeliveryRadius || 50} km radius. Free delivery is available within {form.deliverySettings?.freeDeliveryRadius || 3} km.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : warehouse ? 'Update Warehouse' : 'Add Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
} 