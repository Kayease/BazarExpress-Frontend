"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Edit, Trash2, Eye, Loader2, Check, X, User, Shield, Users, UserCheck, UserX, Mail, Phone, Calendar, MapPin } from "lucide-react"
import toast from 'react-hot-toast'

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'product_inventory_management' | 'order_warehouse_management' | 'marketing_content_manager' | 'customer_support_executive' | 'report_finance_analyst';
  status?: 'active' | 'disabled';
  phone?: string;
  dateOfBirth?: string;
  address?: any;
  assignedWarehouses?: string[];
  createdAt?: string;
  lastLogin?: string;
};

type Warehouse = {
  id: string;
  name: string;
  address: string;
};

type EditFormType = {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'product_inventory_management' | 'order_warehouse_management' | 'marketing_content_manager' | 'customer_support_executive' | 'report_finance_analyst';
  status: 'active' | 'disabled';
  phone: string;
  dateOfBirth: string;
  assignedWarehouses: string[];
  address: {
    street: string;
    landmark: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
};

type ReduxUser = User & { token?: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getRoleDisplayName = (role: string) => {
  const roleMap: { [key: string]: string } = {
    'user': 'User',
    'admin': 'Admin',
    'product_inventory_management': 'Product & Inventory Management',
    'order_warehouse_management': 'Order & Warehouse Management',
    'marketing_content_manager': 'Marketing & Content Manager',
    'customer_support_executive': 'Customer Support Executive',
    'report_finance_analyst': 'Report & Finance Analyst'
  };
  return roleMap[role] || role;
};

const roleConfig = {
  admin: { icon: Shield, color: "text-red-600", bg: "bg-red-100" },
  user: { icon: User, color: "text-blue-600", bg: "bg-blue-100" },
  product_inventory_management: { icon: Users, color: "text-green-600", bg: "bg-green-100" },
  order_warehouse_management: { icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  marketing_content_manager: { icon: Users, color: "text-yellow-600", bg: "bg-yellow-100" },
  customer_support_executive: { icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
  report_finance_analyst: { icon: Users, color: "text-pink-600", bg: "bg-pink-100" },
}

const statusConfig = {
  active: { icon: UserCheck, color: "text-green-600", bg: "bg-green-100" },
  disabled: { icon: UserX, color: "text-red-600", bg: "bg-red-100" },
}

export default function AdminUsers() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const [users, setUsers] = useState<User[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [warehousesLoading, setWarehousesLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditFormType>({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    phone: '',
    dateOfBirth: '',
    assignedWarehouses: [],
    address: {
      street: '',
      landmark: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    },
  });
  const [editLoading, setEditLoading] = useState(false)
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 20

  // Calculate user stats
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    disabled: users.filter(u => u.status === 'disabled').length,
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role !== 'admin' && u.role !== 'user').length,
    customers: users.filter(u => u.role === 'user').length,
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.phone && u.phone.includes(searchTerm));
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  const fetchUsers = async () => {
    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log('Token being sent:', token);
      const res = await fetch(`${API_URL}/auth/users`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        } 
      });
      console.log('Response:', res);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Could not load users.");
      toast.error("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    if (!token) return;
    setWarehousesLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/warehouses`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        } 
      });
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      const data = await res.json();
      setWarehouses(data);
    } catch (err) {
      console.error("Could not load warehouses:", err);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await fetch(`${API_URL}/auth/users/${id}`, { 
        method: 'DELETE', 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        } 
      });
      if (!res.ok) throw new Error("Delete failed");
      setUsers(users.filter(u => u.id !== id));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    setChangingRoleId(id);
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await fetch(`${API_URL}/auth/users/${id}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error("Role update failed");
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast.success("User role updated successfully");
    } catch (err) {
      toast.error("Failed to update user role");
    } finally {
      setChangingRoleId(null);
    }
  };

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      phone: u.phone || '',
      dateOfBirth: u.dateOfBirth || '',
      assignedWarehouses: u.assignedWarehouses || [],
      address: u.address || {
        street: '',
        landmark: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
      },
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditUser(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setEditLoading(true);
    try {
      if (!token) throw new Error("No authentication token found.");
      // Merge updated fields with the existing user object to preserve all other fields
      const updatedUser = {
        ...editUser,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        role: editForm.role,
        status: editForm.status,
        assignedWarehouses: editForm.assignedWarehouses,
        address: editForm.address,
      };
      const res = await fetch(`${API_URL}/auth/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) {
        let errorMsg = "Failed to update user";
        try {
          const errorData = await res.json();
          console.log('Error response:', errorData); // Debug log
          
          // Check for email duplicate error
          if (
            errorData?.error === "EMAIL_EXISTS" ||
            errorData?.error === "DUPLICATE_KEY" ||
            (errorData?.message?.toLowerCase().includes("email") && 
             (errorData?.message?.toLowerCase().includes("exist") || 
              errorData?.message?.toLowerCase().includes("already") ||
              errorData?.message?.toLowerCase().includes("registered")))
          ) {
            errorMsg = "Email already exists. Please use a different email.";
          }
          // Check for phone duplicate error
          else if (
            errorData?.error === "PHONE_EXISTS" ||
            (errorData?.message?.toLowerCase().includes("phone") && 
             (errorData?.message?.toLowerCase().includes("exist") || 
              errorData?.message?.toLowerCase().includes("already")))
          ) {
            errorMsg = "Phone number already exists. Please use a different phone number.";
          }
          // Check for general duplicate error
          else if (errorData?.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          // ignore JSON parse error, fallback to generic
        }
        toast.error(errorMsg);
        return;
      }
      setUsers(users.map(u => u.id === editUser.id ? updatedUser : u));
      toast.success("User updated successfully");
      closeEditModal();
    } catch (err) {
      toast.error("Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusToggle = async (u: User) => {
    if (!token) return;
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${API_URL}/auth/users/${u.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setUsers(users.map(user => user.id === u.id ? { ...user, status: newStatus } : user));
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  useEffect(() => {
    if (user && isAdminUser(user.role) && hasAccessToSection(user.role, 'users')) {
      if (token) {
        fetchUsers();
        fetchWarehouses();
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [user, router]);

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'users')) {
      router.push("/")
      return
    }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Users Management</h2>
            <p className="text-gray-600">Manage all system users and their roles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-codGray">{userStats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-red-600">{userStats.disabled}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-red-600">{userStats.admin}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Staff</p>
              <p className="text-2xl font-bold text-blue-600">{userStats.staff}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-purple-600">{userStats.customers}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">Customer</option>
              <option value="product_inventory_management">Product & Inventory</option>
              <option value="order_warehouse_management">Order & Warehouse</option>
              <option value="marketing_content_manager">Marketing & Content</option>
              <option value="customer_support_executive">Customer Support</option>
              <option value="report_finance_analyst">Report & Finance</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Contact</th>
                  <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Role</th>
                  <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      {filteredUsers.length === 0 ? "No users found" : "No users on this page"}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const RoleIcon = roleConfig[user.role as keyof typeof roleConfig].icon
                    const roleColor = roleConfig[user.role as keyof typeof roleConfig].color
                    const roleBg = roleConfig[user.role as keyof typeof roleConfig].bg
                    const StatusIcon = statusConfig[user.status as keyof typeof statusConfig]?.icon || UserCheck
                    const statusColor = statusConfig[user.status as keyof typeof statusConfig]?.color || "text-green-600"
                    const statusBg = statusConfig[user.status as keyof typeof statusConfig]?.bg || "bg-green-100"

                    return (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition group">
                        <td className="py-3 px-4 align-middle">
                          <div>
                            <p className="font-medium text-sm text-codGray">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            {user.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${roleBg}`}>
                            <RoleIcon className={`h-3 w-3 ${roleColor}`} />
                            <span className={`text-xs font-medium ${roleColor}`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${statusBg}`}>
                            <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                            <span className={`text-xs font-medium ${statusColor} capitalize`}>
                              {user.status || 'active'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors shadow-sm"
                              title="Edit User"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleStatusToggle(user)}
                              className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${
                                user.status === 'active' 
                                  ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                                  : 'text-green-600 bg-green-100 hover:bg-green-200'
                              }`}
                              title={user.status === 'active' ? 'Disable User' : 'Activate User'}
                            >
                              {user.status === 'active' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors shadow-sm"
                              title="Delete User"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {(() => {
                  const maxVisiblePages = 5;
                  const pages = [];
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Smart pagination logic
                    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    // Adjust start if we're near the end
                    const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);
                    
                    for (let i = adjustedStart; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    // Add ellipsis and first/last page if needed
                    if (adjustedStart > 1) {
                      pages.unshift('...');
                      pages.unshift(1);
                    }
                    if (endPage < totalPages) {
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
                    ) : (
                      <button
                        key={page}
                        className={`px-3 py-1 rounded text-sm font-medium border ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="user">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="product_inventory_management">Product & Inventory Management</option>
                    <option value="order_warehouse_management">Order & Warehouse Management</option>
                    <option value="marketing_content_manager">Marketing & Content Manager</option>
                    <option value="customer_support_executive">Customer Support Executive</option>
                    <option value="report_finance_analyst">Report & Finance Analyst</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={editForm.address.street}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, street: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={editForm.address.landmark}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, landmark: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.address.city}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, city: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.address.state}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, state: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.address.country}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, country: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editForm.address.pincode}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      address: { ...editForm.address, pincode: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}