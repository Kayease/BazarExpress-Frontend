"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Mail, Eye, Trash2, CheckCircle, Clock, MessageCircle } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { apiDelete } from '../../../lib/api-client';
import AdminPagination from '../../../components/ui/AdminPagination';
import AdminLoader, { AdminTableSkeleton } from '../../../components/ui/AdminLoader';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminContacts() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const CONTACTS_PER_PAGE = 10
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'contacts')) {
      router.push("/")
      return
    }
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/contacts`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      toast.error("Could not load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(contacts.length / CONTACTS_PER_PAGE);
  const paginatedContacts = contacts.slice(
    (currentPage - 1) * CONTACTS_PER_PAGE,
    currentPage * CONTACTS_PER_PAGE
  );

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleStatusUpdate = async (contactId: string, newStatus: 'new' | 'read' | 'replied') => {
    try {
      const res = await fetch(`${API_URL}/contacts/${contactId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success("Status updated successfully");
      fetchContacts();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`${API_URL}/contacts/${contactToDelete._id}`);
      toast.success("Contact deleted successfully");
      setDeleteModalOpen(false);
      setContactToDelete(null);
      await fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Could not delete contact.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'replied':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-yellow-100 text-yellow-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    read: contacts.filter(c => c.status === 'read').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  };

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'contacts')) {
    return <AdminLoader message="Checking permissions..." fullScreen />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Contact Messages</h1>
            <p className="text-gray-600">Manage customer contact form submissions</p>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="ml-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="w-full bg-white rounded-2xl shadow-lg p-0 overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3.5 px-6 font-semibold text-sm">Name</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Email</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Subject</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Date</th>
                  <th className="py-3.5 px-6 font-semibold text-sm text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AdminTableSkeleton rows={10} columns={6} />
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Contact Messages</h1>
          <p className="text-gray-600">Manage customer contact form submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.read}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="w-full bg-white rounded-2xl shadow-lg p-0 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3.5 px-6 font-semibold text-sm">Name</th>
                <th className="py-3.5 px-6 font-semibold text-sm">Email</th>
                <th className="py-3.5 px-6 font-semibold text-sm">Subject</th>
                <th className="py-3.5 px-6 font-semibold text-sm">Status</th>
                <th className="py-3.5 px-6 font-semibold text-sm">Date</th>
                <th className="py-3.5 px-6 font-semibold text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-lg text-gray-500 mb-2">No contact messages yet.</div>
                      <div className="text-sm text-gray-400">Contact form submissions will appear here.</div>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedContacts.map(contact => (
                <tr key={contact._id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 align-middle text-sm">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                  </td>
                  <td className="py-4 px-6 align-middle text-sm">
                    <span className="text-gray-600">{contact.email}</span>
                  </td>
                  <td className="py-4 px-6 align-middle text-sm">
                    <span className="text-gray-900">{contact.subject}</span>
                  </td>
                  <td className="py-4 px-6 align-middle text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {getStatusIcon(contact.status)}
                      <span className="ml-1 capitalize">{contact.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 align-middle text-sm">
                    <span className="text-gray-600">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-6 align-middle text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors"
                        onClick={() => handleViewContact(contact)}
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <select
                        value={contact.status}
                        onChange={(e) => handleStatusUpdate(contact._id, e.target.value as 'new' | 'read' | 'replied')}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                      <button 
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-error text-white hover:bg-brand-error-dark transition-colors"
                        onClick={() => handleDeleteClick(contact)}
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {contacts.length > CONTACTS_PER_PAGE && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={CONTACTS_PER_PAGE}
              totalItems={contacts.length}
              itemName="contacts"
            />
          )}
        </div>

        {/* Contact Detail Modal */}
        {showModal && selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative">
              <div className="text-2xl font-bold mb-6 text-brand-primary">Contact Details</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedContact.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-gray-900 font-medium">{selectedContact.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedContact.status)}`}>
                    {getStatusIcon(selectedContact.status)}
                    <span className="ml-1 capitalize">{selectedContact.status}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                </div>
                {selectedContact.ipAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <p className="text-gray-900 text-sm">{selectedContact.ipAddress}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <button 
                  className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
              <button 
                className="absolute top-3 right-3 text-text-secondary hover:text-brand-error text-2xl" 
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && contactToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative border-4 border-brand-error/20">
              {deleteLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-error"></div>
                </div>
              )}
              <div className="text-xl font-bold mb-4 text-brand-error">Delete Contact?</div>
              <div className="mb-6 text-gray-700">
                Are you sure you want to delete this contact message from {contactToDelete.name}? This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors" 
                  onClick={() => { setDeleteModalOpen(false); setContactToDelete(null); }} 
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  className="bg-brand-error hover:bg-brand-error-dark text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-transform" 
                  onClick={confirmDelete} 
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 