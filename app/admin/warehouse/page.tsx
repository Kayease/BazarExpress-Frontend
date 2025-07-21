"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { useAppSelector } from '../../../lib/store';
import { useRouter } from 'next/navigation';
import GoogleMapsModal from '../../../components/GoogleMapsModal';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Define the Warehouse type
interface Warehouse {
  _id: string;
  name: string;
  address: string;
  location: { lat: number | null; lng: number | null };
  contactPhone: string;
  email: string;
  capacity: number;
  status: 'active' | 'inactive';
}

export default function AdminWarehouse() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  // Explicitly type warehouses as Warehouse[]
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    location: { lat: null, lng: null },
    contactPhone: '',
    email: '',
    capacity: 0,
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  const fetchWarehouses = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/warehouses?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const data: Warehouse[] = await res.json();
      setWarehouses(data);
    } catch (err) {
      setError('Could not load warehouses.');
      toast.error('Could not load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      address: '',
      location: { lat: null, lng: null },
      contactPhone: '',
      email: '',
      capacity: 0,
      status: 'active',
    });
    setShowModal(true);
  };
  const openEdit = (w: any) => {
    setEditing(w);
    setForm({
      name: w.name,
      address: w.address,
      location: w.location,
      contactPhone: w.contactPhone,
      email: w.email,
      capacity: w.capacity,
      status: w.status,
    });
    setShowModal(true);
  };
  const handleLocationSelect = (location: any) => {
    setForm({
      ...form,
      address: location.address,
      location: {
        lat: location.latitude,
        lng: location.longitude,
      },
    });
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name || !form.address || !user.id) {
      toast.dismiss();
      toast.error('Please select a location on the map and enter a warehouse name.');
      return;
    }
    setLoading(true);
    try {
      let res;
      let data: Warehouse;
      if (editing) {
        res = await fetch(`${API_URL}/warehouses/${editing._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form }),
        });
        if (!res.ok) throw new Error('Failed to update warehouse');
        data = await res.json();
        setWarehouses(warehouses.map(w => w._id === editing._id ? data : w));
        toast.dismiss();
        toast.success('Warehouse updated');
      } else {
        res = await fetch(`${API_URL}/warehouses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, userId: user.id }),
        });
        if (!res.ok) {
          const errData = await res.json();
          toast.dismiss();
          toast.error(errData.error || 'Failed to add warehouse');
          throw new Error(errData.error || 'Failed to add warehouse');
        }
        data = await res.json();
        setWarehouses([data, ...warehouses]);
        toast.dismiss();
        toast.success('Warehouse added');
      }
      setShowModal(false);
    } catch (err) {
      toast.dismiss();
      toast.error('Error saving warehouse');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/warehouses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete warehouse');
      setWarehouses(warehouses.filter(w => w._id !== id));
      toast.dismiss();
      toast.success('Warehouse deleted');
      setConfirmDeleteId(null);
    } catch (err) {
      toast.dismiss();
      toast.error('Error deleting warehouse');
    } finally {
      setDeleting(false);
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
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
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Address</th>
                <th className="py-3 px-4 font-semibold">Contact Phone</th>
                <th className="py-3 px-4 font-semibold">Capacity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Action </th>
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
                <tr key={w._id} className="bg-white border-b">
                  <td className="py-3 px-4 align-middle max-w-xl whitespace-pre-line">{w.name}</td>
                  <td className="py-3 px-4 align-middle">{w.address}</td>
                  <td className="py-3 px-4 align-middle">{w.contactPhone}</td>
                  <td className="py-3 px-4 align-middle">{w.capacity}</td>
                  <td className="py-3 px-4 align-middle">{capitalizeFirstLetter(w.status)}</td>
                  <td className="py-3 flex px-4 align-middle text-center">
                    <button
                      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-800 text-text-inverse rounded p-2 mr-2"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.address)}`, '_blank')}
                      aria-label="View Location"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-dark text-text-inverse rounded p-2 mr-2"
                      onClick={() => openEdit(w)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center bg-brand-error hover:bg-brand-error-dark text-text-inverse rounded p-2"
                      onClick={() => setConfirmDeleteId(w._id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-8 relative">
              <div className="text-xl font-semibold mb-4">{editing ? "Edit" : "Add"} Warehouse</div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Address (Select from Map)"
                    value={form.address}
                    readOnly
                    required
                  />
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    onClick={() => setShowMapModal(true)}
                  >
                    Select Location on Map
                  </button>
                </div>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Warehouse Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Contact Phone"
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                />
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Product capacity"
                  value={form.capacity || ''}
                  onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                  min={0}
                />
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm">Save</button>
                  <button type="button" className="bg-surface-tertiary hover:bg-surface-tertiary-dark text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
              <button className="absolute top-3 right-3 text-gray-400 hover:text-brand-error text-2xl transition-colors" onClick={() => setShowModal(false)} aria-label="Close">&times;</button>
              {/* Google Maps Modal */}
              <GoogleMapsModal
                isOpen={showMapModal}
                onClose={() => setShowMapModal(false)}
                onLocationSelect={(location) => {
                  handleLocationSelect(location);
                  setShowMapModal(false);
                }}
              />
            </div>
          </div>
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