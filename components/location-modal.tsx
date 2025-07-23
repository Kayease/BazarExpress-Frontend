"use client";

import { useState, useRef, useEffect } from "react";
import { X, MapPin, Search, Navigation, Loader2, MapPinOff } from "lucide-react";

// Update TypeScript declaration for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteSessionToken: any;
          AutocompleteService: any;
          PlacesService: any;
          Autocomplete: any;
        };
        Geocoder: any;
        Map: any;
        Marker: any;
      };
    };
  }
}

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

// Get Google Maps API key from env
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [autocompleteInitialized, setAutocompleteInitialized] = useState(false);

  // Load Google Maps script when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    if (window.google && window.google.maps) {
      initAutocomplete();
      return;
    }
    
    // Only load script if it's not already loaded
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement("script");
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, [isOpen]);

  // Initialize Google Places Autocomplete (as a backend service only)
  const initAutocomplete = () => {
    if (!searchInputRef.current || !window.google || !window.google.maps || !window.google.maps.places || autocompleteInitialized) {
      return;
    }
    
    // Create a session token to optimize billing
    const sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    
    // Set up the Places service for detailed place information
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    // Store the service in a ref so we can use it later
    const mapsRef = {
      sessionToken,
      placesService
    };
    
    // We're not using the built-in autocomplete UI at all, just our own implementation
    setAutocompleteInitialized(true);
    
    // Add our own search handler that will fire when the user pauses typing
  };
  
  // Add a debounced search function to prevent too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  useEffect(() => {
    // Set a timer to update the debounced search term after 300ms
    const timerId = setTimeout(() => {
      if (searchQuery.length >= 3) {
        setDebouncedSearchTerm(searchQuery);
      }
    }, 300);

    // Clear the timer if the search query changes before the 300ms is up
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Use the debounced search term to trigger API search
  useEffect(() => {
    if (debouncedSearchTerm.length >= 3) {
      handleSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handleSearch = async (query: string) => {
    setError(null);

    if (query.length < 3) {
      return;
    }

    setIsSearching(true);
    try {
      // Use our backend API to handle the search and avoid Google's UI autocomplete
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Failed to fetch locations");

      const data = await response.json();
      
      // Set the search results directly from the API
      if (data.locations?.length > 0) {
        setSearchResults(data.locations);
      } else {
        // No results
        setSearchResults([]);
      }
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
        // Always set a default delivery time
        deliveryTime: "8 minutes",
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      };
      
      // Pass the location to parent component with delivery time
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

  // Add this function to clear the search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    // Focus back on the input field
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 location-modal-container"
      onClick={onClose}
    >
      {/* Global CSS to hide Google's autocomplete dropdown */}
      <style jsx global>{`
        .pac-container {
          display: none !important;
          z-index: -9999 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          height: 0 !important;
          opacity: 0 !important;
        }
        
        /* Make sure our input doesn't show browser autocomplete either */
        input.location-search-input:-webkit-autofill,
        input.location-search-input:-webkit-autofill:hover,
        input.location-search-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
        }
      `}</style>
      
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200 z-10">
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
            <div className="flex">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length < 3) {
                    setSearchResults([]);
                  }
                }}
                placeholder="Search for area, street name..."
                className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent location-search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                role="presentation"
                aria-autocomplete="none"
              />
              {/* Position actions in the input's right side */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Show loading spinner only when searching */}
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                
                {/* Show clear button only when not searching and has query */}
                {searchQuery && !isSearching && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="text-xs text-gray-500 mt-1 ml-1">Type at least 3 characters to search</p>
            )}
          </div>
        </div>

        {/* Current Location */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            CURRENT LOCATION
          </h3>
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <div className="text-gray-900">
                {currentLocation || "Location not set"}
              </div>
              {/* Display delivery time if it exists in local storage */}
              {(() => {
                try {
                  const storedLocation = localStorage.getItem("userLocation");
                  if (storedLocation) {
                    const locationData = JSON.parse(storedLocation);
                    if (locationData.deliveryTime) {
                      return (
                        <p className="text-xs text-green-600 mt-1">
                          Delivery in {locationData.deliveryTime}
                        </p>
                      );
                    }
                  }
                  return null;
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex justify-between items-center">
              <span>SEARCH RESULTS</span>
              <span className="text-xs text-gray-400">{searchResults.length} found</span>
            </h3>
            <div className="space-y-3">
              {searchResults.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    onLocationSelect(location);
                    onClose();
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition flex items-start border border-gray-100 hover:border-gray-300"
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
        ) : (
          searchQuery.length >= 3 && !isSearching && !error && (
            <div className="p-6 text-center">
              <div className="mb-4 text-gray-400">
                <MapPinOff className="w-8 h-8 mx-auto" />
              </div>
              <h4 className="font-medium text-gray-700 mb-1">No locations found</h4>
              <p className="text-sm text-gray-500">Try a different search term or area</p>
            </div>
          )
        )}

        {/* Error Message */}
        {error && <div className="p-6 text-red-500 text-sm text-center">{error}</div>}

        {/* Loading State */}
        {isSearching && !searchResults.length && (
          <div className="p-6 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Searching locations...</p>
          </div>
        )}
      </div>
    </div>
  );
}
