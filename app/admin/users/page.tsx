"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Edit, Trash2, Eye, Loader2, Check, X, User, Shield, Users, UserCheck, UserX, Mail, Phone, Calendar, MapPin, Lock, Truck, RefreshCw } from "lucide-react"
import toast from 'react-hot-toast'
import { apiGet, apiDelete, apiPut, apiPost, apiPatch } from "../../../lib/api-client"
import { useAdminStatsRefresh } from "../../../lib/hooks/useAdminStatsRefresh"

type User = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'product_inventory_management' | 'order_warehouse_management' | 'marketing_content_manager' | 'customer_support_executive' | 'report_finance_analyst' | 'delivery_boy';
  status?: 'active' | 'disabled';
  phone?: string;
  dateOfBirth?: string;
  address?: any;
  assignedWarehouses?: Array<string | {id?: string, _id?: string, name: string, address: string}>;
  createdAt?: string;
  lastLogin?: string;
};

type Warehouse = {
  id?: string;
  _id?: string;
  name: string;
  address: string;
};

type EditFormType = {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'product_inventory_management' | 'order_warehouse_management' | 'marketing_content_manager' | 'customer_support_executive' | 'report_finance_analyst' | 'delivery_boy';
  status: 'active' | 'disabled';
  phone: string;
  dateOfBirth: string;
  assignedWarehouses: string[];
  newPassword: string;
  confirmPassword: string;
};

