"use client"

import { useState, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "../../lib/store"

interface Address {
  id: number;
  type: "Office" | "Home" | "Hotel" | "Other";
  building: string;
  floor?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone?: string;
  name: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
  addressLabel?: string;
  additionalInstructions?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}
import { Home, Building2, Hotel, MapPin, Plus, X, MapPinOff, Briefcase, Edit, Trash2, MoreVertical, FileText, Tag, Check } from "lucide-react"
import Link from "next/link"
import Layout from "../../components/Layout"
import AddressModal from "../../components/AddressModal"
import toast from "react-hot-toast";

// Addresses will be fetched from the API

// Move parseAddressComponents definition to top-level so it is available everywhere
function parseAddressComponents(components: any[]): any {
  let area = "", city = "", state = "", country = "", pin = "";
  for (const comp of components) {
    if (comp.types.includes("sublocality_level_1")) area = comp.long_name;
    if (comp.types.includes("locality")) city = comp.long_name;
    if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
    if (comp.types.includes("country")) country = comp.long_name;
    if (comp.types.includes("postal_code")) pin = comp.long_name;
  }
  return { area, city, state, country, pin };
}

export default function AddressesPage() {
  const router = useRouter();
  // Fix: Use correct selector for persisted state shape
  const user = useAppSelector((state: any) => state?.auth?.user);
  const token = useAppSelector((state: any) => state?.auth?.token);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address menu states
  const [activeAddressMenu, setActiveAddressMenu] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'instruction' | 'label' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Utility function to set token as cookie
  const setTokenCookie = () => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;
      console.log('Token cookie set:', token.substring(0, 20) + '...');
    } else {
      console.log('No token available to set as cookie');
    }
  };

  // Protect this page
  useEffect(() => {
    if (!user || !token) {
      router.push("/");
    }
  }, [user, token, router]);

  const fetchUserAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      
      // Set token as cookie before making the request
      setTokenCookie();
      
      const response = await fetch(`/api/user/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This is important for sending cookies
        cache: 'no-store' // Disable cache to always get fresh data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      if (Array.isArray(data.addresses)) {
        // Filter out any addresses that are missing essential data
        // Only filter out addresses that are completely invalid or missing critical fields
        const validAddresses = data.addresses.filter((address: any) => 
          address && 
          address.id &&
          (address.building || address.area) && // At least one location identifier
          address.city && 
          address.state && 
          address.pincode
          // Removed name requirement as it might be optional
        );
        console.log('Fetched addresses:', data.addresses);
        console.log('Valid addresses after filtering:', validAddresses);
        setSavedAddresses(validAddresses);
      } else {
        console.error('Invalid address data format:', data);
        throw new Error('Invalid address data received');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Remove initial addresses on error
      setSavedAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
      };
  
  const handleAddAddress = async (newAddress: Omit<Address, 'id'>) => {
    try {
      setIsSubmitting(true);
      // Set token as cookie before making the request
      setTokenCookie();

      const response = await fetch(`/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAddress)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }

      const data = await response.json();
      // Refresh the addresses list
      await fetchUserAddresses();
      setShowAddressModal(false);
      setSelectedAddress(null);
      toast.success('Address added successfully!');
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to add address: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress({ ...address, name: address.name || "" });
    setShowAddressModal(true);
  };

  const handleUpdateAddress = async (updatedAddress: Address) => {
    try {
      setIsSubmitting(true);
      // Set token as cookie before making the request
      setTokenCookie();

      console.log('Updating address:', updatedAddress);
      console.log('Address ID:', updatedAddress.id);

      const response = await fetch(`/api/user/addresses?id=${updatedAddress.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedAddress)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update error data:', errorData);
        throw new Error(errorData.error || 'Failed to update address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Update success:', result);

      // Refresh the addresses list
      await fetchUserAddresses();
      setShowAddressModal(false);
      setSelectedAddress(null);
      toast.success('Address updated successfully!');
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to update address: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      // Set token as cookie before making the request
      setTokenCookie();

      console.log('Deleting address with ID:', addressId);

      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Delete success:', result);

      // Close modal first for better UX
      setShowDeleteModal(false);
      setAddressToDelete(null);
      
      // Show success message
      toast.success('Address deleted permanently!');
      
      // Refresh the addresses list
      await fetchUserAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to delete address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteAddress = (addressId: number) => {
    console.log('confirmDeleteAddress called with ID:', addressId);
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
    setActiveAddressMenu(null);
  };

  // Address menu handlers
  const handleAddressMenuClick = (addressId: string) => {
    console.log('Menu clicked for address:', addressId);
    setActiveAddressMenu(activeAddressMenu === addressId ? null : addressId);
  };

  const handleEditInstruction = (address: Address) => {
    console.log('Edit instruction clicked for address:', address);
    setEditingAddressId(address.id.toString());
    setEditingField('instruction');
    setEditingValue(address.additionalInstructions || '');
    setActiveAddressMenu(null);
  };

  const handleEditLabel = (address: Address) => {
    console.log('Edit label clicked for address:', address);
    setEditingAddressId(address.id.toString());
    setEditingField('label');
    setEditingValue(address.addressLabel || '');
    setActiveAddressMenu(null);
  };

  const handleSetDefault = async (addressId: number) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      setTokenCookie();

      // Find the address to be set as default
      const addressToUpdate = savedAddresses.find(addr => addr.id === addressId);
      if (!addressToUpdate) {
        throw new Error('Address not found');
      }

      console.log('Setting address as default:', addressId);
      
      // Create an update object with all current address data plus isDefault: true
      const updateData = {
        ...addressToUpdate,
        isDefault: true,
        updatedAt: Date.now()
      };

      console.log('Full update data:', updateData);

      // Update the address with all its data, not just isDefault
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      console.log('Set default response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Set default error:', errorData);
        throw new Error(errorData.error || 'Failed to set default address');
      }

      // Optimistically update the UI
      setSavedAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );

      toast.success('Address set as default successfully!');
      
      // Refresh addresses to ensure consistency
      await fetchUserAddresses();
      setActiveAddressMenu(null);
    } catch (error) {
      console.error('Error setting default address:', error);
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
      toast.error(`Failed to set default address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAddressEdit = async () => {
    if (!editingAddressId || !editingField) {
      console.log('Missing required data:', { editingAddressId, editingField });
      return;
    }

    if (isUpdating) return;

    try {
      setIsUpdating(true);
      console.log('Saving address edit:', { editingAddressId, editingField, editingValue });
      setTokenCookie();
      
      const updateData: any = {};
      
      if (editingField === 'instruction') {
        updateData.additionalInstructions = editingValue;
      } else if (editingField === 'label') {
        updateData.addressLabel = editingValue;
      }

      console.log('Update data:', updateData);

      const response = await fetch(`/api/user/addresses?id=${editingAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update error:', errorData);
        throw new Error(errorData.error || 'Failed to update address');
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Update success:', result);

      toast.success(`Address ${editingField} updated successfully!`);
      await fetchUserAddresses(); // Refresh addresses
      
      // Reset editing state
      setEditingAddressId(null);
      setEditingField(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to update address: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null);
    setEditingField(null);
    setEditingValue('');
  };

  useEffect(() => {
    if (user && token) {
      fetchUserAddresses();
    }
  }, [user, token]);

  // Close address menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeAddressMenu) {
        setActiveAddressMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeAddressMenu]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
          {/* Addresses Tab */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-codGray flex items-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Saved Addresses {!isLoadingAddresses && `(${savedAddresses.length})`}</span>
                </h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-purple-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="text-center py-8 sm:py-10 lg:py-16">
                  <div className="animate-spin w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-gray-500 text-sm sm:text-base">Loading addresses...</p>
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="text-center py-8 sm:py-10 lg:py-16">
                  <MapPinOff className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-600 mb-2">
                    No addresses saved yet
                  </h3>
                  <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                    Add your first delivery address to get started!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 sm:p-4 lg:p-6 border border-gray-200 rounded-xl hover:border-brand-primary transition-colors relative"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {address.type === "Home" && <Home className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />}
                          {address.type === "Office" && <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />}
                          {address.type === "Hotel" && <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />}
                          {address.type === "Other" && <MapPinOff className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />}
                          <span className="font-semibold capitalize text-sm sm:text-base">{address.type}</span>
                        </div>
                        
                        {/* Edit and Delete Buttons */}
                        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Address"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteAddress(address.id)}
                            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 relative">
                        {/* Name and Default Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {address.name && (
                            <p className="text-gray-900 font-medium text-sm sm:text-base break-words">{address.name}</p>
                          )}
                          {address.isDefault && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-600 text-xs rounded font-medium flex-shrink-0">Default</span>
                          )}
                        </div>
                        
                        {/* Address Details */}
                        <div className="text-gray-600 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                          {address.building && <p className="break-words">{address.building}{address.floor ? `, Floor ${address.floor}` : ''}</p>}
                          {address.area && <p className="break-words">{address.area}</p>}
                          {address.landmark && <p className="break-words">Near {address.landmark}</p>}
                          {/* Avoid duplicating city, state, pincode if already present in area */}
                          {address.area && (
                            (address.area.includes(address.city) || address.area.includes(address.state) || address.area.includes(address.pincode))
                              ? null
                              : <p className="break-words">{`${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()}</p>
                          )}
                          {!address.area && (
                            <p className="break-words">{`${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()}</p>
                          )}
                          {address.phone && (
                            <p className="text-gray-700 mt-1 break-all">📞 {address.phone}</p>
                          )}
                          {address.additionalInstructions && (
                            <p className="text-gray-500 italic mt-1 text-xs break-words">📝 {address.additionalInstructions}</p>
                          )}
                        </div>
                        
                        {/* Address Label and Set as Default button */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 flex-wrap gap-2">
                          {address.addressLabel && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200 font-medium break-words">
                              {address.addressLabel}
                            </span>
                          )}
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address.id)}
                              disabled={isUpdating}
                              className={`text-xs sm:text-sm flex items-center gap-1 flex-shrink-0 ${
                                isUpdating 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-brand-primary hover:text-brand-primary-dark'
                              }`}
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{isUpdating ? 'Setting...' : 'Set as Default'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

            <AddressModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setSelectedAddress(null);
        }}
        onAddAddress={handleAddAddress}
        onUpdateAddress={handleUpdateAddress}
        selectedAddress={selectedAddress}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-red-600">Delete Address Permanently</h3>
            <p className="text-sm text-gray-700 mb-4 sm:mb-6">
              Are you sure you want to permanently delete this address? This will completely remove the address from your account and cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => addressToDelete && handleDeleteAddress(addressToDelete)}
                disabled={isUpdating}
                className={`py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isUpdating ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAddressToDelete(null);
                }}
                disabled={isUpdating}
                className="bg-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editingAddressId && editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
              {editingField === 'instruction' ? 'Add Additional Instruction' : 'Edit Address Label'}
            </h3>
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              placeholder={
                editingField === 'instruction' 
                  ? 'Enter delivery instructions...' 
                  : 'Enter address label...'
              }
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none text-xs sm:text-sm"
              rows={editingField === 'instruction' ? 4 : 2}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={handleSaveAddressEdit}
                disabled={isUpdating}
                className={`py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                }`}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelAddressEdit}
                disabled={isUpdating}
                className="bg-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

