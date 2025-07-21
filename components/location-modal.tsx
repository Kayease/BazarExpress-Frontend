"use client";

import { useState } from "react";
import { X, MapPin, Search, Navigation, Loader2 } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  deliveryTime?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  currentLocation: string;
}

export default function LocationModal({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation,
}: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError(null);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Failed to fetch locations");

      const data = await response.json();
      setSearchResults(data.locations || []);
    } catch (err) {
      setError("Failed to search locations. Please try again.");
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      // Use Google Maps Geocoding API for address lookup
      const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) throw new Error("Google Maps API key missing");
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (!response.ok) throw new Error("Failed to get address");
      const data = await response.json();
      let address = "Current Location";
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        // Compose a detailed address from address_components
        const components = result.address_components;
        let house = "",
          street = "",
          landmark = "",
          area = "",
          city = "",
          district = "",
          state = "",
          country = "",
          pin = "";
        for (const comp of components) {
          if (comp.types.includes("street_number")) house = comp.long_name;
          if (comp.types.includes("route")) street = comp.long_name;
          if (comp.types.includes("sublocality_level_1")) area = comp.long_name;
          if (comp.types.includes("premise")) landmark = comp.long_name;
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_2"))
            district = comp.long_name;
          if (comp.types.includes("administrative_area_level_1"))
            state = comp.long_name;
          if (comp.types.includes("country")) country = comp.long_name;
          if (comp.types.includes("postal_code")) pin = comp.long_name;
        }
        address = [
          house,
          street,
          area,
          landmark,
          city,
          district,
          state,
          country,
          pin,
        ]
          .filter(Boolean)
          .join(", ");
        if (!address || address.split(",").length < 4)
          address = result.formatted_address;
      }
      const location: Location = {
        id: "current",
        name: "Current Location",
        address: address,
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      };
      onLocationSelect(location);
      onClose();
    } catch (err) {
      setError(
        "Could not detect your location. Please try again or search manually."
      );
      console.error("Location detection error:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Change Location
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Current Location Button */}
          <button
            onClick={detectLocation}
            disabled={isDetecting}
            className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center mb-4 disabled:opacity-70"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 mr-2" />
                Use my current location
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for area, street name..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Current Location */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            CURRENT LOCATION
          </h3>
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-gray-900">
              {currentLocation || "Location not set"}
            </span>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              SEARCH RESULTS
            </h3>
            <div className="space-y-3">
              {searchResults.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    onLocationSelect(location);
                    onClose();
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition flex items-start"
                >
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {location.name}
                    </h4>
                    <p className="text-sm text-gray-600">{location.address}</p>
                    {location.deliveryTime && (
                      <p className="text-xs text-green-600 mt-1">
                        Delivery in {location.deliveryTime}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="p-6 text-red-500 text-sm">{error}</div>}

        {/* Loading State */}
        {isSearching && (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
