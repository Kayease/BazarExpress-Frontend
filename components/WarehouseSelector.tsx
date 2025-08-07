'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Warehouse {
  _id: string;
  name: string;
  address: string;
  status: string;
}

interface WarehouseSelectorProps {
  value: string;
  onChange: (warehouseId: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  className = ''
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAppSelector((state: { auth: { user: any } }) => state.auth.user);

  useEffect(() => {
    fetchWarehouses();
  }, []);

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
      } else {
        console.error('Failed to fetch warehouses');
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-10 rounded ${className}`}></div>
    );
  }

  // For product_inventory_management role, show message if no warehouses assigned
  if (user?.role === 'product_inventory_management' && warehouses.length === 0) {
    return (
      <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <p className="text-yellow-800 text-sm">
          No warehouses assigned to your account. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
      } ${className}`}
    >
      <option value="">Select Warehouse</option>
      {warehouses.map((warehouse) => (
        <option key={warehouse._id} value={warehouse._id}>
          {warehouse.name} - {warehouse.address}
        </option>
      ))}
    </select>
  );
};

export default WarehouseSelector;