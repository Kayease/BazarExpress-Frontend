"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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