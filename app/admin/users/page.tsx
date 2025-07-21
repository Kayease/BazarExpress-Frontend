"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { Search, Edit, Trash2, Eye, Loader2, Check, X } from "lucide-react"
import toast from 'react-hot-toast'

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status?: 'active' | 'disabled';
  phone?: string;
  dateOfBirth?: string;
  address?: any;
};

type EditFormType = {
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  phone: string;
  dateOfBirth: string;
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

export default function AdminUsers() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterRole, setFilterRole] = useState<string>("all")
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


  useEffect(() => {
    if (!user || user.role !== "admin" || !token) {
      router.push("/")
    }
  }, [user, token, router])

  const fetchUsers = async () => {
    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }
    setLoading(true)
    setError("")
    try {
      console.log('Token being sent:', token);
      const res = await fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      console.log('Response:', res);
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError("Could not load users.")
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => { if (token) fetchUsers() }, [token])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await fetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Delete failed")
      setUsers(users.filter(u => u.id !== id))
      toast.success("User deleted")
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    setChangingRoleId(id)
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await fetch(`${API_URL}/auth/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) throw new Error("Role update failed")
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
      toast.success("Role updated")
    } catch {
      toast.error("Failed to update role")
    } finally {
      setChangingRoleId(null)
    }
  }

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      phone: u.phone || '',
      dateOfBirth: u.dateOfBirth || '',
      address: {
        street: u.address?.street || '',
        landmark: u.address?.landmark || '',
        city: u.address?.city || '',
        state: u.address?.state || '',
        country: u.address?.country || '',
        pincode: u.address?.pincode || '',
      },
    });
    setEditModalOpen(true);
  }
  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditUser(null)
  }
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditLoading(true)
    try {
      if (!token) throw new Error("No authentication token found.")
      const res = await fetch(`${API_URL}/auth/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) throw new Error("Update failed")
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editForm } : u))
      toast.success("User updated")
      closeEditModal()
    } catch {
      toast.error("Failed to update user")
    } finally {
      setEditLoading(false)
    }
  }

  const handleStatusToggle = async (u: User) => {
    if (!token) return;
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${API_URL}/auth/users/${u.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setUsers(users.map(user => user.id === u.id ? { ...user, status: newStatus } : user));
      toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || u.role === filterRole
    return matchesSearch && matchesRole
  })

  if (!user || user.role !== "admin" || !token) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-500">No authentication token found or you are not admin. Please log in again.</div>
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
            <p className="text-gray-600">Manage all registered users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin h-8 w-8 text-brand-primary" /></div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-inner" style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-codGray">{u.name}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>{u.status === 'active' ? 'Active' : 'Disabled'}</span>
                          <button
                            type="button"
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${u.status === 'active' ? 'bg-green-400' : 'bg-gray-300'} ${u.id === user.id ? 'opacity-60 cursor-not-allowed' : 'hover:ring-2 hover:ring-brand-primary'}`}
                            onClick={() => handleStatusToggle(u)}
                            disabled={u.id === user.id}
                            aria-pressed={u.status === 'active'}
                            aria-label={u.status === 'active' ? 'Disable user' : 'Enable user'}
                            tabIndex={u.id === user.id ? -1 : 0}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${u.status === 'active' ? 'translate-x-5' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-1 text-text-tertiary hover:text-brand-primary transition-colors"
                            onClick={() => openEditModal(u)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {u.id !== user.id && (
                            <button
                              className="p-1 text-text-tertiary hover:text-brand-error transition-colors"
                              onClick={() => setConfirmDelete(u.id)}
                              disabled={deletingId === u.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {deletingId === u.id && <Loader2 className="inline ml-2 h-4 w-4 animate-spin text-brand-error" />}
                        </div>
                        {/* Confirm Delete Modal */}
                        {confirmDelete === u.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
                              <h3 className="text-lg font-bold mb-2">Delete User?</h3>
                              <p className="mb-4 text-gray-600">Are you sure you want to delete <span className="font-semibold">{u.name}</span>? This action cannot be undone.</p>
                              <div className="flex justify-center gap-4 mt-6">
                                <button
                                  className="bg-brand-error hover:bg-brand-error-dark text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                  onClick={() => handleDelete(u.id)}
                                  disabled={deletingId === u.id}
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                                <button
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                                  onClick={() => setConfirmDelete(null)}
                                >
                                  <X className="h-4 w-4" /> Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Edit Modal */}
      {editModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
            <h3 className="text-lg font-bold mb-2">Edit User</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Email</label>
                <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Phone</label>
                <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block font-medium mb-1">Date of Birth</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2" value={editForm.dateOfBirth || ''} onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Street</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.street || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
                </div>
                <div>
                  <label className="block font-medium mb-1">Landmark</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.landmark || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, landmark: e.target.value } }))} />
                </div>
                <div>
                  <label className="block font-medium mb-1">City</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.city || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
                </div>
                <div>
                  <label className="block font-medium mb-1">State</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.state || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
                </div>
                <div>
                  <label className="block font-medium mb-1">Country</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.country || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, country: e.target.value } }))} />
                </div>
                <div>
                  <label className="block font-medium mb-1">Pincode</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={editForm.address?.pincode || ''} onChange={e => setEditForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Role</label>
                <select className="w-full border border-gray-300 rounded-lg p-2" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'user' | 'admin' }))} disabled={user.id === editUser.id}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {user.id === editUser.id && <div className="text-xs text-gray-400 mt-1">You cannot change your own role</div>}
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <button type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg font-semibold" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</button>
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold" onClick={closeEditModal} disabled={editLoading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}