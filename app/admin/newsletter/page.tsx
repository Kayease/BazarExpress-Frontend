"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { 
  Mail, 
  Trash2, 
  CheckCircle, 
  X, 
  Send, 
  Download, 
  Filter, 
  RefreshCw,
  Search,
  AlertTriangle,
  Info
} from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { useRouter } from 'next/navigation'
import toast from "react-hot-toast"
import { API_URL } from '../../../lib/config'

interface Subscriber {
  _id: string;
  email: string;
  isSubscribed: boolean;
  subscribedAt: string;
  lastEmailSent?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  sources: {
    footer: number;
    popup: number;
    checkout: number;
    other: number;
  };
  recentSubscribers: Subscriber[];
}

export default function AdminNewsletter() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();

  // State for subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // State for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'newsletter')) {
      router.push("/")
      return
    }
    fetchSubscribers();
    fetchStats();
  }, [user, token]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/newsletter`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const data = await res.json();
      setSubscribers(data);
      setFilteredSubscribers(data);
    } catch (err) {
      toast.error("Could not load subscribers");
      console.error("Error fetching subscribers:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch newsletter stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching newsletter stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Apply filters whenever filter state changes
  useEffect(() => {
    let result = [...subscribers];
    
    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter(subscriber => subscriber.isSubscribed === isActive);
    }
    
    // Apply source filter
    if (sourceFilter !== "all") {
      result = result.filter(subscriber => subscriber.source === sourceFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(subscriber => 
        subscriber.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredSubscribers(result);
  }, [statusFilter, sourceFilter, searchTerm, subscribers]);

  const handleDeleteClick = (subscriber: Subscriber) => {
    setSubscriberToDelete(subscriber);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subscriberToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/${subscriberToDelete._id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete subscriber");
        setDeleteLoading(false);
        return;
      }
      toast.success("Subscriber deleted successfully");
      setDeleteModalOpen(false);
      setSubscriberToDelete(null);
      await fetchSubscribers();
      await fetchStats();
    } catch (err: any) {
      toast.error(err.message || "Could not delete subscriber.");
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Function to open default mail client with all subscribers in BCC
  const openMailClient = () => {
    try {
      // Filter only active subscribers
      const activeSubscribers = subscribers.filter(sub => sub.isSubscribed);
      
      if (activeSubscribers.length === 0) {
        toast.error("No active subscribers found");
        return;
      }
      
      // Get all subscriber emails
      const emails = activeSubscribers.map(sub => sub.email);
      
      // Create mailto link with BCC
      const subject = encodeURIComponent("Newsletter from BazarXpress");
      
      // Email body with unsubscribe instructions
      // Note: We can't use HTML in mailto body, so we're using plain text with clear instructions
      const emailBody = `Hello,

We hope this email finds you well.

Best regards,
BazarXpress Team

---

To unsubscribe from our newsletter, please click this link:
${window.location.origin}/newsletter/unsubscribe

`;
      
      const body = encodeURIComponent(emailBody);
      const bcc = encodeURIComponent(emails.join(","));
      
      // Create the mailto URL
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}&bcc=${bcc}`;
      
      // Open the default mail client
      window.location.href = mailtoUrl;
      
      toast.success(`Opening mail client with subscribers in BCC`);
    } catch (error) {
      console.error("Error opening mail client:", error);
      toast.error("Failed to open mail client. Please try again.");
    }
  };
  
  const exportSubscribers = () => {
    const subscribersCSV = [
      // CSV Header
      ["Email", "Status", "Source", "Subscribed Date"],
      // CSV Data
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.isSubscribed ? "Active" : "Inactive",
        sub.source,
        new Date(sub.subscribedAt).toLocaleDateString()
      ])
    ]
      .map(row => row.join(","))
      .join("\n");
    
    const blob = new Blob([subscribersCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'footer': return 'Website Footer';
      case 'popup': return 'Popup Form';
      case 'checkout': return 'Checkout Page';
      case 'other': return 'Other Source';
      default: return 'Unknown';
    }
  };
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'footer': return 'bg-blue-100 text-blue-800';
      case 'popup': return 'bg-purple-100 text-purple-800';
      case 'checkout': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const SUBSCRIBERS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredSubscribers.length / SUBSCRIBERS_PER_PAGE);
  const paginatedSubscribers = filteredSubscribers.slice((currentPage - 1) * SUBSCRIBERS_PER_PAGE, currentPage * SUBSCRIBERS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="font-semibold text-lg">Newsletter Management</div>
          
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <button 
              onClick={openMailClient}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              <Send className="h-4 w-4 mr-2" />
              Compose Email
            </button>
            
            <button 
              onClick={exportSubscribers}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-500 mb-1">Total Subscribers</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-500 mb-1">Active Subscribers</div>
              <div className="text-2xl font-bold">{stats.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="text-sm text-gray-500 mb-1">Unsubscribed</div>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-sm text-gray-500 mb-1">Sources</div>
              <div className="flex space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Footer: {stats.sources.footer}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Popup: {stats.sources.popup}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search by email..."
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
                <option value="active">Active</option>
                <option value="inactive">Unsubscribed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Sources</option>
                <option value="footer">Website Footer</option>
                <option value="popup">Popup Form</option>
                <option value="checkout">Checkout Page</option>
                <option value="other">Other Sources</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                fetchSubscribers();
                fetchStats();
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-md"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            
            {(statusFilter !== "all" || sourceFilter !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {/* Subscribers Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Source</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Subscribed Date</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  </td>
                </tr>
              )}
              
              {!loading && filteredSubscribers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Mail className="h-12 w-12 text-brand-primary mb-4" />
                      <div className="text-lg text-gray-500 mb-2">No subscribers found.</div>
                      <div className="text-sm text-gray-400 mb-6">
                        {(statusFilter !== "all" || sourceFilter !== "all" || searchTerm) 
                          ? "Try adjusting your filters or search term."
                          : "Newsletter subscribers will appear here."}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {paginatedSubscribers.map(subscriber => (
                <tr key={subscriber._id} className="bg-white border-b">
                  <td className="py-2 px-4 align-middle font-medium">
                    {subscriber.email}
                  </td>
                  <td className="py-2 px-4 align-middle hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(subscriber.source)}`}>
                      {getSourceLabel(subscriber.source)}
                    </span>
                  </td>
                  <td className="py-2 px-4 align-middle">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscriber.isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {subscriber.isSubscribed ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Unsubscribed</>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-4 align-middle hidden md:table-cell">
                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 align-middle text-center">
                    <button 
                      className="inline-flex items-center justify-center bg-brand-error hover:bg-brand-error-dark text-white rounded p-1" 
                      onClick={() => handleDeleteClick(subscriber)} 
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
        
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && subscriberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative border-4 border-brand-error/20">
              {deleteLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-error"></div>
                </div>
              )}
              <div className="text-xl font-bold mb-4 text-brand-error">Delete Subscriber?</div>
              <div className="mb-6 text-gray-700">
                Are you sure you want to delete this subscriber: <span className="font-semibold">{subscriberToDelete.email}</span>? This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors" 
                  onClick={() => { setDeleteModalOpen(false); setSubscriberToDelete(null); }} 
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
