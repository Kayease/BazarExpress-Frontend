"use client"

import React, { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth';
import { useRouter } from 'next/navigation';

import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import WarehouseFormModal from '../../../components/WarehouseFormModal';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api-client';
import { Warehouse, defaultWarehouse } from '../../../types/warehouse';

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function AdminWarehouse() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  // Explicitly type warehouses as Warehouse[]
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Warehouse>(defaultWarehouse);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'warehouse')) {
      router.push("/")
      return
    }
    fetchWarehouses();
  }, [user]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`${API_URL}/warehouses`);
      setWarehouses(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Could not load warehouses.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(defaultWarehouse);
    setShowModal(true);
  };
  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({
      ...w,
      deliverySettings: {
        isDeliveryEnabled: w.deliverySettings?.isDeliveryEnabled ?? true,
        disabledMessage: w.deliverySettings?.disabledMessage ?? '',
        deliveryPincodes: w.deliverySettings?.deliveryPincodes ?? [],
        is24x7Delivery: w.deliverySettings?.is24x7Delivery ?? true,
        deliveryDays: w.deliverySettings?.deliveryDays ?? [],
        deliveryHours: {
          start: w.deliverySettings?.deliveryHours?.start ?? '09:00',
          end: w.deliverySettings?.deliveryHours?.end ?? '18:00'
        }
      }
    });
    setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name || !form.address || !user.id) {
      toast.dismiss();
      toast.error('Please select a location on the map and enter a warehouse name.');
      return;
    }
    setLoading(true);
    try {
      let data: Warehouse;
      if (editing && editing._id) {
        data = await apiPut(`${API_URL}/warehouses/${editing._id}`, form);
        setWarehouses(warehouses.map(w => w._id === editing?._id ? data : w));
        toast.dismiss();
        toast.success('Warehouse updated');
      } else {
        data = await apiPost(`${API_URL}/warehouses`, { ...form, userId: user.id });
        setWarehouses([data, ...warehouses]);
        toast.dismiss();
        toast.success('Warehouse added');
      }
      setShowModal(false);
    } catch (err: unknown) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Error saving warehouse';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await apiDelete(`${API_URL}/warehouses/${id}`);
      setWarehouses(warehouses.filter(w => w._id !== id));
      toast.dismiss();
      toast.success('Warehouse deleted');
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete warehouse';
      toast.error(errorMessage);
      console.error('Error deleting warehouse:', err);
    } finally {
      setDeleting(false);
    }
  };



  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'warehouse')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">Warehouses</div>
          <button
            className="bg-surface-primary hover:bg-brand-primary hover:text-text-inverse text-text-primary rounded p-2 transition-colors"
            onClick={openAdd}
            aria-label="Add Warehouse"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 font-semibold text-sm">Name</th>
                <th className="py-2 px-3 font-semibold text-sm">Address</th>
                <th className="py-2 px-3 font-semibold text-sm">Contact Phone</th>
                <th className="py-2 px-3 font-semibold text-sm">Delivery Area</th>
                <th className="py-2 px-3 font-semibold text-sm">Delivery Status</th>
                <th className="py-2 px-3 font-semibold text-sm text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l1.553-4.66A2 2 0 016.447 4h11.106a2 2 0 011.894 1.34L21 10m-9 4v6m-4 0h8" />
                      </svg>
                      <div className="text-lg text-gray-500 mb-2">No warehouses yet.</div>
                      <div className="text-sm text-gray-400 mb-6">Click the + button or the button below to add your first warehouse.</div>
                      <button
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        onClick={openAdd}
                      >
                        Add Warehouse
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {warehouses.map(w => (
                <tr key={w._id || `warehouse-${Math.random()}`} className="bg-white border-b hover:bg-gray-50 transition group">
                  <td className="py-2 px-3 align-middle max-w-xs whitespace-nowrap text-sm font-medium text-gray-900 truncate">{w.name}</td>
                  <td className="py-2 px-3 align-middle max-w-xs whitespace-nowrap text-xs text-gray-700 truncate">{w.address}</td>
                  <td className="py-2 px-3 align-middle text-xs text-gray-700">{w.contactPhone}</td>
                  <td className="py-2 px-3 align-middle text-xs text-gray-700">
                    {w.deliverySettings?.is24x7Delivery ? 
                      'All pincodes (Global)' : 
                      (w.deliverySettings?.deliveryPincodes?.length ? 
                        `${w.deliverySettings.deliveryPincodes.length} pincodes` : 
                        'No pincodes set'
                      )
                    }
                  </td>
                  <td className={`py-2 px-3 align-middle text-xs font-semibold ${
                    w.deliverySettings?.isDeliveryEnabled ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {w.deliverySettings?.isDeliveryEnabled ? 
                      (w.deliverySettings.is24x7Delivery ? '24/7 Global Store' : 'Custom Hours') : 
                      'Disabled'
                    }
                  </td>
                  <td className="py-2 px-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-800 text-white rounded p-1.5 text-xs"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.address)}`, '_blank')}
                        aria-label="View Location"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center bg-purple-500 hover:bg-purple-700 text-white rounded p-1.5 text-xs"
                        onClick={() => openEdit(w)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center bg-red-500 hover:bg-red-700 text-white rounded p-1.5 text-xs"
                        onClick={() => setConfirmDeleteId(w._id || null)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {showModal && (
          <WarehouseFormModal
            open={showModal}
            onClose={() => setShowModal(false)}
            warehouse={editing}
            onSuccess={async (newWarehouse) => {
              setShowModal(false);
              await fetchWarehouses();
            }}
          />
        )}
        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          open={!!confirmDeleteId}
          title="Delete Warehouse?"
          description={`Are you sure you want to delete the warehouse "${warehouses.find(w => w._id === confirmDeleteId)?.name || ''}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={() => handleDelete(confirmDeleteId!)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </div>
    </AdminLayout>
  )
} 