'use client';

import React from 'react';
import { useRoleAccess } from './RoleBasedAccess';
import { Edit, Trash2, Eye, Folder, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string;
  hide: boolean;
  popular: boolean;
  icon: string;
  sortOrder: number;
  thumbnail?: string;
  showOnHome: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

interface RoleBasedCategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onRefresh: () => void;
}

const RoleBasedCategoryList: React.FC<RoleBasedCategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const { user, canEditOwnContent } = useRoleAccess();

  const handleEdit = (category: Category) => {
    if (user?.role === 'admin' || canEditOwnContent(category.createdBy || '')) {
      onEdit(category);
    } else {
      toast.error('You can only edit categories you created');
    }
  };

  const handleDelete = async (category: Category) => {
    if (user?.role === 'admin' || canEditOwnContent(category.createdBy || '')) {
      if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/categories/${category._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            toast.success('Category deleted successfully');
            onRefresh();
          } else {
            const data = await response.json();
            toast.error(data.error || 'Failed to delete category');
          }
        } catch (error) {
          toast.error('Error deleting category');
        }
      }
    } else {
      toast.error('You can only delete categories you created');
    }
  };

  const canEditCategory = (category: Category) => {
    return user?.role === 'admin' || canEditOwnContent(category.createdBy || '');
  };

  const isSubcategory = (category: Category) => {
    return category.parentId && category.parentId !== '';
  };

  const getParentCategoryName = (parentId: string) => {
    const parent = categories.find(cat => cat._id === parentId);
    return parent ? parent.name : 'Unknown Parent';
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category._id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {isSubcategory(category) ? (
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                ) : (
                  <Folder className="w-5 h-5 text-purple-500" />
                )}
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  {isSubcategory(category) && (
                    <p className="text-sm text-gray-500">
                      Under: {getParentCategoryName(category.parentId)}
                    </p>
                  )}
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <span>Sort Order: {category.sortOrder}</span>
                <span>Products: {category.productCount || 0}</span>
                <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {category.popular && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded">
                    Popular
                  </span>
                )}
                {category.showOnHome && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded">
                    Show on Home
                  </span>
                )}
                {category.hide && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded">
                    Hidden
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleEdit(category)}
                disabled={!canEditCategory(category)}
                className={`p-2 rounded-md transition-colors ${
                  canEditCategory(category)
                    ? 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title={canEditCategory(category) ? 'Edit category' : 'You can only edit categories you created'}
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDelete(category)}
                disabled={!canEditCategory(category)}
                className={`p-2 rounded-md transition-colors ${
                  canEditCategory(category)
                    ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title={canEditCategory(category) ? 'Delete category' : 'You can only delete categories you created'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {!canEditCategory(category) && user?.role !== 'admin' && (
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              View only - Created by another user
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RoleBasedCategoryList;