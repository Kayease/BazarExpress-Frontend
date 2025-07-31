"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocation } from "@/components/location-provider";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ 
  initialValue = "", 
  placeholder = "Search products...", 
  className = "",
  onSearch
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  
  // Get location context for pincode-based filtering
  const { locationState } = useLocation();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        // Build URL with location context for pincode-based filtering
        let url = `/search?q=${encodeURIComponent(query.trim())}`;
        
        // Add pincode parameter if location is detected
        if (locationState.isLocationDetected && locationState.pincode) {
          url += `&pincode=${locationState.pincode}`;
        }
        
        // Add delivery mode for proper warehouse filtering
        if (locationState.isGlobalMode) {
          url += `&mode=global`;
        }
        
        router.push(url);
      }
    }
  };

  return (
    <input
      type="text"
      className={`border rounded px-4 py-2 w-full max-w-md ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") {
          handleSearch(value);
        }
      }}
    />
  );
}