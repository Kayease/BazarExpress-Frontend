"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Pencil, Trash2, Plus } from "lucide-react"
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../lib/store';
import { useRouter } from 'next/navigation';

interface Notice {
  _id?: string;
  message: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate: string;
  createdAt?: string;
}

const defaultNotice: Notice = {
  message: "",
  status: "inactive",
  startDate: "",
  endDate: "",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminNotices() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  const fetchNotices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notices");
      const data = await res.json();
      setNotices(data);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchNotices(); }, [token]);

  const handleEdit = (notice: Notice) => {
    setEditing(notice);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Notice deleted.");
      fetchNotices();
    } catch {
      toast.error("Failed to delete notice.");
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(), 1500);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !token) return;
    setLoading(true);
    try {
      let res;
      if (editing._id) {
        res = await fetch(`${API_URL}/notices/${editing._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      } else {
        res = await fetch(`${API_URL}/notices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      toast.success(editing._id ? "Notice updated!" : "Notice created!");
      setEditing(null);
      setShowForm(false);
      fetchNotices();
    } catch {
      toast.error("Failed to save notice.");
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(), 1500);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editing) return;
    setEditing({ ...editing, [e.target.name]: e.target.value });
  };

  const handleActivate = async (id?: string) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const notice = notices.find(n => n._id === id);
      if (!notice) return;
      const res = await fetch(`${API_URL}/notices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...notice, status: 'active' }),
      });
      if (!res.ok) throw new Error("Activation failed");
      toast.success("Notice activated!");
      fetchNotices();
    } catch {
      toast.error("Failed to activate notice.");
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(), 1500);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleToggleStatus = async (notice: Notice) => {
    if (!notice._id || !token) return;
    setLoading(true);
    try {
      const newStatus = notice.status === 'active' ? 'inactive' : 'active';
      const res = await fetch(`${API_URL}/notices/${notice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...notice, status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      toast.success(`Notice ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      fetchNotices();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(), 1500);
    }
  };

  const handleAutoActivate = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notices/auto-activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Auto-activation failed');
      toast.success('Auto-activation completed!');
      fetchNotices();
    } catch {
      toast.error('Auto-activation failed.');
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(), 1500);
    }
  };

  // Date formatting for table
  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Check if notice is scheduled for future
  const isScheduledForFuture = (notice: Notice) => {
    const now = new Date();
    const startDate = new Date(notice.startDate);
    return startDate > now;
  };

  // Check if notice is currently active (within time period)
  const isCurrentlyActive = (notice: Notice) => {
    const now = new Date();
    const startDate = new Date(notice.startDate);
    const endDate = new Date(notice.endDate);
    return notice.status === 'active' && startDate <= now && endDate >= now;
  };

  // Check if notice is expired
  const isExpired = (notice: Notice) => {
    const now = new Date();
    const endDate = new Date(notice.endDate);
    return endDate < now;
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Notice</h2>
            <p className="text-gray-600">Manage all site notices</p>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              onClick={handleAutoActivate}
              disabled={loading}
            >
              {loading ? "Processing..." : "Auto-Activate"}
            </button>
            <button
              className="bg-surface-primary hover:bg-brand-primary hover:text-text-inverse text-text-primary rounded p-2 transition-colors"
              onClick={() => { setEditing({ ...defaultNotice }); setShowForm(true); }}
              aria-label="Add Notice"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 font-semibold">Notice</th>
                <th className="py-3 px-4 font-semibold text-center" style={{ width: '140px' }}>Status</th>
                <th className="py-3 px-4 font-semibold">Start Date</th>
                <th className="py-3 px-4 font-semibold">End Date</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div className="text-lg text-gray-500 mb-2">No notices yet.</div>
                      <div className="text-sm text-gray-400 mb-6">Click the + button or the button below to add your first notice.</div>
                      <button
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        onClick={() => { setEditing({ ...defaultNotice }); setShowForm(true); }}
                      >
                        Add Notice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {notices.map(notice => (
                <tr key={notice._id} className="bg-white border-b">
                  <td className="py-3 px-4 align-middle max-w-xl whitespace-pre-line">{notice.message}</td>
                  <td className="py-3 px-4 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notice.status === 'active' ? 'bg-green-400' : 'bg-gray-300'} hover:ring-2 hover:ring-brand-primary`}
                        onClick={() => handleToggleStatus(notice)}
                        aria-pressed={notice.status === 'active'}
                        aria-label={notice.status === 'active' ? 'Deactivate notice' : 'Activate notice'}
                        disabled={loading}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${notice.status === 'active' ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${notice.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{capitalize(notice.status)}</span>
                      {isScheduledForFuture(notice) && notice.status === 'active' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Scheduled
                        </span>
                      )}
                      {isCurrentlyActive(notice) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Live
                        </span>
                      )}
                      {isExpired(notice) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">{formatDate(notice.startDate)}</td>
                  <td className="py-3 px-4 align-middle">{formatDate(notice.endDate)}</td>
                  <td className="py-3 px-4 align-middle text-center flex gap-2 justify-center">
                    <button
                      className="inline-flex items-center justify-center rounded-full p-2 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors mr-2"
                      onClick={() => handleEdit(notice)}
                      aria-label="Edit"
                      disabled={loading}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-full p-2 text-brand-error hover:bg-brand-error hover:text-white transition-colors"
                      onClick={() => handleDelete(notice._id)}
                      aria-label="Delete"
                      disabled={loading}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Notice Form Modal */}
        {showForm && editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-8 relative">
              <div className="text-xl font-semibold mb-4">{editing._id ? "Edit notice" : "Create notice"}</div>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Your message here...</label>
                  <textarea
                    className="w-full border border-border-primary rounded-lg p-3 focus:ring-2 focus:ring-brand-primary min-h-[120px]"
                    name="message"
                    placeholder="Type something"
                    value={editing.message}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      className="w-full border border-border-primary rounded-lg p-3 focus:ring-2 focus:ring-brand-primary"
                      value={editing.startDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      className="w-full border border-border-primary rounded-lg p-3 focus:ring-2 focus:ring-brand-primary"
                      value={editing.endDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : (editing._id ? "Update" : "Save")}
                  </button>
                  <button
                    type="button"
                    className="bg-surface-tertiary hover:bg-surface-tertiary-dark text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors"
                    onClick={() => { setShowForm(false); setEditing(null); }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
                onClick={() => { setShowForm(false); setEditing(null); }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 