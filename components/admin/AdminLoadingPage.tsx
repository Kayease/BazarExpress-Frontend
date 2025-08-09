"use client";

import React from 'react';
import AdminLayout from '../AdminLayout';
import { 
  FullPageSkeleton, 
  TableSkeleton, 
  CardGridSkeleton, 
  StatsCardsSkeleton,
  FormSkeleton,
  SpecialBannersSkeleton,
  OrdersTableSkeleton
} from './AdminSkeletons';

interface AdminLoadingPageProps {
  type?: 'table' | 'cards' | 'stats' | 'form' | 'dashboard' | 'banners' | 'orders';
  hasButton?: boolean;
  hasTabs?: boolean;
  tabCount?: number;
  contentProps?: any;
}

export default function AdminLoadingPage({ 
  type = 'table',
  hasButton = true,
  hasTabs = false,
  tabCount = 2,
  contentProps = {}
}: AdminLoadingPageProps) {
  
  const renderContent = () => {
    switch (type) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <StatsCardsSkeleton count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardGridSkeleton count={2} columns={1} />
            </div>
          </div>
        );
      
      case 'banners':
        return (
          <div className="space-y-6">
            {hasTabs ? (
              <SpecialBannersSkeleton />
            ) : (
              <TableSkeleton rows={5} columns={4} hasActions={true} />
            )}
          </div>
        );
      
      case 'orders':
        return <OrdersTableSkeleton rows={8} />;
      
      case 'table':
        return <TableSkeleton {...contentProps} />;
      
      case 'cards':
        return <CardGridSkeleton {...contentProps} />;
      
      case 'stats':
        return <StatsCardsSkeleton {...contentProps} />;
      
      case 'form':
        return <FormSkeleton {...contentProps} />;
      
      default:
        return <TableSkeleton {...contentProps} />;
    }
  };

  return (
    <AdminLayout>
      <FullPageSkeleton
        type={type}
        hasButton={hasButton}
        hasTabs={hasTabs}
        tabCount={tabCount}
        contentProps={contentProps}
      />
    </AdminLayout>
  );
}

// Specific loading components for different sections
export const DashboardLoading = () => (
  <AdminLoadingPage type="dashboard" hasButton={false} />
);

export const UsersLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 8, columns: 5, hasActions: true }} 
  />
);

export const ProductsLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 10, columns: 6, hasActions: true }} 
  />
);

export const OrdersLoading = () => (
  <AdminLoadingPage type="orders" />
);

export const BannersLoading = () => (
  <AdminLoadingPage 
    type="banners" 
    hasTabs={true} 
    tabCount={2}
  />
);

export const CategoriesLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 6, columns: 4, hasActions: true }} 
  />
);

export const BrandsLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 6, columns: 4, hasActions: true }} 
  />
);

export const WarehousesLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 5, columns: 5, hasActions: true }} 
  />
);

export const PromocodesLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 6, columns: 6, hasActions: true }} 
  />
);

export const TaxesLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 4, columns: 4, hasActions: true }} 
  />
);

export const DeliverySettingsLoading = () => (
  <AdminLoadingPage 
    type="form" 
    hasButton={false}
    contentProps={{ fields: 8, hasImage: false }} 
  />
);

export const BlogLoading = () => (
  <AdminLoadingPage 
    type="cards" 
    contentProps={{ count: 6, columns: 2, hasImage: true }} 
  />
);

export const NewsletterLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 8, columns: 3, hasActions: true }} 
  />
);

export const EnquiryLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 8, columns: 5, hasActions: true }} 
  />
);

export const ReviewsLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 8, columns: 5, hasActions: true }} 
  />
);

export const InvoiceSettingsLoading = () => (
  <AdminLoadingPage 
    type="form" 
    hasButton={false}
    contentProps={{ fields: 6, hasImage: true }} 
  />
);

export const NoticesLoading = () => (
  <AdminLoadingPage 
    type="table" 
    contentProps={{ rows: 5, columns: 4, hasActions: true }} 
  />
);

export const ReportsLoading = () => (
  <AdminLoadingPage 
    type="stats" 
    hasButton={false}
    contentProps={{ count: 6 }} 
  />
);