"use client";

import { useState } from 'react';
import { MapPin, Plus, Check, Edit, Home, Building, Hotel, MapIcon } from 'lucide-react';

interface Address {
  id: number;
  type: string;
  building: string;
  floor?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  name: string;
  lat?: number;
  lng?: number;
  additionalInstructions?: string;
}

interface AddressSelectorProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  user: any;
}

export default function AddressSelector({ selectedAddress, onAddressSelect, user }: AddressSelectorProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);

  const getAddressIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'office':
        return <Building className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      default:
        return <MapIcon className="h-5 w-5" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'home':
        return 'bg-blue-100 text-blue-800';
      case 'office':
        return 'bg-purple-100 text-purple-800';
      case 'hotel':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [];
    if (address.building) parts.push(address.building);
    if (address.floor) parts.push(`Floor ${address.floor}`);
    if (address.area) parts.push(address.area);
    if (address.landmark) parts.push(`Near ${address.landmark}`);
    if (address.city) parts.push(address.city);
    if (address.pincode) parts.push(address.pincode);
    
    return parts.join(', ');
  };

  // Get user addresses (including default address)
  const userAddresses = [];
  if (user?.defaultAddress) {
    userAddresses.push(user.defaultAddress);
  }
  if (user?.addresses && Array.isArray(user.addresses)) {
    // Add other addresses that are not the default one
    const otherAddresses = user.addresses.filter((addr: Address) => 
      !user.defaultAddress || addr.id !== user.defaultAddress.id
    );
    userAddresses.push(...otherAddresses);
  }

  return (
    <div className="space-y-4">
      {/* Existing Addresses */}
      {userAddresses.length > 0 ? (
        <div className="space-y-3">
          {userAddresses.map((address: Address, index: number) => (
            <div
              key={address.id || index}
              onClick={() => onAddressSelect(address)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                selectedAddress?.id === address.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedAddress?.id === address.id 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getAddressIcon(address.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{address.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAddressTypeColor(address.type)}`}>
                        {address.type}
                      </span>
                      {user?.defaultAddress?.id === address.id && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {formatAddress(address)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Phone: {address.phone}
                    </p>
                    {address.additionalInstructions && (
                      <p className="text-xs text-gray-500 mt-1">
                        Instructions: {address.additionalInstructions}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedAddress?.id === address.id && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No delivery addresses found</p>
        </div>
      )}

      {/* Add New Address Button */}
      <button
        onClick={() => setShowAddressForm(true)}
        className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>Add New Address</span>
      </button>

      {/* Delivery Time Info */}
      {selectedAddress && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm font-medium text-green-800">
              Delivery available to this address
            </p>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Expected delivery time: 15-20 minutes
          </p>
        </div>
      )}

      {/* Add Address Form Modal - Placeholder */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
            <p className="text-gray-600 mb-4">
              Address management functionality will be implemented here.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddressForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddressForm(false)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}