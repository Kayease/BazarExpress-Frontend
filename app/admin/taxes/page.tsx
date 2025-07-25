"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAppSelector } from '../../../lib/store';
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  BadgePercent,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import TaxFormModal from './TaxFormModal';

// Types
interface Tax {
  _id: string;
  name: string;
  percentage: number;
  isInclusive: boolean;
  applicableFor: "product" | "shipping" | "both";
  country?: string;
  state?: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

type TaxForm = Omit<Tax, "id" | "createdAt" | "updatedAt">;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminTaxes() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth Guard
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  // State
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tax | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTax, setEditTax] = useState<Tax | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const TAXES_PER_PAGE = 10;
  const totalPages = Math.ceil(taxes.length / TAXES_PER_PAGE);
  const paginatedTaxes = taxes.slice((currentPage - 1) * TAXES_PER_PAGE, currentPage * TAXES_PER_PAGE);


  // Fetch taxes
  const fetchTaxes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/taxes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to fetch taxes");
      const data = await res.json();
      setTaxes(data);
    } catch (err) {
      setError("Could not load taxes.");
      toast.error("Could not load taxes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") fetchTaxes();
    // eslint-disable-next-line
  }, [user]);

  // Delete Tax
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/taxes/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 400 && data?.error?.includes('used by one or more products')) {
          toast.error('Cannot delete tax: It is used by one or more products. Remove or update those products first.');
        } else {
          toast.error("Failed to delete tax");
        }
        setConfirmDelete(null);
        fetchTaxes();
        return;
      }
      toast.success("Tax deleted successfully");
      setConfirmDelete(null);
      fetchTaxes();
    } catch (err) {
      toast.error("Failed to delete tax");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtering & Search
  const filteredTaxes = useMemo(() => {
    let filtered = taxes;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (tax) =>
          tax.name.toLowerCase().includes(s) ||
          (tax.country && tax.country.toLowerCase().includes(s)) ||
          (tax.state && tax.state.toLowerCase().includes(s)) ||
          (tax.description && tax.description.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [taxes, search]);

  // Toast for add/edit success
  useEffect(() => {
    if (searchParams.get("added") === "1") {
      toast.success("Tax added successfully");
      router.replace("/admin/taxes");
    }
    if (searchParams.get("edited") === "1") {
      toast.success("Tax updated successfully");
      router.replace("/admin/taxes");
    }
  }, [searchParams, router]);

  // UI
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl font-bold text-codGray mb-1">Taxes Management</h2>
            <p className="text-gray-500 text-base mb-2">Manage your store's tax rules and rates</p>
          </div>
          <Button
            onClick={() => { setEditTax(null); setModalOpen(true); }}
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tax</span>
          </Button>
        </div>
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-3">
              <span className="text-gray-400"><Search className="h-5 w-5" /></span>
              <input
                type="text"
                placeholder="Search taxes..."
                className="flex-1 border-none outline-none bg-transparent text-base"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        {/* Taxes List (Rows) */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
            </div>
          ) : filteredTaxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 w-full min-h-[180px] bg-brand-primary/5">
              <BadgePercent className="h-8 w-8 text-brand-primary mb-2" />
              <div className="text-lg font-bold text-codGray mb-1">No Taxes Yet</div>
              <div className="text-gray-500 mb-4 text-center max-w-xs text-sm">You haven’t created any tax rules for your store. Taxes help you manage compliance and pricing for your products.</div>
              <Button
                onClick={() => { setEditTax(null); setModalOpen(true); }}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-md"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Your First Tax
              </Button>
            </div>
          ) : (
            paginatedTaxes.map(tax => (
              <div
                key={tax._id}
                className="bg-white rounded-xl shadow-md p-2 flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-100 relative group hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border flex items-center justify-center overflow-hidden">
                    <BadgePercent className="h-5 w-5 text-brand-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base text-codGray flex items-center gap-2 truncate">
                      {tax.name}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 min-h-[18px]">{tax.description || 'No description'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 items-center text-xs">
                  <span className="bg-gray-100 rounded px-2 py-0.5 font-semibold">{tax.percentage}%</span>
                  <span className={`rounded px-2 py-0.5 font-semibold ${tax.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-400"}`}>{tax.status === "active" ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex gap-1 sm:ml-2">
                  <button
                    className="p-1 rounded-full hover:bg-brand-primary/10 focus:bg-brand-primary/10 transition-colors"
                    title="Edit"
                    onClick={() => { setEditTax(tax); setModalOpen(true); }}
                  >
                    <Pencil className="h-4 w-4 text-brand-primary" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-red-100 focus:bg-red-100 transition-colors" onClick={() => setConfirmDelete(tax)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center space-x-2 mt-6 mb-2 pr-2">
            <button
              className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-2 py-1 rounded text-xs font-medium border mx-0.5 ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          open={!!confirmDelete}
          title="Delete Tax?"
          description={confirmDelete ? (
            <div>
              <div className="font-semibold">{confirmDelete.name}</div>
              {/* <div className="text-gray-500 text-sm">{confirmDelete.description}</div> */}
              <div className="mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </div>
            </div>
          ) : null}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deletingId !== null}
          onConfirm={() => confirmDelete && handleDelete(confirmDelete._id)}
          onCancel={() => setConfirmDelete(null)}
        />
        <TaxFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tax={editTax ? { ...editTax, _id: editTax._id } : null}
          onSuccess={() => { setModalOpen(false); fetchTaxes(); }}
        />
      </div>
    </AdminLayout>
  );
} 