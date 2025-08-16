"use client"

import { useState } from "react"
import { Search, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2, Calendar, CreditCard, MapPin, User, Warehouse, Building2, ArrowRight, AlertCircle, Clock, IndianRupee } from "lucide-react"
import toast from 'react-hot-toast'

interface StockTransferItem {
  _id: string;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  variantKey?: string;
  variantName?: string;
  variantImage?: string;
}

interface StockTransfer {
  _id: string;
  transferId: string;
  fromWarehouse: string;
  toWarehouse: string;
  items: StockTransferItem[];
  totalItems: number;
  totalValue: number;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface StockTransferDetailsModalProps {
  viewing: StockTransfer | null;
  onClose: () => void;
  onStatusUpdate?: (transferId: string, newStatus: string, notes?: string) => Promise<void>;
  onRefresh?: () => void;
  userRole?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  'in-transit': { icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  cancelled: { icon: X, color: "text-red-600", bg: "bg-red-100" },
}



export default function StockTransferDetailsModal({
  viewing,
  onClose,
  onStatusUpdate,
  onRefresh,
  userRole = 'admin'
}: StockTransferDetailsModalProps) {
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(viewing?.status || '')
  const [statusNotes, setStatusNotes] = useState('')

  // Get available status options based on current status and user role
  const getAvailableStatusOptions = (currentStatus: string, userRole: string): string[] => {
    if (userRole === 'customer_support_executive') {
      return [currentStatus] // Customer support can't change status
    }
    
    // Lock status changes for completed and cancelled transfers
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return [currentStatus] // Cannot change from final states
    }
    
    // Define valid transitions based on current status
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['pending', 'in-transit', 'cancelled'],
      'in-transit': ['in-transit', 'completed', 'cancelled'],
      'completed': ['completed'], // Locked
      'cancelled': ['cancelled']  // Locked
    }
    
    if (userRole === 'admin') {
      return validTransitions[currentStatus] || [currentStatus]
    }
    
    if (userRole === 'warehouse_manager') {
      // Warehouse managers follow the same transition rules
      return validTransitions[currentStatus] || [currentStatus]
    }
    
    return [currentStatus]
  }

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!viewing || !selectedStatus || !onStatusUpdate) return
    
    setUpdating(true)
    try {
      await onStatusUpdate(viewing._id, selectedStatus, statusNotes.trim() || undefined)
      toast.success('Transfer status updated successfully')
      onRefresh?.()
      setStatusNotes('')
    } catch (error) {
      console.error('Error updating transfer status:', error)
      toast.error('Failed to update transfer status')
    } finally {
      setUpdating(false)
    }
  }

  if (!viewing) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Stock Transfer Details</h3>
              <p className="text-white/80">#{viewing.transferId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Transfer Status and Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {(() => {
                  const StatusIcon = statusConfig[viewing.status as keyof typeof statusConfig]?.icon || AlertCircle;
                  return <StatusIcon className="w-4 h-4 text-brand-primary" />;
                })()}
                <span className="text-sm font-medium text-gray-600">Transfer Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[viewing.status as keyof typeof statusConfig]?.bg || 'bg-gray-100'} ${statusConfig[viewing.status as keyof typeof statusConfig]?.color || 'text-gray-600'}`}>
                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Created Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(viewing.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Warehouse className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Source Warehouse</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {viewing.fromWarehouse}
              </p>
            </div>
          </div>

          {/* Warehouse Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Building2 className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900">Warehouse Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-600">From:</span>
                  <span className="text-sm font-semibold text-gray-900">{viewing.fromWarehouse}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">To:</span>
                  <span className="text-sm font-semibold text-gray-900">{viewing.toWarehouse}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Items */}
          {viewing.items && viewing.items.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 text-brand-primary mr-2" />
                Transfer Items ({viewing.items.length})
              </h4>
              <div className="space-y-3">
                {viewing.items.map((item: StockTransferItem, index: number) => (
                  <div key={`${item._id}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 ml-4">
                      <h5 className="font-medium text-gray-900 mb-1">{item.productName}</h5>
                      {item.variantName && (
                        <div className="text-sm text-blue-600 mb-1">
                          Variant: {item.variantName}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>SKU: {item.sku}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(item.unitPrice * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{item.unitPrice.toFixed(2)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 text-brand-primary mr-2" />
              Transfer Summary
            </h4>
            <div className="space-y-3">
              {/* Total Items */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items</span>
                <span className="text-gray-900 font-medium">{viewing.totalItems} units</span>
              </div>

              {/* Total Value */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Value</span>
                  <span className="text-xl font-bold text-green-600">
                    <IndianRupee className="inline h-5 w-5" />
                    {viewing.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900">Timeline</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(viewing.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {viewing.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(viewing.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {viewing.completedAt 
                      ? `${Math.ceil((new Date(viewing.completedAt).getTime() - new Date(viewing.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'In Progress'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900">Additional Details</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${statusConfig[viewing.status as keyof typeof statusConfig]?.color || 'text-gray-900'}`}>
                    {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                  </span>
                </div>
                {viewing.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 block mb-1">Notes:</span>
                    <span className="text-gray-900 font-medium">{viewing.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Update */}
          {onStatusUpdate && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 text-brand-primary mr-2" />
                Update Transfer Status
              </h4>
        
              
              <div className="space-y-4">
                <select
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                    userRole === 'customer_support_executive' || viewing?.status === 'completed' || viewing?.status === 'cancelled'
                      ? 'bg-gray-100 cursor-not-allowed opacity-60'
                      : ''
                  }`}
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  disabled={userRole === 'customer_support_executive' || viewing?.status === 'completed' || viewing?.status === 'cancelled'}
                  title={
                    userRole === 'customer_support_executive' 
                      ? 'Customer Support Executive cannot change transfer status' 
                      : (viewing?.status === 'completed' || viewing?.status === 'cancelled')
                        ? `Cannot modify ${viewing?.status} transfer`
                        : ''
                  }
                >
                  {getAvailableStatusOptions(viewing?.status || '', userRole).map(opt => (
                    <option key={`status-${opt}`} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
                
                {/* Notes input for status update */}
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  placeholder="Add notes for this status update (optional)"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  disabled={userRole === 'customer_support_executive' || viewing?.status === 'completed' || viewing?.status === 'cancelled'}
                />
                
                {userRole === 'customer_support_executive' ? (
                  <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                    <Eye className="h-4 w-4 inline mr-2" />
                    View Only - Cannot change transfer status
                  </div>
                ) : (viewing?.status === 'completed' || viewing?.status === 'cancelled') ? (
                  <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Status Locked - Transfer is {viewing?.status}
                  </div>
                ) : (
                  <button
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={handleStatusUpdate}
                    disabled={updating || selectedStatus === viewing.status}
                    title={selectedStatus === viewing.status ? `Transfer is already ${selectedStatus}` : ''}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating Status...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
