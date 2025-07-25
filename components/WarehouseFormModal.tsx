import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, MapPin } from "lucide-react";
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
};

export default function WarehouseFormModal({ open, onClose, warehouse, onSuccess }: WarehouseFormModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [form, setForm] = useState<Warehouse>(warehouse || defaultWarehouse);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [marker, setMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
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
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="text-xl font-semibold mb-4">{warehouse ? "Edit" : "Add"} Warehouse</div>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Map and Search */}
          <div className="md:w-1/2 w-full flex flex-col" style={{ minHeight: '420px' }}>
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
              >
                <MapPin className="w-4 h-4 text-brand-primary" />
              </button>
            </div>
            <div className="w-full flex-1 rounded-lg overflow-hidden border border-gray-200 bg-white mb-2" style={{ minHeight: '380px', height: '100%' }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          {/* Right: Form Inputs */}
          <form onSubmit={handleSubmit} className="md:w-1/2 w-full flex flex-col space-y-4 justify-between">
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Warehouse Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
            />
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
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Product capacity"
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
            <div className="flex gap-2 mt-4 justify-around">
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                onClick={onClose}
                disabled={loading}
              >Cancel</button>
              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                disabled={loading}
              >{loading ? 'Saving...' : warehouse ? 'Update Warehouse' : 'Add Warehouse'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
} 