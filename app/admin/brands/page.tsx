"use client";
import React, { useEffect, useState } from "react";
import { BadgeCheck, Edit, Trash2, Plus, Tag } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/AdminLayout";

import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import BrandFormModal from '../../../components/BrandFormModal';
import AdminPagination from '../../../components/ui/AdminPagination';
import AdminLoader, { AdminBrandSkeleton } from '../../../components/ui/AdminLoader';
import { useAdminStatsRefresh } from '../../../lib/hooks/useAdminStatsRefresh';

interface Brand {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  isPopular: boolean;
  showOnHome: boolean;
  status: "active" | "inactive";
  productCount?: number;
}



export default function BrandManagementPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const BRANDS_PER_PAGE = 18;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Use global stats refresh system
  const { isRefreshing } = useAdminStatsRefresh({
    onRefresh: () => fetchBrands(false),
    debounceMs: 300,
    enabled: true
  });

  // Fetch brands
  useEffect(() => {
    fetchBrands(false);
  }, []);

  async function fetchBrands(showToast = true) {
    try {
      setLoading(true);
      const data = await apiGet(`${API_URL}/brands`);
      setBrands(data);
    } catch (e) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const total = brands.length;
  const active = brands.filter(b => b.status === "active").length;
  const inactive = brands.filter(b => b.status === "inactive").length;
  const home = brands.filter(b => b.showOnHome).length;
  const popular = brands.filter(b => b.isPopular).length;

  // Filtered brands
  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredBrands.length / BRANDS_PER_PAGE);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * BRANDS_PER_PAGE,
    currentPage * BRANDS_PER_PAGE
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Stats
  const stats = [
    {
      label: "Total Brands",
      value: total,
      color: "text-codGray",
      iconColor: "text-brand-primary",
    },
    {
      label: "Active Brands",
      value: active,
      color: "text-green-600",
      iconColor: "text-green-500",
    },
    {
      label: "Inactive Brands",
      value: inactive,
      color: "text-red-500",
      iconColor: "text-red-400",
    },
    {
      label: "Brands on Home",
      value: home,
      color: "text-blue-500",
      iconColor: "text-blue-400",
    },
    {
      label: "Popular Brands",
      value: popular,
      color: "text-pink-500",
      iconColor: "text-pink-400",
    },
  ];

  // Modal open/close
  function openAddModal() {
    setEditingBrand(null);
    setShowModal(true);
  }
  function openEditModal(brand: Brand) {
    setEditingBrand(brand);
    setShowModal(true);
  }





  // Delete Brand
  async function handleDelete(brand: Brand) {
    setConfirmDeleteBrand(brand);
  }

  async function deleteImageFromCloudinary(imageUrl: string) {
    if (!imageUrl) return true;
    try {
      await apiPost(`${API_URL}/brands/delete-image`, { imageUrl });
      return true;
    } catch (error) {
      return false;
    }
  }

  async function confirmDeleteBrandAction() {
    if (!confirmDeleteBrand) return;
    setDeleting(true);
    const toastId = toast.loading("Deleting brand...");

    try {
      // 1. Delete logo and banner images first
      const logoDeleted = await deleteImageFromCloudinary(confirmDeleteBrand.logo || "");
      const bannerDeleted = await deleteImageFromCloudinary(confirmDeleteBrand.bannerImage || "");

      if (!logoDeleted || !bannerDeleted) {
        toast.error("Failed to delete brand images. Brand not deleted.", { id: toastId });
        setDeleting(false);
        setConfirmDeleteBrand(null);
        return;
      }

      // 2. Delete the brand from the database
      await apiDelete(`${API_URL}/brands/${confirmDeleteBrand._id}`);
      toast.success("Brand deleted", { id: toastId });
      fetchBrands();
      setConfirmDeleteBrand(null);
    } catch (err: any) {
      // Display specific error message from backend
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to delete brand";
      toast.error(errorMessage, { id: toastId });
      setConfirmDeleteBrand(null);
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div>
          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h2 className="text-3xl font-bold text-codGray mb-1">Brands Management</h2>
              <p className="text-gray-500 text-base mb-2">Manage your store's brands, logos, and homepage highlights</p>
            </div>
            <button
              className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled
            >
              <Plus className="h-4 w-4" />
              <span>Add Brands</span>
            </button>
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow p-6 flex items-center justify-between border border-gray-100">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          
          {/* Search Bar Skeleton */}
          <div className="bg-white rounded-xl shadow mt-6 p-4 mb-4 border border-gray-100 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="flex-1 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Brand Grid Skeleton */}
          <AdminBrandSkeleton items={18} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl font-bold text-codGray mb-1">Brands Management</h2>
            <p className="text-gray-500 text-base mb-2">Manage your store's brands, logos, and homepage highlights</p>
          </div>
          <button
            className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" />
            <span>Add Brands</span>
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow p-6 flex items-center justify-between border border-gray-100">
              <div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
              <Tag className={`h-8 w-8 ${stat.iconColor}`} />
            </div>
          ))}
        </div>
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow mt-6 p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-gray-400"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
            <input
              type="text"
              placeholder="Search brands..."
              className="flex-1 border-none outline-none bg-transparent text-base"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Brand Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {paginatedBrands.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Tag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? "No brands found" : "No brands yet"}
              </h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchTerm 
                  ? "Try adjusting your search terms or browse all brands."
                  : "Start building your brand collection by adding your first brand. Create logos, descriptions, and showcase them on your homepage."
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={openAddModal}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Brand
                </button>
              )}
            </div>
          ) : (
            paginatedBrands.map(brand => (
              <div
                key={brand._id}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-2 border border-gray-100 relative group transition-all duration-200 w-full hover:shadow-md focus-within:shadow-md"
              >
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border flex items-center justify-center overflow-hidden">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="object-contain w-full h-full aspect-square" />
                    ) : (
                      <BadgeCheck className="h-6 w-6 text-brand-primary/40" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <div className="font-medium text-sm text-codGray flex items-center justify-center gap-1 truncate">
                    {brand.name}
                    {brand.isPopular && <BadgeCheck className="h-3 w-3 text-pink-500" />}
                  </div>
                </div>
                <div className="flex gap-1 items-center text-xs flex-wrap justify-center">
                  <span className="bg-gray-100 rounded px-1.5 py-0.5 text-xs">{brand.productCount || 0} Product</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${brand.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-400"}`}>{brand.status === "active" ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex gap-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <button className="p-1 rounded-full hover:bg-brand-primary/10 focus:bg-brand-primary/10" onClick={() => openEditModal(brand)}><Edit className="h-3 w-3" /></button>
                  <button className="p-1 rounded-full hover:bg-red-100 focus:bg-red-100" onClick={() => handleDelete(brand)}><Trash2 className="h-3 w-3 text-red-500" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredBrands.length > BRANDS_PER_PAGE && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={BRANDS_PER_PAGE}
              totalItems={filteredBrands.length}
              itemName="brands"
            />
          </div>
        )}

        {/* Brand Form Modal */}
        <BrandFormModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBrand(null);
          }}
          onSuccess={async (brand: Brand) => {
            setShowModal(false);
            setEditingBrand(null);
            // Refetch brands to get updated list
            await fetchBrands();
          }}
          brand={editingBrand}
        />

        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          open={!!confirmDeleteBrand}
          title="Delete Brand?"
          description={
            <div>
              <div className="font-semibold">{confirmDeleteBrand?.name}</div>
              {confirmDeleteBrand?.logo && (
                <img src={confirmDeleteBrand.logo} alt={confirmDeleteBrand.name} className="mx-auto my-2 w-16 h-16 object-cover rounded" />
              )}
              <div className="text-gray-500 text-sm">{confirmDeleteBrand?.description}</div>
              <div className="mt-2 text-red-600 font-medium">
                You must delete the brand images first. This action cannot be undone.
              </div>
            </div>
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={confirmDeleteBrandAction}
          onCancel={() => setConfirmDeleteBrand(null)}
        />
      </div>
    </AdminLayout>
  );
} 