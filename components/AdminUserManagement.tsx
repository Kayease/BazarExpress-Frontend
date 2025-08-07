'use client';

import React, { useState, useEffect } from 'react';
import { useRoleAccess } from './RoleBasedAccess';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Warehouse
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  assignedWarehouses?: Array<{
    _id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Warehouse {
  _id: string;
  name: string;
  address: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const { user: currentUser, hasRole } = useRoleAccess();

  const roleOptions = [
    { value: 'admin', label: 'Super Admin' },
    { value: 'product_inventory_management', label: 'Product & Inventory Management' },
    { value: 'order_warehouse_management', label: 'Order & Warehouse Management' },
    { value: 'marketing_content_manager', label: 'Marketing & Content Manager' },
    { value: 'customer_support_executive', label: 'Customer Support Executive' },
    { value: 'report_finance_analyst', label: 'Report & Finance Analyst' }
  ];

  useEffect(() => {
    if (hasRole(['admin'])) {
      fetchUsers();
      fetchWarehouses();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/admin/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase()) ||
                         user.phone.includes(search);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.label : role;
  };

  const needsWarehouseAssignment = (role: string) => {
    return ['product_inventory_management', 'order_warehouse_management'].includes(role);
  };

  if (!hasRole(['admin'])) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to manage admin users.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
          <p className="text-gray-600">Manage admin users and their roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {search || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No admin users have been created yet'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">{user.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {getRoleLabel(user.role)}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      {needsWarehouseAssignment(user.role) && (
                        <span className="flex items-center text-xs text-blue-600">
                          <Warehouse className="w-3 h-3 mr-1" />
                          {user.assignedWarehouses?.length || 0} warehouse(s)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(user._id, user.status === 'active' ? 'inactive' : 'active')}
                      className={`p-2 rounded-md transition-colors ${
                        user.status === 'active'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                    >
                      {user.status === 'active' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {needsWarehouseAssignment(user.role) && user.assignedWarehouses && user.assignedWarehouses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Assigned Warehouses:</div>
                  <div className="flex flex-wrap gap-2">
                    {user.assignedWarehouses.map(warehouse => (
                      <span key={warehouse._id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {warehouse.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;