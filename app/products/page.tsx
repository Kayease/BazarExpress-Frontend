"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LocationBasedProducts from "@/components/LocationBasedProducts";

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const pin = params.get("pin") || "";

  if (!pin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
        <div className="mb-6">
          <p>Please select a PIN code to view products.</p>
        </div>
      </div>
    );
  }

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
        <LocationBasedProducts categoryId={category} searchQuery={search} />
      </div>
    </div>
  );
}