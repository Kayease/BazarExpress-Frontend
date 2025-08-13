"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Filter, 
  RefreshCw 
} from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { useRouter } from 'next/navigation'
import toast from "react-hot-toast"
import { apiDelete } from '../../../lib/api-client';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  categoryLabel?: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminEnquiry() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState<Contact | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'enquiry')) {
      router.push("/")
      return
    }
    fetchContacts();
  }, [user]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const ENQUIRIES_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredContacts.length / ENQUIRIES_PER_PAGE);
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * ENQUIRIES_PER_PAGE, currentPage * ENQUIRIES_PER_PAGE);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/contacts`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
      setFilteredContacts(data);
    } catch (err) {
      toast.error("Could not load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever filter state changes
  useEffect(() => {
    let result = [...contacts];
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(contact => contact.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(contact => contact.category === categoryFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(contact => 
        contact.name.toLowerCase().includes(term) || 
        contact.email.toLowerCase().includes(term) || 
        contact.subject.toLowerCase().includes(term) ||
        contact.message.toLowerCase().includes(term)
      );
    }
    
    setFilteredContacts(result);
  }, [statusFilter, categoryFilter, searchTerm, contacts]);

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
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
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

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'general':
        return 'bg-purple-100 text-purple-800';
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'feedback':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="font-semibold text-lg">Enquiries</div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button 
                onClick={() => setSearchTerm("")}
                className={`px-2 py-2 bg-gray-100 border-y border-r border-gray-300 rounded-r-md ${searchTerm ? 'text-gray-700' : 'text-gray-400'}`}
                disabled={!searchTerm}
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Categories</option>
                <option value="general">General Inquiry</option>
                <option value="order">Order Support</option>
                <option value="technical">Technical Issue</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
            
            <button 
              onClick={fetchContacts}
              className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-md"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Category</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  </td>
                </tr>
              )}
              {!loading && filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <MessageCircle className="h-12 w-12 text-brand-primary mb-4" />
                      <div className="text-lg text-gray-500 mb-2">No enquiries found.</div>
                      <div className="text-sm text-gray-400 mb-6">
                        {(statusFilter !== "all" || categoryFilter !== "all" || searchTerm) 
                          ? "Try adjusting your filters or search term."
                          : "All customer enquiries will appear here."}
                      </div>
                      {(statusFilter !== "all" || categoryFilter !== "all" || searchTerm) && (
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                            setCategoryFilter("all");
                            setSearchTerm("");
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {paginatedContacts.map(contact => (
                <tr key={contact._id} className="bg-white border-b">
                  <td className="py-2 px-4 align-middle font-semibold text-brand-primary">{contact.name}</td>
                  <td className="py-2 px-4 align-middle">{contact.email}</td>
                  <td className="py-2 px-4 align-middle">{contact.subject}</td>
                  <td className="py-2 px-4 align-middle hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(contact.category)}`}>
                      {contact.categoryLabel || 'General Inquiry'}
                    </span>
                  </td>
                  <td className="py-2 px-4 align-middle">{new Date(contact.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-4 align-middle">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {getStatusIcon(contact.status)}
                      <span className="ml-1 capitalize">{contact.status}</span>
                    </span>
                  </td>
                  <td className="py-2 px-4 align-middle text-center flex gap-2 justify-center">
                    <button 
                      className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-dark text-white rounded p-1 mr-1" 
                      onClick={() => setViewing(contact)} 
                      aria-label="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="inline-flex items-center justify-center bg-brand-error hover:bg-brand-error-dark text-white rounded p-1" 
                      onClick={() => handleDeleteClick(contact)} 
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      </div>

      {/* View Modal */}
      {viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 relative border-4 border-brand-primary">
              <div className="text-2xl font-bold mb-4 text-brand-primary">Enquiry Details</div>
              <div className="mb-2"><span className="font-semibold">Name:</span> {viewing.name}</div>
              <div className="mb-2"><span className="font-semibold">Email:</span> {viewing.email}</div>
              <div className="mb-2"><span className="font-semibold">Subject:</span> {viewing.subject}</div>
              <div className="mb-2"><span className="font-semibold">Category:</span> {viewing.categoryLabel || 'General Inquiry'}</div>
              <div className="mb-2"><span className="font-semibold">Date:</span> {new Date(viewing.createdAt).toLocaleString()}</div>
              <div className="mb-4">
                <span className="font-semibold">Message:</span>
                <div className="bg-gray-50 rounded p-3 mt-1 text-codGray whitespace-pre-line">{viewing.message}</div>
              </div>
              <div className="mb-4">
                <span className="font-semibold">Status:</span>
                <select
                  value={viewing.status}
                  onChange={(e) => handleStatusUpdate(viewing._id, e.target.value as 'new' | 'read' | 'replied')}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  className="bg-surface-tertiary hover:bg-surface-tertiary-dark text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors" 
                  onClick={() => setViewing(null)}
                >
                  Close
                </button>
              </div>
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
              <div className="text-xl font-bold mb-4 text-brand-error">Delete Enquiry?</div>
              <div className="mb-6 text-gray-700">
                Are you sure you want to delete this enquiry from {contactToDelete.name}? This action cannot be undone.
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
    </AdminLayout>
  )
} 