'use client';

import React, { useState, useEffect } from 'react';
import { useRoleAccess } from './RoleBasedAccess';
import { Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  bannerImage?: string;
  isPopular: boolean;
  showOnHome: boolean;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface RoleBasedBrandListProps {
  brands: Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
  onRefresh: () => void;
}

const RoleBasedBrandList: React.FC<RoleBasedBrandListProps> = ({
  brands,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const { user, canEditOwnContent } = useRoleAccess();

  const handleEdit = (brand: Brand) => {
    if (user?.role === 'admin' || canEditOwnContent(brand.createdBy || '')) {
      onEdit(brand);
    } else {
      toast.error('You can only edit brands you created');
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (user?.role === 'admin' || canEditOwnContent(brand.createdBy || '')) {
      if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/brands/${brand._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            toast.success('Brand deleted successfully');
            onRefresh();
          } else {
            const data = await response.json();
            toast.error(data.error || 'Failed to delete brand');
          }
        } catch (error) {
          toast.error('Error deleting brand');
        }
      }
    } else {
      toast.error('You can only delete brands you created');
    }
  };

  const canEditBrand = (brand: Brand) => {
    return user?.role === 'admin' || canEditOwnContent(brand.createdBy || '');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <div key={brand._id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-32 object-contain p-4"
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">
                No Logo
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {brand.name}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                brand.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {brand.status}
              </span>
            </div>
            
            {brand.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {brand.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>Created: {new Date(brand.createdAt).toLocaleDateString()}</span>
              {brand.isPopular && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Popular
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleEdit(brand)}
                disabled={!canEditBrand(brand)}
                className={`p-2 rounded-md transition-colors ${
                  canEditBrand(brand)
                    ? 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title={canEditBrand(brand) ? 'Edit brand' : 'You can only edit brands you created'}
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDelete(brand)}
                disabled={!canEditBrand(brand)}
                className={`p-2 rounded-md transition-colors ${
                  canEditBrand(brand)
                    ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title={canEditBrand(brand) ? 'Delete brand' : 'You can only delete brands you created'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {!canEditBrand(brand) && user?.role !== 'admin' && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <Eye className="w-3 h-3 inline mr-1" />
                View only - Created by another user
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoleBasedBrandList;