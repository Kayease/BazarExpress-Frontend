"use client"

import React, { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import AdminLoader, { AdminTableSkeleton, AdminGridSkeleton, AdminBrandSkeleton, AdminCategorySkeleton } from '../../../components/ui/AdminLoader';
import AdminPagination from '../../../components/ui/AdminPagination';

export default function TestLoadersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeLoader, setActiveLoader] = useState<'table' | 'grid' | 'brand' | 'category' | 'none'>('none');
  
  const totalItems = 157;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-codGray mb-2">Loader & Pagination Test</h1>
          <p className="text-gray-600">Test all skeleton loaders and pagination components</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLoader('none')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeLoader === 'none' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              No Loader
            </button>
            <button
              onClick={() => setActiveLoader('table')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeLoader === 'table' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Table Skeleton
            </button>
            <button
              onClick={() => setActiveLoader('grid')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeLoader === 'grid' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Grid Skeleton
            </button>
            <button
              onClick={() => setActiveLoader('brand')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeLoader === 'brand' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Brand Skeleton
            </button>
            <button
              onClick={() => setActiveLoader('category')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeLoader === 'category' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Category Skeleton
            </button>
          </div>
        </div>

        {/* Loader Display */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeLoader === 'none' && (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Loader Active</h3>
              <p className="text-gray-500">Select a loader type to see the skeleton animation</p>
            </div>
          )}

          {activeLoader === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 font-semibold text-sm">Name</th>
                    <th className="py-3 px-4 font-semibold text-sm">Email</th>
                    <th className="py-3 px-4 font-semibold text-sm">Role</th>
                    <th className="py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AdminTableSkeleton rows={8} columns={5} />
                </tbody>
              </table>
            </div>
          )}

          {activeLoader === 'grid' && (
            <div className="p-6">
              <AdminGridSkeleton items={8} />
            </div>
          )}

          {activeLoader === 'brand' && (
            <div className="p-6">
              <AdminBrandSkeleton items={12} />
            </div>
          )}

          {activeLoader === 'category' && (
            <div className="p-6">
              <AdminCategorySkeleton items={8} />
            </div>
          )}
        </div>

        {/* Pagination Test */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Pagination Component Test</h2>
            <p className="text-gray-600 text-sm mt-1">Test pagination with {totalItems} total items</p>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Current Page:</strong> {currentPage} of {totalPages}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Showing:</strong> Items {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </p>
            </div>
            
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

        {/* Full Screen Loader Test */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Full Screen Loader</h2>
          </div>
          <div className="h-64 relative">
            <AdminLoader message="Loading test data..." />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}