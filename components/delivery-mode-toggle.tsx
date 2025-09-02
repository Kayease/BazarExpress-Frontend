"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from '@/components/location-provider';

interface DeliveryModeToggleProps {
  className?: string;
}

export default function DeliveryModeToggle({ className = "" }: DeliveryModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locationState } = useLocation();
  
  // Get current mode from URL or default based on location state
  const currentMode = searchParams.get("mode") || (locationState.isGlobalMode ? 'global' : 'auto');
  const [selectedMode, setSelectedMode] = useState<'auto' | 'global'>(currentMode as 'auto' | 'global');

  useEffect(() => {
    const mode = searchParams.get("mode") || (locationState.isGlobalMode ? 'global' : 'auto');
    setSelectedMode(mode as 'auto' | 'global');
  }, [searchParams, locationState.isGlobalMode]);

  const handleModeChange = (mode: 'auto' | 'global') => {
    setSelectedMode(mode);
    
    // Update URL with new mode
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'global') {
      params.set('mode', 'global');
    } else {
      params.delete('mode'); // Remove mode parameter for auto mode
    }
    
    // Navigate with new parameters
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Delivery Mode:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleModeChange('auto')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            selectedMode === 'auto'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Local
        </button>
        <button
          onClick={() => handleModeChange('global')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            selectedMode === 'global'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Global
        </button>
      </div>
      <div className="text-xs text-gray-500">
        {selectedMode === 'auto' ? 'Local warehouses' : '24/7 delivery'}
      </div>
    </div>
  );
}