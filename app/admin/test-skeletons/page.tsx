"use client";

import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  TableSkeleton, 
  CardGridSkeleton, 
  StatsCardsSkeleton,
  FormSkeleton,
  SpecialBannersSkeleton,
  OrdersTableSkeleton,
  FullPageSkeleton,
  PageHeaderSkeleton
} from '../../../components/admin/AdminSkeletons';

export default function TestSkeletons() {
  const [activeDemo, setActiveDemo] = useState('table');

  const demos = [
    { id: 'table', name: 'Table Skeleton', component: <TableSkeleton rows={5} columns={4} hasActions={true} /> },
    { id: 'cards', name: 'Card Grid Skeleton', component: <CardGridSkeleton count={6} columns={3} hasImage={true} /> },
    { id: 'stats', name: 'Stats Cards Skeleton', component: <StatsCardsSkeleton count={4} /> },
    { id: 'form', name: 'Form Skeleton', component: <FormSkeleton fields={6} hasImage={true} /> },
    { id: 'banners', name: 'Special Banners Skeleton', component: <SpecialBannersSkeleton /> },
    { id: 'orders', name: 'Orders Table Skeleton', component: <OrdersTableSkeleton rows={8} /> },
    { id: 'header', name: 'Page Header Skeleton', component: <PageHeaderSkeleton hasButton={true} hasTabs={true} tabCount={3} /> },
    { 
      id: 'fullpage', 
      name: 'Full Page Skeleton', 
      component: <FullPageSkeleton type="table" hasButton={true} hasTabs={true} tabCount={2} contentProps={{ rows: 6, columns: 5 }} /> 
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Skeleton Loading Test</h1>
        </div>

        {/* Demo Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Select Skeleton Type:</h2>
          <div className="flex flex-wrap gap-2">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeDemo === demo.id 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Display */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            {demos.find(d => d.id === activeDemo)?.name}
          </h3>
          {demos.find(d => d.id === activeDemo)?.component}
        </div>

        {/* Implementation Guide */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Implementation Guide</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-brand-primary">1. Route-level Loading (loading.tsx files)</h3>
              <p className="text-gray-600 mt-1">
                All admin sections now have loading.tsx files that show skeleton loading during page transitions.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-brand-primary">2. Component-level Loading</h3>
              <p className="text-gray-600 mt-1">
                Use skeleton components within your pages during data fetching by importing from AdminSkeletons.tsx
              </p>
            </div>
            <div>
              <h3 className="font-medium text-brand-primary">3. Available Skeleton Types</h3>
              <ul className="text-gray-600 mt-1 list-disc list-inside space-y-1">
                <li>TableSkeleton - For table-based layouts (users, products, orders, etc.)</li>
                <li>CardGridSkeleton - For card-based layouts (blog, categories, etc.)</li>
                <li>StatsCardsSkeleton - For dashboard statistics</li>
                <li>FormSkeleton - For add/edit forms</li>
                <li>SpecialBannersSkeleton - For banner management</li>
                <li>OrdersTableSkeleton - Specialized for orders with more columns</li>
                <li>FullPageSkeleton - Complete page with header and content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}