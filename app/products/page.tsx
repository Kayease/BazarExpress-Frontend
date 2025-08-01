"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LocationBasedProducts from "@/components/LocationBasedProducts";

import { useLocation } from "@/components/location-provider";

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  // Always use context pincode
  const { locationState, isLoading } = useLocation();
  const contextPincode = locationState?.pincode;
  const isLocationDetected = locationState?.isLocationDetected;

  // Show loading skeleton while fetching location/pincode
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-500">Detecting your location and fetching products...</p>
      </div>
    );
  }

  // On mount: If context has pincode but URL does not (or is out of sync), update URL for shareability
  useEffect(() => {
    if (contextPincode && params.get("pin") !== contextPincode) {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set("pin", contextPincode);
      router.replace(`/products?${newParams.toString()}`);
    }
  }, [contextPincode, router, params]);

  // Only show select pincode message if location detection is complete and no pincode found
  if (isLocationDetected && !contextPincode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
        <div className="mb-6">
          <p>Please select your delivery PIN code to view available products.</p>
        </div>
      </div>
    );
  }

  // If contextPincode exists, always show products (even if URL does not have pin)
  if (contextPincode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded px-4 py-2 w-full max-w-md"
            value={search}
            onChange={e => {
              const val = e.target.value;
              const params = new URLSearchParams(window.location.search);
              if (val) {
                params.set('search', val);
              } else {
                params.delete('search');
              }
              router.push(`/products?${params.toString()}`);
            }}
          />
        </div>
        <div>
          <LocationBasedProducts categoryId={category} searchQuery={search} pincode={contextPincode} />
        </div>
      </div>
    );
  }

  // Optionally, show a loading spinner or nothing if still initializing
  return null;
}