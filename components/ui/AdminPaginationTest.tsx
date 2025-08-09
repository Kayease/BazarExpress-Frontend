import React, { useState } from 'react';
import AdminPagination from './AdminPagination';
import AdminLoader, { AdminTableSkeleton, AdminGridSkeleton, AdminBrandSkeleton } from './AdminLoader';

// Test component to verify pagination and loaders work correctly
export default function AdminPaginationTest() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skeletonType, setSkeletonType] = useState<'table' | 'grid' | 'brand'>('table');
  
  const totalItems = 157; // Test with a large number
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const toggleLoading = () => {
    setLoading(!loading);
  };

  const changeSkeleton = (type: 'table' | 'grid' | 'brand') => {
    setSkeletonType(type);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Admin Pagination & Loader Test</h1>
        
        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={toggleLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? 'Hide Loading' : 'Show Loading'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => changeSkeleton('table')}
              className={`px-3 py-1 rounded text-sm ${skeletonType === 'table' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Table
            </button>
            <button
              onClick={() => changeSkeleton('grid')}
              className={`px-3 py-1 rounded text-sm ${skeletonType === 'grid' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Grid
            </button>
            <button
              onClick={() => changeSkeleton('brand')}
              className={`px-3 py-1 rounded text-sm ${skeletonType === 'brand' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Brand
            </button>
          </div>
        </div>

        {/* Loading States */}
        {loading && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Loading States:</h2>
            
            {/* Full Screen Loader */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Full Screen Loader:</h3>
              <div className="h-32 relative">
                <AdminLoader message="Loading data..." />
              </div>
            </div>

            {/* Skeleton Loaders */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Skeleton Loader ({skeletonType}):</h3>
              {skeletonType === 'table' && <AdminTableSkeleton rows={5} columns={4} />}
              {skeletonType === 'grid' && <AdminGridSkeleton items={8} />}
              {skeletonType === 'brand' && <AdminBrandSkeleton items={12} />}
            </div>
          </div>
        )}

        {/* Pagination Test */}
        {!loading && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pagination Test:</h2>
            
            {/* Sample Content */}
            <div className="bg-gray-50 p-4 rounded">
              <p>Sample content for page {currentPage}</p>
              <p className="text-sm text-gray-600">
                Showing items {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </p>
            </div>

            {/* Pagination Component */}
            <div className="bg-white rounded-lg shadow-sm">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                itemName="test items"
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current Page:</strong> {currentPage}
          </div>
          <div>
            <strong>Total Pages:</strong> {totalPages}
          </div>
          <div>
            <strong>Items Per Page:</strong> {itemsPerPage}
          </div>
          <div>
            <strong>Total Items:</strong> {totalItems}
          </div>
          <div>
            <strong>Loading State:</strong> {loading ? 'Active' : 'Inactive'}
          </div>
          <div>
            <strong>Skeleton Type:</strong> {skeletonType}
          </div>
        </div>
      </div>
    </div>
  );
}