type ReduxUser = User & { token?: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get warehouse ID (handles both 'id' and '_id')
const getWarehouseId = (warehouse: any): string => {
  return warehouse.id || warehouse._id || '';
};

// Helper function to get user ID (handles both 'id' and '_id')
const getUserId = (user: any): string => {
  return user.id || user._id || '';
};

const getRoleDisplayName = (role: string) => {
  const roleMap: { [key: string]: string } = {
    'user': 'User',
    'admin': 'Admin',
    'product_inventory_management': 'Product & Inventory Management',
    'order_warehouse_management': 'Order & Warehouse Management',
    'marketing_content_manager': 'Marketing & Content Manager',
    'customer_support_executive': 'Customer Support Executive',
    'report_finance_analyst': 'Report & Finance Analyst',
    'delivery_boy': 'Delivery Agent'
  };
  return roleMap[role] || role;
};

const roleConfig = {
  admin: { icon: Shield, color: "text-red-600", bg: "bg-red-100" },
  user: { icon: User, color: "text-blue-600", bg: "bg-blue-100", isCustomer: true },
  product_inventory_management: { icon: Users, color: "text-green-600", bg: "bg-green-100" },
  order_warehouse_management: { icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  marketing_content_manager: { icon: Users, color: "text-yellow-600", bg: "bg-yellow-100" },
  customer_support_executive: { icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
  report_finance_analyst: { icon: Users, color: "text-pink-600", bg: "bg-pink-100" },
  delivery_boy: { icon: Truck, color: "text-orange-600", bg: "bg-orange-100" },
}

const statusConfig = {
  active: { icon: UserCheck, color: "text-green-600", bg: "bg-green-100" },
  disabled: { icon: UserX, color: "text-red-600", bg: "bg-red-100" },
}

export default function AdminUsers() {
  const currentUser = useAppSelector((state) => state.auth.user)
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
    newPassword: '',
    confirmPassword: '',
  });
  const [editLoading, setEditLoading] = useState(false)
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 20

  // Calculate user stats - ensure users is always an array and force recalculation
  const safeUsers = Array.isArray(users) ? users : [];
  const userStats = useMemo(() => {
    const stats = {
      total: safeUsers.length,
      active: safeUsers.filter(u => u.status === 'active').length,
      disabled: safeUsers.filter(u => u.status === 'disabled').length,
      admin: safeUsers.filter(u => u.role === 'admin').length,
      staff: safeUsers.filter(u => u.role !== 'admin' && u.role !== 'user').length,
      customers: safeUsers.filter(u => u.role === 'user').length,
    };
    return stats;
  }, [safeUsers]);


  // Filter and sort users - use safeUsers to ensure it's always an array
  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.phone && u.phone.includes(searchTerm));
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    // Define role priority: admin first, then other roles, then users last
    const rolePriority: { [key: string]: number } = {
      'admin': 1,
      'product_inventory_management': 2,
      'order_warehouse_management': 3,
      'marketing_content_manager': 4,
      'customer_support_executive': 5,
      'report_finance_analyst': 6,
      'delivery_boy': 7,
      'user': 8
    };
    
    const aPriority = rolePriority[a.role] || 8;
    const bPriority = rolePriority[b.role] || 8;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same role priority, sort by name
    return a.name.localeCompare(b.name);
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      
      const data = await apiGet(`${API_URL}/admin/users?includeAll=true`);
      
      // Handle different API response structures
      if (data && Array.isArray(data.users)) {
        // New format: { users: Array, pagination: {...} }
        console.log("Using new format, found users:", data.users.length);
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        // Old format: direct array response
        setUsers(data);
      } else {
        console.error("API returned invalid data structure:", data);
        setUsers([]);
        setError("Invalid data format received from server");
        toast.error("Invalid data format received from server");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Could not load users.");
      toast.error(err.message || "Could not load users.");
      setUsers([]); // Ensure users is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  // Use global stats refresh system
  const { isRefreshing } = useAdminStatsRefresh({
    onRefresh: fetchUsers,
    debounceMs: 300,
    enabled: true
  });

  const fetchWarehouses = async () => {
    // Only fetch warehouses if user has admin access
    if (currentUser?.role !== 'admin') return;
    
    setWarehousesLoading(true);
    try {
      const data = await apiGet(`${API_URL}/auth/warehouses`);
      const warehouseData = Array.isArray(data) ? data : [];
      
      // Log warehouse data for debugging
      console.log("Fetched warehouses:", warehouseData);
      if (editUser && editUser.assignedWarehouses) {
        console.log("User's assigned warehouses:", editUser.assignedWarehouses);
      }
      
      setWarehouses(warehouseData);
    } catch (err) {
      console.error("Could not load warehouses:", err);
      setWarehouses([]);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Only admin can delete users
    if (currentUser?.role !== 'admin') {
      toast.error("You don't have permission to delete users");
      return;
    }
    
    setDeletingId(id);
    try {
      await apiDelete(`${API_URL}/admin/users/${id}`);
      setUsers((prevUsers) => {
        if (!Array.isArray(prevUsers)) return [];
        return prevUsers.filter(u => getUserId(u) !== id);
      });
      toast.success("User deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    // Only admin can change user roles
    if (currentUser?.role !== 'admin') {
      toast.error("You don't have permission to change user roles");
      return;
    }
    
    setChangingRoleId(id);
    try {
      await apiPut(`${API_URL}/admin/users/${id}`, { role: newRole });
      setUsers((prevUsers) => {
        if (!Array.isArray(prevUsers)) return [];
        return prevUsers.map(u => getUserId(u) === id ? { ...u, role: newRole } : u);
      });
      toast.success("User role updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'disabled') => {
    try {
      // Use the correct endpoint for status changes that allows customer support executive
      await apiPatch(`${API_URL}/auth/users/${id}/status`, { status: newStatus });
      setUsers((prevUsers) => {
        if (!Array.isArray(prevUsers)) return [];
        return prevUsers.map(u => getUserId(u) === id ? { ...u, status: newStatus } : u);
      });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const openEditModal = (u: User) => {
    console.log("Opening edit modal for user:", u);
    
    // Ensure assignedWarehouses is always an array
    const rawAssignedWarehouses = Array.isArray(u.assignedWarehouses) ? u.assignedWarehouses : [];
    console.log("User's assigned warehouses:", rawAssignedWarehouses);
    
    // Extract warehouse IDs from assignedWarehouses (which might be objects or IDs)
    const assignedWarehouseIds = rawAssignedWarehouses.map(warehouse => {
      if (typeof warehouse === 'string') {
        return warehouse; // Already an ID
      } else if (warehouse && typeof warehouse === 'object') {
        // Extract ID from warehouse object
        return warehouse._id || warehouse.id || '';
      }
      return '';
    }).filter(id => id !== ''); // Remove any empty IDs
    
    console.log("Extracted warehouse IDs:", assignedWarehouseIds);
    
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      phone: u.phone || '',
      dateOfBirth: u.dateOfBirth || '',
      assignedWarehouses: assignedWarehouseIds,
      newPassword: '',
      confirmPassword: '',
    });
    setEditModalOpen(true);
    
    // Load warehouses when opening the modal for roles that need it
    if (u.role === 'product_inventory_management' || u.role === 'order_warehouse_management' || u.role === 'delivery_boy') {
      fetchWarehouses();
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditUser(null);
  };

  const handleSendPasswordResetEmail = async (user: User) => {
    if (user.role === 'user') {
      toast.error("Regular users do not require password reset links");
      return;
    }

    if (!user.email) {
      toast.error("User does not have an email address");
      return;
    }

    try {
      // Generate expiration time (10 minutes from now)
      const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
      
      // Generate a password reset link with expiration
      const resetLink = `${window.location.origin}/admin/password-reset?userId=${getUserId(user)}&role=${user.role}&expires=${expirationTime}`;
      
      // Create email template
      const subject = encodeURIComponent("Password Reset Request - Bazar Admin");
      const body = encodeURIComponent(`Dear ${user.name || 'User'},

You have requested a password reset for your Bazar admin account.

Please click the link below to reset your password:
${resetLink}

Important Notes:
- This link will expire in 10 minutes for security reasons
- If you did not request this password reset, please ignore this email
- For security, please do not share this link with anyone

Role: ${getRoleDisplayName(user.role)}
Account: ${user.email}

If you have any issues, please contact your system administrator.

Best regards,
Bazar Admin Team`);

      // Open email client with prefilled template
      const mailtoLink = `mailto:${user.email}?subject=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');
      
      toast.success(`Email client opened with password reset template for ${user.name || user.phone}`);
    } catch (err) {
      toast.error("Failed to open email client");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const userId = getUserId(editUser);
    console.log("Submitting edit for user ID:", userId);
    console.log("Edit form data:", editForm);
    
    if (!userId) {
      toast.error("User ID is missing. Cannot update user.");
      return;
    }

    // Only admin can edit user details
    if (currentUser?.role !== 'admin') {
      toast.error("You don't have permission to edit user details");
      return;
    }

    // Validate phone number (exactly 10 digits)
    if (editForm.phone && !/^\d{10}$/.test(editForm.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    // Validate password fields if provided
    if (editForm.newPassword || editForm.confirmPassword) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (editForm.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      // Only allow password setting for non-user roles
      if (editForm.role === 'user') {
        toast.error("Regular users do not require passwords");
        return;
      }
    }

    // Validate warehouse assignment for roles that require it
    if (editForm.role === 'product_inventory_management' || editForm.role === 'order_warehouse_management' || editForm.role === 'delivery_boy') {
      if (!editForm.assignedWarehouses || editForm.assignedWarehouses.length === 0) {
        toast.error("Please select at least one warehouse for this role");
        return;
      }
    }

    setEditLoading(true);
    try {
      // Create a clean update payload with only the necessary fields
      const updatePayload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        role: editForm.role,
        status: editForm.status,
        assignedWarehouses: editForm.assignedWarehouses,
        ...(editForm.newPassword && editForm.newPassword.trim() !== '' && { password: editForm.newPassword })
      };
      
      // Update user details
      await apiPut(`${API_URL}/admin/users/${userId}`, updatePayload);
      
      // Password is already included in the updatePayload object if provided
      
      // Update users in state - ensure the updated user maintains its ID
      setUsers((prevUsers) => {
        if (!Array.isArray(prevUsers)) return [];
        return prevUsers.map(u => {
          if (getUserId(u) === userId) {
            // Preserve the original ID fields and merge with update payload
            return { 
              ...u, 
              ...updatePayload,
              // Ensure ID fields are preserved
              id: u.id,
              _id: u._id
            };
          }
          return u;
        });
      });
      
      const successMessage = editForm.newPassword 
        ? "User updated successfully and password set" 
        : "User updated successfully";
      toast.success(successMessage);
      closeEditModal();
    } catch (err: any) {
      let errorMsg = "Failed to update user";
      
      // Check for specific error types
      if (err.message?.toLowerCase().includes("email") && err.message?.toLowerCase().includes("exist")) {
        errorMsg = "Email already exists. Please use a different email.";
      } else if (err.message?.toLowerCase().includes("phone") && err.message?.toLowerCase().includes("exist")) {
        errorMsg = "Phone number already exists. Please use a different phone number.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusToggle = async (u: User) => {
    if (!token) return;
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${API_URL}/admin/users/${getUserId(u)}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setUsers((prevUsers) => {
        if (!Array.isArray(prevUsers)) return [];
        return prevUsers.map(user => getUserId(user) === getUserId(u) ? { ...user, status: newStatus } : user);
      });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  useEffect(() => {
    if (currentUser && isAdminUser(currentUser.role) && hasAccessToSection(currentUser.role, 'users')) {
      if (token) {
        fetchUsers();
        fetchWarehouses();
      } else {
        router.push("/");
      }
    } else if (currentUser) {
      // Only redirect if currentUser is loaded (not null/undefined)
      router.push("/");
    }
  }, [currentUser, router, token]);

  if (!currentUser || !isAdminUser(currentUser.role) || !hasAccessToSection(currentUser.role, 'users')) {
      return null;
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
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Users & Customers Management</h2>
            <p className="text-gray-600">Manage all system users, staff, and customers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Refresh user list"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating stats...</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4" data-testid="stats-cards">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-codGray" data-testid="total-count">{userStats.total}</p>
              </div>
            </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600" data-testid="active-count">{userStats.active}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-red-600" data-testid="disabled-count">{userStats.disabled}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-red-600" data-testid="admin-count">{userStats.admin}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Staff</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="staff-count">{userStats.staff}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="customers-count">{userStats.customers}</p>
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
              <option key="all" value="all">All Roles</option>
              <option key="admin" value="admin">Admin</option>
              <option key="user" value="user">Customer</option>
              <option key="product_inventory_management" value="product_inventory_management">Product & Inventory</option>
              <option key="order_warehouse_management" value="order_warehouse_management">Order & Warehouse</option>
              <option key="marketing_content_manager" value="marketing_content_manager">Marketing & Content</option>
              <option key="customer_support_executive" value="customer_support_executive">Customer Support</option>
              <option key="report_finance_analyst" value="report_finance_analyst">Report & Finance</option>
              <option key="delivery_boy" value="delivery_boy">Delivery Agent</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option key="all-status" value="all">All Status</option>
              <option key="active-status" value="active">Active</option>
              <option key="disabled-status" value="disabled">Disabled</option>
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
                  paginatedUsers.map((user, index) => {
                    // Default to User icon if role is not found in roleConfig
                    const roleData = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user
                    const RoleIcon = roleData.icon
                    const roleColor = roleData.color
                    const roleBg = roleData.bg
                    const StatusIcon = statusConfig[user.status as keyof typeof statusConfig]?.icon || UserCheck
                    const statusColor = statusConfig[user.status as keyof typeof statusConfig]?.color || "text-green-600"
                    const statusBg = statusConfig[user.status as keyof typeof statusConfig]?.bg || "bg-green-100"

                    return (
                      <tr key={`user-${getUserId(user)}-${index}`} className={`border-b border-gray-200 hover:bg-gray-50 transition group ${user.role === 'user' ? 'bg-blue-50/30' : ''}`}>
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
                          <div className="flex items-center text-right justify-end gap-1 flex-wrap">
                            {/* Admin Actions */}
                            {currentUser?.role === 'admin' && (
                              <>
                                {/* Edit Button */}
                                <button 
                                  onClick={() => openEditModal(user)}
                                  className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors shadow-sm"
                                  title="Edit User"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </button>

                                {/* Password Reset Email - Only for non-user roles */}
                                {user.role !== 'user' && (
                                  <button
                                    onClick={() => handleSendPasswordResetEmail(user)}
                                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors shadow-sm"
                                    title="Send Password Reset Email (10 min expiry)"
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Reset
                                  </button>
                                )}

                                {/* Status Toggle */}
                                <button
                                  onClick={() => handleStatusChange(getUserId(user), user.status === 'active' ? 'disabled' : 'active')}
                                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${
                                    user.status === 'active' 
                                      ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                                      : 'text-green-600 bg-green-100 hover:bg-green-200'
                                  }`}
                                  title={user.status === 'active' ? 'Disable User' : 'Activate User'}
                                >
                                  {user.status === 'active' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setConfirmDelete(getUserId(user))}
                                  className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors shadow-sm"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}

                            {/* Customer Support Executive Actions */}
                            {currentUser?.role === 'customer_support_executive' && (
                              <>
                                {/* Can only change status of regular users */}
                                {user.role === 'user' ? (
                                  <button
                                    onClick={() => handleStatusChange(getUserId(user), user.status === 'active' ? 'disabled' : 'active')}
                                    className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${
                                      user.status === 'active' 
                                        ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                                        : 'text-green-600 bg-green-100 hover:bg-green-200'
                                    }`}
                                    title={user.status === 'active' ? 'Disable User' : 'Activate User'}
                                  >
                                    {user.status === 'active' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                  </button>
                                ) : (
                                  <span 
                                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg"
                                    title="Customer Support Executive can only change status of regular customers"
                                  >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Restricted
                                  </span>
                                )}
                              </>
                            )}

                            {/* Other roles - view only */}
                            {currentUser?.role !== 'admin' && currentUser?.role !== 'customer_support_executive' && (
                              <span className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg" title="View Only Access">
                                <Eye className="h-3 w-3 mr-1" />
                                View Only
                              </span>
                            )}
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                      if (value.length <= 10) { // Limit to 10 digits
                        setEditForm({ ...editForm, phone: value });
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                  {editForm.phone && editForm.phone.length !== 10 && (
                    <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                    {editUser && currentUser && getUserId(editUser) === getUserId(currentUser) && (
                      <span className="text-xs text-amber-600 ml-2">(You cannot change your own role)</span>
                    )}
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      setEditForm({ 
                        ...editForm, 
                        role: newRole,
                        // Clear warehouse assignments when changing roles
                        assignedWarehouses: []
                      });
                      
                      // Fetch warehouses if switching to a warehouse-dependent role
                      if (newRole === 'product_inventory_management' || newRole === 'order_warehouse_management' || newRole === 'delivery_boy') {
                        fetchWarehouses();
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={
                      editUser && currentUser && getUserId(editUser) === getUserId(currentUser)
                        ? true
                        : undefined
                    }
                  >
                    <option key="user" value="user">Customer</option>
                    <option key="admin" value="admin">Admin</option>
                    <option key="product_inventory_management" value="product_inventory_management">Product & Inventory Management</option>
                    <option key="order_warehouse_management" value="order_warehouse_management">Order & Warehouse Management</option>
                    <option key="marketing_content_manager" value="marketing_content_manager">Marketing & Content Manager</option>
                    <option key="customer_support_executive" value="customer_support_executive">Customer Support Executive</option>
                    <option key="report_finance_analyst" value="report_finance_analyst">Report & Finance Analyst</option>
                    <option key="delivery_boy" value="delivery_boy">Delivery Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option key="active" value="active">Active</option>
                    <option key="disabled" value="disabled">Disabled</option>
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
              
              {/* Password Fields - Only show for non-user roles */}
              {editForm.role !== 'user' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                      <span className="text-xs text-gray-500 ml-1">(Leave empty to keep current)</span>
                    </label>
                    <input
                      type="password"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    {editForm.newPassword && editForm.newPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Confirm new password"
                    />
                    {editForm.confirmPassword && editForm.newPassword !== editForm.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Warehouse Assignment for specific roles */}
              {(editForm.role === 'product_inventory_management' || editForm.role === 'order_warehouse_management' || editForm.role === 'delivery_boy') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Warehouses
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {warehousesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading warehouses...
                    </div>
                  ) : (
                    <div className={`border rounded-lg p-3 max-h-40 overflow-y-auto ${
                      editForm.assignedWarehouses.length === 0 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}>
                      {warehouses.length === 0 ? (
                        <p className="text-gray-500 text-sm">No warehouses available</p>
                      ) : (
                        warehouses.map((warehouse, index) => {
                          const warehouseId = getWarehouseId(warehouse);
                          return (
                          <label key={`warehouse-${warehouseId}-${index}`} className="flex items-center space-x-3 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              id={`warehouse-${warehouseId}`}
                              checked={editForm.assignedWarehouses.some(id => 
                                id === warehouseId || 
                                id === warehouse._id || 
                                id === warehouse.id
                              )}
                              onChange={(e) => {
                                e.stopPropagation();
                                setEditForm(prev => {
                                  if (e.target.checked) {
                                    // Add warehouse if not already present
                                    const alreadyAssigned = prev.assignedWarehouses.some(
                                      id => id === warehouseId || id === warehouse._id || id === warehouse.id
                                    );
                                    if (!alreadyAssigned) {
                                      return {
                                        ...prev,
                                        assignedWarehouses: [...prev.assignedWarehouses, warehouseId]
                                      };
                                    }
                                    return prev;
                                  } else {
                                    // Remove warehouse - filter out any ID that might match this warehouse
                                    return {
                                      ...prev,
                                      assignedWarehouses: prev.assignedWarehouses.filter(
                                        id => id !== warehouseId && id !== warehouse._id && id !== warehouse.id
                                      )
                                    };
                                  }
                                });
                              }}
                              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 font-medium">{warehouse.name}</span>
                          </label>
                          );
                        })
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.role === 'product_inventory_management' 
                      ? 'User will only see products from selected warehouses'
                      : editForm.role === 'delivery_boy'
                      ? 'User will only see orders assigned from selected warehouses'
                      : 'User will only see orders from selected warehouses'
                    }
                  </p>
                  {editForm.assignedWarehouses.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      At least one warehouse must be selected for this role
                    </p>
                  )}
                </div>
              )}

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
                  disabled={
                    editLoading || 
                    ((editForm.role === 'product_inventory_management' || editForm.role === 'order_warehouse_management' || editForm.role === 'delivery_boy') && 
                     editForm.assignedWarehouses.length === 0)
                  }
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
  );
}