"use client"

import React, { useEffect, useState } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import toast from "react-hot-toast"
import Link from "next/link"
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Settings, 
  Save, 
  RefreshCw,
  Info,
  Calculator,
  CreditCard
} from "lucide-react"

// Types
interface DeliverySettings {
  _id?: string
  freeDeliveryMinAmount: number
  freeDeliveryRadius: number
  baseDeliveryCharge: number
  minimumDeliveryCharge: number
  maximumDeliveryCharge: number
  perKmCharge: number
  codAvailable: boolean
  codExtraCharge: number
  calculationMethod: 'haversine' | 'straight_line'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL
const DELIVERY_API = `${API_URL}/delivery`

export default function DeliveryManagementPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [formData, setFormData] = useState<DeliverySettings>({
    freeDeliveryMinAmount: 500,
    freeDeliveryRadius: 3,
    baseDeliveryCharge: 20,
    minimumDeliveryCharge: 10,
    maximumDeliveryCharge: 100,
    perKmCharge: 5,
    codAvailable: true,
    codExtraCharge: 20,
    calculationMethod: 'haversine'
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch delivery settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${DELIVERY_API}/settings`)
      const data = await response.json()
      
      if (data.success && data.settings) {
        setSettings(data.settings)
        setFormData(data.settings)
      } else {
        setSettings(null)
        // Keep default form data
      }
    } catch (error) {
      console.error('Error fetching delivery settings:', error)
      toast.error('Failed to load delivery settings')
    } finally {
      setLoading(false)
    }
  }

  // Initialize default settings
  const initializeSettings = async () => {
    try {
      setInitializing(true)
      const response = await fetch(`${DELIVERY_API}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Default delivery settings initialized')
        await fetchSettings()
      } else {
        toast.error(data.error || 'Failed to initialize settings')
      }
    } catch (error) {
      console.error('Error initializing settings:', error)
      toast.error('Failed to initialize settings')
    } finally {
      setInitializing(false)
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (formData.freeDeliveryMinAmount < 0) {
      newErrors.freeDeliveryMinAmount = 'Free delivery minimum amount must be positive'
    }
    
    if (formData.freeDeliveryRadius <= 0) {
      newErrors.freeDeliveryRadius = 'Free delivery radius must be greater than 0'
    }
    
    if (formData.baseDeliveryCharge < 0) {
      newErrors.baseDeliveryCharge = 'Base delivery charge must be positive'
    }
    
    if (formData.minimumDeliveryCharge < 0) {
      newErrors.minimumDeliveryCharge = 'Minimum delivery charge must be positive'
    }
    
    if (formData.maximumDeliveryCharge <= formData.minimumDeliveryCharge) {
      newErrors.maximumDeliveryCharge = 'Maximum charge must be greater than minimum charge'
    }
    
    if (formData.perKmCharge < 0) {
      newErrors.perKmCharge = 'Per km charge must be positive'
    }
    
    if (formData.codExtraCharge < 0) {
      newErrors.codExtraCharge = 'COD extra charge must be positive'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save settings
  const saveSettings = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }
    
    try {
      setSaving(true)
      const response = await fetch(`${DELIVERY_API}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          _id: settings?._id // Include the ID to ensure update instead of create
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Delivery settings updated successfully')
        setSettings(data.settings)
        setFormData(data.settings)
      } else {
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Handle input change
  const handleInputChange = (field: keyof DeliverySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Delivery Settings</h2>
            <p className="text-gray-600 mt-1">Manage delivery charges and free delivery settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchSettings}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!settings && (
              <Button
                onClick={initializeSettings}
                disabled={initializing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="h-4 w-4" />
                {initializing ? 'Initializing...' : 'Initialize Default Settings'}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !settings ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Delivery Settings Found</h3>
              <p className="text-gray-600 text-center mb-6">
                Initialize default delivery settings to get started with delivery management.
              </p>
              <Button
                onClick={initializeSettings}
                disabled={initializing}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {initializing ? 'Initializing...' : 'Initialize Default Settings'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Settings Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Current Settings Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{settings.freeDeliveryMinAmount}</div>
                    <div className="text-sm text-gray-600">Free Delivery Above</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{settings.freeDeliveryRadius} km</div>
                    <div className="text-sm text-gray-600">Free Delivery Radius</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹{settings.baseDeliveryCharge}</div>
                    <div className="text-sm text-gray-600">Base Charge</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{settings.perKmCharge}/km</div>
                    <div className="text-sm text-gray-600">Per KM Charge</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last updated: {new Date(settings.updatedAt!).toLocaleString()}</span>
                  <Badge variant={settings.codAvailable ? "default" : "secondary"}>
                    COD {settings.codAvailable ? 'Available' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Settings Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Free Delivery Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Free Delivery Settings
                  </CardTitle>
                  <CardDescription>
                    Configure when customers qualify for free delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="freeDeliveryMinAmount">Minimum Order Amount (₹)</Label>
                    <Input
                      id="freeDeliveryMinAmount"
                      type="number"
                      value={formData.freeDeliveryMinAmount}
                      onChange={(e) => handleInputChange('freeDeliveryMinAmount', Number(e.target.value))}
                      className={errors.freeDeliveryMinAmount ? 'border-red-500' : ''}
                    />
                    {errors.freeDeliveryMinAmount && (
                      <p className="text-sm text-red-500 mt-1">{errors.freeDeliveryMinAmount}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="freeDeliveryRadius">Free Delivery Radius (km)</Label>
                    <Input
                      id="freeDeliveryRadius"
                      type="number"
                      step="0.1"
                      value={formData.freeDeliveryRadius}
                      onChange={(e) => handleInputChange('freeDeliveryRadius', Number(e.target.value))}
                      className={errors.freeDeliveryRadius ? 'border-red-500' : ''}
                    />
                    {errors.freeDeliveryRadius && (
                      <p className="text-sm text-red-500 mt-1">{errors.freeDeliveryRadius}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Customers within this radius from warehouse get free delivery if order amount qualifies
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Charges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Delivery Charges
                  </CardTitle>
                  <CardDescription>
                    Set base charges and per kilometer rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="baseDeliveryCharge">Base Delivery Charge (₹)</Label>
                    <Input
                      id="baseDeliveryCharge"
                      type="number"
                      value={formData.baseDeliveryCharge}
                      onChange={(e) => handleInputChange('baseDeliveryCharge', Number(e.target.value))}
                      className={errors.baseDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.baseDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.baseDeliveryCharge}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="perKmCharge">Per KM Charge (₹)</Label>
                    <Input
                      id="perKmCharge"
                      type="number"
                      step="0.1"
                      value={formData.perKmCharge}
                      onChange={(e) => handleInputChange('perKmCharge', Number(e.target.value))}
                      className={errors.perKmCharge ? 'border-red-500' : ''}
                    />
                    {errors.perKmCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.perKmCharge}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Additional charge per kilometer beyond free delivery radius
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Charge Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Charge Limits
                  </CardTitle>
                  <CardDescription>
                    Set minimum and maximum delivery charge limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="minimumDeliveryCharge">Minimum Delivery Charge (₹)</Label>
                    <Input
                      id="minimumDeliveryCharge"
                      type="number"
                      value={formData.minimumDeliveryCharge}
                      onChange={(e) => handleInputChange('minimumDeliveryCharge', Number(e.target.value))}
                      className={errors.minimumDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.minimumDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.minimumDeliveryCharge}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="maximumDeliveryCharge">Maximum Delivery Charge (₹)</Label>
                    <Input
                      id="maximumDeliveryCharge"
                      type="number"
                      value={formData.maximumDeliveryCharge}
                      onChange={(e) => handleInputChange('maximumDeliveryCharge', Number(e.target.value))}
                      className={errors.maximumDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.maximumDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.maximumDeliveryCharge}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* COD & Calculation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    COD & Calculation Settings
                  </CardTitle>
                  <CardDescription>
                    Configure cash on delivery and distance calculation method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="codAvailable">Cash on Delivery</Label>
                      <p className="text-sm text-gray-500">Allow customers to pay on delivery</p>
                    </div>
                    <Switch
                      id="codAvailable"
                      checked={formData.codAvailable}
                      onCheckedChange={(checked) => handleInputChange('codAvailable', checked)}
                    />
                  </div>
                  
                  {formData.codAvailable && (
                    <div>
                      <Label htmlFor="codExtraCharge">COD Extra Charge (₹)</Label>
                      <Input
                        id="codExtraCharge"
                        type="number"
                        value={formData.codExtraCharge}
                        onChange={(e) => handleInputChange('codExtraCharge', Number(e.target.value))}
                        className={errors.codExtraCharge ? 'border-red-500' : ''}
                      />
                      {errors.codExtraCharge && (
                        <p className="text-sm text-red-500 mt-1">{errors.codExtraCharge}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="calculationMethod">Distance Calculation Method</Label>
                    <Select
                      value={formData.calculationMethod}
                      onValueChange={(value: 'haversine' | 'straight_line') => 
                        handleInputChange('calculationMethod', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        <SelectItem value="haversine">Haversine Formula (More Accurate)</SelectItem>
                        <SelectItem value="straight_line">Straight Line (Faster)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Haversine is more accurate but slightly slower
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}